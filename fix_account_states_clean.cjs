const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace state declaration section
const stateTarget = `  // Profile form local state
  const [profileName, setProfileName] = useState(user.name);`;

const stateReplacement = `  // Profile form local state
  const [profileName, setProfileName] = useState(user.name);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');`;

if (!content.includes('profileFirstName')) {
    content = content.replace(stateTarget, stateReplacement);
}

fs.writeFileSync(path, content);
console.log('Added profileFirstName and profileLastName states');
