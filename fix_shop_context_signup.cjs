const fs = require('fs');
const path = './src/context/ShopContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      showToast('Successfully signed in!', 'success');
    } catch (err: any) {
      showToast('Sign in failed: ' + err.message, 'warning');
      throw err;
    }
  };`;

const replacement = target + `

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      showToast('Account created and signed in!', 'success');
    } catch (err: any) {
      showToast('Sign up failed: ' + err.message, 'warning');
      throw err;
    }
  };`;

if (!content.includes('const signUpWithEmail =')) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Added signUpWithEmail implementation');
}
