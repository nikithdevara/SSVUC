import {
  Donation,
  MaterialDonation,
  Expense,
  EventItem,
  Announcement,
  GalleryItem,
  AuditLog,
  AdminUser,
  CommitteeSettings,
  Receipt,
  AdminNotification,
} from '../types';
import { svucStore } from './store';
import { authService } from './authService';
import { generateReceiptNumber, generateVerificationCode, generateQrData } from './receiptNumberService';
import { donationsFirebaseService } from './firebase/donationsFirebaseService';
import { materialsFirebaseService } from './firebase/materialsFirebaseService';
import { expensesFirebaseService } from './firebase/expensesFirebaseService';
import { eventsFirebaseService } from './firebase/eventsFirebaseService';
import { announcementsFirebaseService } from './firebase/announcementsFirebaseService';
import { galleryFirebaseService } from './firebase/galleryFirebaseService';
import { usersFirebaseService } from './firebase/usersFirebaseService';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { COLLECTIONS } from './firebase/firestoreService';
import { isFirebaseConfigured, db } from '../lib/firebase';

export const donationsService = {
  getAll(): Donation[] {
    return svucStore.getDonations();
  },

  getById(id: string): Donation | undefined {
    return svucStore.getDonations().find((d) => d.id === id || d.receiptId === id);
  },

  create(data: {
    donorName: string;
    anonymous: boolean;
    amount: number;
    paymentMethod: Donation['paymentMethod'];
    phoneNumber?: string;
    email?: string;
    notes?: string;
    gothram?: string;
    date?: string;
    status?: Donation['status'];
  }): { donation: Donation; receipt: Receipt } {
    const donations = svucStore.getDonations();
    const sequence = donations.length + 1;
    const year = '2026';
    const id = `DON-${year}-${String(sequence).padStart(3, '0')}`;
    const receiptNumber = generateReceiptNumber('MONETARY', sequence, year);
    const now = new Date();
    const dateStr = data.date || now.toISOString().split('T')[0];
    const currentUser = authService.getCurrentUser();
    const status = data.status || 'Pending';

    const newDonation: Donation = {
      id,
      receiptId: receiptNumber,
      donorName: data.anonymous ? 'Devotee (Anonymous)' : data.donorName || 'Devotee',
      anonymous: data.anonymous,
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod,
      phoneNumber: data.phoneNumber,
      email: data.email,
      notes: data.notes,
      gothram: data.gothram,
      date: dateStr,
      status,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: currentUser ? currentUser.name : 'Counter Admin',
      approvedBy: status === 'Approved' ? currentUser?.name : undefined,
      approvedAt: status === 'Approved' ? now.toISOString() : undefined,
    };

    const newReceipt: Receipt = {
      id: receiptNumber,
      receiptNumber,
      type: 'MONETARY',
      donationId: id,
      donorName: newDonation.donorName,
      anonymous: newDonation.anonymous,
      amount: newDonation.amount,
      paymentMethod: newDonation.paymentMethod,
      date: dateStr,
      verificationCode: generateVerificationCode(receiptNumber),
      qrCodeData: generateQrData(receiptNumber),
      committeeName: 'Sri Siddhi Vinayaka Utsava Committee',
      location: 'Gandhinagar Anjayya Colony, Anakapalle',
      issuedBy: 'Utsav Committee',
      createdAt: now.toISOString(),
      status: status === 'Approved' ? 'VERIFIED' : status === 'Pending' ? 'PENDING' : 'REVOKED',
    };

    const updated = [newDonation, ...donations];
    localStorage.setItem('svuc_donations_v1', JSON.stringify(updated));

    const receipts = svucStore.getReceipts();
    localStorage.setItem('svuc_receipts_v1', JSON.stringify([newReceipt, ...receipts]));

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.DONATIONS, newDonation.id), newDonation, { merge: true }).catch(console.error);
      setDoc(doc(db, COLLECTIONS.RECEIPTS, newReceipt.id), newReceipt, { merge: true }).catch(console.error);
    }

    auditService.logAction(
      'Donation',
      id,
      'CREATE',
      `Recorded donation of ₹${newDonation.amount.toLocaleString('en-IN')} by ${newDonation.donorName} (${data.paymentMethod}) - Status: ${status}`
    );

    window.dispatchEvent(new Event('svuc_store_updated'));
    return { donation: newDonation, receipt: newReceipt };
  },

  update(
    id: string,
    updates: Partial<Donation>,
    reason?: string
  ): { success: boolean; donation?: Donation; error?: string } {
    const list = svucStore.getDonations();
    const index = list.findIndex((d) => d.id === id);
    if (index === -1) return { success: false, error: 'Donation record not found' };

    const original = list[index];
    const isFinancialChange =
      (updates.amount !== undefined && updates.amount !== original.amount) ||
      (updates.paymentMethod !== undefined && updates.paymentMethod !== original.paymentMethod);

    const updated: Donation = {
      ...original,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    localStorage.setItem('svuc_donations_v1', JSON.stringify(list));

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.DONATIONS, id), updated, { merge: true }).catch(console.error);
    }

    // Also update associated receipt if amount or donor changed
    if (updates.amount !== undefined || updates.donorName !== undefined || updates.status !== undefined) {
      const receipts = svucStore.getReceipts();
      const rIdx = receipts.findIndex(
        (r) =>
          r.donationId === id ||
          r.id === original.receiptId ||
          r.receiptNumber === original.receiptId ||
          r.id === id ||
          r.receiptNumber === id
      );
      if (rIdx !== -1) {
        const isApproved = updated.status === 'Approved' || updated.status === 'Verified';
        const isDeclined = updated.status === 'Declined' || updated.status === 'Rejected' || updated.status === 'Archived';
        receipts[rIdx] = {
          ...receipts[rIdx],
          donorName: updated.donorName,
          amount: updated.amount,
          status: isApproved ? 'VERIFIED' : isDeclined ? 'VOID' : 'PENDING',
          voidReason: isDeclined ? (reason || updated.rejectionReason || 'Declined by administration') : undefined,
          verificationCode: isApproved
            ? `SVUC-${id.replace('DON-', '')}-VERIFIED`
            : isDeclined
            ? `SVUC-${id.replace('DON-', '')}-DECLINED`
            : `SVUC-${id.replace('DON-', '')}-PENDING`,
        };
        localStorage.setItem('svuc_receipts_v1', JSON.stringify(receipts));
        if (isFirebaseConfigured() && db) {
          setDoc(doc(db, COLLECTIONS.RECEIPTS, receipts[rIdx].id), receipts[rIdx], { merge: true }).catch(console.error);
        }
      }
    }

    const diff = isFinancialChange
      ? `Amount changed from ₹${original.amount} to ₹${updated.amount}. ${reason ? `Reason: ${reason}` : ''}`
      : `Updated donor info: ${updated.donorName}. ${reason ? `Reason: ${reason}` : ''}`;

    auditService.logAction(
      'Donation',
      id,
      'UPDATE',
      diff,
      `₹${original.amount} (${original.donorName})`,
      `₹${updated.amount} (${updated.donorName})`,
      reason
    );

    window.dispatchEvent(new Event('svuc_store_updated'));
    return { success: true, donation: updated };
  },

  approve(id: string): { success: boolean; donation?: Donation } {
    const currentUser = authService.getCurrentUser();
    const res = this.update(
      id,
      {
        status: 'Approved',
        approvedBy: currentUser?.name || 'Administrator',
        approvedAt: new Date().toISOString(),
      },
      'Official verification & audit approval granted'
    );
    if (res.success && res.donation) {
      auditService.logAction('Donation', id, 'APPROVE', `Donation ${id} approved by ${currentUser?.name || 'Admin'}`);
    }
    return res;
  },

  reject(id: string, reason: string): { success: boolean; donation?: Donation } {
    const currentUser = authService.getCurrentUser();
    const res = this.update(
      id,
      {
        status: 'Declined',
        rejectionReason: reason,
      },
      `Declined by ${currentUser?.name || 'Admin'}. Reason: ${reason}`
    );
    if (res.success && res.donation) {
      auditService.logAction('Donation', id, 'REJECT', `Donation ${id} declined. Reason: ${reason}`);
    }
    return res;
  },

  decline(id: string, reason: string): { success: boolean; donation?: Donation } {
    return this.reject(id, reason);
  },

  archive(id: string, reason?: string): { success: boolean } {
    const res = this.update(id, { status: 'Archived' }, reason || 'Archived record');
    if (res.success) {
      auditService.logAction('Donation', id, 'ARCHIVE', `Donation ${id} marked as archived/void.`);
    }
    return { success: res.success };
  },

  delete(id: string): boolean {
    svucStore.deleteDonation(id);
    if (isFirebaseConfigured() && db) {
      deleteDoc(doc(db, COLLECTIONS.DONATIONS, id)).catch(console.error);
    }
    return true;
  },
};

export const materialsService = {
  getAll(): MaterialDonation[] {
    return svucStore.getMaterials();
  },

  getById(id: string): MaterialDonation | undefined {
    return svucStore.getMaterials().find((m) => m.id === id || m.receiptId === id);
  },

  create(data: {
    donorName: string;
    anonymous: boolean;
    materialName: string;
    category: MaterialDonation['category'];
    quantity: number;
    unit: string;
    phoneNumber?: string;
    notes?: string;
    date?: string;
    status?: MaterialDonation['status'];
  }): { material: MaterialDonation; receipt: Receipt } {
    const list = svucStore.getMaterials();
    const sequence = list.length + 1;
    const year = '2026';
    const id = `MAT-${year}-${String(sequence).padStart(3, '0')}`;
    const receiptNumber = generateReceiptNumber('MATERIAL', sequence, year);
    const now = new Date();
    const dateStr = data.date || now.toISOString().split('T')[0];
    const currentUser = authService.getCurrentUser();
    const status = data.status || 'Pending';

    const newMaterial: MaterialDonation = {
      id,
      receiptId: receiptNumber,
      donorName: data.anonymous ? 'Devotee (Anonymous)' : data.donorName || 'Devotee',
      anonymous: data.anonymous,
      materialName: data.materialName,
      category: data.category,
      quantity: Number(data.quantity),
      unit: data.unit,
      phoneNumber: data.phoneNumber,
      notes: data.notes,
      date: dateStr,
      status,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: currentUser ? currentUser.name : 'Counter Admin',
      approvedBy: status === 'Approved' ? currentUser?.name : undefined,
      approvedAt: status === 'Approved' ? now.toISOString() : undefined,
    };

    const newReceipt: Receipt = {
      id: receiptNumber,
      receiptNumber,
      type: 'MATERIAL',
      materialDonationId: id,
      donorName: newMaterial.donorName,
      anonymous: newMaterial.anonymous,
      materialName: newMaterial.materialName,
      quantity: newMaterial.quantity,
      unit: newMaterial.unit,
      date: dateStr,
      verificationCode: generateVerificationCode(receiptNumber),
      qrCodeData: generateQrData(receiptNumber),
      committeeName: 'Sri Siddhi Vinayaka Utsava Committee',
      location: 'Gandhinagar Anjayya Colony, Anakapalle',
      issuedBy: 'Utsav Committee',
      createdAt: now.toISOString(),
      status: status === 'Approved' ? 'VERIFIED' : status === 'Pending' ? 'PENDING' : 'REVOKED',
    };

    localStorage.setItem('svuc_materials_v1', JSON.stringify([newMaterial, ...list]));
    const receipts = svucStore.getReceipts();
    localStorage.setItem('svuc_receipts_v1', JSON.stringify([newReceipt, ...receipts]));

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.MATERIALS, newMaterial.id), newMaterial, { merge: true }).catch(console.error);
      setDoc(doc(db, COLLECTIONS.RECEIPTS, newReceipt.id), newReceipt, { merge: true }).catch(console.error);
    }

    auditService.logAction(
      'Material',
      id,
      'CREATE',
      `Recorded material seva: ${data.quantity} ${data.unit} of ${data.materialName} by ${newMaterial.donorName} (${data.category})`
    );

    window.dispatchEvent(new Event('svuc_store_updated'));
    return { material: newMaterial, receipt: newReceipt };
  },

  update(id: string, updates: Partial<MaterialDonation>, reason?: string) {
    const list = svucStore.getMaterials();
    const index = list.findIndex((m) => m.id === id);
    if (index === -1) return { success: false, error: 'Material record not found' };

    const original = list[index];
    const updated: MaterialDonation = {
      ...original,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    localStorage.setItem('svuc_materials_v1', JSON.stringify(list));

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.MATERIALS, id), updated, { merge: true }).catch(console.error);
    }

    if (updates.status !== undefined || updates.quantity !== undefined || updates.materialName !== undefined) {
      const receipts = svucStore.getReceipts();
      const rIdx = receipts.findIndex(
        (r) =>
          r.materialDonationId === id ||
          r.id === original.receiptId ||
          r.receiptNumber === original.receiptId ||
          r.id === id ||
          r.receiptNumber === id
      );
      if (rIdx !== -1) {
        const isAppr = updated.status === 'Approved' || updated.status === 'Verified';
        const isDeclined = updated.status === 'Declined' || updated.status === 'Rejected';
        receipts[rIdx] = {
          ...receipts[rIdx],
          materialName: updated.materialName,
          quantity: updated.quantity,
          status: isAppr ? 'VERIFIED' : isDeclined ? 'VOID' : 'PENDING',
          voidReason: isDeclined ? (reason || 'Declined by administration') : undefined,
          verificationCode: isAppr
            ? `SVUC-MAT-${id.replace('MAT-', '')}-VERIFIED`
            : isDeclined
            ? `SVUC-MAT-${id.replace('MAT-', '')}-DECLINED`
            : `SVUC-MAT-${id.replace('MAT-', '')}-PENDING`,
        };
        localStorage.setItem('svuc_receipts_v1', JSON.stringify(receipts));
        if (isFirebaseConfigured() && db) {
          setDoc(doc(db, COLLECTIONS.RECEIPTS, receipts[rIdx].id), receipts[rIdx], { merge: true }).catch(console.error);
        }
      }
    }

    auditService.logAction(
      'Material',
      id,
      'UPDATE',
      `Updated material seva: ${updated.materialName}. ${reason ? `Reason: ${reason}` : ''}`,
      `${original.quantity} ${original.unit}`,
      `${updated.quantity} ${updated.unit}`,
      reason
    );

    window.dispatchEvent(new Event('svuc_store_updated'));
    return { success: true, material: updated };
  },

  approve(id: string) {
    const currentUser = authService.getCurrentUser();
    const res = this.update(
      id,
      {
        status: 'Approved',
        approvedBy: currentUser?.name || 'Administrator',
        approvedAt: new Date().toISOString(),
      },
      'Official verification & audit approval granted for Mandapam inventory'
    );
    if (res.success && res.material) {
      auditService.logAction('Material', id, 'APPROVE', `Material contribution ${id} (${res.material.materialName}) approved by ${currentUser?.name || 'Admin'}`);
    }
    return res;
  },

  reject(id: string, reason: string) {
    const currentUser = authService.getCurrentUser();
    const res = this.update(id, { status: 'Declined' }, reason || `Declined by ${currentUser?.name || 'Admin'}`);
    if (res.success && res.material) {
      auditService.logAction('Material', id, 'REJECT', `Material contribution ${id} (${res.material.materialName}) declined. Reason: ${reason}`);
    }
    return res;
  },

  decline(id: string, reason: string) {
    return this.reject(id, reason);
  },

  archive(id: string, reason?: string) {
    return this.update(id, { status: 'Archived' }, reason);
  },

  delete(id: string) {
    svucStore.deleteMaterial(id);
    if (isFirebaseConfigured() && db) {
      deleteDoc(doc(db, COLLECTIONS.MATERIALS, id)).catch(console.error);
    }
    return true;
  },
};


export const expensesService = {
  getAll(): Expense[] {
    return svucStore.getExpenses();
  },

  getById(id: string): Expense | undefined {
    return svucStore.getExpenses().find((e) => e.id === id);
  },

  create(data: {
    expenseName: string;
    category: Expense['category'];
    amount: number;
    vendorName: string;
    description: string;
    paymentMethod: Expense['paymentMethod'];
    billUrl?: string;
    date?: string;
    status?: Expense['status'];
  }): Expense {
    const list = svucStore.getExpenses();
    const sequence = list.length + 1;
    const year = '2026';
    const id = `EXP-${year}-${String(sequence).padStart(3, '0')}`;
    const voucher = `VCH-${year}-${String(100 + sequence)}`;
    const now = new Date();
    const currentUser = authService.getCurrentUser();
    const status = data.status || 'Pending';

    const newExpense: Expense = {
      id,
      expenseName: data.expenseName,
      category: data.category,
      amount: Number(data.amount),
      vendorName: data.vendorName,
      description: data.description,
      paymentMethod: data.paymentMethod,
      billUrl: data.billUrl || undefined,
      receiptVoucherNo: voucher,
      date: data.date || now.toISOString().split('T')[0],
      status,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: currentUser && !/satyam|treasurer/i.test(currentUser.name) ? currentUser.name : 'Utsav Committee',
      approvedBy: status === 'Approved' ? currentUser?.name : undefined,
      approvedAt: status === 'Approved' ? now.toISOString() : undefined,
    };

    try {
      localStorage.setItem('svuc_expenses_v1', JSON.stringify([newExpense, ...list]));
    } catch (e) {
      console.warn('[LocalStorage expenses write failed]', e);
    }

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.EXPENSES, newExpense.id), newExpense, { merge: true }).catch(console.error);
    }

    auditService.logAction(
      'Expense',
      id,
      'CREATE',
      `Authorized expense request of ₹${newExpense.amount.toLocaleString('en-IN')} for ${newExpense.expenseName} (${voucher}) - Status: ${status}`
    );

    window.dispatchEvent(new Event('svuc_store_updated'));
    return newExpense;
  },

  update(id: string, updates: Partial<Expense>, reason?: string) {
    const list = svucStore.getExpenses();
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return { success: false, error: 'Expense record not found' };

    const original = list[index];
    const isFinancialChange =
      (updates.amount !== undefined && updates.amount !== original.amount) ||
      (updates.category !== undefined && updates.category !== original.category);

    const updated: Expense = {
      ...original,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    try {
      localStorage.setItem('svuc_expenses_v1', JSON.stringify(list));
    } catch (e) {
      console.warn('[LocalStorage expenses update failed]', e);
    }

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.EXPENSES, id), updated, { merge: true }).catch(console.error);
    }

    const diff = isFinancialChange
      ? `Expense amount changed from ₹${original.amount} to ₹${updated.amount}. ${reason ? `Reason: ${reason}` : ''}`
      : `Updated expense: ${updated.expenseName}. ${reason ? `Reason: ${reason}` : ''}`;

    auditService.logAction(
      'Expense',
      id,
      'UPDATE',
      diff,
      `₹${original.amount} (${original.expenseName})`,
      `₹${updated.amount} (${updated.expenseName})`,
      reason
    );

    window.dispatchEvent(new Event('svuc_store_updated'));
    return { success: true, expense: updated };
  },

  approve(id: string) {
    const currentUser = authService.getCurrentUser();
    return this.update(
      id,
      {
        status: 'Approved',
        approvedBy: currentUser && !/satyam|treasurer/i.test(currentUser.name) ? currentUser.name : 'Utsav Committee',
        approvedAt: new Date().toISOString(),
      },
      'Approved voucher for treasury disbursement'
    );
  },

  reject(id: string, reason: string) {
    return this.update(id, { status: 'Rejected' }, reason);
  },

  archive(id: string, reason?: string) {
    return this.update(id, { status: 'Archived' }, reason);
  },

  delete(id: string) {
    const list = svucStore.getExpenses();
    const target = list.find((e) => e.id === id);
    if (!target) return false;

    const filtered = list.filter((e) => e.id !== id);
    try {
      localStorage.setItem('svuc_expenses_v1', JSON.stringify(filtered));
    } catch (e) {
      console.warn('[LocalStorage expenses delete failed]', e);
    }

    if (isFirebaseConfigured() && db) {
      deleteDoc(doc(db, COLLECTIONS.EXPENSES, id)).catch(console.error);
    }

    auditService.logAction('Expense', id, 'DELETE', `Deleted expense voucher ${target.receiptVoucherNo} (₹${target.amount})`);
    window.dispatchEvent(new Event('svuc_store_updated'));
    return true;
  },
};

export const eventsService = {
  getAll(): EventItem[] {
    return svucStore.getEvents();
  },

  getById(id: string): EventItem | undefined {
    return svucStore.getEvents().find((e) => e.id === id);
  },

  create(event: Omit<EventItem, 'id'>): EventItem {
    const res = svucStore.addEvent(event);
    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.EVENTS, res.id), res, { merge: true }).catch(console.error);
    }
    return res;
  },

  update(id: string, updates: Partial<EventItem>) {
    const list = svucStore.getEvents();
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return null;

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    localStorage.setItem('svuc_events_v1', JSON.stringify(list));

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.EVENTS, id), updated, { merge: true }).catch(console.error);
    }

    auditService.logAction('Event', id, 'UPDATE', `Updated festival event: ${updated.title}`);
    window.dispatchEvent(new Event('svuc_store_updated'));
    return updated;
  },

  delete(id: string) {
    svucStore.deleteEvent(id);
    if (isFirebaseConfigured() && db) {
      deleteDoc(doc(db, COLLECTIONS.EVENTS, id)).catch(console.error);
    }
    return true;
  },
};

export const announcementsService = {
  getAll(): Announcement[] {
    return svucStore.getAnnouncements();
  },

  getById(id: string): Announcement | undefined {
    return svucStore.getAnnouncements().find((a) => a.id === id);
  },

  create(ann: Omit<Announcement, 'id' | 'date'>): Announcement {
    const res = svucStore.addAnnouncement(ann);
    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, res.id), res, { merge: true }).catch(console.error);
    }
    return res;
  },

  update(id: string, updates: Partial<Announcement>) {
    const list = svucStore.getAnnouncements();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    localStorage.setItem('svuc_announcements_v1', JSON.stringify(list));

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id), updated, { merge: true }).catch(console.error);
    }

    auditService.logAction('Announcement', id, 'UPDATE', `Updated announcement: ${updated.title}`);
    window.dispatchEvent(new Event('svuc_store_updated'));
    return updated;
  },

  delete(id: string) {
    svucStore.deleteAnnouncement(id);
    if (isFirebaseConfigured() && db) {
      deleteDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id)).catch(console.error);
    }
    return true;
  },
};

export const galleryService = {
  getAll(): GalleryItem[] {
    return svucStore.getGallery();
  },

  getById(id: string): GalleryItem | undefined {
    return svucStore.getGallery().find((g) => g.id === id);
  },

  create(item: Omit<GalleryItem, 'id'>): GalleryItem {
    const res = svucStore.addGalleryItem(item);
    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.GALLERY, res.id), res, { merge: true }).catch(console.error);
    }
    auditService.logAction('Gallery', res.id, 'CREATE', `Added photo to gallery: ${res.title} (${res.category})`);
    return res;
  },

  update(id: string, updates: Partial<GalleryItem>) {
    const list = svucStore.getGallery();
    const index = list.findIndex((g) => g.id === id);
    if (index === -1) return null;

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    localStorage.setItem('svuc_gallery_v1', JSON.stringify(list));

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.GALLERY, id), updated, { merge: true }).catch(console.error);
    }

    auditService.logAction('Gallery', id, 'UPDATE', `Updated gallery image: ${updated.title}`);
    window.dispatchEvent(new Event('svuc_store_updated'));
    return updated;
  },

  delete(id: string) {
    svucStore.deleteGalleryItem(id);
    if (isFirebaseConfigured() && db) {
      deleteDoc(doc(db, COLLECTIONS.GALLERY, id)).catch(console.error);
    }
    auditService.logAction('Gallery', id, 'DELETE', `Deleted gallery image ID ${id}`);
    return true;
  },

  reorder(items: GalleryItem[]) {
    localStorage.setItem('svuc_gallery_v1', JSON.stringify(items));
    window.dispatchEvent(new Event('svuc_store_updated'));
  },

  // Mock upload behavior ready for Stage 4 Firebase Storage
  async uploadImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  },
};

export const usersService = {
  getAll(): AdminUser[] {
    return svucStore.getAdminUsers();
  },

  getById(id: string): AdminUser | undefined {
    return svucStore.getAdminUsers().find((u) => u.id === id);
  },

  create(user: Omit<AdminUser, 'id' | 'lastLogin'>): AdminUser {
    const res = svucStore.addAdminUser(user);
    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.USERS, res.id), res, { merge: true }).catch(console.error);
    }
    auditService.logAction('User', res.id, 'CREATE', `Created admin account for ${res.name} (${res.role})`);
    return res;
  },

  update(id: string, updates: Partial<AdminUser>) {
    const list = svucStore.getAdminUsers();
    const index = list.findIndex((u) => u.id === id);
    if (index === -1) return null;

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    localStorage.setItem('svuc_admin_users_v1', JSON.stringify(list));

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.USERS, id), updated, { merge: true }).catch(console.error);
    }

    auditService.logAction('User', id, 'UPDATE', `Modified user profile for ${updated.name}`);
    window.dispatchEvent(new Event('svuc_store_updated'));
    return updated;
  },

  toggleStatus(id: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
    return this.update(id, { status: newStatus });
  },

  delete(id: string) {
    const list = svucStore.getAdminUsers();
    const target = list.find((u) => u.id === id);
    if (!target) return false;

    const filtered = list.filter((u) => u.id !== id);
    localStorage.setItem('svuc_admin_users_v1', JSON.stringify(filtered));

    if (isFirebaseConfigured() && db) {
      deleteDoc(doc(db, COLLECTIONS.USERS, id)).catch(console.error);
    }

    auditService.logAction('User', id, 'DELETE', `Deleted admin user ${target.name} (${target.email})`);
    window.dispatchEvent(new Event('svuc_store_updated'));
    return true;
  },
};

export const adminUserService = usersService;

export const settingsService = {
  getSettings(): CommitteeSettings {
    return svucStore.getSettings();
  },

  updateSettings(newSettings: Partial<CommitteeSettings>) {
    const updated = svucStore.updateSettings(newSettings);
    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.SETTINGS, 'general'), updated, { merge: true }).catch(console.error);
    }
    auditService.logAction('Settings', 'CFG-01', 'UPDATE', 'Updated committee and festival settings.');
    return updated;
  },

  update(newSettings: Partial<CommitteeSettings>, reason?: string) {
    const updated = svucStore.updateSettings(newSettings);
    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, COLLECTIONS.SETTINGS, 'general'), updated, { merge: true }).catch(console.error);
    }
    auditService.logAction(
      'Settings',
      'CFG-01',
      'UPDATE',
      `Updated committee and festival settings. ${reason ? `(${reason})` : ''}`
    );
    return updated;
  },
};


export const auditService = {
  getAll(): AuditLog[] {
    return svucStore.getAuditLogs();
  },

  getById(id: string): AuditLog | undefined {
    return svucStore.getAuditLogs().find((l) => l.id === id);
  },

  logAction(
    entity: AuditLog['entity'],
    recordId: string,
    action: AuditLog['action'],
    details: string,
    previousValue?: string,
    newValue?: string,
    reason?: string
  ) {
    const logs = svucStore.getAuditLogs();
    const currentUser = authService.getCurrentUser();
    const actorName = currentUser ? currentUser.name : 'System / Online Devotee';
    const actorRole = currentUser ? authService.getRoleLabel(currentUser.role) : 'Public';

    const newLog: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userName: actorName,
      userRole: actorRole,
      performedBy: actorName,
      auditReason: reason,
      action,
      entity,
      recordId,
      details,
      previousValue,
      newValue,
      reason,
    };

    localStorage.setItem('svuc_audit_logs_v1', JSON.stringify([newLog, ...logs.slice(0, 200)]));
    window.dispatchEvent(new Event('svuc_store_updated'));
  },
};

export const notificationsService = {
  getNotifications(): AdminNotification[] {
    const donations = svucStore.getDonations().filter((d) => d.status === 'Pending');
    const expenses = svucStore.getExpenses().filter((e) => e.status === 'Pending');
    const materials = svucStore.getMaterials().filter((m) => m.status === 'Pending');

    const notifs: AdminNotification[] = [];

    if (donations.length > 0) {
      notifs.push({
        id: 'notif-1',
        title: 'Pending Donations Require Approval',
        message: `${donations.length} monetary donation(s) waiting for counter audit verification.`,
        timestamp: 'Just now',
        type: 'PENDING_APPROVAL',
        read: false,
        link: '/admin/donations',
      });
    }

    if (expenses.length > 0) {
      notifs.push({
        id: 'notif-2',
        title: 'New Expense Vouchers Pending',
        message: `${expenses.length} voucher(s) submitted for Treasury approval.`,
        timestamp: '15 mins ago',
        type: 'FINANCE',
        read: false,
        link: '/admin/expenses',
      });
    }

    if (materials.length > 0) {
      notifs.push({
        id: 'notif-3',
        title: 'Material Seva Received',
        message: `${materials.length} in-kind items pledged for Annadanam & Mandapam.`,
        timestamp: '1 hour ago',
        type: 'PENDING_APPROVAL',
        read: false,
        link: '/admin/materials',
      });
    }

    notifs.push({
      id: 'notif-4',
      title: 'Festival Countdown Alert',
      message: 'Sri Siddhi Vinayaka Utsav preparations active. Ensure all receipts are audited.',
      timestamp: 'Today',
      type: 'EVENT',
      read: true,
      link: '/admin/events',
    });

    return notifs;
  },
};

export const reportService = {
  exportCSV(filename: string, rows: Record<string, any>[]) {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvRows: string[] = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportPDF(reportTitle: string) {
    // Print window triggers native browser print / save as PDF
    window.print();
  },

  exportExcel(filename: string, rows: Record<string, any>[]) {
    // Stage 3 clean CSV export (opens natively in Microsoft Excel)
    this.exportCSV(`${filename}_Excel`, rows);
  },
};
