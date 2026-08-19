const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showToast('Please enter both email and password', 'warning');
      return;
    }
    setIsAuthLoading(true);
    try {
      await signInWithEmail(authEmail, authPassword);
      setProfileEmail(authEmail);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsAuthLoading(false);
    }
  };`;

const replacement = `  const handleSignIn = async () => {
    if (!authEmail || !authPassword) {
      showToast('Please enter both email and password', 'warning');
      return;
    }
    setIsAuthLoading(true);
    try {
      await signInWithEmail(authEmail, authPassword);
      setProfileEmail(authEmail);
    } catch (err) {} finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!authEmail || !authPassword) {
      showToast('Please enter both email and password', 'warning');
      return;
    }
    setIsAuthLoading(true);
    try {
      await signUpWithEmail(authEmail, authPassword);
      setProfileEmail(authEmail);
    } catch (err) {} finally {
      setIsAuthLoading(false);
    }
  };`;

content = content.replace(target, replacement);
fs.writeFileSync(path, content);
console.log('Added handleSignIn and handleSignUp to AccountView');
