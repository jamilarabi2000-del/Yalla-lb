const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add signInWithEmail to destructuring
content = content.replace(
    '    signInWithGoogle,\n    signOutUser',
    '    signInWithGoogle,\n    signOutUser,\n    signInWithEmail'
);

// 2. Add auth states
const stateTarget = `  const [isSaving, setIsSaving] = useState(false);`;
const stateReplacement = `  const [isSaving, setIsSaving] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
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

content = content.replace(stateTarget, stateReplacement);

// 3. Replace Profile Tab content block
const profileTabTarget = `          {/* Tab 2: Profile Settings */}
          {activeAccountTab === 'profile' && (
            <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">`;

const profileTabReplacement = `          {/* Tab 2: Profile Settings */}
          {activeAccountTab === 'profile' && (
            <div>
              {!firebaseUser ? (
                <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-bold">
                      <User className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{language === 'ar' ? 'تسجيل الدخول أو إنشاء حساب' : 'Sign In or Create Account'}</h2>
                    <p className="text-xs text-slate-500 mt-1">{language === 'ar' ? 'أدخل بريدك الإلكتروني وكلمة المرور للمتابعة' : 'Enter your email and password to sign in or register instantly.'}</p>
                  </div>
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                      <input 
                        type="email" 
                        value={authEmail} 
                        onChange={(e) => setAuthEmail(e.target.value)} 
                        className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                        placeholder="name@example.com"
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{language === 'ar' ? 'كلمة المرور (مطلوبة)' : 'Password (Required)'}</label>
                      <input 
                        type="password" 
                        value={authPassword} 
                        onChange={(e) => setAuthPassword(e.target.value)} 
                        className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                        placeholder="At least 6 characters"
                        minLength={6}
                        required 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isAuthLoading}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:bg-slate-300"
                    >
                      {isAuthLoading ? (language === 'ar' ? 'جاري المعالجة...' : 'Processing...') : (language === 'ar' ? 'متابعة / تسجيل' : 'Continue / Sign Up')}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">`;

// We also need to close the extra </div> for the logged in state
// Let's find where the profile tab div ends and add a closing div.
content = content.replace(profileTabTarget, profileTabReplacement);

fs.writeFileSync(path, content);
console.log('Updated AccountView with sign in / sign up password form');
