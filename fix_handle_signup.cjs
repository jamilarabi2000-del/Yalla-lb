const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace handleSignUp implementation cleanly
const targetFunc = `  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFirstName || !profileLastName) {
      showToast('Please enter both First Name and Last Name', 'warning');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    if (!/^d{8}$/.test(profilePhone)) {
      showToast('Please enter a valid 8-digit Lebanese phone number', 'warning');
      return;
    }
    const fullName = \`\${profileFirstName.trim()} \${profileLastName.trim()}\`;
    if (!/^d{8}$/.test(profilePhone)) {
      showToast('Please enter a valid 8-digit Lebanese phone number', 'warning');
      return;
    }
    if (authPassword !== authConfirmPassword) {
      showToast('Passwords do not match. Please verify.', 'warning');
      return;
    }
    setIsAuthLoading(true);
    try {
      await signUpWithEmail(authEmail, authPassword);
      await updateUser({
        name: fullName,
        email: authEmail,
        phone: '+961 ' + profilePhone,
        defaultCity: profileCity,
        defaultAddress: profileAddress
      });
    } catch (err) {} finally {
      setIsAuthLoading(false);
    }
  };`;

const replacementFunc = `  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFirstName || !profileFirstName.trim() || !profileLastName || !profileLastName.trim()) {
      showToast('First Name and Last Name are required', 'warning');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      showToast('Valid email format is required', 'warning');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }
    if (authPassword !== authConfirmPassword) {
      showToast('Passwords do not match', 'warning');
      return;
    }
    if (!/^\\d{8}$/.test(profilePhone)) {
      showToast('Lebanese phone number must be strictly 8 digits', 'warning');
      return;
    }
    const fullName = \`\${profileFirstName.trim()} \${profileLastName.trim()}\`;
    setIsAuthLoading(true);
    try {
      await signUpWithEmail(authEmail, authPassword);
      await updateUser({
        name: fullName,
        email: authEmail,
        phone: '+961 ' + profilePhone,
        defaultCity: profileCity,
        defaultAddress: profileAddress
      });
    } catch (err) {} finally {
      setIsAuthLoading(false);
    }
  };`;

if (content.includes('const handleSignUp = async')) {
    content = content.replace(targetFunc, replacementFunc);
}

// Also ensure the phone badge CSS is enhanced with flag + country code
const badgeTarget = `                            <span className="flex items-center px-3 bg-slate-100 text-slate-600 text-xs font-bold border-r border-slate-200 select-none">
                              🇱🇧 +961
                            </span>`;

const badgeReplacement = `                            <span className="flex items-center gap-1.5 px-3.5 bg-slate-100 text-slate-800 text-xs font-bold border-r border-slate-200 select-none whitespace-nowrap">
                              <span className="text-sm">🇱🇧</span>
                              <span>+961</span>
                            </span>`;

if (content.includes(badgeTarget)) {
    content = content.replace(badgeTarget, badgeReplacement);
}

fs.writeFileSync(path, content);
console.log('Fixed handleSignUp and phone badge CSS');
