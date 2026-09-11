import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirebaseConfigured } from '../../lib/firebase';
import {
  Donation,
  MaterialDonation,
  Expense,
  EventItem,
  Announcement,
  GalleryItem,
  Receipt,
  AuditLog,
  CommitteeSettings,
  ContactMessage,
  AdminNotification,
  AdminUser,
} from '../../types';
import { svucStore } from '../store';

export const COLLECTIONS = {
  USERS: 'users',
  DONATIONS: 'donations',
  MATERIALS: 'materials',
  EXPENSES: 'expenses',
  EVENTS: 'events',
  ANNOUNCEMENTS: 'announcements',
  GALLERY: 'gallery',
  RECEIPTS: 'receipts',
  AUDIT_LOGS: 'auditLogs',
  SETTINGS: 'settings',
  CONTACT_MESSAGES: 'contactMessages',
  NOTIFICATIONS: 'notifications',
  COUNTERS: 'counters',
} as const;

/**
 * Clean any undefined properties recursively to prevent Firestore SDK validation errors
 */
export function cleanForFirebase<T>(obj: T): any {
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

/**
 * Atomic Receipt Number generator using Firestore transaction
 * Standard format: SSV-YYYY-C-XXXXX (Cash), SSV-YYYY-O-XXXXX (UPI/Online), SSV-YYYY-M-XXXXX (Material)
 */
export async function generateSafeReceiptNumber(
  type: 'MONETARY' | 'MATERIAL',
  year = '2026',
  paymentMethod?: string
): Promise<string> {
  let prefix = 'O';
  if (type === 'MATERIAL') {
    prefix = 'M';
  } else if (
    paymentMethod?.trim().toLowerCase() === 'cash' ||
    paymentMethod?.trim().toLowerCase() === 'cash handover'
  ) {
    prefix = 'C';
  } else {
    prefix = 'O';
  }

  if (isFirebaseConfigured() && db) {
    try {
      const counterRef = doc(db, COLLECTIONS.SETTINGS, 'counters');
      const field =
        type === 'MONETARY'
          ? prefix === 'C'
            ? 'cashDonationCount'
            : 'onlineDonationCount'
          : 'materialCount';

      const sequence = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nextVal = 1;
        if (counterDoc.exists()) {
          const current = counterDoc.data()[field] || counterDoc.data()['donationCount'] || 0;
          nextVal = current + 1;
          transaction.update(counterRef, {
            [field]: nextVal,
            updatedAt: serverTimestamp(),
          });
        } else {
          transaction.set(counterRef, {
            [field]: 1,
            donationCount: 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        return nextVal;
      });

      return `SSV-${year}-${prefix}-${String(sequence).padStart(5, '0')}`;
    } catch (err) {
      console.warn('[Firestore Transaction Counter] Falling back to local sequence:', err);
    }
  }

  // Fallback if Firestore is not available
  const existingCount =
    type === 'MONETARY' ? svucStore.getDonations().length : svucStore.getMaterials().length;
  return `SSV-${year}-${prefix}-${String(existingCount + 1).padStart(5, '0')}`;
}

/**
 * Centralized Audit Logging Service
 * Guaranteed immutable server timestamps and actor metadata
 */
export const auditFirebaseService = {
  async log(params: {
    action: AuditLog['action'];
    entity: AuditLog['entity'];
    recordId: string;
    details: string;
    before?: any;
    after?: any;
    reason?: string;
  }) {
    const actor = auth?.currentUser;
    const localUser = svucStore.getCurrentUser();
    const actorUid = actor?.uid || localUser?.id || 'system';
    const actorName = actor?.displayName || localUser?.name || actor?.email?.split('@')[0] || 'Administrator';
    const actorRole = localUser?.role || 'SUPER_ADMIN';

    const logEntry: Omit<AuditLog, 'id'> & { actorUid: string; before?: any; after?: any } = {
      timestamp: new Date().toISOString(),
      userName: actorName,
      userRole: actorRole,
      action: params.action,
      entity: params.entity,
      recordId: params.recordId,
      details: params.details,
      actorUid,
      before: params.before || null,
      after: params.after || null,
      reason: params.reason || '',
      performedBy: actorName,
    };

    // Save to local store for instant UI updates
    svucStore.addAuditLog(params.entity, params.recordId, params.action, params.details, params.reason);

    // Save to Firestore if configured
    if (isFirebaseConfigured() && db) {
      try {
        const logsRef = collection(db, COLLECTIONS.AUDIT_LOGS);
        const newDoc = doc(logsRef);
        await setDoc(newDoc, {
          ...logEntry,
          id: newDoc.id,
          serverTimestamp: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Audit Log Firestore] Error writing log:', err);
      }
    }
  },

  async getLogs(pageLimit = 50): Promise<AuditLog[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, COLLECTIONS.AUDIT_LOGS),
          orderBy('serverTimestamp', 'desc'),
          limit(pageLimit)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
        }
      } catch (err) {
        console.warn('[Audit Log Firestore] Error reading logs, using local cache:', err);
      }
    }
    return svucStore.getAuditLogs();
  },
};

/**
 * Settings Firebase Service
 */
export const settingsFirebaseService = {
  async getSettings(): Promise<CommitteeSettings> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'committee'));
        if (snap.exists()) {
          return snap.data() as CommitteeSettings;
        }
      } catch (err) {
        console.warn('[Settings Firestore] Read error, using store cache:', err);
      }
    }
    return svucStore.getSettings();
  },

  async updateSettings(data: Partial<CommitteeSettings>, reason?: string): Promise<CommitteeSettings> {
    const updated = svucStore.updateSettings(data);
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(
          doc(db, COLLECTIONS.SETTINGS, 'committee'),
          { ...updated, updatedAt: serverTimestamp() },
          { merge: true }
        );
        await auditFirebaseService.log({
          action: 'UPDATE',
          entity: 'Settings',
          recordId: 'committee',
          details: 'Updated committee settings',
          reason,
          after: data,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.SETTINGS}/committee`);
      }
    }
    return updated;
  },
};

/**
 * Notifications Firebase Service
 */
export const notificationsFirebaseService = {
  async getNotifications(): Promise<AdminNotification[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, COLLECTIONS.NOTIFICATIONS),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminNotification));
        }
      } catch (err) {
        console.warn('[Notifications Firestore] Error reading:', err);
      }
    }
    return svucStore.getNotifications();
  },

  async markAsRead(id: string) {
    svucStore.markNotificationRead(id);
    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), { read: true });
      } catch (err) {
        console.warn('[Notifications] Error marking as read:', err);
      }
    }
  },

  async createNotification(notif: Omit<AdminNotification, 'id'>) {
    const created = svucStore.addNotification(notif);
    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
        await setDoc(ref, {
          ...notif,
          id: ref.id,
          serverCreatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Notifications] Error creating:', err);
      }
    }
    return created;
  },
};

/**
 * Contact Messages Service
 */
export const contactFirebaseService = {
  async submitMessage(data: { name: string; phone: string; email: string; message: string }): Promise<ContactMessage> {
    const msg: ContactMessage = {
      id: `MSG-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      email: data.email,
      message: data.message,
      createdAt: new Date().toISOString(),
      read: false,
      status: 'unread',
    };

    if (isFirebaseConfigured() && db) {
      try {
        const ref = doc(collection(db, COLLECTIONS.CONTACT_MESSAGES));
        msg.id = ref.id;
        await setDoc(ref, {
          ...msg,
          serverCreatedAt: serverTimestamp(),
        });

        // Trigger notification for admins
        await notificationsFirebaseService.createNotification({
          title: 'New Devotee Inquiry',
          message: `Devotee ${data.name} sent a message regarding festival sevas.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'SYSTEM',
          read: false,
          link: '/admin',
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, COLLECTIONS.CONTACT_MESSAGES);
      }
    }

    return msg;
  },

  async getMessages(): Promise<ContactMessage[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, COLLECTIONS.CONTACT_MESSAGES), orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContactMessage));
      } catch (err) {
        console.warn('[ContactMessages] Read error:', err);
      }
    }
    return [];
  },
};
