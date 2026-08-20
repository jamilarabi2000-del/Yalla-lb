import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { initializeFirestore, getFirestore, memoryLocalCache, setLogLevel } from 'firebase/firestore';

// Suppress transient connection info messages in console but keep warnings in development
try {
  setLogLevel(import.meta.env.DEV ? 'warn' : 'error');
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
export const IS_FIREBASE_ENABLED = !import.meta.env.DEV ? true : (import.meta.env.VITE_USE_FIREBASE !== 'false');

const app = initializeApp(firebaseConfig);

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
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
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  if (isIframe) {
    authInstance = initializeAuth(app, {
      persistence: [inMemoryPersistence, browserSessionPersistence]
    });
  } else {
    authInstance = initializeAuth(app, {
      persistence: [browserLocalPersistence, browserSessionPersistence]
    });
  }
} catch (e) {
  try {
    authInstance = getAuth(app);
  } catch (err) {
    console.error("Firebase Auth fallback critical error:", err);
  }
}

export const db = firestoreInstance;
export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail };
export type { FirebaseUser };

