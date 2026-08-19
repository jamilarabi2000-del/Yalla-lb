const fs = require('fs');
const path = './src/components/AdminView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "signInWithGoogle = async () => {},",
  "signInWithEmail = async (e: string, p: string) => {},"
);

fs.writeFileSync(path, content);
console.log('Updated AdminView.tsx destructuring');
