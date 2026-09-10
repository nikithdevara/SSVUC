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
import { Announcement } from '../../types';
import { COLLECTIONS, auditFirebaseService } from './firestoreService';
import { svucStore } from '../store';

export const announcementsFirebaseService = {
  async getAnnouncements(
    onRealtimeUpdate?: (announcements: Announcement[]) => void
  ): Promise<Announcement[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, COLLECTIONS.ANNOUNCEMENTS),
          orderBy('date', 'desc'),
          limit(50)
        );

        if (onRealtimeUpdate) {
          onSnapshot(
            q,
            (snapshot) => {
              const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
              onRealtimeUpdate(live);
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, COLLECTIONS.ANNOUNCEMENTS);
            }
          );
        }

        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
      } catch (err) {
        console.warn('[Announcements Firestore] Read error:', err);
      }
    }
    return svucStore.getAnnouncements();
  },

  async getPublicAnnouncements(): Promise<Announcement[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, COLLECTIONS.ANNOUNCEMENTS),
          where('published', '==', true),
          limit(50)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
        // Prioritize pinned announcements, then date
        return list.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.date.localeCompare(a.date);
        });
      } catch (err) {
        console.warn('[Public Announcements Firestore] Fallback:', err);
      }
    }


    return svucStore
      .getAnnouncements()
      .filter((a) => a.published)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });
  },

  async createAnnouncement(data: Omit<Announcement, 'id' | 'date'>): Promise<Announcement> {
    const list = svucStore.getAnnouncements();
    const id = `ANN-${String(list.length + 1).padStart(2, '0')}`;
    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newAnn: Announcement = {
      ...data,
      id,
      date: dateStr,
    };

    svucStore.addAnnouncement(data);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id), {
          ...newAnn,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Announcement Firestore] Write error:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'CREATE',
      entity: 'Announcement',
      recordId: id,
      details: `Published announcement: ${newAnn.title}`,
      after: newAnn,
    });

    return newAnn;
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    const existing = svucStore.getAnnouncements().find((a) => a.id === id);
    const merged: Announcement = {
      ...(existing || ({} as Announcement)),
      ...updates,
    };

    const list = svucStore.getAnnouncements();
    const nextList = list.map((a) => (a.id === id ? merged : a));
    localStorage.setItem('svuc_announcements_v1', JSON.stringify(nextList));
    window.dispatchEvent(new Event('svuc_store_updated'));

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id), {
          ...updates,
          serverUpdatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.ANNOUNCEMENTS}/${id}`);
      }
    }

    await auditFirebaseService.log({
      action: 'UPDATE',
      entity: 'Announcement',
      recordId: id,
      details: `Updated announcement: ${merged.title}`,
      before: existing,
      after: merged,
    });

    return merged;
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const existing = svucStore.getAnnouncements().find((a) => a.id === id);
    svucStore.deleteAnnouncement(id);

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id));
      } catch (err) {
        console.warn('[Delete Announcement] Error:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'DELETE',
      entity: 'Announcement',
      recordId: id,
      details: `Deleted announcement: ${existing?.title || id}`,
      before: existing,
    });
  },

  async publishAnnouncement(id: string, published: boolean): Promise<Announcement> {
    return this.updateAnnouncement(id, { published });
  },

  async pinAnnouncement(id: string, pinned: boolean): Promise<Announcement> {
    return this.updateAnnouncement(id, { pinned });
  },
};
