const fs = require('fs');
let code = fs.readFileSync('src/context/ShopContext.tsx', 'utf8');

code = code.replace(/, signInAnonymously/g, '');

fs.writeFileSync('src/context/ShopContext.tsx', code);
