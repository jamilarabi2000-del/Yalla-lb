const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `  const [profileName, setProfileName] = useState(user.name);`;
const replacement = `  const [profileName, setProfileName] = useState(user.name);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');`;

// Remove any existing duplicate profileFirstName declarations if any
content = content.replace(/  const \[profileFirstName, setProfileFirstName\] = useState\(''\);\n/g, '');
content = content.replace(/  const \[profileLastName, setProfileLastName\] = useState\(''\);\n/g, '');

content = content.replace(target, replacement);
fs.writeFileSync(path, content);
console.log('Placed profileFirstName and profileLastName states at top');
