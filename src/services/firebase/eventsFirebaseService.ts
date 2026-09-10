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
import { EventItem } from '../../types';
import { COLLECTIONS, auditFirebaseService } from './firestoreService';
import { svucStore } from '../store';

export const eventsFirebaseService = {
  async getEvents(onRealtimeUpdate?: (events: EventItem[]) => void): Promise<EventItem[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, COLLECTIONS.EVENTS),
          orderBy('dayNumber', 'asc'),
          limit(50)
        );

        if (onRealtimeUpdate) {
          onSnapshot(
            q,
            (snapshot) => {
              const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EventItem));
              onRealtimeUpdate(live);
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, COLLECTIONS.EVENTS);
            }
          );
        }

        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventItem));
      } catch (err) {
        console.warn('[Events Firestore] Read error, fallback to store:', err);
      }
    }
    return svucStore.getEvents();
  },

  async getPublicEvents(): Promise<EventItem[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(
          collection(db, COLLECTIONS.EVENTS),
          where('published', '==', true),
          orderBy('dayNumber', 'asc')
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventItem));
      } catch (err) {
        console.warn('[Public Events Firestore] Fallback:', err);
      }
    }
    return svucStore.getEvents().filter((e) => e.published);
  },


  async getEvent(id: string): Promise<EventItem | undefined> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.EVENTS, id));
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as EventItem;
        }
      } catch (err) {
        console.warn('[Get Event] Read error:', err);
      }
    }
    return svucStore.getEvents().find((e) => e.id === id);
  },

  async createEvent(eventData: Omit<EventItem, 'id'>): Promise<EventItem> {
    const list = svucStore.getEvents();
    const id = `EVT-${String(list.length + 1).padStart(2, '0')}`;
    const newEvent: EventItem = {
      ...eventData,
      id,
    };

    svucStore.addEvent(eventData);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.EVENTS, id), {
          ...newEvent,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Event Firestore] Write error:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'CREATE',
      entity: 'Event',
      recordId: id,
      details: `Created festival event: ${newEvent.title} (Day ${newEvent.dayNumber})`,
      after: newEvent,
    });

    return newEvent;
  },

  async updateEvent(id: string, updates: Partial<EventItem>): Promise<EventItem> {
    const existing = await this.getEvent(id);
    const merged: EventItem = {
      ...(existing || ({} as EventItem)),
      ...updates,
    };

    const list = svucStore.getEvents();
    const nextList = list.map((e) => (e.id === id ? merged : e));
    localStorage.setItem('svuc_events_v1', JSON.stringify(nextList));
    window.dispatchEvent(new Event('svuc_store_updated'));

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, COLLECTIONS.EVENTS, id), {
          ...updates,
          serverUpdatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.EVENTS}/${id}`);
      }
    }

    await auditFirebaseService.log({
      action: 'UPDATE',
      entity: 'Event',
      recordId: id,
      details: `Updated event: ${merged.title}`,
      before: existing,
      after: merged,
    });

    return merged;
  },

  async deleteEvent(id: string): Promise<void> {
    const existing = await this.getEvent(id);
    svucStore.deleteEvent(id);

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.EVENTS, id));
      } catch (err) {
        console.warn('[Delete Event] Error in Firestore:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'DELETE',
      entity: 'Event',
      recordId: id,
      details: `Deleted event: ${existing?.title || id}`,
      before: existing,
    });
  },

  async publishEvent(id: string, published: boolean): Promise<EventItem> {
    return this.updateEvent(id, { published });
  },
};
