const fs = require('fs');
const path = './src/components/CheckoutView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /bg-\[\#c5a059\]\/15 border-\[\#c5a059\]/g,
  'bg-amber-50/60 border-amber-400 text-slate-900 shadow-sm ring-1 ring-amber-400'
);

content = content.replace(
  /bg-white\/\[0\.03\] border-slate-100/g,
  'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:bg-slate-50 shadow-sm'
);

content = content.replace(
  /<Banknote className="w-4 h-4 text-emerald-400" \/>/g,
  '<Banknote className="w-4 h-4 text-emerald-600" />'
);

content = content.replace(
  /<Building2 className="w-4 h-4 text-rose-400" \/>/g,
  '<Building2 className="w-4 h-4 text-rose-600" />'
);

content = content.replace(
  /<CreditCard className="w-4 h-4 text-sky-400" \/>/g,
  '<CreditCard className="w-4 h-4 text-sky-600" />'
);

fs.writeFileSync(path, content);
console.log("Updated CheckoutView.tsx successfully (pass 2).");
