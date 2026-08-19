const fs = require('fs');
const path = './src/components/CheckoutView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove Delivery Mode Block completely (Step 1)
content = content.replace(
  /\{\/\* Step 1: Delivery Mode \*\/\}\s*<div className="p-6 rounded-3xl premium-card space-y-4">[\s\S]*?(?=\{\/\* Step 2: Recipient Details & Address \*\/)/,
  ''
);

// 2. Remove City quick presets
content = content.replace(
  /\{\/\* City quick presets \*\/\}\s*<div>\s*<label className="block text-\[11px\] font-bold uppercase tracking-wider text-slate-600 mb-1">\s*City \/ Governorate Quick Select\s*<\/label>\s*<div className="flex flex-wrap gap-1.5 mb-2">[\s\S]*?<\/div>\s*<input[\s\S]*?className="w-full px-3.5 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm"\s*\/>\s*<\/div>/,
  `<div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    City / Governorate *
                  </label>
                  <input
                    type="text"
                    id="checkout-city-input"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Achrafieh, Beirut"
                    className="w-full px-3.5 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm"
                  />
                </div>`
);

// 3. Remove Special Delivery Instructions block
content = content.replace(
  /<div>\s*<label className="block text-\[11px\] font-bold uppercase tracking-wider text-slate-600 mb-1">\s*Special Delivery Instructions\s*<\/label>\s*<input[\s\S]*?value=\{formData\.notes\}[\s\S]*?\/>\s*<\/div>/,
  ''
);

// 4. Remove Payment Method block completely (Step 3)
content = content.replace(
  /\{\/\* Step 3: Payment Method \*\/\}\s*<div className="p-6 rounded-3xl premium-card space-y-4">[\s\S]*?(?=<\/div>\s*\{\/\* Right Column: Order Summary Card \*\/)/,
  ''
);

// 5. Remove Trust badges in Order Summary
content = content.replace(
  /<div className="flex items-center justify-center gap-4 text-\[10px\] text-slate-500 pt-1">\s*<span>🔒 256-Bit SSL Protection<\/span>\s*<span>•<\/span>\s*<span>🇱🇧 Direct Artisan Payout<\/span>\s*<\/div>/,
  ''
);

// We need to renumber "Step 2" to "Step 1" now that it's the only block
content = content.replace(
  /<span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black">2<\/span>/,
  '<span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black">1</span>'
);

fs.writeFileSync(path, content);
console.log("Stripted CheckoutView.tsx successfully.");
