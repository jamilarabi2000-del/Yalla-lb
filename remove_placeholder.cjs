const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('placeholder="At least 6 characters"', '');

fs.writeFileSync(path, content);
console.log('Removed placeholder from password input');
