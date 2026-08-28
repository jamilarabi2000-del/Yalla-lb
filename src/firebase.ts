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
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { initializeFirestore, getFirestore, memoryLocalCache, setLogLevel } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

// Suppress transient connection info messages in console
try {
  setLogLevel('silent');
} catch {}

// Hardcoded local copy of the config to ensure compilation succeeds even without firebase-applet-config.json
const firebaseConfig = {
  "projectId": "yalla-lb-2026",
  "appId": "1:878326922370:web:8abd543edb90484ba9889b",
  "apiKey": "AIzaSyDQI42LOpzqKckcTDsY4dBIW3scC2PaGAI",
  "authDomain": "yalla-lb-2026.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-yallalb-1415b490-9de7-4a31-acee-0f9c6439c18c",
  "storageBucket": "yalla-lb-2026.firebasestorage.app",
  "messagingSenderId": "878326922370",
  "measurementId": "",
  "oAuthClientId": "878326922370-ml6v8ck0uljja62vd5qg6341o6f82hrp.apps.googleusercontent.com",
  "recaptchaSiteKey": ""
};

// Toggle switch to decouple active database calls to bypass project locked / billing requirements
export const IS_FIREBASE_ENABLED = import.meta.env.PROD ? true : (import.meta.env.VITE_USE_FIREBASE !== 'false');

const app = initializeApp(firebaseConfig);

// M-4: Initialize App Check with reCAPTCHA Enterprise
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

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: memoryLocalCache()
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  try {
    firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    firestoreInstance = getFirestore(app);
  }
}

let authInstance;
try {
  authInstance = getAuth(app);
} catch (e) {
  try {
    authInstance = initializeAuth(app, {
      persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]
    });
  } catch (err) {
    console.error("Firebase Auth fallback critical error:", err);
  }
}

export const db = firestoreInstance;
export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

export { GoogleAuthProvider, OAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, fetchSignInMethodsForEmail };
export type { FirebaseUser };

