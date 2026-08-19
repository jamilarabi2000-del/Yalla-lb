import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from 'firebase/firestore';

// Suppress transient connection info messages in console
try {
  setLogLevel('error');
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
export const IS_FIREBASE_ENABLED = true;

const app = initializeApp(firebaseConfig);

const isIframe = typeof window !== 'undefined' && window.self !== window.top;

let firestoreInstance;
if (isIframe) {
  firestoreInstance = getFirestore(app);
} else {
  try {
    firestoreInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    }, firebaseConfig.firestoreDatabaseId);
  } catch (e) {
    try {
      firestoreInstance = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch (err) {
      firestoreInstance = getFirestore(app);
    }
  }
}

let authInstance;
if (isIframe) {
  try {
    // In an iframe, bypass indexedDBLocalPersistence which hooks pagehide/visibilitychange listeners that crash with "Database is closing/hidden"
    authInstance = initializeAuth(app, {
      persistence: [browserLocalPersistence, browserSessionPersistence]
    });
  } catch (e) {
    authInstance = getAuth(app);
  }
} else {
  try {
    authInstance = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence]
    });
  } catch (e) {
    authInstance = getAuth(app);
  }
}

export const db = firestoreInstance;
export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail };
export type { FirebaseUser };

