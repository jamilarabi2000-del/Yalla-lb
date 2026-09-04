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
  fetchSignInMethodsForEmail,
  Auth
} from 'firebase/auth';
import { getFirestore, setLogLevel, Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import firebaseConfig from '../firebase-applet-config.json';

// Suppress transient connection info messages in console
try {
  setLogLevel('silent');
} catch {}

export { firebaseConfig };

// Toggle switch to decouple active database calls to bypass project locked / billing requirements
export const IS_FIREBASE_ENABLED = import.meta.env.PROD ? true : (import.meta.env.VITE_USE_FIREBASE !== 'false');

const app = initializeApp(firebaseConfig);

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
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (err) {
  try {
    firestoreInstance = getFirestore(app);
  } catch (e) {
    console.error("[Firebase] Firestore initialization fallback error:", e);
    firestoreInstance = getFirestore();
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
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

export { GoogleAuthProvider, OAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, fetchSignInMethodsForEmail };
export type { FirebaseUser };

