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
import { isFirebaseConfigured, db, getFriendlyFirebaseErrorMessage } from '../lib/firebase';

/**
 * Remove any undefined properties recursively to prevent Firestore SDK validation errors
 */
function cleanForFirebase<T>(obj: T): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirebase);
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = cleanForFirebase(value);
    }
  }
  return clean;
}

export const donationsService = {
  getAll(): Donation[] {
    return svucStore.getDonations();
  },

  getById(id: string): Donation | undefined {
    return svucStore.getDonations().find((d) => d.id === id || d.receiptId === id);
  },

  async create(data: {
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
  }): Promise<{ donation: Donation; receipt: Receipt }> {
    const donations = svucStore.getDonations();
    const sequence = donations.length + 1;
    const year = '2026';
    const uniqueSuffix = Date.now().toString(36).slice(-4).toUpperCase();
    const id = `DON-${year}-${String(sequence).padStart(3, '0')}-${uniqueSuffix}`;
    const receiptNumber = generateReceiptNumber('MONETARY', sequence, year, data.paymentMethod);
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
      phoneNumber: data.phoneNumber || '',
      email: data.email || '',
      notes: data.notes || '',
      gothram: data.gothram || '',
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
    svucStore.saveDonations(updated);

    const receipts = svucStore.getReceipts();
    svucStore.saveReceipts([newReceipt, ...receipts]);

    if (isFirebaseConfigured() && db) {
      try {
        const cleanDon = cleanForFirebase(newDonation);
        const cleanRec = cleanForFirebase(newReceipt);
        await setDoc(doc(db, COLLECTIONS.DONATIONS, newDonation.id), cleanDon, { merge: true });
        await setDoc(doc(db, COLLECTIONS.RECEIPTS, newReceipt.id), cleanRec, { merge: true });
      } catch (err) {
        console.warn('[Firestore Donation Create Sync Warning]', err);
      }
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

  async update(
    id: string,
    updates: Partial<Donation>,
    reason?: string
  ): Promise<{ success: boolean; donation?: Donation; error?: string }> {
    const list = svucStore.getDonations();
    let index = list.findIndex((d) => d.id === id || d.receiptId === id);

    let original: Donation;
    if (index === -1) {
      original = {
        id,
        receiptId: updates.receiptId || id,
        donorName: updates.donorName || 'Devotee',
        anonymous: updates.anonymous || false,
        amount: Number(updates.amount) || 0,
        paymentMethod: updates.paymentMethod || 'UPI',
        phoneNumber: updates.phoneNumber || '',
        email: updates.email || '',
        notes: updates.notes || '',
        gothram: updates.gothram || '',
        date: updates.date || new Date().toISOString().split('T')[0],
        status: updates.status || 'Approved',
        createdAt: updates.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Devotee',
      };
      list.unshift(original);
      index = 0;
    } else {
      original = list[index];
    }

    const isFinancialChange =
      (updates.amount !== undefined && updates.amount !== original.amount) ||
      (updates.paymentMethod !== undefined && updates.paymentMethod !== original.paymentMethod);

    const updated: Donation = {
      ...original,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const targetDocId = original.id || id;

    list[index] = updated;
    svucStore.saveDonations(list);

    if (isFirebaseConfigured() && db) {
      try {
        const cleanData = cleanForFirebase(updated);
        // Write ONLY to the single canonical document ID
        await setDoc(doc(db, COLLECTIONS.DONATIONS, targetDocId), cleanData, { merge: true });
        
        // If an alias document was previously created under receiptId or id, clean it up
        if (id !== targetDocId) {
          deleteDoc(doc(db, COLLECTIONS.DONATIONS, id)).catch(() => {});
        }
        if (original.receiptId && original.receiptId !== targetDocId) {
          deleteDoc(doc(db, COLLECTIONS.DONATIONS, original.receiptId)).catch(() => {});
        }
      } catch (err) {
        console.warn('[Firestore Donation Update Sync Warning]', err);
      }
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
        svucStore.saveReceipts(receipts);
        if (isFirebaseConfigured() && db) {
          try {
            const cleanRec = cleanForFirebase(receipts[rIdx]);
            await setDoc(doc(db, COLLECTIONS.RECEIPTS, receipts[rIdx].id), cleanRec, { merge: true });
          } catch (err) {
            console.warn('[Firestore Receipt Update Warning]', err);
          }
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

  async approve(id: string): Promise<{ success: boolean; donation?: Donation }> {
    const currentUser = authService.getCurrentUser();
    const res = await this.update(
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

  async reject(id: string, reason: string): Promise<{ success: boolean; donation?: Donation }> {
    const currentUser = authService.getCurrentUser();
    const res = await this.update(
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

  async decline(id: string, reason: string): Promise<{ success: boolean; donation?: Donation }> {
    return this.reject(id, reason);
  },

  async archive(id: string, reason?: string): Promise<{ success: boolean }> {
    const res = await this.update(id, { status: 'Archived' }, reason || 'Archived record');
    if (res.success) {
      auditService.logAction('Donation', id, 'ARCHIVE', `Donation ${id} marked as archived/void.`);
    }
    return { success: res.success };
  },

  async delete(id: string): Promise<boolean> {
    const list = svucStore.getDonations();
    const target = list.find((d) => d.id === id || d.receiptId === id);
    svucStore.deleteDonation(id);
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.DONATIONS, id)).catch(() => {});
        if (target) {
          if (target.id && target.id !== id) {
            await deleteDoc(doc(db, COLLECTIONS.DONATIONS, target.id)).catch(() => {});
          }
          if (target.receiptId) {
            await deleteDoc(doc(db, COLLECTIONS.DONATIONS, target.receiptId)).catch(() => {});
            await deleteDoc(doc(db, COLLECTIONS.RECEIPTS, target.receiptId)).catch(() => {});
          }
        }
      } catch (err) {
        console.error('[Firestore Donation Delete Error]', err);
      }
    }
    window.dispatchEvent(new Event('svuc_store_updated'));
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

  async create(data: {
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
  }): Promise<{ material: MaterialDonation; receipt: Receipt }> {
    const list = svucStore.getMaterials();
    const sequence = list.length + 1;
    const year = '2026';
    const uniqueSuffix = Date.now().toString(36).slice(-4).toUpperCase();
    const id = `MAT-${year}-${String(sequence).padStart(3, '0')}-${uniqueSuffix}`;
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

    svucStore.saveMaterials([newMaterial, ...list]);
    const receipts = svucStore.getReceipts();
    svucStore.saveReceipts([newReceipt, ...receipts]);

    if (isFirebaseConfigured() && db) {
      try {
        const cleanMat = cleanForFirebase(newMaterial);
        const cleanRec = cleanForFirebase(newReceipt);
        await setDoc(doc(db, COLLECTIONS.MATERIALS, newMaterial.id), cleanMat, { merge: true });
        await setDoc(doc(db, COLLECTIONS.RECEIPTS, newReceipt.id), cleanRec, { merge: true });
      } catch (err) {
        console.warn('[Firestore Material Create Sync Warning]', err);
      }
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

  async update(id: string, updates: Partial<MaterialDonation>, reason?: string): Promise<{ success: boolean; material?: MaterialDonation; error?: string }> {
    const list = svucStore.getMaterials();
    let index = list.findIndex((m) => m.id === id || m.receiptId === id);
    let original: MaterialDonation;
    if (index === -1) {
      original = {
        id,
        receiptId: updates.receiptId || id,
        donorName: updates.donorName || 'Devotee',
        anonymous: updates.anonymous || false,
        materialName: updates.materialName || 'Material Item',
        category: updates.category || 'Other',
        quantity: Number(updates.quantity) || 1,
        unit: updates.unit || 'units',
        date: updates.date || new Date().toISOString().split('T')[0],
        status: updates.status || 'Approved',
        createdAt: updates.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Devotee',
      };
      list.unshift(original);
      index = 0;
    } else {
      original = list[index];
    }

    const updated: MaterialDonation = {
      ...original,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const targetDocId = original.id || id;

    list[index] = updated;
    svucStore.saveMaterials(list);

    if (isFirebaseConfigured() && db) {
      try {
        const cleanMat = cleanForFirebase(updated);
        await setDoc(doc(db, COLLECTIONS.MATERIALS, targetDocId), cleanMat, { merge: true });
        if (id !== targetDocId) {
          deleteDoc(doc(db, COLLECTIONS.MATERIALS, id)).catch(() => {});
        }
        if (original.receiptId && original.receiptId !== targetDocId) {
          deleteDoc(doc(db, COLLECTIONS.MATERIALS, original.receiptId)).catch(() => {});
        }
      } catch (err) {
        console.warn('[Firestore Material Update Sync Warning]', err);
      }
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
        svucStore.saveReceipts(receipts);
        if (isFirebaseConfigured() && db) {
          try {
            const cleanRec = cleanForFirebase(receipts[rIdx]);
            await setDoc(doc(db, COLLECTIONS.RECEIPTS, receipts[rIdx].id), cleanRec, { merge: true });
          } catch (err) {
            console.error('[Firestore Receipt Material Update Error]', err);
          }
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

  async approve(id: string) {
    const currentUser = authService.getCurrentUser();
    const res = await this.update(
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

  async reject(id: string, reason: string) {
    const currentUser = authService.getCurrentUser();
    const res = await this.update(id, { status: 'Declined' }, reason || `Declined by ${currentUser?.name || 'Admin'}`);
    if (res.success && res.material) {
      auditService.logAction('Material', id, 'REJECT', `Material contribution ${id} (${res.material.materialName}) declined. Reason: ${reason}`);
    }
    return res;
  },

  async decline(id: string, reason: string) {
    return this.reject(id, reason);
  },

  async archive(id: string, reason?: string) {
    return this.update(id, { status: 'Archived' }, reason);
  },

  async delete(id: string) {
    const list = svucStore.getMaterials();
    const target = list.find((m) => m.id === id || m.receiptId === id);
    svucStore.deleteMaterial(id);
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.MATERIALS, id)).catch(() => {});
        if (target) {
          if (target.id && target.id !== id) {
            await deleteDoc(doc(db, COLLECTIONS.MATERIALS, target.id)).catch(() => {});
          }
          if (target.receiptId) {
            await deleteDoc(doc(db, COLLECTIONS.MATERIALS, target.receiptId)).catch(() => {});
            await deleteDoc(doc(db, COLLECTIONS.RECEIPTS, target.receiptId)).catch(() => {});
          }
        }
      } catch (err) {
        console.error('[Firestore Material Delete Error]', err);
      }
    }
    window.dispatchEvent(new Event('svuc_store_updated'));
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

  async create(data: {
    expenseName: string;
    category: Expense['category'];
    amount: number;
    vendorName: string;
    description: string;
    paymentMethod: Expense['paymentMethod'];
    billUrl?: string;
    date?: string;
    status?: Expense['status'];
  }): Promise<Expense> {
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

    svucStore.saveExpenses([newExpense, ...list]);

    if (isFirebaseConfigured() && db) {
      try {
        const cleanExp = cleanForFirebase(newExpense);
        await setDoc(doc(db, COLLECTIONS.EXPENSES, newExpense.id), cleanExp, { merge: true });
      } catch (err) {
        console.error('[Firestore Expense Create Error]', err);
        throw err;
      }
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

  async update(id: string, updates: Partial<Expense>, reason?: string): Promise<{ success: boolean; expense?: Expense; error?: string }> {
    const list = svucStore.getExpenses();
    let index = list.findIndex((e) => e.id === id || e.receiptVoucherNo === id);
    let original: Expense;
    if (index === -1) {
      original = {
        id,
        expenseName: updates.expenseName || 'Expense Item',
        category: updates.category || 'Mandapam Setup',
        amount: Number(updates.amount) || 0,
        vendorName: updates.vendorName || 'Vendor',
        description: updates.description || '',
        paymentMethod: updates.paymentMethod || 'UPI',
        receiptVoucherNo: updates.receiptVoucherNo || id,
        date: updates.date || new Date().toISOString().split('T')[0],
        status: updates.status || 'Approved',
        createdAt: updates.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Admin',
      };
      list.unshift(original);
      index = 0;
    } else {
      original = list[index];
    }

    const isFinancialChange =
      (updates.amount !== undefined && updates.amount !== original.amount) ||
      (updates.category !== undefined && updates.category !== original.category);

    const updated: Expense = {
      ...original,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const targetDocId = original.id || id;

    list[index] = updated;
    svucStore.saveExpenses(list);

    if (isFirebaseConfigured() && db) {
      try {
        const cleanData = cleanForFirebase(updated);
        await setDoc(doc(db, COLLECTIONS.EXPENSES, targetDocId), cleanData, { merge: true });
        if (id !== targetDocId) {
          deleteDoc(doc(db, COLLECTIONS.EXPENSES, id)).catch(() => {});
        }
        if (original.receiptVoucherNo && original.receiptVoucherNo !== targetDocId) {
          deleteDoc(doc(db, COLLECTIONS.EXPENSES, original.receiptVoucherNo)).catch(() => {});
        }
      } catch (err) {
        console.error('[Firestore Expense Update Error]', err);
        throw err;
      }
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

  async approve(id: string) {
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

  async reject(id: string, reason: string) {
    return this.update(id, { status: 'Rejected' }, reason);
  },

  async archive(id: string, reason?: string) {
    return this.update(id, { status: 'Archived' }, reason);
  },

  async delete(id: string): Promise<boolean> {
    const list = svucStore.getExpenses();
    const target = list.find((e) => e.id === id || e.receiptVoucherNo === id);
    if (!target) {
      if (isFirebaseConfigured() && db) {
        try {
          await deleteDoc(doc(db, COLLECTIONS.EXPENSES, id));
        } catch (err) {
          console.error('[Firestore Expense Delete Error]', err);
        }
      }
      return true;
    }

    const filtered = list.filter((e) => e.id !== id && e.receiptVoucherNo !== id);
    svucStore.saveExpenses(filtered);

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.EXPENSES, id));
        if (target.id && target.id !== id) {
          await deleteDoc(doc(db, COLLECTIONS.EXPENSES, target.id)).catch(console.error);
        }
      } catch (err) {
        console.error('[Firestore Expense Delete Error]', err);
        throw new Error(getFriendlyFirebaseErrorMessage(err));
      }
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

  async create(event: Omit<EventItem, 'id'>): Promise<EventItem> {
    const res = svucStore.addEvent(event);
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.EVENTS, res.id), cleanForFirebase(res), { merge: true });
      } catch (err) {
        console.error('[Firestore Event Create Error]', err);
        throw new Error(getFriendlyFirebaseErrorMessage(err));
      }
    }
    return res;
  },

  async update(id: string, updates: Partial<EventItem>) {
    const list = svucStore.getEvents();
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return null;

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    svucStore.saveEvents(list);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.EVENTS, id), cleanForFirebase(updated), { merge: true });
      } catch (err) {
        console.error('[Firestore Event Update Error]', err);
        throw new Error(getFriendlyFirebaseErrorMessage(err));
      }
    }

    auditService.logAction('Event', id, 'UPDATE', `Updated festival event: ${updated.title}`);
    window.dispatchEvent(new Event('svuc_store_updated'));
    return updated;
  },

  async delete(id: string) {
    svucStore.deleteEvent(id);
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.EVENTS, id));
      } catch (err) {
        console.error('[Firestore Event Delete Error]', err);
        throw new Error(getFriendlyFirebaseErrorMessage(err));
      }
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

  async create(ann: Omit<Announcement, 'id' | 'date'>): Promise<Announcement> {
    const res = svucStore.addAnnouncement(ann);
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, res.id), cleanForFirebase(res), { merge: true });
      } catch (err) {
        console.error('[Firestore Announcement Create Error]', err);
        throw new Error(getFriendlyFirebaseErrorMessage(err));
      }
    }
    return res;
  },

  async update(id: string, updates: Partial<Announcement>) {
    const list = svucStore.getAnnouncements();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    svucStore.saveAnnouncements(list);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id), cleanForFirebase(updated), { merge: true });
      } catch (err) {
        console.error('[Firestore Announcement Update Error]', err);
        throw new Error(getFriendlyFirebaseErrorMessage(err));
      }
    }

    auditService.logAction('Announcement', id, 'UPDATE', `Updated announcement: ${updated.title}`);
    window.dispatchEvent(new Event('svuc_store_updated'));
    return updated;
  },

  async delete(id: string) {
    svucStore.deleteAnnouncement(id);
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id));
      } catch (err) {
        console.error('[Firestore Announcement Delete Error]', err);
        throw new Error(getFriendlyFirebaseErrorMessage(err));
      }
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

  async create(item: Omit<GalleryItem, 'id'>): Promise<GalleryItem> {
    const res = svucStore.addGalleryItem(item);
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.GALLERY, res.id), cleanForFirebase(res), { merge: true });
      } catch (err) {
        console.error('[Firestore Gallery Create Error]', err);
        throw new Error(getFriendlyFirebaseErrorMessage(err));
      }
    }
    auditService.logAction('Gallery', res.id, 'CREATE', `Added photo to gallery: ${res.title} (${res.category})`);
    return res;
  },

  async update(id: string, updates: Partial<GalleryItem>) {
    const list = svucStore.getGallery();
    const index = list.findIndex((g) => g.id === id);
    if (index === -1) return null;

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    svucStore.saveGallery(list);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.GALLERY, id), cleanForFirebase(updated), { merge: true });
      } catch (err) {
        console.error('[Firestore Gallery Update Error]', err);
        throw new Error(getFriendlyFirebaseErrorMessage(err));
      }
    }

    auditService.logAction('Gallery', id, 'UPDATE', `Updated gallery image: ${updated.title}`);
    window.dispatchEvent(new Event('svuc_store_updated'));
    return updated;
  },

  async delete(id: string) {
    svucStore.deleteGalleryItem(id);
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.GALLERY, id));
      } catch (err) {
        console.error('[Firestore Gallery Delete Error]', err);
        throw new Error(getFriendlyFirebaseErrorMessage(err));
      }
    }
    auditService.logAction('Gallery', id, 'DELETE', `Deleted gallery image ID ${id}`);
    return true;
  },

  reorder(items: GalleryItem[]) {
    svucStore.saveGallery(items);
    window.dispatchEvent(new Event('svuc_store_updated'));
  },

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

  async create(user: Omit<AdminUser, 'id' | 'lastLogin'>): Promise<AdminUser> {
    const res = svucStore.addAdminUser(user);
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.USERS, res.id), cleanForFirebase(res), { merge: true });
      } catch (err) {
        console.error('[Firestore User Create Error]', err);
      }
    }
    auditService.logAction('User', res.id, 'CREATE', `Created admin account for ${res.name} (${res.role})`);
    return res;
  },

  async update(id: string, updates: Partial<AdminUser>) {
    const list = svucStore.getAdminUsers();
    const index = list.findIndex((u) => u.id === id);
    if (index === -1) return null;

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    svucStore.saveAdminUsers(list);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.USERS, id), cleanForFirebase(updated), { merge: true });
      } catch (err) {
        console.error('[Firestore User Update Error]', err);
      }
    }

    auditService.logAction('User', id, 'UPDATE', `Modified user profile for ${updated.name}`);
    window.dispatchEvent(new Event('svuc_store_updated'));
    return updated;
  },

  async toggleStatus(id: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
    return this.update(id, { status: newStatus });
  },

  async delete(id: string) {
    const list = svucStore.getAdminUsers();
    const target = list.find((u) => u.id === id);
    if (!target) return false;

    const filtered = list.filter((u) => u.id !== id);
    svucStore.saveAdminUsers(filtered);

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.USERS, id));
      } catch (err) {
        console.error('[Firestore User Delete Error]', err);
      }
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

  async updateSettings(newSettings: Partial<CommitteeSettings>) {
    const updated = svucStore.updateSettings(newSettings);
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'general'), cleanForFirebase(updated), { merge: true });
      } catch (err) {
        console.error('[Firestore Settings Update Error]', err);
      }
    }
    auditService.logAction('Settings', 'CFG-01', 'UPDATE', 'Updated committee and festival settings.');
    return updated;
  },

  async update(newSettings: Partial<CommitteeSettings>, reason?: string) {
    const updated = svucStore.updateSettings(newSettings);
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'general'), cleanForFirebase(updated), { merge: true });
      } catch (err) {
        console.error('[Firestore Settings Update Error]', err);
      }
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
    svucStore.addAuditLog(entity, recordId, action, details, reason);
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
