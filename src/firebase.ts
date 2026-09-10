import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  GoogleAuthProvider,
  OAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  // Note: fetchSignInMethodsForEmail intentionally omitted to prevent account-enumeration attacks
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  setLogLevel, 
  Firestore 
} from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getFunctions, httpsCallable, Functions } from 'firebase/functions';
import firebaseConfig from '../firebase-applet-config.json';

// Suppress transient connection info messages in console
try {
  setLogLevel('silent');
} catch {}

export { firebaseConfig };

// Toggle switch to decouple active database calls to bypass project locked / billing requirements
export const IS_FIREBASE_ENABLED = import.meta.env.PROD ? true : (import.meta.env.VITE_USE_FIREBASE !== 'false');

export const app = initializeApp(firebaseConfig);

// Initialize Firebase App Check immediately after initializeApp and BEFORE Auth, Firestore, Functions, etc.
if (typeof window !== 'undefined') {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // If an explicit App Check debug token is provided, activate it for non-production environments
  const explicitDebugToken = typeof import.meta.env.VITE_APPCHECK_DEBUG_TOKEN === 'string' 
    ? import.meta.env.VITE_APPCHECK_DEBUG_TOKEN.trim() 
    : '';

  if (!import.meta.env.PROD && explicitDebugToken) {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = explicitDebugToken;
    console.info("[Firebase] App Check configured with explicit debug token.");
  } else if (import.meta.env.DEV && isLocalhost) {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    console.info("[Firebase] App Check debug mode active on localhost.");
  }

  const siteKey = (firebaseConfig.recaptchaSiteKey || import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim();

  if (!siteKey) {
    console.warn("[Firebase] Warning: reCAPTCHA Enterprise site key is not configured.");
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
    console.info(`[Firebase] App Check initialized with ReCaptchaEnterpriseProvider (siteKey: ${siteKey ? siteKey.slice(0, 6) + '...' : 'missing'}). Origin domain: ${window.location.hostname}. (Note: Ensure "${window.location.hostname}" or "run.app" is in your reCAPTCHA Enterprise key's allowed domains).`);
  } catch (err: any) {
    console.error("[Firebase] App Check initialization failed:", err?.message || err);
    if (import.meta.env.PROD && siteKey) {
      throw err;
    }
  }
}

let firestoreInstance: Firestore;
try {
  let cacheConfig;
  try {
    cacheConfig = typeof window !== 'undefined'
      ? persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      : memoryLocalCache();
  } catch (cacheErr) {
    console.warn("[Firebase] Persistent cache not supported, falling back to memory cache:", cacheErr);
    cacheConfig = memoryLocalCache();
  }

  firestoreInstance = initializeFirestore(app, {
    localCache: cacheConfig
  }, firebaseConfig.firestoreDatabaseId);
} catch (err) {
  try {
    firestoreInstance = initializeFirestore(app, {
      localCache: memoryLocalCache()
    }, firebaseConfig.firestoreDatabaseId);
  } catch (e2) {
    try {
      firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } catch (e3) {
      try {
        firestoreInstance = getFirestore(app);
      } catch (e4) {
        console.warn("[Firebase] Firestore initialization fallback warning:", e4);
        firestoreInstance = getFirestore();
      }
    }
  }
}

let authInstance: Auth;
try {
  authInstance = getAuth(app);
} catch (e) {
  try {
    authInstance = initializeAuth(app, {
      persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]
    });
  } catch (err) {
    console.error("Firebase Auth fallback critical error:", err);
    authInstance = getAuth();
  }
}

export const db = firestoreInstance;
export const auth = authInstance;
export const functionsInstance: Functions = getFunctions(app, 'europe-west1');
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

export { 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  httpsCallable
};
export type { FirebaseUser, Functions };

