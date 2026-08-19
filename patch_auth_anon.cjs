const fs = require('fs');
let code = fs.readFileSync('src/context/ShopContext.tsx', 'utf8');

code = code.replace(/if \(!userObj\) \{\s*await signInAnonymously\(auth\);\s*return;\s*\}/, `if (!userObj) {
        setFirebaseUser(null);
        return;
      }`);

fs.writeFileSync('src/context/ShopContext.tsx', code);
