const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `  const [profileName, setProfileName] = useState(user.name);`;
const replacement = `  const [profileName, setProfileName] = useState(user.name);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');`;

if (!content.includes('profileFirstName')) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Added profileFirstName and profileLastName states');
}
