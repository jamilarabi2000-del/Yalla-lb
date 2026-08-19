const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `            {/* Account Status Badge & Google Auth */}
            <div className="flex items-center gap-3">
              {firebaseUser ? (
                <button
                  id="firebase-signout-btn"
                  onClick={signOutUser}
                  className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'} ({firebaseUser.displayName || firebaseUser.email})</span>
                </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700">`;

const replacement = `            {/* Account Status Badge & Google Auth */}
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
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700">`;

if (content.includes('firebase-signout-btn')) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Successfully fixed account auth section');
} else {
    console.log('Target not found');
}
