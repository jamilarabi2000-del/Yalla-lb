const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "{user.name.charAt(0)}",
  "{user.name ? user.name.charAt(0) : 'G'}"
);

content = content.replace(
  '<h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>',
  '<h1 className="text-2xl font-bold text-slate-900">{user.name || (language === \'ar\' ? \'زائر جديد\' : \'New Guest Patron\')}</h1>'
);

content = content.replace(
  '<p className="text-xs text-slate-500 mt-0.5">{user.email} • {user.phone}</p>',
  '<p className="text-xs text-slate-500 mt-0.5">{user.email || (language === \'ar\' ? \'يرجى تحديث بريدك الإلكتروني ورقم هاتفك أدناه\' : \'Please fill out your profile details below to complete sign up\')} {user.phone ? \`• \${user.phone}\` : \'\'}</p>'
);

content = content.replace(
  '<span className="text-[11px] text-slate-600 flex items-center gap-1 mt-1 font-medium">\n                  <MapPin className="w-3 h-3 text-slate-400" />\n                  <span>{user.defaultAddress}, {user.defaultCity}</span>\n                </span>',
  '{user.defaultAddress ? (\n                <span className="text-[11px] text-slate-600 flex items-center gap-1 mt-1 font-medium">\n                  <MapPin className="w-3 h-3 text-slate-400" />\n                  <span>{user.defaultAddress}, {user.defaultCity}</span>\n                </span>\n              ) : null}'
);

fs.writeFileSync(path, content);
console.log('Fixed AccountView fallback for empty user profile');
