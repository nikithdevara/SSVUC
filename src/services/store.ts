import {
  Donation,
  MaterialDonation,
  Expense,
  Receipt,
  EventItem,
  Announcement,
  GalleryItem,
  AuditLog,
  AdminUser,
  CommitteeSettings,
  CommitteeMember,
  ContactMessage,
} from '../types';
import {
  initialDonations,
  initialMaterialDonations,
  initialExpenses,
  initialEvents,
  initialAnnouncements,
  initialGallery,
  initialAuditLogs,
  initialAdminUsers,
  initialSettings,
} from '../data/mockData';

const STORAGE_KEYS = {
  DONATIONS: 'svuc_donations_2026_clean',
  MATERIALS: 'svuc_materials_2026_clean',
  EXPENSES: 'svuc_expenses_2026_clean',
  RECEIPTS: 'svuc_receipts_2026_clean',
  EVENTS: 'svuc_events_2026_clean',
  ANNOUNCEMENTS: 'svuc_announcements_2026_clean',
  GALLERY: 'svuc_gallery_2026_clean',
  AUDIT_LOGS: 'svuc_audit_logs_2026_clean',
  USERS: 'svuc_admin_users_2026_clean',
  SETTINGS: 'svuc_settings_2026_clean',
  CURRENT_USER: 'svuc_current_user_2026_clean',
  MESSAGES: 'svuc_contact_messages_2026_clean',
  NOTIFICATIONS: 'svuc_notifications_2026_clean',
};

// Purge legacy mock/demo data from browser localStorage for a fresh start
(function purgeLegacyData() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const legacyKeys = [
    'svuc_donations_v1',
    'svuc_materials_v1',
    'svuc_expenses_v1',
    'svuc_receipts_v1',
    'svuc_events_v1',
    'svuc_announcements_v1',
    'svuc_gallery_v1',
    'svuc_audit_logs_v1',
    'svuc_contact_messages_2026',
    'svuc_notifications_2026',
    'svuc_payment_transactions_v1',
    'svuc_payment_transactions_v2',
  ];
  legacyKeys.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch (_) {}
  });
})();

// Helper to safely read from localStorage
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
    return fallback;
  }
}

function setLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Dispatch custom event to notify listeners
    window.dispatchEvent(new Event('svuc_store_updated'));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// Generate initial receipts
function buildInitialReceipts(): Receipt[] {
  return [];
}


export const svucStore = {
  // --- Settings ---
  getSettings(): CommitteeSettings {
    return getLocal<CommitteeSettings>(STORAGE_KEYS.SETTINGS, initialSettings);
  },
  updateSettings(newSettings: Partial<CommitteeSettings>) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    setLocal(STORAGE_KEYS.SETTINGS, updated);
    this.addAuditLog('Settings', 'SETTING', 'UPDATE', 'Updated committee configuration details.');
    return updated;
  },

  // --- Auth / Current Admin User ---
  getCurrentUser(): AdminUser | null {
    return getLocal<AdminUser | null>(STORAGE_KEYS.CURRENT_USER, null);
  },
  login(email: string, role?: string): { success: boolean; user?: AdminUser; error?: string } {
    const users = this.getAdminUsers();
    const matched = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched && matched.status === 'ACTIVE') {
      matched.lastLogin = new Date().toLocaleString();
      setLocal(STORAGE_KEYS.CURRENT_USER, matched);
      this.addAuditLog('System', matched.id, 'LOGIN', `Logged into Admin Portal with role: ${matched.role}`);
      return { success: true, user: matched };
    }
    // Demo fallback: if email doesn't match standard, create mock session
    if (email.includes('@')) {
      const fallbackUser: AdminUser = {
        id: `USR-${Date.now()}`,
        name: email.split('@')[0].toUpperCase(),
        email,
        role: (role as any) || 'COMMITTEE_ADMIN',
        status: 'ACTIVE',
        lastLogin: new Date().toLocaleString(),
        phone: '+91 94401 00000',
      };
      setLocal(STORAGE_KEYS.CURRENT_USER, fallbackUser);
      this.addAuditLog('System', fallbackUser.id, 'LOGIN', `Logged into Admin Portal with role: ${fallbackUser.role}`);
      return { success: true, user: fallbackUser };
    }
    return { success: false, error: 'Invalid email address or inactive account.' };
  },
  logout() {
    const u = this.getCurrentUser();
    if (u) {
      this.addAuditLog('System', u.id, 'LOGIN', 'Admin logged out.');
    }
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.dispatchEvent(new Event('svuc_store_updated'));
  },
  getAdminUsers(): AdminUser[] {
    return getLocal<AdminUser[]>(STORAGE_KEYS.USERS, initialAdminUsers);
  },
  addAdminUser(user: Omit<AdminUser, 'id' | 'lastLogin'>): AdminUser {
    const users = this.getAdminUsers();
    const newUser: AdminUser = {
      ...user,
      id: `USR-${String(users.length + 1).padStart(2, '0')}`,
      lastLogin: 'Never',
    };
    const updated = [newUser, ...users];
    setLocal(STORAGE_KEYS.USERS, updated);
    this.addAuditLog('System', newUser.id, 'CREATE', `Added admin user ${newUser.name} (${newUser.role})`);
    return newUser;
  },

  // --- Donations ---
  getDonations(): Donation[] {
    return getLocal<Donation[]>(STORAGE_KEYS.DONATIONS, initialDonations);
  },
  addDonation(data: {
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
    const donations = this.getDonations();
    const id = `DON-2026-${String(donations.length + 1).padStart(3, '0')}`;
    const receiptId = `REC-2026-${String(donations.length + 1).padStart(3, '0')}`;
    const now = new Date();
    const dateStr = data.date || now.toISOString().split('T')[0];
    const initialStatus = data.status || 'Verified';
    const isApproved = initialStatus === 'Approved' || initialStatus === 'Verified';

    const newDonation: Donation = {
      id,
      receiptId,
      donorName: data.anonymous ? 'Devotee (Anonymous)' : data.donorName || 'Devotee',
      anonymous: data.anonymous,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      phoneNumber: data.phoneNumber,
      email: data.email,
      notes: data.notes,
      gothram: data.gothram,
      date: dateStr,
      status: initialStatus,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: this.getCurrentUser()?.name || 'Online Portal',
    };

    const newReceipt: Receipt = {
      id: receiptId,
      receiptNumber: receiptId,
      type: 'MONETARY',
      donationId: id,
      donorName: newDonation.donorName,
      anonymous: newDonation.anonymous,
      amount: newDonation.amount,
      paymentMethod: newDonation.paymentMethod,
      date: dateStr,
      verificationCode: isApproved
        ? `SVUC-${id.replace('DON-', '')}-VERIFIED`
        : `SVUC-${id.replace('DON-', '')}-PENDING`,
      qrCodeData: `https://siddhivinayaka-utsav.org/verify/${receiptId}`,
      committeeName: 'Sri Siddhi Vinayaka Utsava Committee',
      location: 'Gandhinagar Anjayya Colony, Anakapalle',
      issuedBy: 'Utsav Committee',
      createdAt: now.toISOString(),
      status: isApproved ? 'VERIFIED' : 'PENDING',
    };

    const updatedDonations = [newDonation, ...donations];
    setLocal(STORAGE_KEYS.DONATIONS, updatedDonations);

    const receipts = this.getReceipts();
    setLocal(STORAGE_KEYS.RECEIPTS, [newReceipt, ...receipts]);

    this.addAuditLog(
      'Donation',
      id,
      'CREATE',
      `Recorded donation of ₹${data.amount.toLocaleString('en-IN')} by ${newDonation.donorName} (${data.paymentMethod}) - Status: ${initialStatus}`
    );

    return { donation: newDonation, receipt: newReceipt };
  },
  deleteDonation(id: string) {
    const list = this.getDonations();
    const target = list.find((d) => d.id === id);
    const updated = list.filter((d) => d.id !== id);
    setLocal(STORAGE_KEYS.DONATIONS, updated);
    if (target) {
      // Also clean up associated receipt
      const receipts = this.getReceipts();
      const updatedReceipts = receipts.filter(
        (r) => r.donationId !== id && r.id !== target.receiptId && r.receiptNumber !== target.receiptId && r.id !== id
      );
      setLocal(STORAGE_KEYS.RECEIPTS, updatedReceipts);
      this.addAuditLog('Donation', id, 'DELETE', `Removed donation record of ₹${target.amount} by ${target.donorName}`);
    }
  },

  // --- Material Donations ---
  getMaterials(): MaterialDonation[] {
    return getLocal<MaterialDonation[]>(STORAGE_KEYS.MATERIALS, initialMaterialDonations);
  },
  addMaterial(data: {
    donorName: string;
    anonymous: boolean;
    materialName: string;
    category: MaterialDonation['category'];
    quantity: number;
    unit: string;
    phoneNumber?: string;
    email?: string;
    gothram?: string;
    deliveryMethod?: string;
    notes?: string;
    date?: string;
    status?: MaterialDonation['status'];
  }): { material: MaterialDonation; receipt: Receipt } {
    const list = this.getMaterials();
    const id = `MAT-2026-${String(list.length + 1).padStart(3, '0')}`;
    const receiptId = `REC-MAT-${String(list.length + 1).padStart(3, '0')}`;
    const now = new Date();
    const dateStr = data.date || now.toISOString().split('T')[0];
    const initialStatus = data.status || 'Pending';
    const isApproved = initialStatus === 'Approved' || initialStatus === 'Verified';

    const newMaterial: MaterialDonation = {
      id,
      receiptId,
      donorName: data.anonymous ? 'Devotee (Anonymous)' : data.donorName || 'Devotee',
      anonymous: data.anonymous,
      materialName: data.materialName,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit,
      phoneNumber: data.phoneNumber,
      email: data.email,
      gothram: data.gothram,
      deliveryMethod: data.deliveryMethod,
      notes: data.notes,
      date: dateStr,
      status: initialStatus,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: this.getCurrentUser()?.name || 'Online Portal',
      approvedBy: isApproved ? (this.getCurrentUser()?.name || 'Utsav Committee') : undefined,
      approvedAt: isApproved ? now.toISOString() : undefined,
    };

    const newReceipt: Receipt = {
      id: receiptId,
      receiptNumber: receiptId,
      type: 'MATERIAL',
      materialDonationId: id,
      donorName: newMaterial.donorName,
      anonymous: newMaterial.anonymous,
      materialName: newMaterial.materialName,
      quantity: newMaterial.quantity,
      unit: newMaterial.unit,
      date: dateStr,
      verificationCode: isApproved
        ? `SVUC-MAT-${id.replace('MAT-', '')}-VERIFIED`
        : `SVUC-MAT-${id.replace('MAT-', '')}-PENDING`,
      qrCodeData: `https://siddhivinayaka-utsav.org/verify/${receiptId}`,
      committeeName: 'Sri Siddhi Vinayaka Utsava Committee',
      location: 'Gandhinagar Anjayya Colony, Anakapalle',
      issuedBy: 'Utsav Committee',
      createdAt: now.toISOString(),
      status: isApproved ? 'VERIFIED' : 'PENDING',
    };

    setLocal(STORAGE_KEYS.MATERIALS, [newMaterial, ...list]);

    const receipts = this.getReceipts();
    setLocal(STORAGE_KEYS.RECEIPTS, [newReceipt, ...receipts]);

    this.addAuditLog(
      'Material',
      id,
      'CREATE',
      `Recorded material seva: ${data.quantity} ${data.unit} of ${data.materialName} by ${newMaterial.donorName} (${data.category}) - Status: ${initialStatus}`
    );

    return { material: newMaterial, receipt: newReceipt };
  },
  deleteMaterial(id: string) {
    const list = this.getMaterials();
    const target = list.find((m) => m.id === id);
    const updated = list.filter((m) => m.id !== id);
    setLocal(STORAGE_KEYS.MATERIALS, updated);
    if (target) {
      // Also clean up associated receipt
      const receipts = this.getReceipts();
      const updatedReceipts = receipts.filter(
        (r) => r.materialDonationId !== id && r.id !== target.receiptId && r.receiptNumber !== target.receiptId && r.id !== id
      );
      setLocal(STORAGE_KEYS.RECEIPTS, updatedReceipts);
      this.addAuditLog('Material', id, 'DELETE', `Removed material donation ${target.materialName} by ${target.donorName}`);
    }
  },

  // --- Expenses ---
  getExpenses(): Expense[] {
    return getLocal<Expense[]>(STORAGE_KEYS.EXPENSES, initialExpenses);
  },
  addExpense(data: {
    expenseName: string;
    category: Expense['category'];
    amount: number;
    vendorName: string;
    description: string;
    paymentMethod: Expense['paymentMethod'];
    billUrl?: string;
    date?: string;
  }): Expense {
    const list = this.getExpenses();
    const id = `EXP-2026-${String(list.length + 1).padStart(3, '0')}`;
    const voucher = `VCH-2026-${100 + list.length + 1}`;
    const now = new Date();

    const newExpense: Expense = {
      id,
      expenseName: data.expenseName,
      category: data.category,
      amount: data.amount,
      vendorName: data.vendorName,
      description: data.description,
      paymentMethod: data.paymentMethod,
      billUrl: data.billUrl || undefined,
      receiptVoucherNo: voucher,
      date: data.date || now.toISOString().split('T')[0],
      status: 'Approved',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: this.getCurrentUser()?.name && !/satyam|treasurer/i.test(this.getCurrentUser()!.name) ? this.getCurrentUser()!.name : 'Utsav Committee',
    };

    setLocal(STORAGE_KEYS.EXPENSES, [newExpense, ...list]);
    this.addAuditLog(
      'Expense',
      id,
      'CREATE',
      `Authorized expense of ₹${data.amount.toLocaleString('en-IN')} for ${data.expenseName} (${voucher})`
    );
    return newExpense;
  },
  deleteExpense(id: string) {
    const list = this.getExpenses();
    const target = list.find((e) => e.id === id);
    const updated = list.filter((e) => e.id !== id);
    setLocal(STORAGE_KEYS.EXPENSES, updated);
    if (target) {
      this.addAuditLog('Expense', id, 'DELETE', `Deleted expense voucher ${target.receiptVoucherNo} (₹${target.amount})`);
    }
  },

  // --- Receipts ---
  getReceipts(): Receipt[] {
    const raw = getLocal<Receipt[]>(STORAGE_KEYS.RECEIPTS, buildInitialReceipts());
    return raw.map((r) => {
      if (!r.issuedBy || /satyam|treasurer|portal/i.test(r.issuedBy)) {
        return { ...r, issuedBy: 'Utsav Committee' };
      }
      return r;
    });
  },
  getReceiptById(receiptId: string): Receipt | undefined {
    const receipts = this.getReceipts();
    return receipts.find(
      (r) =>
        r.id.toLowerCase() === receiptId.toLowerCase() ||
        r.receiptNumber.toLowerCase() === receiptId.toLowerCase() ||
        r.donationId?.toLowerCase() === receiptId.toLowerCase() ||
        r.materialDonationId?.toLowerCase() === receiptId.toLowerCase()
    );
  },
  verifyReceipt(receiptOrCode: string): { verified: boolean; receipt?: Receipt; message: string; status?: 'VERIFIED' | 'VOID' | 'INVALID' | 'PENDING' } {
    const clean = receiptOrCode.trim().toLowerCase();
    const receipts = this.getReceipts();
    const match = receipts.find(
      (r) =>
        r.id.toLowerCase() === clean ||
        r.receiptNumber.toLowerCase() === clean ||
        r.verificationCode.toLowerCase() === clean ||
        r.donationId?.toLowerCase() === clean ||
        r.materialDonationId?.toLowerCase() === clean
    );

    if (match) {
      let isDeclined = match.status === 'VOID' || match.status === 'REVOKED';
      let declineReason = match.voidReason || '';

      if (match.donationId) {
        const don = this.getDonations().find((d) => d.id.toLowerCase() === match.donationId?.toLowerCase() || d.receiptId.toLowerCase() === match.receiptNumber.toLowerCase());
        if (don && (don.status === 'Declined' || don.status === 'Rejected')) {
          isDeclined = true;
          declineReason = don.rejectionReason || declineReason || 'Declined by administration';
        }
      }
      if (match.materialDonationId) {
        const mat = this.getMaterials().find((m) => m.id.toLowerCase() === match.materialDonationId?.toLowerCase() || m.receiptId.toLowerCase() === match.receiptNumber.toLowerCase());
        if (mat && (mat.status === 'Declined' || mat.status === 'Rejected')) {
          isDeclined = true;
          declineReason = declineReason || 'Declined by administration';
        }
      }

      if (isDeclined) {
        return {
          verified: false,
          receipt: { ...match, status: 'VOID', voidReason: declineReason },
          status: 'VOID',
          message: declineReason
            ? `This offering was formally DECLINED by committee administration. Reason: ${declineReason}`
            : 'This receipt was formally VOIDED or declined by committee audit officers and is no longer valid.',
        };
      }
      if (match.status === 'PENDING') {
        return {
          verified: false,
          receipt: match,
          status: 'PENDING',
          message: 'This offering has been registered and is currently pending verification and audit approval by the Utsav Super Admin / Treasurer.',
        };
      }
      return {
        verified: true,
        receipt: match,
        status: 'VERIFIED',
        message: 'This receipt is authentic and officially registered with Sri Siddhi Vinayaka Utsava Committee.',
      };
    }

    // Fallback cross-check directly from donations & materials
    const fallbackDon = this.getDonations().find((d) => d.id.toLowerCase() === clean || d.receiptId.toLowerCase() === clean);
    if (fallbackDon) {
      if (fallbackDon.status === 'Declined' || fallbackDon.status === 'Rejected') {
        return {
          verified: false,
          status: 'VOID',
          message: `This offering (${fallbackDon.id}) was formally DECLINED by committee administration.${fallbackDon.rejectionReason ? ` Reason: ${fallbackDon.rejectionReason}` : ''}`,
        };
      }
      if (fallbackDon.status === 'Pending') {
        return {
          verified: false,
          status: 'PENDING',
          message: `Offering ${fallbackDon.id} is registered and pending committee audit verification.`,
        };
      }
    }

    const fallbackMat = this.getMaterials().find((m) => m.id.toLowerCase() === clean || m.receiptId.toLowerCase() === clean);
    if (fallbackMat) {
      if (fallbackMat.status === 'Declined' || fallbackMat.status === 'Rejected') {
        return {
          verified: false,
          status: 'VOID',
          message: `This material seva pledge (${fallbackMat.id}) was formally DECLINED by committee administration.`,
        };
      }
      if (fallbackMat.status === 'Pending') {
        return {
          verified: false,
          status: 'PENDING',
          message: `Material seva pledge ${fallbackMat.id} is registered and pending physical handover verification.`,
        };
      }
    }

    return {
      verified: false,
      status: 'INVALID',
      message: 'Receipt could not be verified. Please check the receipt number or scan the QR code again.',
    };
  },

  // --- Events ---
  getEvents(): EventItem[] {
    return getLocal<EventItem[]>(STORAGE_KEYS.EVENTS, initialEvents);
  },
  addEvent(event: Omit<EventItem, 'id'>): EventItem {
    const list = this.getEvents();
    const newEvent: EventItem = {
      ...event,
      id: `EVT-${String(list.length + 1).padStart(2, '0')}`,
    };
    setLocal(STORAGE_KEYS.EVENTS, [...list, newEvent]);
    this.addAuditLog('Event', newEvent.id, 'CREATE', `Created festival event: ${newEvent.title}`);
    return newEvent;
  },
  deleteEvent(id: string) {
    const list = this.getEvents();
    const updated = list.filter((e) => e.id !== id);
    setLocal(STORAGE_KEYS.EVENTS, updated);
    this.addAuditLog('Event', id, 'DELETE', `Deleted festival event ID ${id}`);
  },

  // --- Announcements ---
  getAnnouncements(): Announcement[] {
    return getLocal<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, initialAnnouncements);
  },
  addAnnouncement(ann: Omit<Announcement, 'id' | 'date'>): Announcement {
    const list = this.getAnnouncements();
    const newAnn: Announcement = {
      ...ann,
      id: `ANN-${String(list.length + 1).padStart(2, '0')}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    setLocal(STORAGE_KEYS.ANNOUNCEMENTS, [newAnn, ...list]);
    this.addAuditLog('Announcement', newAnn.id, 'CREATE', `Published announcement: ${newAnn.title}`);
    return newAnn;
  },
  deleteAnnouncement(id: string) {
    const list = this.getAnnouncements();
    const updated = list.filter((a) => a.id !== id);
    setLocal(STORAGE_KEYS.ANNOUNCEMENTS, updated);
    this.addAuditLog('Announcement', id, 'DELETE', `Removed announcement ID ${id}`);
  },

  // --- Gallery ---
  getGallery(): GalleryItem[] {
    return getLocal<GalleryItem[]>(STORAGE_KEYS.GALLERY, initialGallery);
  },
  addGalleryItem(item: Omit<GalleryItem, 'id'>): GalleryItem {
    const list = this.getGallery();
    const newItem: GalleryItem = {
      ...item,
      id: `GAL-${String(list.length + 1).padStart(2, '0')}`,
    };
    setLocal(STORAGE_KEYS.GALLERY, [newItem, ...list]);
    return newItem;
  },
  deleteGalleryItem(id: string) {
    const list = this.getGallery();
    const updated = list.filter((g) => g.id !== id);
    setLocal(STORAGE_KEYS.GALLERY, updated);
  },

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    return getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
  },
  addAuditLog(entity: AuditLog['entity'], recordId: string, action: AuditLog['action'], details: string, reason?: string) {
    const logs = this.getAuditLogs();
    const current = this.getCurrentUser();
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      userName: current ? current.name : 'Public / Online User',
      userRole: current ? current.role : 'Devotee',
      action,
      entity,
      recordId,
      details: reason ? `${details} (Reason: ${reason})` : details,
    };
    setLocal(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs.slice(0, 150)]);
  },

  // --- Notifications ---
  getNotifications(): any[] {
    return getLocal<any[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },
  markNotificationRead(id: string) {
    const list = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    setLocal(STORAGE_KEYS.NOTIFICATIONS, list);
  },
  addNotification(notif: any) {
    const list = this.getNotifications();
    const item = { ...notif, id: `NOTIF-${Date.now()}` };
    setLocal(STORAGE_KEYS.NOTIFICATIONS, [item, ...list]);
    return item;
  },

  // --- Financial Transparency Aggregations ---
  getFinancialSummary() {
    const donations = this.getDonations().filter((d) => d.status === 'Approved' || d.status === 'Verified');
    const expenses = this.getExpenses().filter((e) => e.status === 'Approved' || e.status === 'Paid');
    const materials = this.getMaterials().filter((m) => m.status === 'Approved' || m.status === 'Verified');

    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    // Formula per requirement: Available Balance = Total Monetary Donations - Total Expenses
    const availableBalance = totalDonations - totalExpenses;

    const totalDonors = donations.length;
    const materialItemsCount = materials.reduce((sum, m) => sum + m.quantity, 0);
    const materialContributorsCount = materials.length;

    // Category-wise expense calculation
    const expenseByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });

    // Payment method breakdown
    const donationsByMethod: Record<string, number> = {};
    donations.forEach((d) => {
      donationsByMethod[d.paymentMethod] = (donationsByMethod[d.paymentMethod] || 0) + d.amount;
    });

    return {
      totalDonations,
      totalExpenses,
      availableBalance,
      totalDonors,
      materialItemsCount,
      materialContributorsCount,
      expenseByCategory,
      donationsByMethod,
      donationCount: donations.length,
      expenseCount: expenses.length,
      materialCount: materials.length,
    };
  },

  // --- Admin Session Helpers ---
  isAdminLoggedIn(): boolean {
    return !!this.getCurrentUser();
  },
  adminLogin(pinOrCred: string): boolean {
    const clean = pinOrCred.trim().toLowerCase();
    if (clean === '1234' || clean === 'admin2026' || clean.includes('admin') || clean.includes('treasurer')) {
      const adminUser: AdminUser = {
        id: 'USR-02',
        name: 'Utsav Committee',
        email: 'treasurer@siddhivinayaka-utsav.org',
        role: 'TREASURER',
        status: 'ACTIVE',
        lastLogin: new Date().toLocaleString(),
        phone: '+91 98480 23456',
      };
      setLocal(STORAGE_KEYS.CURRENT_USER, adminUser);
      this.addAuditLog('System', adminUser.id, 'LOGIN', 'Admin authenticated into Treasurer portal.');
      window.dispatchEvent(new Event('svuc_store_updated'));
      return true;
    }
    return false;
  },
  adminLogout(): void {
    this.logout();
  },

  // --- Committee Directory ---
  getCommittee(): CommitteeMember[] {
    return [
      {
        id: 'COM-01',
        name: 'Sri K. Ramana Murthy',
        role: 'President & Founder',
        servingSince: 'Serving since 2012 (14 years)',
        phoneNumber: '+91 98480 23456',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        bio: 'Senior community elder dedicated to preserving traditional Vedic worship, eco-friendly celebrations, and neighborhood harmony in Gandhinagar Anjayya Colony.',
      },
      {
        id: 'COM-02',
        name: 'Sri B. Satyam',
        role: 'Treasurer & Accounts Auditor',
        servingSince: 'Serving since 2015 (11 years)',
        phoneNumber: '+91 94401 23456',
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
        bio: 'Practicing financial consultant in Anakapalle. Oversees day-to-day expenditure, daily counter verification, and maintains the 100% transparent public balance sheet.',
      },
      {
        id: 'COM-03',
        name: 'Sri G. Apparao',
        role: 'General Secretary',
        servingSince: 'Serving since 2014 (12 years)',
        phoneNumber: '+91 94401 56789',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        bio: 'Manages Vedic priesthood liaison, daily puja schedules, temple decorations, homam materials procurement, and official municipal permissions.',
      },
      {
        id: 'COM-04',
        name: 'Sri M. Satyanarayana',
        role: 'Maha Annadanam In-charge',
        servingSince: 'Serving since 2016 (10 years)',
        phoneNumber: '+91 99890 12345',
        photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
        bio: 'Leads the dedicated satvik kitchen team that prepares feasts for 3,000+ devotees, supervising rice donations, clean drinking water, and hygienic dining arrangements.',
      },
      {
        id: 'COM-05',
        name: 'Sri S. Venu Gopal',
        role: 'Youth Seva Coordinator',
        servingSince: 'Serving since 2018 (8 years)',
        phoneNumber: '+91 98490 87654',
        photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
        bio: 'Coordinates 60+ colony youth volunteers for queue management, cultural sound arrangements, stage setups, and the grand Sarada River Shobha Yatra.',
      },
      {
        id: 'COM-06',
        name: 'Smt. P. Lakshmi & Smt. K. Sarojini',
        role: 'Women’s Seva & Deepotsavam Wing',
        servingSince: 'Serving since 2016 (10 years)',
        phoneNumber: '+91 98481 99887',
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        bio: 'Organize floral rangolis, Kumkumarchana poojas, daily prasadam distribution, and the sacred 10,000-clay-lamp Laksha Deepotsavam across colony streets.',
      },
    ];
  },

  // --- Single Announcement by ID ---
  getAnnouncementById(id: string): Announcement | undefined {
    return this.getAnnouncements().find((a) => a.id === id);
  },

  // --- Donations Persistence ---
  saveDonations(donations: Donation[]): void {
    setLocal(STORAGE_KEYS.DONATIONS, donations);
    window.dispatchEvent(new Event('svuc_store_updated'));
  },

  // --- Contact Messages ---
  getContactMessages(): ContactMessage[] {
    return getLocal<ContactMessage[]>(STORAGE_KEYS.MESSAGES, []);
  },
  saveContactMessages(msgs: ContactMessage[]): void {
    setLocal(STORAGE_KEYS.MESSAGES, msgs);
    window.dispatchEvent(new Event('svuc_store_updated'));
  },

  // --- Notification Bulk Actions ---
  markAllNotificationsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    setLocal(STORAGE_KEYS.NOTIFICATIONS, list);
    window.dispatchEvent(new Event('svuc_store_updated'));
  },

  // --- Receipts Management (Section 31, 32, 33) ---
  regenerateReceipt(receiptNumber: string): Receipt | null {
    const receipts = this.getReceipts();
    const target = receipts.find((r) => r.receiptNumber === receiptNumber);
    if (!target) return null;

    const user = this.getCurrentUser()?.name || 'Administrator';
    const timestamp = new Date().toISOString();
    target.regeneratedAt = timestamp;
    target.updatedAt = timestamp;
    target.verificationCode = `SVUC-REG-${target.receiptNumber}-${Date.now().toString(36).toUpperCase()}`;

    setLocal(STORAGE_KEYS.RECEIPTS, receipts);
    this.addAuditLog(
      'Receipt',
      receiptNumber,
      'UPDATE',
      `Receipt regenerated by ${user} at ${timestamp}`
    );
    window.dispatchEvent(new Event('svuc_store_updated'));
    return target;
  },

  voidReceipt(receiptNumber: string, reason: string): boolean {
    const receipts = this.getReceipts();
    const target = receipts.find((r) => r.receiptNumber === receiptNumber);
    if (!target) return false;

    const user = this.getCurrentUser()?.name || 'Administrator';
    target.status = 'VOID';
    target.updatedAt = new Date().toISOString();

    setLocal(STORAGE_KEYS.RECEIPTS, receipts);
    this.addAuditLog(
      'Receipt',
      receiptNumber,
      'UPDATE',
      `Receipt officially marked as VOID by ${user}. Reason: ${reason}`
    );
    window.dispatchEvent(new Event('svuc_store_updated'));
    return true;
  },

  // --- Admin Users alias ---
  getUsers(): AdminUser[] {
    return this.getAdminUsers();
  },

  // --- Clear local cache ---
  clearStorage(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new Event('svuc_store_updated'));
  },
};

