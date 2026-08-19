const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add authMode state
const stateTarget = `  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);`;

const stateReplacement = `  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');`;

content = content.replace(stateTarget, stateReplacement);

// Replace handleSignUp implementation to also update user profile data
const signUpTarget = `  const handleSignUp = async () => {
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

const signUpReplacement = `  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !profileName) {
      showToast('Please fill in name, email, and password', 'warning');
      return;
    }
    setIsAuthLoading(true);
    try {
      await signUpWithEmail(authEmail, authPassword);
      await updateUser({
        name: profileName,
        email: authEmail,
        phone: profilePhone,
        defaultCity: profileCity,
        defaultAddress: profileAddress
      });
    } catch (err) {} finally {
      setIsAuthLoading(false);
    }
  };`;

content = content.replace(signUpTarget, signUpReplacement);

// Replace handleSignIn implementation
const signInTarget = `  const handleSignIn = async () => {
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
  };`;

const signInReplacement = `  const handleSignIn = async (e: React.FormEvent) => {
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
  };`;

content = content.replace(signInTarget, signInReplacement);

// Replace the unauthenticated form block in AccountView.tsx
const formBlockTarget = `{!firebaseUser ? (
                <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-bold">
                      <User className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{language === 'ar' ? 'تسجيل الدخول أو إنشاء حساب' : 'Sign In or Create Account'}</h2>
                    <p className="text-xs text-slate-500 mt-1">{language === 'ar' ? 'أدخل بريدك الإلكتروني وكلمة المرور للمتابعة' : 'Enter your email and password to sign in or register instantly.'}</p>
                  </div>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
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
                        
                        minLength={6}
                        required 
                      />
                    </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
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
                  </div>
                  </form>
                </div>`;

const formBlockReplacement = `{!firebaseUser ? (
                <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setAuthMode('signin')}
                      className={\`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer \${
                        authMode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }\`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className={\`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer \${
                        authMode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }\`}
                    >
                      Sign Up
                    </button>
                  </div>

                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">{authMode === 'signin' ? 'Welcome Back' : 'Create Your Account'}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {authMode === 'signin' ? 'Sign in to access your orders and saved details.' : 'Fill in your personal details and set a secure password.'}
                    </p>
                  </div>

                  {authMode === 'signin' ? (
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                        <input 
                          type="email" 
                          value={authEmail} 
                          onChange={(e) => setAuthEmail(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Password (Required)</label>
                        <input 
                          type="password" 
                          value={authPassword} 
                          onChange={(e) => setAuthPassword(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                          minLength={6}
                          required 
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isAuthLoading}
                        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:bg-slate-300"
                      >
                        {isAuthLoading ? 'Signing In...' : 'Sign In'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                          required 
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                          <input 
                            type="email" 
                            value={authEmail} 
                            onChange={(e) => setAuthEmail(e.target.value)} 
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Password (Required)</label>
                          <input 
                            type="password" 
                            value={authPassword} 
                            onChange={(e) => setAuthPassword(e.target.value)} 
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            minLength={6}
                            required 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Phone (WhatsApp)</label>
                          <input 
                            type="tel" 
                            value={profilePhone} 
                            onChange={(e) => setProfilePhone(e.target.value)} 
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">City / Region</label>
                          <input 
                            type="text" 
                            value={profileCity} 
                            onChange={(e) => setProfileCity(e.target.value)} 
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            required 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Detailed Address</label>
                        <input 
                          type="text" 
                          value={profileAddress} 
                          onChange={(e) => setProfileAddress(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                          required 
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isAuthLoading}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:bg-slate-300 mt-2"
                      >
                        {isAuthLoading ? 'Creating Account...' : 'Create Account & Sign Up'}
                      </button>
                    </form>
                  )}
                </div>`;

content = content.replace(formBlockTarget, formBlockReplacement);
fs.writeFileSync(path, content);
console.log('Updated AccountView with Sign In and Sign Up tabs');
