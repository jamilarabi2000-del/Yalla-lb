const fs = require('fs');
let code = fs.readFileSync('src/context/ShopContext.tsx', 'utf8');

code = code.replace(/const userKey = firebaseUser \? firebaseUser\.uid : 'guest_session';\n\s*const cartDocRef/g, `if (!firebaseUser) return;\n    const userKey = firebaseUser.uid;\n    const cartDocRef`);

code = code.replace(/const userKey = firebaseUser \? firebaseUser\.uid : 'guest_session';\n\s*const wishlistDocRef/g, `if (!firebaseUser) return;\n    const userKey = firebaseUser.uid;\n    const wishlistDocRef`);

fs.writeFileSync('src/context/ShopContext.tsx', code);
