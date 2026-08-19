const fs = require('fs');
const path = './src/components/AdminView.tsx';
let content = fs.readFileSync(path, 'utf8');

const loginForm = `  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-sm w-full space-y-8 shadow-sm">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-[22px] bg-slate-900 flex items-center justify-center text-white shadow-md">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Admin Login
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your credentials to access the portal
              </p>
            </div>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsLoggingIn(true);
            await signInWithEmail(adminEmail, adminPassword);
            setIsLoggingIn(false);
          }} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="jamilarabi2000@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-bold rounded-2xl text-xs tracking-wide transition-all shadow-md cursor-pointer"
              >
                {isLoggingIn ? 'Authenticating...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={goBack}
                className="w-full py-3.5 text-slate-500 hover:text-slate-700 font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }`;

// Replace the !firebaseUser block
const startStr = '  if (!firebaseUser) {';
const endStr = '  if (firebaseUser && !isAdminUser) {';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    let before = content.substring(0, startIndex);
    let after = content.substring(endIndex);
    
    // Check if we need to add state vars if they aren't there
    // Actually, we'll put them right above if (!firebaseUser)
    content = before + loginForm + '\n\n' + after;
    fs.writeFileSync(path, content);
    console.log("Successfully replaced with email/password login form.");
} else {
    console.log("Could not find start or end strings.");
}
