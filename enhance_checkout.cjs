const fs = require('fs');
const path = './src/components/CheckoutView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Success Screen Container
content = content.replace(
  'className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#1a1a2e]"',
  'className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-slate-50"'
);

// 2. Success Screen Card Text
content = content.replace(
  '<h2 className="text-3xl sm:text-4xl font-light text-white">',
  '<h2 className="text-3xl sm:text-4xl font-light text-slate-900">'
);
content = content.replace(
  '<p className="text-xs sm:text-sm text-slate-300">',
  '<p className="text-xs sm:text-sm text-slate-600">'
);
content = content.replace(
  '<span className="font-mono font-bold text-[#f1d592] bg-[#121222] px-3 py-1 rounded-lg border border-[#c5a059]/40 inline-block mt-1">',
  '<span className="font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 inline-block mt-1">'
);

// 3. Success steps box
content = content.replace(
  '<div className="p-5 rounded-2xl bg-white/[0.03] border border-[#c5a059]/20 text-left text-xs space-y-2.5 text-slate-300">',
  '<div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-left text-xs space-y-2.5 text-slate-600">'
);

// 4. Success Buttons
content = content.replace(
  'className="px-8 py-3.5 bg-[#c5a059] hover:bg-[#d4b36e] text-[#1a1a2e] font-black uppercase text-xs tracking-widest transition-all cursor-pointer shadow-lg"',
  'className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest transition-all cursor-pointer shadow-lg"'
);

// 5. Main wrapper
content = content.replace(
  'className="min-h-screen bg-[#1a1a2e] pb-24"',
  'className="min-h-screen bg-slate-50 pb-24"'
);

// 6. Checkout Header
content = content.replace(
  'className="bg-[#121222] border-b border-[#c5a059]/20 pt-6 pb-10 px-4 sm:px-6 lg:px-8"',
  'className="bg-white border-b border-slate-200 pt-6 pb-10 px-4 sm:px-6 lg:px-8"'
);
content = content.replace(
  'className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider border border-slate-700 transition-colors cursor-pointer mb-1"',
  'className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border border-slate-200 transition-colors cursor-pointer mb-1 shadow-sm"'
);
content = content.replace(
  '<div className="flex items-center gap-2 text-[#f1d592] text-xs font-bold uppercase tracking-[0.2em]">',
  '<div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.2em]">'
);
content = content.replace(
  '<Lock className="w-3.5 h-3.5 text-[#c5a059]" />',
  '<Lock className="w-3.5 h-3.5 text-emerald-600" />'
);
content = content.replace(
  '<h1 className="text-3xl font-light text-white tracking-tight">',
  '<h1 className="text-3xl font-light text-slate-900 tracking-tight">'
);
content = content.replace(
  '<p className="text-xs sm:text-sm text-slate-300">',
  '<p className="text-xs sm:text-sm text-slate-500">'
);

// 7. Empty state
content = content.replace(
  '<div className="w-16 h-16 rounded-full bg-white/[0.05] border border-[#c5a059]/30 flex items-center justify-center mx-auto text-[#c5a059]">',
  '<div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">'
);
content = content.replace(
  '<h2 className="text-xl font-bold text-white">{t(\'emptyBasket\')}</h2>',
  '<h2 className="text-xl font-bold text-slate-900">{t(\'emptyBasket\')}</h2>'
);
content = content.replace(
  'className="px-8 py-3.5 bg-[#c5a059] hover:bg-[#d4b36e] text-[#1a1a2e] font-black uppercase text-xs tracking-widest cursor-pointer transition-colors shadow-lg"',
  'className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest cursor-pointer transition-colors shadow-lg"'
);

// 8. Headings in cards
content = content.replace(/<h3 className="text-base font-bold text-white flex items-center gap-2">/g, '<h3 className="text-base font-bold text-slate-900 flex items-center gap-2">');
content = content.replace(/<h3 className="text-base font-bold text-white pb-3 border-b border-white\/10 flex items-center justify-between">/g, '<h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">');
content = content.replace(/<span className="flex items-center justify-center w-6 h-6 rounded-full bg-\[\#c5a059\] text-\[\#1a1a2e\] text-xs font-black">/g, '<span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black">');

// 9. Delivery Methods
content = content.replace(/bg-white\/\[0\.03\] border-white\/10 text-slate-400 hover:border-white\/20/g, 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:bg-slate-50 shadow-sm');
content = content.replace(/bg-\[\#c5a059\]\/15 border-\[\#c5a059\] text-white shadow-md/g, 'bg-amber-50/60 border-amber-400 text-slate-900 shadow-sm ring-1 ring-amber-400');
content = content.replace(/text-\[\#f1d592\]/g, 'text-amber-700');
content = content.replace(/text-slate-300/g, 'text-slate-500');

// 10. Inputs
content = content.replace(/bg-white\/\[0\.05\] text-xs text-white rounded-xl border border-\[\#c5a059\]\/30 focus:border-\[\#c5a059\] focus:outline-none/g, 'bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm');
content = content.replace(/text-\[\#c5a059\] focus:ring-\[\#c5a059\]/g, 'text-amber-600 focus:ring-amber-600 border-slate-300');
content = content.replace(/<label className="block text-\[11px\] font-bold uppercase tracking-wider text-slate-400 mb-1">/g, '<label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">');

// 11. City quick preset buttons
content = content.replace(/bg-white\/\[0\.04\] text-slate-300 hover:bg-white\/\[0\.08\] border border-white\/10/g, 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm');
content = content.replace(/'bg-\[\#c5a059\] text-\[\#1a1a2e\]'/g, "'bg-slate-900 text-white'");
content = content.replace(
  'className="w-full px-3.5 py-2.5 bg-[#121222] text-xs text-white rounded-xl border border-[#c5a059]/30 focus:border-[#c5a059] focus:outline-none"',
  'className="w-full px-3.5 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm"'
);

// 12. Payment choices text
content = content.replace(/<div className="flex items-center gap-1\.5 font-bold text-white text-xs">/g, '<div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">');
content = content.replace(/text-slate-400/g, 'text-slate-500'); // Note: affects multiple places, but mostly good for converting to light mode! Let's be careful. Actually, this is generally safe for light mode text.

// 13. Order Summary items
content = content.replace(/<h4 className="font-bold text-white truncate">/g, '<h4 className="font-bold text-slate-900 truncate">');
content = content.replace(/<span className="font-bold text-\[\#c5a059\]">/g, '<span className="font-bold text-amber-600">');
content = content.replace(/border-white\/10/g, 'border-slate-100');
content = content.replace(/<span className="text-sm font-bold">Total Amount Due<\/span>/g, '<span className="text-sm font-bold text-slate-900">Total Amount Due</span>');
content = content.replace(/bg-slate-950 border border-\[\#c5a059\]\/30/g, 'bg-slate-50 border border-slate-200');

// 14. Submit order button
content = content.replace(
  'className="w-full py-4 rounded-xl bg-[#c5a059] hover:bg-[#d4b36e] text-[#1a1a2e] font-black uppercase text-xs tracking-widest shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"',
  'className="w-full py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"'
);
content = content.replace(
  '<ShieldCheck className="w-4 h-4 text-[#1a1a2e]" />',
  '<ShieldCheck className="w-4 h-4 text-emerald-400" />'
);

fs.writeFileSync(path, content);
console.log("Updated CheckoutView.tsx successfully.");
