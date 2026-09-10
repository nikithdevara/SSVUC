import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, getFriendlyFirebaseErrorMessage } from '../lib/firebase';
import { AdminRole, Permission, UserProfile } from '../types';
import { authService, DEMO_ACCOUNTS } from '../services/authService';
import { svucStore } from '../services/store';

export interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: AdminRole;
  roleLabel: string;
  permissions: Permission[];
  isFirebaseActive: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  hasRole: (role: AdminRole | AdminRole[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
}

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    'donations.view',
    'donations.create',
    'donations.edit',
    'donations.delete',
    'donations.approve',
    'materials.view',
    'materials.create',
    'materials.edit',
    'materials.delete',
    'materials.approve',
    'expenses.view',
    'expenses.create',
    'expenses.edit',
    'expenses.delete',
    'expenses.approve',
    'events.view',
    'events.create',
    'events.edit',
    'events.delete',
    'announcements.view',
    'announcements.create',
    'announcements.edit',
    'announcements.delete',
    'gallery.view',
    'gallery.create',
    'gallery.edit',
    'gallery.delete',
    'reports.view',
    'reports.export',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'settings.view',
    'settings.edit',
    'audit.view',
  ],
  TREASURER: [
    'donations.view',
    'donations.create',
    'donations.edit',
    'donations.approve',
    'materials.view',
    'materials.create',
    'materials.edit',
    'materials.approve',
    'expenses.view',
    'expenses.create',
    'expenses.edit',
    'expenses.approve',
    'reports.view',
    'reports.export',
    'receipts.view',
    'receipts.void',
    'payments.view',
    'payments.reconcile',
    'notifications.view',
  ],
  COMMITTEE_ADMIN: [
    'events.view',
    'events.create',
    'events.edit',
    'events.delete',
    'announcements.view',
    'announcements.create',
    'announcements.edit',
    'announcements.delete',
    'gallery.view',
    'gallery.create',
    'gallery.edit',
    'gallery.delete',
    'messages.view',
    'messages.manage',
    'notifications.view',
  ],
};

function normalizeRole(roleStr?: string): AdminRole {
  if (!roleStr) return 'COMMITTEE_ADMIN';
  const clean = roleStr.toUpperCase().replace('-', '_');
  if (clean.includes('SUPER')) return 'SUPER_ADMIN';
  if (clean.includes('TREASUR')) return 'TREASURER';
  return 'COMMITTEE_ADMIN';
}

function getRoleDisplayLabel(role: AdminRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'TREASURER':
      return 'Treasurer';
    case 'COMMITTEE_ADMIN':
      return 'Committee Admin';
    default:
      return 'Committee Admin';
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isFirebaseActive = isFirebaseConfigured() && Boolean(auth);

  // Sync state with local store and Firebase Auth
  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseActive && auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          setCurrentUser(fbUser);
          try {
            // Load user profile from Firestore 'users' collection
            if (db) {
              const userRef = doc(db, 'users', fbUser.uid);
              const snap = await getDoc(userRef);
              if (snap.exists()) {
                const data = snap.data() as Partial<UserProfile>;
                // Check if account status is active
                const status = (data.status || 'active').toLowerCase();
                if (status === 'inactive' || status === 'suspended') {
                  console.warn('[Auth] Account is disabled or suspended. Logging out.');
                  await firebaseSignOut(auth);
                  setCurrentUser(null);
                  setUserProfile(null);
                  authService.logout();
                  setLoading(false);
                  return;
                }

                const profile: UserProfile = {
                  uid: fbUser.uid,
                  name: data.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Admin',
                  email: fbUser.email || data.email || '',
                  role: (data.role as any) || 'super_admin',
                  status: (data.status as any) || 'active',
                  createdAt: data.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  lastLoginAt: new Date().toISOString(),
                  photoURL: fbUser.photoURL || data.photoURL,
                  phone: data.phone,
                };
                setUserProfile(profile);

                // Keep existing authService and store in sync
                const localAdmin = {
                  id: fbUser.uid,
                  uid: fbUser.uid,
                  name: profile.name,
                  email: profile.email,
                  role: normalizeRole(profile.role),
                  status: 'ACTIVE' as const,
                  lastLogin: new Date().toLocaleString(),
                  phone: profile.phone || '+91 94401 23456',
                };
                localStorage.setItem('svuc_current_user_v1', JSON.stringify(localAdmin));
              } else {
                // Profile doesn't exist yet, create default based on email or demo matches
                const demoMatch = DEMO_ACCOUNTS.find(
                  (d) => d.email.toLowerCase() === (fbUser.email || '').toLowerCase()
                );
                const assignedRole = demoMatch ? demoMatch.role : 'SUPER_ADMIN';
                const newProfile: UserProfile = {
                  uid: fbUser.uid,
                  name: fbUser.displayName || demoMatch?.name || 'Administrator',
                  email: fbUser.email || '',
                  role: assignedRole,
                  status: 'active',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  lastLoginAt: new Date().toISOString(),
                  photoURL: fbUser.photoURL || undefined,
                  phone: demoMatch?.phone,
                };

                await setDoc(userRef, {
                  ...newProfile,
                  serverCreatedAt: serverTimestamp(),
                  serverUpdatedAt: serverTimestamp(),
                });
                setUserProfile(newProfile);
              }
            }
          } catch (profileErr) {
            console.error('[Auth] Error fetching user profile:', profileErr);
          }
        } else {
          setCurrentUser(null);
          // Check local stored session so administrative logins persist even if Firebase auth provider isn't enabled
          const localUser = authService.getCurrentUser();
          if (localUser && localUser.status === 'ACTIVE') {
            setUserProfile({
              uid: localUser.id,
              name: localUser.name,
              email: localUser.email,
              role: localUser.role,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: localUser.lastLogin,
              phone: localUser.phone,
            });
          } else {
            setUserProfile(null);
          }
        }
        setLoading(false);
      });
    } else {
      // Local fallback mode when Firebase env is not yet configured
      const localUser = authService.getCurrentUser() || svucStore.getCurrentUser();
      if (localUser && localUser.status === 'ACTIVE') {
        setUserProfile({
          uid: localUser.id,
          name: localUser.name,
          email: localUser.email,
          role: localUser.role,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: localUser.lastLogin,
          phone: localUser.phone,
        });
      }
      setLoading(false);
    }

    return () => unsubscribe();
  }, [isFirebaseActive]);

  const role: AdminRole = normalizeRole(userProfile?.role);
  const permissions: Permission[] = ROLE_PERMISSIONS[role] || [];
  const isAuthenticated = Boolean(currentUser || userProfile);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim();

    if (isFirebaseActive && auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        const fbUser = cred.user;
        setCurrentUser(fbUser);

        // Fetch or create profile
        if (db) {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as Partial<UserProfile>;
            const status = (data.status || 'active').toLowerCase();
            if (status === 'inactive' || status === 'suspended') {
              await firebaseSignOut(auth);
              return { success: false, error: 'Your account has been disabled. Please contact the Super Admin.' };
            }

            const profile: UserProfile = {
              uid: fbUser.uid,
              name: data.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Admin',
              email: fbUser.email || data.email || '',
              role: (data.role as any) || 'super_admin',
              status: 'active',
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              phone: data.phone,
            };
            setUserProfile(profile);

            // Update lastLogin in Firestore
            await setDoc(doc(db, 'users', fbUser.uid), { lastLoginAt: new Date().toISOString() }, { merge: true });
          }
        }

        // Sync local store for seamless offline/fast caching
        authService.login(trimmedEmail, password);
        return { success: true };
      } catch (err: any) {
        console.warn('[Firebase Auth] Live Firebase sign-in failed, checking committee administrator accounts:', err);
        
        // Fallback directly to local committee administrator accounts:
        const localRes = authService.login(trimmedEmail, password);
        if (localRes.success && localRes.user) {
          setUserProfile({
            uid: localRes.user.id,
            name: localRes.user.name,
            email: localRes.user.email,
            role: localRes.user.role,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: localRes.user.lastLogin,
            phone: localRes.user.phone,
          });
          return { success: true };
        }

        // Return clear, actionable error
        if (localRes.error) {
          return { success: false, error: localRes.error };
        }
        return { success: false, error: getFriendlyFirebaseErrorMessage(err) };
      }
    } else {
      // Offline/Local Demo Mode
      const res = authService.login(trimmedEmail, password);
      if (res.success && res.user) {
        setUserProfile({
          uid: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: res.user.lastLogin,
          phone: res.user.phone,
        });
        return { success: true };
      }
      return { success: false, error: res.error || 'Invalid credentials' };
    }
  };

  const logout = async (): Promise<void> => {
    if (isFirebaseActive && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error('[Firebase Auth] Logout error:', err);
      }
    }
    authService.logout();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }

    if (isFirebaseActive && auth) {
      try {
        await sendPasswordResetEmail(auth, trimmed);
        return {
          success: true,
          message: 'Password reset instructions have been sent to your registered email address.',
        };
      } catch (err) {
        // Do not reveal whether an account exists in a way that leaks account information per Section 9!
        console.warn('[Firebase Auth] Password reset request:', err);
        return {
          success: true,
          message: 'Password reset instructions have been sent if an account with this email exists.',
        };
      }
    } else {
      // Local demo response
      return {
        success: true,
        message: 'Password reset instructions have been simulated and sent to your email (Demo Mode).',
      };
    }
  };

  const hasRole = (targetRole: AdminRole | AdminRole[]): boolean => {
    if (Array.isArray(targetRole)) {
      return targetRole.includes(role);
    }
    return role === targetRole;
  };

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAuthenticated,
        role,
        roleLabel: getRoleDisplayLabel(role),
        permissions,
        isFirebaseActive,
        login,
        logout,
        resetPassword,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
