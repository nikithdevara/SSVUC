import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
  runTransaction,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirebaseConfigured } from '../../lib/firebase';
import { Donation, Receipt } from '../../types';
import { COLLECTIONS, generateSafeReceiptNumber, auditFirebaseService, notificationsFirebaseService, cleanForFirebase } from './firestoreService';
import { svucStore } from '../store';

export interface DonationFilterOptions {
  status?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
  limitCount?: number;
  lastDoc?: DocumentSnapshot;
}

export const donationsFirebaseService = {
  /**
   * Fetch donations with optional real-time updates and fallback to store cache
   */
  async getDonations(
    options: DonationFilterOptions = {},
    onRealtimeUpdate?: (donations: Donation[]) => void
  ): Promise<{ donations: Donation[]; lastDoc?: DocumentSnapshot }> {
    if (isFirebaseConfigured() && db) {
      try {
        const constraints: any[] = [];

        if (options.status && options.status !== 'ALL') {
          constraints.push(where('status', '==', options.status));
        }
        if (options.paymentMethod && options.paymentMethod !== 'ALL') {
          constraints.push(where('paymentMethod', '==', options.paymentMethod));
        }

        constraints.push(orderBy('date', 'desc'));

        if (options.lastDoc) {
          constraints.push(startAfter(options.lastDoc));
        }

        constraints.push(limit(options.limitCount || 100));

        const q = query(collection(db, COLLECTIONS.DONATIONS), ...constraints);

        if (onRealtimeUpdate) {
          onSnapshot(
            q,
            (snapshot) => {
              const liveData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Donation));
              onRealtimeUpdate(liveData);
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, COLLECTIONS.DONATIONS);
            }
          );
        }

        const snapshot = await getDocs(q);
        let list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Donation));

        // Filter in-memory for search terms (donorName, receiptId, notes)
        if (options.searchQuery?.trim()) {
          const term = options.searchQuery.toLowerCase().trim();
          list = list.filter(
            (d) =>
              d.donorName.toLowerCase().includes(term) ||
              d.receiptId.toLowerCase().includes(term) ||
              (d.notes && d.notes.toLowerCase().includes(term))
          );
        }

        return {
          donations: list,
          lastDoc: snapshot.docs[snapshot.docs.length - 1],
        };
      } catch (err) {
        console.warn('[Donations Firestore] Read error, falling back to store:', err);
      }
    }

    // Local fallback
    let list = svucStore.getDonations();
    if (options.status && options.status !== 'ALL') {
      list = list.filter((d) => d.status.toLowerCase() === options.status?.toLowerCase());
    }
    if (options.paymentMethod && options.paymentMethod !== 'ALL') {
      list = list.filter((d) => d.paymentMethod === options.paymentMethod);
    }
    if (options.searchQuery?.trim()) {
      const term = options.searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.donorName.toLowerCase().includes(term) ||
          d.receiptId.toLowerCase().includes(term) ||
          (d.notes && d.notes.toLowerCase().includes(term))
      );
    }
    return { donations: list };
  },

  /**
   * Get public verified donations for transparency / ticker
   */
  async getPublicApprovedDonations(): Promise<Donation[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, COLLECTIONS.DONATIONS),
          where('status', 'in', ['Approved', 'approved', 'Verified']),
          orderBy('date', 'desc'),
          limit(100)
        );
        const snap = await getDocs(q);
        return snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Donation))
          .filter((d: any) => d.publicVisibility !== false && !d.archived);
      } catch (err) {
        console.warn('[Public Donations Firestore] Fallback to local store:', err);
      }
    }

    // Local fallback
    return svucStore
      .getDonations()
      .filter((d) => (d.status === 'Approved' || d.status === 'Verified') && (d as any).publicVisibility !== false);
  },

  async getDonation(id: string): Promise<Donation | undefined> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.DONATIONS, id));
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as Donation;
        }
      } catch (err) {
        console.warn('[Get Donation] Read error:', err);
      }
    }
    return svucStore.getDonations().find((d) => d.id === id || d.receiptId === id);
  },

  /**
   * Create donation: sets status to 'Pending' by default for review
   */
  async createDonation(data: {
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
    const actor = auth?.currentUser;
    const localUser = svucStore.getCurrentUser();
    const createdBy = actor?.displayName || localUser?.name || 'Devotee (Online Demo Portal)';
    const now = new Date();
    const dateStr = data.date || now.toISOString().split('T')[0];
    const sequenceYear = '2026';

    const receiptNumber = await generateSafeReceiptNumber('MONETARY', sequenceYear);
    const donationId = `DON-${receiptNumber.replace('SSV-', '')}`;

    const newDonation: Donation = {
      id: donationId,
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
      status: data.status || 'Pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy,
    };

    // Prepare matching receipt record
    const newReceipt: Receipt = {
      id: receiptNumber,
      receiptNumber,
      type: 'MONETARY',
      donationId,
      donorName: newDonation.donorName,
      anonymous: newDonation.anonymous,
      amount: newDonation.amount,
      paymentMethod: newDonation.paymentMethod,
      date: dateStr,
      verificationCode: `SVUC-${donationId.replace('DON-', '')}-VERIFIED`,
      qrCodeData: `https://siddhivinayaka-utsav.org/verify/${receiptNumber}`,
      committeeName: 'Sri Siddhi Vinayaka Utsava Committee',
      location: 'Gandhinagar Anjayya Colony, Anakapalle',
      issuedBy: createdBy,
      createdAt: now.toISOString(),
      status: newDonation.status === 'Approved' || newDonation.status === 'Verified' ? 'VERIFIED' : 'REVOKED',
    };

    // Update local store immediately for instant UI feedback
    const donations = svucStore.getDonations();
    localStorage.setItem('svuc_donations_v1', JSON.stringify([newDonation, ...donations]));
    const receipts = svucStore.getReceipts();
    localStorage.setItem('svuc_receipts_v1', JSON.stringify([newReceipt, ...receipts]));
    window.dispatchEvent(new Event('svuc_store_updated'));

    // Write to Firestore if configured
    if (isFirebaseConfigured() && db) {
      try {
        await runTransaction(db, async (transaction) => {
          const donRef = doc(db, COLLECTIONS.DONATIONS, donationId);
          const recRef = doc(db, COLLECTIONS.RECEIPTS, receiptNumber);

          transaction.set(donRef, cleanForFirebase({
            ...newDonation,
            publicVisibility: true,
            currency: 'INR',
            archived: false,
            serverCreatedAt: serverTimestamp(),
            serverUpdatedAt: serverTimestamp(),
          }));

          transaction.set(recRef, cleanForFirebase({
            ...newReceipt,
            serverCreatedAt: serverTimestamp(),
            serverUpdatedAt: serverTimestamp(),
          }));
        });

        // Trigger in-app notification if pending
        if (newDonation.status === 'Pending') {
          await notificationsFirebaseService.createNotification({
            title: 'New Donation Pending Approval',
            message: `Devotee ${newDonation.donorName} offered ₹${newDonation.amount.toLocaleString('en-IN')} via ${newDonation.paymentMethod}.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'PENDING_APPROVAL',
            read: false,
            link: '/admin/donations',
          });
        }
      } catch (err) {
        console.warn('[Donation Firestore Write] Transacted write error:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'CREATE',
      entity: 'Donation',
      recordId: donationId,
      details: `Created donation record of ₹${newDonation.amount.toLocaleString('en-IN')} by ${newDonation.donorName} (${newDonation.status})`,
      after: newDonation,
    });

    return { donation: newDonation, receipt: newReceipt };
  },

  /**
   * Update donation with audit logging
   */
  async updateDonation(id: string, updates: Partial<Donation>, reason?: string): Promise<Donation> {
    const existing = await this.getDonation(id);
    const actor = auth?.currentUser;
    const localUser = svucStore.getCurrentUser();
    const updatedBy = actor?.displayName || localUser?.name || 'Administrator';
    const now = new Date().toISOString();

    const merged: Donation = {
      ...(existing || ({} as Donation)),
      ...updates,
      updatedAt: now,
    };

    // Update local store
    const list = svucStore.getDonations();
    const nextList = list.map((d) => (d.id === id ? merged : d));
    localStorage.setItem('svuc_donations_v1', JSON.stringify(nextList));
    window.dispatchEvent(new Event('svuc_store_updated'));

    if (isFirebaseConfigured() && db) {
      try {
        const payload = cleanForFirebase({
          ...updates,
          updatedBy,
          updatedAt: now,
          serverUpdatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, COLLECTIONS.DONATIONS, id), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.DONATIONS}/${id}`);
      }
    }

    await auditFirebaseService.log({
      action: 'UPDATE',
      entity: 'Donation',
      recordId: id,
      details: `Modified donation record ${id}: ${reason || 'Field values adjusted'}`,
      before: existing,
      after: merged,
      reason,
    });

    return merged;
  },

  /**
   * Approve donation: changes status to Approved, enables receipt verification, impacts financial totals
   */
  async approveDonation(id: string, notes?: string): Promise<Donation> {
    const existing = await this.getDonation(id);
    const actor = auth?.currentUser;
    const localUser = svucStore.getCurrentUser();
    const approvedBy = actor?.displayName || localUser?.name || 'Treasurer';
    const approvedAt = new Date().toISOString();

    const updated = await this.updateDonation(
      id,
      {
        status: 'Approved',
        approvedBy,
        approvedAt,
      },
      notes || 'Approved by authorized committee administrator'
    );

    // Update receipt status to VERIFIED
    if (updated.receiptId) {
      const receipts = svucStore.getReceipts();
      const updatedReceipts = receipts.map((r) =>
        r.id === updated.receiptId || r.receiptNumber === updated.receiptId
          ? { ...r, status: 'VERIFIED' as const }
          : r
      );
      localStorage.setItem('svuc_receipts_v1', JSON.stringify(updatedReceipts));
      window.dispatchEvent(new Event('svuc_store_updated'));

      if (isFirebaseConfigured() && db) {
        try {
          await updateDoc(doc(db, COLLECTIONS.RECEIPTS, updated.receiptId), {
            status: 'VERIFIED',
            serverUpdatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn('[Approve Donation] Could not update receipt:', err);
        }
      }
    }

    await auditFirebaseService.log({
      action: 'APPROVE',
      entity: 'Donation',
      recordId: id,
      details: `Approved donation ${id} (₹${updated.amount}) - added to public transparency and audited ledger`,
      before: existing,
      after: updated,
      reason: notes,
    });

    return updated;
  },

  /**
   * Reject donation: sets status to Rejected with logged reason
   */
  async rejectDonation(id: string, reason: string): Promise<Donation> {
    const existing = await this.getDonation(id);
    const actor = auth?.currentUser;
    const localUser = svucStore.getCurrentUser();
    const rejectedBy = actor?.displayName || localUser?.name || 'Administrator';

    const updated = await this.updateDonation(
      id,
      {
        status: 'Rejected',
        rejectionReason: reason,
      },
      reason
    );

    // Revoke receipt if previously present
    if (updated.receiptId) {
      const receipts = svucStore.getReceipts();
      const updatedReceipts = receipts.map((r) =>
        r.id === updated.receiptId ? { ...r, status: 'REVOKED' as const } : r
      );
      localStorage.setItem('svuc_receipts_v1', JSON.stringify(updatedReceipts));
      window.dispatchEvent(new Event('svuc_store_updated'));
    }

    await auditFirebaseService.log({
      action: 'REJECT',
      entity: 'Donation',
      recordId: id,
      details: `Rejected donation ${id}: ${reason}`,
      before: existing,
      after: updated,
      reason,
    });

    return updated;
  },

  /**
   * Archive donation: retains historical record while removing from active view
   */
  async archiveDonation(id: string, reason?: string): Promise<Donation> {
    const existing = await this.getDonation(id);
    const updated = await this.updateDonation(
      id,
      {
        status: 'Archived',
      },
      reason || 'Archived record'
    );

    await auditFirebaseService.log({
      action: 'ARCHIVE',
      entity: 'Donation',
      recordId: id,
      details: `Archived donation ${id}`,
      before: existing,
      after: updated,
      reason,
    });

    return updated;
  },

  /**
   * Soft delete or permanent removal with audit
   */
  async deleteDonation(id: string, reason?: string): Promise<void> {
    const existing = await this.getDonation(id);
    svucStore.deleteDonation(id);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, COLLECTIONS.DONATIONS, id), {
          archived: true,
          status: 'Archived',
          serverUpdatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Delete Donation] Error archiving in Firestore:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'DELETE',
      entity: 'Donation',
      recordId: id,
      details: `Removed donation ${id} (₹${existing?.amount || 0})`,
      before: existing,
      reason,
    });
  },
};
