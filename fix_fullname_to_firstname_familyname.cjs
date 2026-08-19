const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                      <div>                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>                        <input 
                          type="text" 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                          required 
                        />                      </div>`;

const replacement = `                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">First Name (Required)</label>
                          <input 
                            type="text" 
                            value={profileFirstName} 
                            onChange={(e) => setProfileFirstName(e.target.value)} 
                            placeholder="John"
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Family Name (Required)</label>
                          <input 
                            type="text" 
                            value={profileLastName} 
                            onChange={(e) => setProfileLastName(e.target.value)} 
                            placeholder="Doe"
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            required 
                          />
                        </div>
                      </div>`;

if (content.includes('Full Name')) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Replaced Full Name with First Name and Family Name');
}
