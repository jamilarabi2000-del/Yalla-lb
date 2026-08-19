const fs = require('fs');
const path = './src/components/Navbar.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `            <button
              id="nav-account-btn"
              onClick={() => setActiveTab('account')}
              className={\`px-3.5 py-2 rounded-lg transition-all cursor-pointer \${
                activeTab === 'account' 
                  ? 'text-slate-900 bg-amber-50 border border-amber-200' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }\`}
            >
              {t('account')}
            </button>`;

if (content.includes('nav-account-btn')) {
    content = content.replace(target, '');
    fs.writeFileSync(path, content);
    console.log('Successfully removed nav-account-btn');
} else {
    console.log('Button not found');
}
