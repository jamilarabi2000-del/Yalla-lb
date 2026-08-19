const fs = require('fs');
const path = './src/context/ShopContext.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    "import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, FirebaseUser, IS_FIREBASE_ENABLED } from '../firebase';",
    "import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, FirebaseUser, IS_FIREBASE_ENABLED } from '../firebase';"
);

const googleFunc = `  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Successfully signed in with Google!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'auth');
    }
  };`;

const emailFunc = `  const signInWithEmail = async (email: string, pass: string) => {
    try {
      try {
        await signInWithEmailAndPassword(auth, email, pass);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          // Attempt to create user if not found/invalid, simple fail-safe for admin
          await createUserWithEmailAndPassword(auth, email, pass);
        } else {
          throw err;
        }
      }
      showToast('Successfully signed in!', 'success');
    } catch (error: any) {
      showToast('Authentication failed: ' + error.message, 'error');
      handleFirestoreError(error, OperationType.CREATE, 'auth');
    }
  };`;

content = content.replace(googleFunc, emailFunc);
content = content.replace('signInWithGoogle,', 'signInWithEmail,');

fs.writeFileSync(path, content);
console.log('Updated ShopContext.tsx');
