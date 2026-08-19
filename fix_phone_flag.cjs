const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                            <span className="flex items-center gap-1 px-3.5 bg-slate-100 text-slate-800 text-xs font-bold border-r border-slate-200 select-none whitespace-nowrap">
                              <span className="text-sm">🇱🇧</span> 
                              <span>+961</span>
                            </span>`;

const replacement = `                            <span className="flex items-center gap-1.5 px-3 bg-slate-100 text-slate-800 text-xs font-bold border-r border-slate-200 select-none whitespace-nowrap">
                              <span className="text-base leading-none">🇱🇧</span>
                              <span>+961</span>
                            </span>`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Switch/enhanced Lebanese flag badge');
}
