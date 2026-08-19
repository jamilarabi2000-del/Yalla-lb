const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      </div>`;

const replacement = `                      <div>
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
                      </div>`;

content = content.replace(target, replacement);
fs.writeFileSync(path, content);
console.log('Made password field on a new line');
