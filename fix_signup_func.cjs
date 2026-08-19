const fs = require('fs');
const path = './src/context/ShopContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `  const signInWithEmail = async (email: string, pass: string) => {`;
const addition = `  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      showToast('Account created successfully!', 'success');
    } catch (err: any) {
      showToast('Sign up failed: ' + err.message, 'warning');
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {`;

if (!content.includes('const signUpWithEmail =')) {
    content = content.replace(target, addition);
    fs.writeFileSync(path, content);
    console.log('Added signUpWithEmail definition before signInWithEmail');
}
