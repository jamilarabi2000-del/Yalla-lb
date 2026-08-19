const fs = require('fs');
const path = './src/components/AdminView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `const { firebaseUser, signInWithEmail, signOutUser, isAdminUser } = useShop();`;
content = content.replace(target1, `const { firebaseUser, signInWithEmail, signOutUser, isAdminUser, resetPassword } = useShop();`);

const target2 = `<button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-bold rounded-2xl text-xs tracking-wide transition-all shadow-md cursor-pointer"
              >
                {isLoggingIn ? 'Authenticating...' : 'Sign In'}
              </button>`;

const newButtons = `<button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-bold rounded-2xl text-xs tracking-wide transition-all shadow-md cursor-pointer"
              >
                {isLoggingIn ? 'Authenticating...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!adminEmail) {
                    alert('Please enter your email address first.');
                    return;
                  }
                  resetPassword(adminEmail);
                }}
                className="w-full py-2 text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>`;

content = content.replace(target2, newButtons);
fs.writeFileSync(path, content);
console.log('Added reset password button to AdminView.tsx');
