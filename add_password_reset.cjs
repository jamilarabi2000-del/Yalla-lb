const fs = require('fs');
const path = './src/context/ShopContext.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
content = content.replace("signInWithPopup, googleProvider }", "signInWithPopup, googleProvider, sendPasswordResetEmail }");

// Add context interface
content = content.replace("signInWithEmail: (email: string, pass: string) => Promise<void>;", "signInWithEmail: (email: string, pass: string) => Promise<void>;\n  resetPassword: (email: string) => Promise<void>;");

// Add reset function
const resetFunc = `  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('Password reset email sent. Please check your inbox.', 'success');
    } catch (error: any) {
      showToast('Failed to send reset email: ' + error.message, 'error');
    }
  };

  const signInWithEmail`;
content = content.replace("  const signInWithEmail", resetFunc);

// Export it
content = content.replace("signInWithEmail,", "signInWithEmail,\n        resetPassword,");

fs.writeFileSync(path, content);
console.log('Added resetPassword to ShopContext.tsx');
