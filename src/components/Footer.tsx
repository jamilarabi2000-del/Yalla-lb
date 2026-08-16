import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import systemLogo from '../assets/images/system_logo_1786837577985.jpg';
import { 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Truck, 
  Sparkles,
  Lock,
  Unlock,
  KeyRound
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, t, isAdminUnlocked, setIsAdminUnlocked, showToast, language } = useShop();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  return (
    <footer className="bg-[#121222] border-t border-[#c5a059]/20 text-slate-400 text-xs">
      
      {/* Top Value Banner */}
      <div className="border-b border-white/5 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-[#c5a059]/30 text-[#f1d592] flex-shrink-0">
              <Truck className="w-5 h-5 text-[#c5a059]" />
            </div>
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">2-Hour Beirut Express</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Direct motorcycle dispatch across Achrafieh, Hamra, Badaro & suburbs.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-[#c5a059]/30 text-[#f1d592] flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">100% Lebanese Terroir</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Sourced from independent generational artisans, cooperatives & wineries.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-[#c5a059]/30 text-[#f1d592] flex-shrink-0">
              <Sparkles className="w-5 h-5 text-[#c5a059]" />
            </div>
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Fair Trade Artisan Payout</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Empowering rural villages in Koura, Jezzine, Tripoli, Chouf & Bekaa.</p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          
          {/* Brand Col */}
          <div className="space-y-4 max-w-xl">
            <div 
              className="flex items-center gap-3 cursor-pointer group w-fit"
              onClick={() => setActiveTab('home')}
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] p-1.5 border border-[#c5a059]/30 group-hover:border-[#c5a059] transition-colors">
                <img 
                  src={systemLogo} 
                  alt="Yalla.lb Logo" 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight gold-gradient uppercase font-sans">
                  Yalla.lb
                </span>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Lebanese Artisan Commerce
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-light">
              A premium, high-velocity marketplace bridging Lebanese craftsmanship with modern digital commerce for a seamless, hyper-local shopping experience.
            </p>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300 min-w-[240px]">
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#c5a059]" />
              <span>Gouraud Street, Gemmayze, Beirut, Lebanon</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#c5a059]" />
              <span>WhatsApp Dispatch: +961 70 889 234</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#c5a059]" />
              <span>concierge@yalla.lb</span>
            </p>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-[11px]">
          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} Yalla.lb
          </p>
          
          {/* Subtle Secure Merchant Gate Trigger */}
          <button 
            onClick={() => {
              if (isAdminUnlocked) {
                setIsAdminUnlocked(false);
                setActiveTab('home');
                showToast('Merchant session locked securely.', 'info');
              } else {
                setError('');
                setPasscode('');
                setShowUnlockModal(true);
              }
            }}
            className="text-slate-600 hover:text-[#c5a059] transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold tracking-wider uppercase"
          >
            {isAdminUnlocked ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lock Portal</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span>Merchant Portal</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 text-slate-400">
            <span>Made with love from Rachaya</span>
            <span>🇱🇧</span>
          </div>
        </div>

      </div>

      {/* Elegant Merchant Passcode Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90">
          <div className="bg-[#121222] border border-[#c5a059]/40 p-6 rounded-3xl max-w-sm w-full space-y-5 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-[#c5a059]" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                {language === 'ar' ? 'بوابة التجار والحرفيين' : 'Merchant & Artisan Access'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'ar' ? 'أدخل كلمة المرور الخاصة بالمشرف للوصول إلى بوابة الإدارة.' : 'Please enter the authorization passcode to unlock the merchant dashboard.'}
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (passcode === '1234' || passcode.toLowerCase() === 'admin' || passcode === '961') {
                setIsAdminUnlocked(true);
                setShowUnlockModal(false);
                setActiveTab('admin');
                showToast(
                  language === 'ar' ? 'تم فتح بوابة الإدارة بنجاح!' : 'Merchant dashboard successfully unlocked!',
                  'success'
                );
              } else {
                setError(language === 'ar' ? 'كلمة المرور غير صحيحة. حاول مجدداً.' : 'Invalid passcode. Please try again.');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#c5a059] mb-1.5">
                  {language === 'ar' ? 'كلمة المرور' : 'Security Passcode'}
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setError('');
                  }}
                  placeholder="••••"
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-center text-lg font-mono text-white focus:outline-none focus:border-[#c5a059] transition-all tracking-widest"
                  autoFocus
                />
                {error && (
                  <p className="text-rose-500 text-[11px] font-semibold text-center mt-2">{error}</p>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-2xl text-xs uppercase tracking-wider border border-white/10 transition-all cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#c5a059] hover:bg-[#d4b36e] text-[#1a1a2e] font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  {language === 'ar' ? 'دخول' : 'Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </footer>
  );
};
