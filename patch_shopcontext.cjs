const fs = require('fs');
const path = './src/context/ShopContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const interfaceTarget = 'signInWithEmail: (email: string, pass: string) => Promise<void>;';
content = content.replace(interfaceTarget, interfaceTarget + '\n  signInWithGoogle: () => Promise<void>;');

const methodTarget = `  const signInWithEmail = async (email: string, pass: string) => {`;
const googleFunc = `  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Successfully signed in with Google!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'auth');
    }
  };
  
`;
content = content.replace(methodTarget, googleFunc + methodTarget);

const exportsTarget = `signInWithEmail,`;
content = content.replace(exportsTarget, exportsTarget + `\n        signInWithGoogle,`);

fs.writeFileSync(path, content);
console.log('Restored signInWithGoogle');
