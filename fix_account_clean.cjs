const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

const startIdx = content.indexOf('{/* Account Status Badge & Google Auth */}');
const endIdx = content.indexOf('<div className="flex flex-wrap items-center justify-between gap-6 pt-2">');

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `{/* Account Status Badge */}
            <div className="flex items-center gap-3">
              {firebaseUser && (
                <button
                  id="firebase-signout-btn"
                  onClick={signOutUser}
                  className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'} ({firebaseUser.displayName || firebaseUser.email})</span>
                </button>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold tracking-wide">
                  {firebaseUser ? (language === 'ar' ? 'مسجل وموثق' : 'VERIFIED MEMBER') : (language === 'ar' ? 'زائر' : 'GUEST')}
                </span>
              </div>
            </div>
          </div>

          `;
    content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
    fs.writeFileSync(path, content);
    console.log('Cleanly replaced account auth section');
} else {
    console.log('Indices not found');
}
