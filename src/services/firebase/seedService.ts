import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { COLLECTIONS } from './firestoreService';
import {
  initialEvents,
  initialAnnouncements,
  initialGallery,
  initialSettings,
  initialAdminUsers,
  initialDonations,
  initialMaterialDonations,
  initialExpenses,
} from '../../data/mockData';
import { auditFirebaseService } from './firestoreService';

export const seedService = {
  /**
   * Manual admin-triggered seed function.
   * Can ONLY be initiated by Super Admin via the Admin Settings or Portal UI.
   * Never runs automatically on application boot.
   */
  async seedInitialCommitteeData(): Promise<{ success: boolean; message: string; count: number }> {
    if (!isFirebaseConfigured() || !db) {
      return {
        success: false,
        message: 'Firebase is not yet configured with project credentials. Please set your environment variables.',
        count: 0,
      };
    }

    try {
      let totalSeeded = 0;
      const batch = writeBatch(db);

      // 1. Committee Settings
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'committee');
      batch.set(
        settingsRef,
        {
          ...initialSettings,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      totalSeeded++;

      // 2. Counters for Safe Atomic Receipt Generation
      const countersRef = doc(db, COLLECTIONS.SETTINGS, 'counters');
      batch.set(
        countersRef,
        {
          donationCount: initialDonations.length,
          materialCount: initialMaterialDonations.length,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      totalSeeded++;

      // 3. Events
      for (const evt of initialEvents) {
        const evtRef = doc(db, COLLECTIONS.EVENTS, evt.id);
        batch.set(evtRef, {
          ...evt,
          serverCreatedAt: serverTimestamp(),
        });
        totalSeeded++;
      }

      // 4. Announcements
      for (const ann of initialAnnouncements) {
        const annRef = doc(db, COLLECTIONS.ANNOUNCEMENTS, ann.id);
        batch.set(annRef, {
          ...ann,
          serverCreatedAt: serverTimestamp(),
        });
        totalSeeded++;
      }

      // 5. Gallery
      for (const gal of initialGallery) {
        const galRef = doc(db, COLLECTIONS.GALLERY, gal.id);
        batch.set(galRef, {
          ...gal,
          serverCreatedAt: serverTimestamp(),
        });
        totalSeeded++;
      }

      // 6. Monetary Offerings
      for (const don of initialDonations) {
        const donRef = doc(db, COLLECTIONS.DONATIONS, don.id);
        batch.set(donRef, {
          ...don,
          publicVisibility: true,
          currency: 'INR',
          archived: false,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        });
        totalSeeded++;
      }

      // 7. Material Seva
      for (const mat of initialMaterialDonations) {
        const matRef = doc(db, COLLECTIONS.MATERIALS, mat.id);
        batch.set(matRef, {
          ...mat,
          publicVisibility: true,
          archived: false,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        });
        totalSeeded++;
      }

      // 8. Mandapam Expenses
      for (const exp of initialExpenses) {
        const expRef = doc(db, COLLECTIONS.EXPENSES, exp.id);
        batch.set(expRef, {
          ...exp,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        });
        totalSeeded++;
      }

      // 9. Demo Users Profiles
      for (const usr of initialAdminUsers) {
        const usrRef = doc(db, COLLECTIONS.USERS, usr.id);
        batch.set(
          usrRef,
          {
            uid: usr.id,
            name: usr.name,
            email: usr.email,
            role: usr.role.toLowerCase(),
            status: usr.status.toLowerCase(),
            phone: usr.phone,
            createdAt: new Date().toISOString(),
            lastLoginAt: usr.lastLogin,
            serverCreatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        totalSeeded++;
      }

      // Commit the batch atomically
      await batch.commit();

      await auditFirebaseService.log({
        action: 'CREATE',
        entity: 'Settings',
        recordId: 'seed_init',
        details: `Super Admin manually executed initial committee baseline data seeding (${totalSeeded} documents)`,
      });

      return {
        success: true,
        message: `Successfully seeded ${totalSeeded} baseline committee records (events, gallery, announcements, settings, demo roles) into Firestore.`,
        count: totalSeeded,
      };
    } catch (err: any) {
      console.error('[Seed Error]:', err);
      return {
        success: false,
        message: `Failed to seed data: ${err.message || 'Unknown Firestore error'}`,
        count: 0,
      };
    }
  },
};
