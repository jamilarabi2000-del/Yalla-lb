const fs = require('fs');
const path = './src/context/ShopContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldFunc = `  const signInWithEmail = async (email: string, pass: string) => {
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
      showToast('Authentication failed: ' + error.message, 'warning');
      handleFirestoreError(error, OperationType.CREATE, 'auth');
    }
  };`;

const newFunc = `  const signInWithEmail = async (email: string, pass: string) => {
    try {
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        showToast('Successfully signed in!', 'success');
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          // Attempt to create user if not found
          await createUserWithEmailAndPassword(auth, email, pass);
          showToast('Account created and signed in!', 'success');
        } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          // Might be a Google account or just wrong password. Let's try to create to see if it's not found
          try {
            await createUserWithEmailAndPassword(auth, email, pass);
            showToast('Account created and signed in!', 'success');
          } catch (createErr: any) {
             if (createErr.code === 'auth/email-already-in-use') {
               throw new Error('This email is already registered (likely via Google). Please use a different email or reset your password in Firebase console.');
             }
             throw createErr;
          }
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      // Remove the prefix if we threw a custom error message
      const msg = error.message.includes('already registered') ? error.message : 'Authentication failed: ' + error.message;
      showToast(msg, 'error');
      console.error("Auth error:", error);
    }
  };`;

content = content.replace(oldFunc, newFunc);
fs.writeFileSync(path, content);
console.log('Updated ShopContext.tsx');
