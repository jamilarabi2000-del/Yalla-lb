const fs = require('fs');
const path = './src/context/ShopContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `      if (!userObj) {
        setFirebaseUser(null);
        return;
      }`;

const replacement = `      if (!userObj) {
        setFirebaseUser(null);
        setUser(INITIAL_USER);
        localStorage.removeItem('yallalb_user');
        return;
      }`;

content = content.replace(target, replacement);
fs.writeFileSync(path, content);
console.log('Updated onAuthStateChanged to clear user state on logout/guest');
