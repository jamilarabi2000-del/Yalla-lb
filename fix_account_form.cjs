const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('onSubmit={handleEmailAuth}', 'onSubmit={(e) => e.preventDefault()}');

fs.writeFileSync(path, content);
console.log('Fixed AccountView form onSubmit');
