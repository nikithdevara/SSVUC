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
  runTransaction,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirebaseConfigured } from '../../lib/firebase';
import { MaterialDonation, Receipt } from '../../types';
import { COLLECTIONS, generateSafeReceiptNumber, auditFirebaseService, notificationsFirebaseService, cleanForFirebase } from './firestoreService';
import { svucStore } from '../store';

export const materialsFirebaseService = {
  async getMaterials(
    onRealtimeUpdate?: (materials: MaterialDonation[]) => void
  ): Promise<MaterialDonation[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, COLLECTIONS.MATERIALS),
          orderBy('date', 'desc'),
          limit(100)
        );

        if (onRealtimeUpdate) {
          onSnapshot(
            q,
            (snapshot) => {
              const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MaterialDonation));
              onRealtimeUpdate(live);
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, COLLECTIONS.MATERIALS);
            }
          );
        }

        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MaterialDonation));
      } catch (err) {
        console.warn('[Materials Firestore] Read error, fallback to store:', err);
      }
    }
    return svucStore.getMaterials();
  },

  async getPublicApprovedMaterials(): Promise<MaterialDonation[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, COLLECTIONS.MATERIALS),
          where('status', 'in', ['Approved', 'approved', 'Verified']),
          orderBy('date', 'desc'),
          limit(100)
        );
        const snap = await getDocs(q);
        return snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as MaterialDonation))
          .filter((m: any) => m.publicVisibility !== false && !m.archived);
      } catch (err) {
        console.warn('[Public Materials Firestore] Fallback to store:', err);
      }
    }

    return svucStore
      .getMaterials()
      .filter((m) => m.status === 'Approved' || m.status === 'Verified');
  },

  async getMaterial(id: string): Promise<MaterialDonation | undefined> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.MATERIALS, id));
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as MaterialDonation;
        }
      } catch (err) {
        console.warn('[Get Material] Read error:', err);
      }
    }
    return svucStore.getMaterials().find((m) => m.id === id || m.receiptId === id);
  },

  async createMaterial(data: {
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
  }): Promise<{ material: MaterialDonation; receipt: Receipt }> {
    const actor = auth?.currentUser;
    const localUser = svucStore.getCurrentUser();
    const createdBy = actor?.displayName || localUser?.name || 'Devotee / Online Seva Counter';
    const now = new Date();
    const dateStr = data.date || now.toISOString().split('T')[0];
    const sequenceYear = '2026';

    const receiptNumber = await generateSafeReceiptNumber('MATERIAL', sequenceYear);
    const materialId = `MAT-${receiptNumber.replace('SSV-', '')}`;

    const newMaterial: MaterialDonation = {
      id: materialId,
      receiptId: receiptNumber,
      donorName: data.anonymous ? 'Devotee (Anonymous)' : data.donorName || 'Devotee',
      anonymous: data.anonymous,
      materialName: data.materialName,
      category: data.category,
      quantity: Number(data.quantity),
      unit: data.unit,
      phoneNumber: data.phoneNumber,
      email: data.email,
      gothram: data.gothram,
      deliveryMethod: data.deliveryMethod,
      notes: data.notes,
      date: dateStr,
      status: data.status || 'Pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy,
    };


    const newReceipt: Receipt = {
      id: receiptNumber,
      receiptNumber,
      type: 'MATERIAL',
      materialDonationId: materialId,
      donorName: newMaterial.donorName,
      anonymous: newMaterial.anonymous,
      materialName: newMaterial.materialName,
      quantity: newMaterial.quantity,
      unit: newMaterial.unit,
      date: dateStr,
      verificationCode: `SVUC-MAT-${materialId.replace('MAT-', '')}-VERIFIED`,
      qrCodeData: `https://siddhivinayaka-utsav.org/verify/${receiptNumber}`,
      committeeName: 'Sri Siddhi Vinayaka Utsava Committee',
      location: 'Gandhinagar Anjayya Colony, Anakapalle',
      issuedBy: createdBy,
      createdAt: now.toISOString(),
      status: newMaterial.status === 'Approved' || newMaterial.status === 'Verified' ? 'VERIFIED' : 'REVOKED',
    };

    // Store in local cache
    const materials = svucStore.getMaterials();
    localStorage.setItem('svuc_materials_v1', JSON.stringify([newMaterial, ...materials]));
    const receipts = svucStore.getReceipts();
    localStorage.setItem('svuc_receipts_v1', JSON.stringify([newReceipt, ...receipts]));
    window.dispatchEvent(new Event('svuc_store_updated'));

    if (isFirebaseConfigured() && db) {
      try {
        await runTransaction(db, async (transaction) => {
          const matRef = doc(db, COLLECTIONS.MATERIALS, materialId);
          const recRef = doc(db, COLLECTIONS.RECEIPTS, receiptNumber);

          transaction.set(matRef, cleanForFirebase({
            ...newMaterial,
            publicVisibility: true,
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

        if (newMaterial.status === 'Pending') {
          await notificationsFirebaseService.createNotification({
            title: 'New Material Seva Offered',
            message: `${newMaterial.donorName} offered ${newMaterial.quantity} ${newMaterial.unit} of ${newMaterial.materialName}.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'PENDING_APPROVAL',
            read: false,
            link: '/admin/materials',
          });
        }
      } catch (err) {
        console.warn('[Material Firestore] Transacted write error:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'CREATE',
      entity: 'Material',
      recordId: materialId,
      details: `Logged in-kind material seva: ${newMaterial.quantity} ${newMaterial.unit} of ${newMaterial.materialName} by ${newMaterial.donorName}`,
      after: newMaterial,
    });

    return { material: newMaterial, receipt: newReceipt };
  },

  async updateMaterial(id: string, updates: Partial<MaterialDonation>, reason?: string): Promise<MaterialDonation> {
    const existing = await this.getMaterial(id);
    const actor = auth?.currentUser;
    const localUser = svucStore.getCurrentUser();
    const updatedBy = actor?.displayName || localUser?.name || 'Administrator';
    const now = new Date().toISOString();

    const merged: MaterialDonation = {
      ...(existing || ({} as MaterialDonation)),
      ...updates,
      updatedAt: now,
    };

    const list = svucStore.getMaterials();
    const nextList = list.map((m) => (m.id === id ? merged : m));
    localStorage.setItem('svuc_materials_v1', JSON.stringify(nextList));
    window.dispatchEvent(new Event('svuc_store_updated'));

    if (isFirebaseConfigured() && db) {
      try {
        const payload = cleanForFirebase({
          ...updates,
          updatedBy,
          updatedAt: now,
          serverUpdatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, COLLECTIONS.MATERIALS, id), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.MATERIALS}/${id}`);
      }
    }

    await auditFirebaseService.log({
      action: 'UPDATE',
      entity: 'Material',
      recordId: id,
      details: `Updated material donation ${id}: ${reason || 'Updated fields'}`,
      before: existing,
      after: merged,
      reason,
    });

    return merged;
  },

  async approveMaterial(id: string, notes?: string): Promise<MaterialDonation> {
    const existing = await this.getMaterial(id);
    const actor = auth?.currentUser;
    const localUser = svucStore.getCurrentUser();
    const approvedBy = actor?.displayName || localUser?.name || 'Treasurer';
    const approvedAt = new Date().toISOString();

    const updated = await this.updateMaterial(
      id,
      {
        status: 'Approved',
        approvedBy,
        approvedAt,
      },
      notes || 'Approved in-kind material delivery verification'
    );

    if (updated.receiptId) {
      const receipts = svucStore.getReceipts();
      const updatedReceipts = receipts.map((r) =>
        r.id === updated.receiptId ? { ...r, status: 'VERIFIED' as const } : r
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
          console.warn('[Approve Material] Receipt update error:', err);
        }
      }
    }

    await auditFirebaseService.log({
      action: 'APPROVE',
      entity: 'Material',
      recordId: id,
      details: `Approved material seva ${id} (${updated.materialName}) - delivery physically verified`,
      before: existing,
      after: updated,
      reason: notes,
    });

    return updated;
  },

  async rejectMaterial(id: string, reason: string): Promise<MaterialDonation> {
    const existing = await this.getMaterial(id);
    const updated = await this.updateMaterial(
      id,
      {
        status: 'Rejected',
      },
      reason
    );

    await auditFirebaseService.log({
      action: 'REJECT',
      entity: 'Material',
      recordId: id,
      details: `Rejected material item ${id}: ${reason}`,
      before: existing,
      after: updated,
      reason,
    });

    return updated;
  },

  async archiveMaterial(id: string, reason?: string): Promise<MaterialDonation> {
    const existing = await this.getMaterial(id);
    const updated = await this.updateMaterial(
      id,
      {
        status: 'Archived',
      },
      reason || 'Archived material record'
    );

    await auditFirebaseService.log({
      action: 'ARCHIVE',
      entity: 'Material',
      recordId: id,
      details: `Archived material record ${id}`,
      before: existing,
      after: updated,
      reason,
    });

    return updated;
  },

  async deleteMaterial(id: string, reason?: string): Promise<void> {
    const existing = await this.getMaterial(id);
    svucStore.deleteMaterial(id);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, COLLECTIONS.MATERIALS, id), {
          archived: true,
          status: 'Archived',
          serverUpdatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Delete Material] Error archiving:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'DELETE',
      entity: 'Material',
      recordId: id,
      details: `Deleted material item ${id} (${existing?.materialName || ''})`,
      before: existing,
      reason,
    });
  },
};
