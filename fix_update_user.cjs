const fs = require('fs');
const path = './src/context/ShopContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `    const updatedUser = { ...user, ...updates };
    const sanitizedUser = sanitizeDocumentData(updatedUser);
    setUser(updatedUser);
    const userKey = firebaseUser ? firebaseUser.uid : 'guest_profile';`;

const replacement = `    const updatedUser = { ...user, ...updates };
    const sanitizedUser = sanitizeDocumentData(updatedUser);
    setUser(updatedUser);

    if (!firebaseUser) {
      showToast('Profile and delivery details saved successfully');
      return;
    }

    const userKey = firebaseUser.uid;`;

if (content.includes('guest_profile')) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Successfully updated updateUser in ShopContext.tsx');
} else {
    console.log('Target not found');
}
