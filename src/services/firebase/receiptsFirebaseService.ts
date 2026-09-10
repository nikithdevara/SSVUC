import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { Receipt } from '../../types';
import { COLLECTIONS } from './firestoreService';
import { svucStore } from '../store';

export interface PublicReceiptVerificationResult {
  verified: boolean;
  receiptNumber?: string;
  type?: 'MONETARY' | 'MATERIAL';
  date?: string;
  donorName?: string;
  amount?: number;
  materialName?: string;
  quantity?: number;
  unit?: string;
  paymentMethod?: string;
  committeeName?: string;
  location?: string;
  status?: string;
  verificationCode?: string;
  issuedAt?: string;
  message: string;
}

export const receiptsFirebaseService = {
  async getReceipts(): Promise<Receipt[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, COLLECTIONS.RECEIPTS), limit(100));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Receipt));
        }
      } catch (err) {
        console.warn('[Receipts Firestore] Read error, using store cache:', err);
      }
    }
    return svucStore.getReceipts();
  },

  async getReceiptById(receiptId: string): Promise<Receipt | undefined> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.RECEIPTS, receiptId));
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as Receipt;
        }

        // Query by receiptNumber or verificationCode
        const q = query(
          collection(db, COLLECTIONS.RECEIPTS),
          where('receiptNumber', '==', receiptId),
          limit(1)
        );
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const first = querySnap.docs[0];
          return { id: first.id, ...first.data() } as Receipt;
        }
      } catch (err) {
        console.warn('[Get Receipt] Error:', err);
      }
    }
    return svucStore.getReceiptById(receiptId);
  },

  /**
   * Strictly verifies receipt and returns ONLY public safe information per Section 53 & 54.
   * Never leaks phone, email, notes, or internal metadata.
   */
  async verifyReceiptPublicly(codeOrId: string): Promise<PublicReceiptVerificationResult> {
    const raw = codeOrId.trim();
    if (!raw) {
      return {
        verified: false,
        message: 'Receipt could not be verified. Please enter a valid receipt number.',
      };
    }

    let match: Receipt | undefined;

    if (isFirebaseConfigured() && db) {
      try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.RECEIPTS, raw));
        if (docSnap.exists()) {
          match = { id: docSnap.id, ...docSnap.data() } as Receipt;
        } else {
          // Check by receiptNumber
          const q1 = query(
            collection(db, COLLECTIONS.RECEIPTS),
            where('receiptNumber', '==', raw),
            limit(1)
          );
          const s1 = await getDocs(q1);
          if (!s1.empty) {
            match = { id: s1.docs[0].id, ...s1.docs[0].data() } as Receipt;
          } else {
            // Check by verificationCode
            const q2 = query(
              collection(db, COLLECTIONS.RECEIPTS),
              where('verificationCode', '==', raw),
              limit(1)
            );
            const s2 = await getDocs(q2);
            if (!s2.empty) {
              match = { id: s2.docs[0].id, ...s2.docs[0].data() } as Receipt;
            }
          }
        }
      } catch (err) {
        console.warn('[Verify Receipt Firestore] Error:', err);
      }
    }

    // Fallback to store
    if (!match) {
      const storeRes = svucStore.verifyReceipt(raw);
      if (storeRes.receipt) {
        match = storeRes.receipt;
      }
    }

    if (match) {
      if (match.status === 'VOID' || match.status === 'REVOKED') {
        return {
          verified: false,
          receiptNumber: match.receiptNumber,
          type: match.type,
          date: match.date,
          donorName: match.anonymous ? 'Devotee (Anonymous)' : match.donorName,
          amount: match.amount,
          materialName: match.materialName,
          quantity: match.quantity,
          unit: match.unit,
          status: 'VOID',
          verificationCode: match.verificationCode,
          message: 'VOID RECEIPT — This receipt was officially cancelled / voided by the committee treasury. It is no longer valid.',
        };
      }

      if (match.status === 'VERIFIED') {
        return {
          verified: true,
          receiptNumber: match.receiptNumber,
          type: match.type,
          date: match.date,
          donorName: match.anonymous ? 'Devotee (Anonymous)' : match.donorName,
          amount: match.amount,
          materialName: match.materialName,
          quantity: match.quantity,
          unit: match.unit,
          paymentMethod: match.paymentMethod,
          committeeName: match.committeeName || 'Sri Siddhi Vinayaka Utsava Committee',
          location: match.location || 'Gandhinagar Anjayya Colony, Anakapalle',
          status: 'VERIFIED',
          verificationCode: match.verificationCode,
          issuedAt: match.createdAt,
          message: '✓ Authentic Receipt registered with Sri Siddhi Vinayaka Utsava Committee.',
        };
      }
    }

    return {
      verified: false,
      message: 'Receipt could not be verified.',
    };
  },
};
