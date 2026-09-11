import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  setPersistence,
  browserLocalPersistence,
  signInAnonymously,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
} from 'firebase/storage';

/**
 * Firebase Environment Configuration Interface
 */
export interface FirebaseEnvConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

/**
 * Read Vite environment variables with production fallbacks for ssv-utsava
 */
export const firebaseEnv: FirebaseEnvConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDDfhqKBKOF-6BARt1i-BlqBFeCfEaN4m0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ssv-utsava.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ssv-utsava',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ssv-utsava.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '886601227019',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:886601227019:web:794fe5a120158e929d600e',
};

/**
 * Check if the minimum required Firebase configuration is present
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseEnv.apiKey &&
      firebaseEnv.apiKey.trim() !== '' &&
      firebaseEnv.apiKey !== 'MY_FIREBASE_API_KEY' &&
      firebaseEnv.projectId &&
      firebaseEnv.projectId.trim() !== '' &&
      firebaseEnv.projectId !== 'MY_FIREBASE_PROJECT_ID'
  );
}

export interface ConfigValidationResult {
  isConfigured: boolean;
  missingVariables: string[];
  message: string;
}

export function validateFirebaseConfig(): ConfigValidationResult {
  const missing: string[] = [];
  if (!firebaseEnv.apiKey || firebaseEnv.apiKey === 'MY_FIREBASE_API_KEY') {
    missing.push('VITE_FIREBASE_API_KEY');
  }
  if (!firebaseEnv.authDomain) {
    missing.push('VITE_FIREBASE_AUTH_DOMAIN');
  }
  if (!firebaseEnv.projectId || firebaseEnv.projectId === 'MY_FIREBASE_PROJECT_ID') {
    missing.push('VITE_FIREBASE_PROJECT_ID');
  }
  if (!firebaseEnv.storageBucket) {
    missing.push('VITE_FIREBASE_STORAGE_BUCKET');
  }
  if (!firebaseEnv.messagingSenderId) {
    missing.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
  }
  if (!firebaseEnv.appId) {
    missing.push('VITE_FIREBASE_APP_ID');
  }

  const configured = isFirebaseConfigured();
  return {
    isConfigured: configured,
    missingVariables: missing,
    message: configured
      ? 'Firebase is configured and ready.'
      : `Firebase configuration is missing or incomplete. Missing: ${missing.join(', ')}. Operating in demo/fallback mode.`,
  };
}

// Log a development-friendly validation message once at boot
const validation = validateFirebaseConfig();
if (!validation.isConfigured) {
  console.warn(
    `[Firebase Initialization] ${validation.message}\n` +
      'To connect live Cloud Firestore & Auth, add your project credentials to .env (see .env.example).'
  );
}

// Initialize instances safely
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (validation.isConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseEnv as Record<string, string>);
    auth = getAuth(app);
    // Persist session across browser restarts
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('[Firebase Auth] Could not enable local persistence:', err);
    });
    // Attempt anonymous sign-in in background to establish authenticated Firebase context
    signInAnonymously(auth).catch(() => {
      // Ignored if anonymous auth provider is disabled in console
    });
    db = getFirestore(app);
    storage = getStorage(app);

    // Validate connectivity test on initial boot per skill guidelines
    if (db) {
      getDocFromServer(doc(db, 'system_health', 'connection_probe')).catch((err) => {
        if (err instanceof Error && err.message.includes('the client is offline')) {
          console.warn('[Firebase Connectivity] Client is currently offline.');
        }
      });
    }
  } catch (initErr) {
    console.error('[Firebase Init Error]', initErr);
  }
}

export { app, auth, db, storage };

/**
 * Operation types conforming to Firebase Security Skill
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

/**
 * Standardized error handler throwing formatted JSON string per Firebase skill
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: currentAuth?.uid || null,
      email: currentAuth?.email || null,
      emailVerified: currentAuth?.emailVerified || null,
      isAnonymous: currentAuth?.isAnonymous || null,
    },
  };
  console.error('[Firestore Error Details]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * User-friendly error message translator for UI presentations
 */
export function getFriendlyFirebaseErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  let msg = error instanceof Error ? error.message : String(error);

  // Parse JSON FirestoreErrorInfo if thrown by handleFirestoreError
  try {
    if (msg.startsWith('{') && msg.includes('operationType')) {
      const parsed: FirestoreErrorInfo = JSON.parse(msg);
      msg = parsed.error;
    }
  } catch {
    // Keep msg as is
  }

  if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
    return 'Invalid email or password. Please verify your credentials.';
  }
  if (msg.includes('auth/configuration-not-found') || msg.includes('auth/operation-not-allowed')) {
    return 'Authentication provider is not yet enabled. Switching to offline committee credentials verification.';
  }
  if (msg.includes('auth/user-disabled')) {
    return 'This administrative account has been deactivated. Please contact the Super Admin.';
  }
  if (msg.includes('auth/too-many-requests')) {
    return 'Access temporarily blocked due to multiple failed attempts. Please reset your password or try again later.';
  }
  if (msg.includes('auth/network-request-failed') || msg.includes('offline') || msg.includes('unavailable')) {
    return 'Network connectivity issue. Please check your internet connection and try again.';
  }
  if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
    return 'Access restricted: You do not hold sufficient administrative clearance for this operation.';
  }
  if (msg.includes('auth/email-already-in-use')) {
    return 'An account with this email address already exists.';
  }
  if (msg.includes('auth/weak-password')) {
    return 'The password is too weak. Please choose at least 6 characters.';
  }
  if (msg.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }

  return msg;
}
