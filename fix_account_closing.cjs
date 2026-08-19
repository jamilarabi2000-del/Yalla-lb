const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6 text-slate-900">
                <User className="w-5 h-5" />
                <h2 className="text-lg font-bold">Personal Information</h2>
              </div>`;

const replacement = `                <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 text-slate-900">
                    <User className="w-5 h-5" />
                    <h2 className="text-lg font-bold">Personal Information</h2>
                  </div>`;

// And close the wrapper div before closing parenthesis
content = content.replace(
    '                <div className="pt-4 flex justify-end">\n                  <button type="submit" disabled={isSaving} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer">\n                    {isSaving ? \'Saving...\' : \'Save Profile Details\'}\n                  </button>\n                </div>\n              </form>\n            </div>\n          )}',
    '                <div className="pt-4 flex justify-end">\n                  <button type="submit" disabled={isSaving} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer">\n                    {isSaving ? \'Saving...\' : \'Save Profile Details\'}\n                  </button>\n                </div>\n              </form>\n            </div>\n              )}\n            </div>\n          )}'
);

fs.writeFileSync(path, content);
console.log('Fixed AccountView closing tags');
