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
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirebaseConfigured } from '../../lib/firebase';
import { Expense } from '../../types';
import { COLLECTIONS, auditFirebaseService, notificationsFirebaseService, cleanForFirebase } from './firestoreService';
import { svucStore } from '../store';

export const expensesFirebaseService = {
  async getExpenses(onRealtimeUpdate?: (expenses: Expense[]) => void): Promise<Expense[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, COLLECTIONS.EXPENSES),
          orderBy('date', 'desc'),
          limit(100)
        );

        if (onRealtimeUpdate) {
          onSnapshot(
            q,
            (snapshot) => {
              const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
              onRealtimeUpdate(live);
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, COLLECTIONS.EXPENSES);
            }
          );
        }

        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
      } catch (err) {
        console.warn('[Expenses Firestore] Read error, fallback to store:', err);
      }
    }
    return svucStore.getExpenses();
  },

  async getPublicExpenses(): Promise<Expense[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, COLLECTIONS.EXPENSES));
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Expense))
          .filter((e: any) => (e.status === 'Approved' || e.status === 'Paid') && e.publicVisibility !== false && !e.archived);
        return items.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      } catch (err) {
        console.warn('[Public Expenses Firestore] Fallback to store:', err);
      }
    }

    return svucStore.getExpenses().filter((e) => e.status === 'Approved' || e.status === 'Paid');
  },

  async getExpense(id: string): Promise<Expense | undefined> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.EXPENSES, id));
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as Expense;
        }
      } catch (err) {
        console.warn('[Get Expense] Read error:', err);
      }
    }
    return svucStore.getExpenses().find((e) => e.id === id || e.receiptVoucherNo === id);
  },

  async createExpense(data: {
    expenseName: string;
    category: Expense['category'];
    amount: number;
    vendorName: string;
    description: string;
    paymentMethod: Expense['paymentMethod'];
    billUrl?: string;
    billStoragePath?: string;
    publicBillVisibility?: boolean;
    date?: string;
    status?: Expense['status'];
  }): Promise<Expense> {
    const actor = auth?.currentUser;
    const localUser = svucStore.getCurrentUser();
    const createdBy = actor?.displayName || localUser?.name || 'Administrator';
    const now = new Date();
    const dateStr = data.date || now.toISOString().split('T')[0];

    const expenses = svucStore.getExpenses();
    const sequence = expenses.length + 1;
    const id = `EXP-2026-${String(sequence).padStart(3, '0')}`;
    const receiptVoucherNo = `VCH-2026-${100 + sequence}`;

    const newExpense: Expense = {
      id,
      expenseName: data.expenseName,
      category: data.category,
      amount: Number(data.amount),
      vendorName: data.vendorName,
      description: data.description,
      paymentMethod: data.paymentMethod,
      billUrl: data.billUrl || undefined,
      receiptVoucherNo,
      date: dateStr,
      status: data.status || 'Pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy,
    };

    // Update store cache safely
    try {
      localStorage.setItem('svuc_expenses_v1', JSON.stringify([newExpense, ...expenses]));
    } catch (e) {
      console.warn('[Expenses Storage] Local storage write warning:', e);
    }
    window.dispatchEvent(new Event('svuc_store_updated'));

    if (isFirebaseConfigured() && db) {
      try {
        const expRef = doc(db, COLLECTIONS.EXPENSES, id);
        const rawPayload = {
          ...newExpense,
          expenseId: id,
          currency: 'INR',
          billStoragePath: data.billStoragePath || null,
          publicBillVisibility: data.publicBillVisibility || false,
          publicVisibility: true,
          archived: false,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        };
        await setDoc(expRef, cleanForFirebase(rawPayload), { merge: true });

        if (newExpense.status === 'Pending') {
          await notificationsFirebaseService.createNotification({
            title: 'New Expense Voucher Awaiting Approval',
            message: `Voucher ${receiptVoucherNo} for ₹${newExpense.amount.toLocaleString('en-IN')} (${newExpense.expenseName}) submitted.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'FINANCE',
            read: false,
            link: '/admin/expenses',
          });
        }
      } catch (err) {
        console.warn('[Expense Firestore] Write error:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'CREATE',
      entity: 'Expense',
      recordId: id,
      details: `Created expense voucher ${receiptVoucherNo} for ₹${newExpense.amount.toLocaleString('en-IN')} - ${newExpense.expenseName} (${newExpense.status})`,
      after: newExpense,
    });

    return newExpense;
  },

  async updateExpense(id: string, updates: Partial<Expense>, reason?: string): Promise<Expense> {
    const existing = await this.getExpense(id);
    const actor = auth?.currentUser;
    const localUser = svucStore.getCurrentUser();
    const updatedBy = actor?.displayName || localUser?.name || 'Administrator';
    const now = new Date().toISOString();

    const merged: Expense = {
      ...(existing || ({} as Expense)),
      ...updates,
      updatedAt: now,
    };

    const list = svucStore.getExpenses();
    const nextList = list.map((e) => (e.id === id ? merged : e));
    try {
      localStorage.setItem('svuc_expenses_v1', JSON.stringify(nextList));
    } catch (e) {
      console.warn('[Expenses Storage] Local storage update warning:', e);
    }
    window.dispatchEvent(new Event('svuc_store_updated'));

    if (isFirebaseConfigured() && db) {
      try {
        const payload = cleanForFirebase({
          ...updates,
          updatedBy,
          updatedAt: now,
          serverUpdatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, COLLECTIONS.EXPENSES, id), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.EXPENSES}/${id}`);
      }
    }

    await auditFirebaseService.log({
      action: 'UPDATE',
      entity: 'Expense',
      recordId: id,
      details: `Updated expense record ${id}: ${reason || 'Updated fields'}`,
      before: existing,
      after: merged,
      reason,
    });

    return merged;
  },

  async approveExpense(id: string, notes?: string): Promise<Expense> {
    const existing = await this.getExpense(id);
    const actor = auth?.currentUser;
    const localUser = svucStore.getCurrentUser();
    const approvedBy = actor?.displayName || localUser?.name || 'Treasurer';
    const approvedAt = new Date().toISOString();

    const updated = await this.updateExpense(
      id,
      {
        status: 'Approved',
        approvedBy,
        approvedAt,
      },
      notes || 'Authorized voucher payment and expense allocation'
    );

    await auditFirebaseService.log({
      action: 'APPROVE',
      entity: 'Expense',
      recordId: id,
      details: `Approved expense voucher ${updated.receiptVoucherNo} (₹${updated.amount}) - reflected in transparency ledger`,
      before: existing,
      after: updated,
      reason: notes,
    });

    return updated;
  },

  async rejectExpense(id: string, reason: string): Promise<Expense> {
    const existing = await this.getExpense(id);
    const updated = await this.updateExpense(
      id,
      {
        status: 'Rejected',
      },
      reason
    );

    await auditFirebaseService.log({
      action: 'REJECT',
      entity: 'Expense',
      recordId: id,
      details: `Rejected expense voucher ${id}: ${reason}`,
      before: existing,
      after: updated,
      reason,
    });

    return updated;
  },

  async archiveExpense(id: string, reason?: string): Promise<Expense> {
    const existing = await this.getExpense(id);
    const updated = await this.updateExpense(
      id,
      {
        status: 'Archived',
      },
      reason || 'Archived expense record'
    );

    await auditFirebaseService.log({
      action: 'ARCHIVE',
      entity: 'Expense',
      recordId: id,
      details: `Archived expense voucher ${id}`,
      before: existing,
      after: updated,
      reason,
    });

    return updated;
  },

  async deleteExpense(id: string, reason?: string): Promise<void> {
    const existing = await this.getExpense(id);
    svucStore.deleteExpense(id);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, COLLECTIONS.EXPENSES, id), {
          archived: true,
          status: 'Archived',
          serverUpdatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Delete Expense] Error archiving in Firestore:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'DELETE',
      entity: 'Expense',
      recordId: id,
      details: `Deleted expense voucher ${existing?.receiptVoucherNo || id} (₹${existing?.amount || 0})`,
      before: existing,
      reason,
    });
  },
};
