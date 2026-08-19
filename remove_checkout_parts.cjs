const fs = require('fs');
const path = './src/components/CheckoutView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove: Provenance Stamp & Packaging FREE
content = content.replace(
  /\s*<div className="flex justify-between text-slate-500">\s*<span>Provenance Stamp & Packaging<\/span>\s*<span className="font-bold text-emerald-400">FREE<\/span>\s*<\/div>/,
  ''
);

// Remove: Encrypted Lebanese Checkout
content = content.replace(
  /\s*<div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-\[0\.2em\]">\s*<Lock className="w-3\.5 h-3\.5 text-emerald-600" \/>\s*<span>\{language === 'ar' \? 'دفع إلكتروني آمن ومشفر \(بالدولار الأمريكي\)' : 'Encrypted Lebanese Checkout \(USD Only\)'\}<\/span>\s*<\/div>/,
  ''
);

// Remove: Instant courier dispatch throughout Lebanon
content = content.replace(
  /\s*<p className="text-xs sm:text-sm text-slate-500">\s*\{language === 'ar'\s*\?\s*'توصيل سريع لجميع المناطق اللبنانية • جميع الأسعار محددة بالدولار الأمريكي \(\$\)\.'\s*:\s*'Instant courier dispatch throughout Lebanon • All pricing strictly in US Dollars \(\$\)\.'\}\s*<\/p>/,
  ''
);

fs.writeFileSync(path, content);
console.log("Successfully removed specified elements from CheckoutView.tsx");
