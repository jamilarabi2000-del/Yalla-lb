const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state for first and last name if not present
const stateTarget = `  const [profilePhone, setProfilePhone] = useState('');`;
const stateReplacement = `  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');`;

if (!content.includes('profileFirstName')) {
    content = content.replace(stateTarget, stateReplacement);
}

// 2. Update handleSignUp validation
const handleSignUpTarget = `  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !profileName) {
      showToast('Please fill in name, email, and password', 'warning');
      return;
    }`;

const handleSignUpReplacement = `  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFirstName || !profileLastName) {
      showToast('Please enter both First Name and Last Name', 'warning');
      return;
    }
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      showToast('Please enter a valid email address format', 'warning');
      return;
    }
    if (!authPassword) {
      showToast('Please enter a password', 'warning');
      return;
    }
    if (authPassword !== authConfirmPassword) {
      showToast('Passwords do not match', 'warning');
      return;
    }
    if (!/^\d{8}$/.test(profilePhone)) {
      showToast('Please enter a valid 8-digit Lebanese phone number', 'warning');
      return;
    }
    const fullName = \`\${profileFirstName.trim()} \${profileLastName.trim()}\`;`;

content = content.replace(handleSignUpTarget, handleSignUpReplacement);

// Update updateUser call inside handleSignUp to use fullName
content = content.replace('name: profileName,', 'name: fullName,');

// 3. Update Full Name inputs in signup form to First Name and Last Name
const nameInputTarget = `                      <div>                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>                        <input 
                          type="text" 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                          required 
                        />                      </div>`;

const nameInputReplacement = `                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">First Name (Required)</label>
                          <input 
                            type="text" 
                            value={profileFirstName} 
                            onChange={(e) => setProfileFirstName(e.target.value)} 
                            placeholder="John"
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Last Name (Required)</label>
                          <input 
                            type="text" 
                            value={profileLastName} 
                            onChange={(e) => setProfileLastName(e.target.value)} 
                            placeholder="Doe"
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            required 
                          />
                        </div>
                      </div>`;

content = content.replace(nameInputTarget, nameInputReplacement);

// 4. Enhance country code CSS (side-by-side, whitespace-nowrap, flag + code)
const phoneBadgeTarget = `                            <span className="flex items-center px-3 bg-slate-100 text-slate-600 text-xs font-bold border-r border-slate-200 select-none">
                              🇱🇧 +961
                            </span>`;

const phoneBadgeReplacement = `                            <span className="flex items-center gap-1 px-3.5 bg-slate-100 text-slate-800 text-xs font-bold border-r border-slate-200 select-none whitespace-nowrap">
                              <span className="text-sm">🇱🇧</span> 
                              <span>+961</span>
                            </span>`;

content = content.replace(phoneBadgeTarget, phoneBadgeReplacement);

fs.writeFileSync(path, content);
console.log('Updated signup fields and country code CSS');
