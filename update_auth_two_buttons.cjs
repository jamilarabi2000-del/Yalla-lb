const fs = require('fs');

// 1. Update ShopContext.tsx to add signUpWithEmail
const shopContextPath = './src/context/ShopContext.tsx';
let scContent = fs.readFileSync(shopContextPath, 'utf8');

if (!scContent.includes('signUpWithEmail')) {
    scContent = scContent.replace(
        '  signInWithEmail: (email: string, pass: string) => Promise<void>;',
        '  signInWithEmail: (email: string, pass: string) => Promise<void>;\n  signUpWithEmail: (email: string, pass: string) => Promise<void>;'
    );

    const signUpFunc = `  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      showToast('Successfully signed in!', 'success');
    } catch (err: any) {
      showToast('Sign in failed: ' + err.message, 'warning');
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      showToast('Account created and signed in!', 'success');
    } catch (err: any) {
      showToast('Sign up failed: ' + err.message, 'warning');
      throw err;
    }
  };`;

    scContent = scContent.replace(/  const signInWithEmail = async[\s\S]*?    } \};/, signUpFunc);
    scContent = scContent.replace('        signInWithEmail,', '        signInWithEmail,\n        signUpWithEmail,');
    fs.writeFileSync(shopContextPath, scContent);
    console.log('Added signUpWithEmail to ShopContext');
}

// 2. Update AccountView.tsx to have two buttons (Sign In & Sign Up)
const accountViewPath = './src/components/AccountView.tsx';
let avContent = fs.readFileSync(accountViewPath, 'utf8');

avContent = avContent.replace('    signInWithEmail', '    signInWithEmail,\n    signUpWithEmail');

const authHandlers = `  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
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

avContent = avContent.replace(/  const handleEmailAuth = async[\s\S]*?    \} \};/, authHandlers);

const formButtons = `                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={handleSignIn}
                      disabled={isAuthLoading}
                      className="py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:bg-slate-300"
                    >
                      {isAuthLoading ? '...' : 'Sign In'}
                    </button>
                    <button 
                      type="button" 
                      onClick={handleSignUp}
                      disabled={isAuthLoading}
                      className="py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:bg-slate-300"
                    >
                      {isAuthLoading ? '...' : 'Sign Up'}
                    </button>
                  </div>`;

avContent = avContent.replace(/                    <button[\s\S]*?<\/button>\s*<\/form>/, formButtons + '\n                  </form>');

fs.writeFileSync(accountViewPath, avContent);
console.log('Updated AccountView with two buttons');
