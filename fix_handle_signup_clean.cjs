const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find start of handleSignUp and end of handleSignUp and replace
const startIndex = content.indexOf('const handleSignUp = async (e: React.FormEvent) => {');
const endIndex = content.indexOf('const wishlistProducts = products.filter');

const newSignUpFunc = `  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFirstName || !profileFirstName.trim() || !profileLastName || !profileLastName.trim()) {
      showToast('First name and last name are required', 'warning');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      showToast('A valid email format is required', 'warning');
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
  };

  `;

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + newSignUpFunc + content.substring(endIndex);
    fs.writeFileSync(path, content);
    console.log('Replaced handleSignUp cleanly');
}
