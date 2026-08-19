const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add phone validation in handleSignUp
const valTarget = `    if (!authEmail || !authPassword || !profileName) {
      showToast('Please fill in name, email, and password', 'warning');
      return;
    }`;

const valReplacement = `    if (!authEmail || !authPassword || !profileName) {
      showToast('Please fill in name, email, and password', 'warning');
      return;
    }
    if (!/^\d{8}$/.test(profilePhone)) {
      showToast('Please enter a valid 8-digit Lebanese phone number', 'warning');
      return;
    }`;

content = content.replace(valTarget, valReplacement);

// Format phone with +961 on signup save if not already formatted
const saveTarget = `      await updateUser({
        name: profileName,
        email: authEmail,
        phone: profilePhone,
        defaultCity: profileCity,
        defaultAddress: profileAddress
      });`;

const saveReplacement = `      await updateUser({
        name: profileName,
        email: authEmail,
        phone: '+961 ' + profilePhone,
        defaultCity: profileCity,
        defaultAddress: profileAddress
      });`;

content = content.replace(saveTarget, saveReplacement);

// 2. Update phone input markup
const inputTarget = `                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Phone (WhatsApp)</label>
                          <input 
                            type="tel" 
                            value={profilePhone} 
                            onChange={(e) => setProfilePhone(e.target.value)} 
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            required 
                          />
                        </div>`;

const inputReplacement = `                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Phone (WhatsApp)</label>
                          <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-slate-400">
                            <span className="flex items-center px-3 bg-slate-100 text-slate-600 text-xs font-bold border-r border-slate-200 select-none">
                              🇱🇧 +961
                            </span>
                            <input 
                              type="text" 
                              inputMode="numeric"
                              maxLength={8}
                              placeholder="70123456"
                              value={profilePhone} 
                              onChange={(e) => {
                                const val = e.target.value.replace(/\\D/g, '').slice(0, 8);
                                setProfilePhone(val);
                              }} 
                              className="w-full px-3 py-2.5 bg-transparent text-slate-900 text-sm focus:outline-none" 
                              required 
                            />
                          </div>
                        </div>`;

content = content.replace(inputTarget, inputReplacement);

fs.writeFileSync(path, content);
console.log('Added Lebanon phone country code (+961) and 8-digit strict validation');
