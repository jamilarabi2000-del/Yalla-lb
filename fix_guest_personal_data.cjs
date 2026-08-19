const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-serif text-2xl shadow-sm">
                {firebaseUser ? (user.name ? user.name.charAt(0) : 'U') : 'G'}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {firebaseUser ? (user.name || firebaseUser.email || 'Member') : (language === 'ar' ? 'زائر كرام' : 'Guest Visitor')}
                  </h1>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {firebaseUser ? (user.email || firebaseUser.email) : (language === 'ar' ? 'يرجى تسجيل الدخول أو إنشاء حساب أدناه' : 'Please sign in or create an account below')}
                </p>
                {firebaseUser && user.defaultAddress ? (
                  <span className="text-[11px] text-slate-600 flex items-center gap-1 mt-1 font-medium">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{user.defaultAddress}, {user.defaultCity}</span>
                  </span>
                ) : null}
              </div>`;

const replacement = `              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-serif text-2xl shadow-sm">
                {firebaseUser ? (user.name ? user.name.charAt(0) : 'U') : 'G'}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {firebaseUser ? (user.name || firebaseUser.email || 'Member') : (language === 'ar' ? 'زائر' : 'Guest Visitor')}
                  </h1>
                </div>
                {firebaseUser ? (
                  <>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {user.email || firebaseUser.email} {user.phone ? \`• \${user.phone}\` : ''}
                    </p>
                    {user.defaultAddress ? (
                      <span className="text-[11px] text-slate-600 flex items-center gap-1 mt-1 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{user.defaultAddress}, {user.defaultCity}</span>
                      </span>
                    ) : null}
                  </>
                ) : (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'ar' ? 'يرجى تسجيل الدخول أو إنشاء حساب للوصول إلى تفاصيل حسابك' : 'Please sign in or create an account to access your profile'}
                  </p>
                )}
              </div>`;

content = content.replace(target, replacement);
fs.writeFileSync(path, content);
console.log('Fixed guest personal data visibility in AccountView');
