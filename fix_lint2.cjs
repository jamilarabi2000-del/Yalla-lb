const fs = require('fs');

const shopPath = './src/context/ShopContext.tsx';
let shopContent = fs.readFileSync(shopPath, 'utf8');
shopContent = shopContent.replace(/showToast\('Failed to send reset email: ' \+ error\.message, 'error'\);/g, "showToast('Failed to send reset email: ' + error.message, 'warning');");
shopContent = shopContent.replace(/showToast\(msg, 'error'\);/g, "showToast(msg, 'warning');");
fs.writeFileSync(shopPath, shopContent);

const adminPath = './src/components/AdminView.tsx';
let adminContent = fs.readFileSync(adminPath, 'utf8');

adminContent = adminContent.replace(
  "const { firebaseUser, signInWithEmail, signOutUser, isAdminUser } = useShop();",
  "const { firebaseUser, signInWithEmail, signOutUser, isAdminUser, resetPassword } = useShop();"
);

fs.writeFileSync(adminPath, adminContent);
console.log('Fixed lint issues');
