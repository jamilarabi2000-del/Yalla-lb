const fs = require('fs');
const path = './src/context/ShopContext.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("showToast('Authentication failed: ' + error.message, 'error');", "showToast('Authentication failed: ' + error.message, 'warning');");

fs.writeFileSync(path, content);
console.log('Fixed error toast type');
