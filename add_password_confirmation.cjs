const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add authConfirmPassword state
const stateTarget = `  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);`;

const stateReplacement = `  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);`;

content = content.replace(stateTarget, stateReplacement);

// 2. Update handleSignUp validation
const signUpValidationTarget = `  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !profileName) {
      showToast('Please fill in name, email, and password', 'warning');
      return;
    }`;

const signUpValidationReplacement = `  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !profileName) {
      showToast('Please fill in name, email, and password', 'warning');
      return;
    }
    if (authPassword !== authConfirmPassword) {
      showToast('Passwords do not match. Please verify.', 'warning');
      return;
    }`;

content = content.replace(signUpValidationTarget, signUpValidationReplacement);

// 3. Add Confirm Password input field in Sign Up form
const signupFormTarget = `                        <div>
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
                      </div>`;

const signupFormReplacement = `                        <div>
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
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Confirm Password</label>
                        <input 
                          type="password" 
                          value={authConfirmPassword} 
                          onChange={(e) => setAuthConfirmPassword(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                          minLength={6}
                          required 
                        />
                      </div>`;

content = content.replace(signupFormTarget, signupFormReplacement);

fs.writeFileSync(path, content);
console.log('Added password confirmation to AccountView');
