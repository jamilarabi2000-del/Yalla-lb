const fs = require('fs');
const path = './src/context/ShopContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldFunc = `const msg = error.message.includes('already registered') ? error.message : 'Authentication failed: ' + error.message;
      showToast(msg, 'warning');`;

const newFunc = `const isEmailInUse = error.message.includes('email-already-in-use') || error.message.includes('already registered');
      const msg = isEmailInUse 
        ? 'This email is already registered. If you forgot your password, please click "Forgot Password?".' 
        : (error.message.includes('invalid-credential') ? 'Incorrect password. Try again or click "Forgot Password?".' : 'Authentication failed: ' + error.message);
      showToast(msg, 'warning');`;

content = content.replace(oldFunc, newFunc);
fs.writeFileSync(path, content);
console.log('Fixed auth error messages');
