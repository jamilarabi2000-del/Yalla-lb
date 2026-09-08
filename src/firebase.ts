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

// Initialize App Check if configured
if (typeof window !== 'undefined') {
  const siteKey = firebaseConfig.recaptchaSiteKey || import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (siteKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log("[Firebase] App Check registered with reCAPTCHA Enterprise!");
    } catch (err) {
      console.warn("[Firebase] Non-blocking App Check registration note:", err);
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
  httpsCallable
};
export type { FirebaseUser, Functions };

