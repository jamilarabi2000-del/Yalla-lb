const fs = require('fs');
let code = fs.readFileSync('src/firebase.ts', 'utf8');

code = code.replace(/, signInAnonymously/g, '');

fs.writeFileSync('src/firebase.ts', code);
