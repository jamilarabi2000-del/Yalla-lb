const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `              ) : (
                <button
                  id="firebase-google-signin-btn"
                  onClick={signInWithGoogle}
                  className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 bg-white rounded-full p-0.5" />
                  <span>{language === 'ar' ? 'تسجيل الدخول بواسطة جوجل' : 'Sign in with Google'}</span>
                </button>
              )}`;

if (content.includes('firebase-google-signin-btn')) {
    content = content.replace(target, '');
    fs.writeFileSync(path, content);
    console.log('Successfully removed Google sign-in button');
} else {
    console.log('Button not found');
}
