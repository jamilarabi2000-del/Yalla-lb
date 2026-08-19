const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;', 'const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;');

fs.writeFileSync(path, content);
console.log('Fixed email regex in AccountView');
