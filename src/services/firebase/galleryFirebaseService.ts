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
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirebaseConfigured } from '../../lib/firebase';
import { GalleryItem } from '../../types';
import { COLLECTIONS, auditFirebaseService } from './firestoreService';
import { storageService } from './storageService';
import { svucStore } from '../store';

export const galleryFirebaseService = {
  async getGallery(onRealtimeUpdate?: (items: GalleryItem[]) => void): Promise<GalleryItem[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, COLLECTIONS.GALLERY),
          orderBy('year', 'desc'),
          limit(60)
        );

        if (onRealtimeUpdate) {
          onSnapshot(
            q,
            (snapshot) => {
              const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
              onRealtimeUpdate(live);
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, COLLECTIONS.GALLERY);
            }
          );
        }

        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
      } catch (err) {
        console.warn('[Gallery Firestore] Read error, fallback to store:', err);
      }
    }
    return svucStore.getGallery();
  },

  async getPublicGallery(): Promise<GalleryItem[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, COLLECTIONS.GALLERY),
          where('published', '==', true),
          limit(60)
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
      } catch (err) {
        console.warn('[Public Gallery Firestore] Fallback:', err);
      }
    }
    return svucStore.getGallery().filter((g) => g.published !== false);
  },


  async addGalleryItem(data: Omit<GalleryItem, 'id'>, storagePath?: string): Promise<GalleryItem> {
    const list = svucStore.getGallery();
    const id = `GAL-${String(list.length + 1).padStart(2, '0')}`;
    const newItem: GalleryItem = {
      ...data,
      id,
      published: data.published ?? true,
    };

    svucStore.addGalleryItem(data);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.GALLERY, id), {
          ...newItem,
          storagePath: storagePath || null,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Gallery Firestore] Write error:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'CREATE',
      entity: 'Gallery',
      recordId: id,
      details: `Added gallery photo: ${newItem.title}`,
      after: newItem,
    });

    return newItem;
  },

  async updateGalleryItem(id: string, updates: Partial<GalleryItem>): Promise<GalleryItem> {
    const existing = svucStore.getGallery().find((g) => g.id === id);
    const merged: GalleryItem = {
      ...(existing || ({} as GalleryItem)),
      ...updates,
    };

    const list = svucStore.getGallery();
    const nextList = list.map((g) => (g.id === id ? merged : g));
    localStorage.setItem('svuc_gallery_v1', JSON.stringify(nextList));
    window.dispatchEvent(new Event('svuc_store_updated'));

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, COLLECTIONS.GALLERY, id), {
          ...updates,
          serverUpdatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.GALLERY}/${id}`);
      }
    }

    await auditFirebaseService.log({
      action: 'UPDATE',
      entity: 'Gallery',
      recordId: id,
      details: `Updated gallery item ${merged.title}`,
      before: existing,
      after: merged,
    });

    return merged;
  },

  async deleteGalleryItem(id: string, storagePath?: string): Promise<void> {
    const existing = svucStore.getGallery().find((g) => g.id === id);
    svucStore.deleteGalleryItem(id);

    if (storagePath) {
      await storageService.deleteFile(storagePath);
    }

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.GALLERY, id));
      } catch (err) {
        console.warn('[Delete Gallery] Error:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'DELETE',
      entity: 'Gallery',
      recordId: id,
      details: `Deleted gallery photo: ${existing?.title || id}`,
      before: existing,
    });
  },
};
