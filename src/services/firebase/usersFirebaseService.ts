import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirebaseConfigured } from '../../lib/firebase';
import { AdminUser, AdminRole, UserProfile } from '../../types';
import { COLLECTIONS, auditFirebaseService } from './firestoreService';
import { svucStore } from '../store';

export const usersFirebaseService = {
  async getUsers(): Promise<AdminUser[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, COLLECTIONS.USERS));
        if (!snap.empty) {
          return snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              uid: d.id,
              name: data.name || 'Admin User',
              email: data.email || '',
              role: (data.role?.toUpperCase() || 'COMMITTEE_ADMIN') as AdminRole,
              status: (data.status?.toUpperCase() || 'ACTIVE') as any,
              lastLogin: data.lastLoginAt || 'Never',
              phone: data.phone || '+91 94401 00000',
              photoURL: data.photoURL,
              createdAt: data.createdAt,
            } as AdminUser;
          });
        }
      } catch (err) {
        console.warn('[Users Firestore] Read error, using store cache:', err);
      }
    }
    return svucStore.getAdminUsers();
  },

  async getUser(uid: string): Promise<AdminUser | undefined> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
        if (snap.exists()) {
          const data = snap.data();
          return {
            id: snap.id,
            uid: snap.id,
            name: data.name,
            email: data.email,
            role: data.role?.toUpperCase() as AdminRole,
            status: data.status?.toUpperCase() as any,
            lastLogin: data.lastLoginAt || 'Never',
            phone: data.phone,
          } as AdminUser;
        }
      } catch (err) {
        console.warn('[Get User] Error:', err);
      }
    }
    return svucStore.getAdminUsers().find((u) => u.id === uid || u.email === uid);
  },

  async createUser(userData: {
    name: string;
    email: string;
    role: AdminRole;
    phone: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  }): Promise<AdminUser> {
    const list = svucStore.getAdminUsers();
    const id = `USR-${String(list.length + 1).padStart(2, '0')}`;
    const newUser: AdminUser = {
      ...userData,
      id,
      uid: id,
      status: userData.status || 'ACTIVE',
      lastLogin: 'Never',
    };

    svucStore.addAdminUser(newUser);

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, COLLECTIONS.USERS, id), {
          uid: id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role.toLowerCase(),
          status: newUser.status.toLowerCase(),
          phone: newUser.phone,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: 'Never',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[User Firestore] Write error:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'CREATE',
      entity: 'User',
      recordId: id,
      details: `Registered new administrative user: ${newUser.name} (${newUser.role})`,
      after: newUser,
    });

    return newUser;
  },

  async updateUserRole(uid: string, newRole: AdminRole, reason?: string): Promise<void> {
    const existing = await this.getUser(uid);
    const users = svucStore.getAdminUsers();
    const updated = users.map((u) => (u.id === uid ? { ...u, role: newRole } : u));
    localStorage.setItem('svuc_admin_users_v1', JSON.stringify(updated));
    window.dispatchEvent(new Event('svuc_store_updated'));

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
          role: newRole.toLowerCase(),
          updatedAt: new Date().toISOString(),
          serverUpdatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.USERS}/${uid}`);
      }
    }

    await auditFirebaseService.log({
      action: 'UPDATE',
      entity: 'User',
      recordId: uid,
      details: `Changed role of user ${existing?.name || uid} from ${existing?.role} to ${newRole}`,
      before: existing,
      after: { ...existing, role: newRole },
      reason,
    });
  },

  async updateUserStatus(
    uid: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    reason?: string
  ): Promise<void> {
    const existing = await this.getUser(uid);
    const users = svucStore.getAdminUsers();
    const updated = users.map((u) => (u.id === uid ? { ...u, status } : u));
    localStorage.setItem('svuc_admin_users_v1', JSON.stringify(updated));
    window.dispatchEvent(new Event('svuc_store_updated'));

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
          status: status.toLowerCase(),
          updatedAt: new Date().toISOString(),
          serverUpdatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.USERS}/${uid}`);
      }
    }

    await auditFirebaseService.log({
      action: 'UPDATE',
      entity: 'User',
      recordId: uid,
      details: `Changed status of user ${existing?.name || uid} to ${status}`,
      before: existing,
      after: { ...existing, status },
      reason,
    });
  },

  async deleteUser(uid: string, reason?: string): Promise<void> {
    const existing = await this.getUser(uid);
    const users = svucStore.getAdminUsers();
    const updated = users.filter((u) => u.id !== uid);
    localStorage.setItem('svuc_admin_users_v1', JSON.stringify(updated));
    window.dispatchEvent(new Event('svuc_store_updated'));

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
      } catch (err) {
        console.warn('[Delete User] Firestore error:', err);
      }
    }

    await auditFirebaseService.log({
      action: 'DELETE',
      entity: 'User',
      recordId: uid,
      details: `Deactivated administrative account for ${existing?.name || uid}`,
      before: existing,
      reason,
    });
  },
};
