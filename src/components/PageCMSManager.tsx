import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { HomeIcon, Layout, ShoppingBag, Search, CreditCard, User, Newspaper, Navigation, Type, Blocks, Settings } from 'lucide-react';

export const PageCMSManager: React.FC<{ initialTab?: string }> = ({ initialTab = 'home' }) => {
  const { siteContent, updateSiteContent, saveCmsSettings } = useShop();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [cmsForm, setCmsForm] = useState(siteContent);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCmsForm(siteContent);
  }, [siteContent]);

  const updateSectionField = (section: keyof typeof cmsForm, field: string, value: string) => {
    setCmsForm(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveCmsSettings(cmsForm);
    setIsSaving(false);
  };

  const tabs = [
    { id: 'home', label: 'Home Sections', icon: HomeIcon },
    { id: 'navbar', label: 'Navbar & Brand', icon: Navigation },
    { id: 'footer', label: 'Footer', icon: Layout },
    { id: 'productsPage', label: 'Catalog Page', icon: ShoppingBag },
    { id: 'productDetailPage', label: 'Product Details', icon: Search },
    { id: 'checkoutPage', label: 'Checkout Page', icon: CreditCard },
    { id: 'accountPage', label: 'Account Page', icon: User },
    { id: 'newsSection', label: 'News / Blog', icon: Newspaper },
    { id: 'customBlocks', label: 'Custom Blocks', icon: Blocks },
    { id: 'visibility', label: 'Visibility', icon: Settings },
    { id: 'seo', label: 'SEO Config', icon: Type }
  ];

  return (
    <div className="bg-[#1a1a2e] p-6 rounded-3xl text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-amber-400">Content Management System</h2>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id ? 'bg-[#4f46e5] text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'home' && (
        <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HomeIcon className="w-4 h-4 text-amber-400" />
            <span>Home Page Content & Narrative Blocks</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Featured Items Title</label>
              <input type="text" value={cmsForm.home?.featuredTitle || ''} onChange={e => updateSectionField('home', 'featuredTitle', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-500/70 mb-1.5" dir="rtl">عنوان المنتجات المميزة (عربي)</label>
              <input type="text" dir="rtl" value={cmsForm.home?.featuredTitleArabic || ''} onChange={e => updateSectionField('home', 'featuredTitleArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Featured Items Subtitle</label>
              <input type="text" value={cmsForm.home?.featuredSubtitle || ''} onChange={e => updateSectionField('home', 'featuredSubtitle', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-500/70 mb-1.5" dir="rtl">وصف المنتجات المميزة (عربي)</label>
              <input type="text" dir="rtl" value={cmsForm.home?.featuredSubtitleArabic || ''} onChange={e => updateSectionField('home', 'featuredSubtitleArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Heritage Story Title</label>
              <input type="text" value={cmsForm.home?.heritageTitle || ''} onChange={e => updateSectionField('home', 'heritageTitle', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-500/70 mb-1.5" dir="rtl">عنوان قصة التراث (عربي)</label>
              <input type="text" dir="rtl" value={cmsForm.home?.heritageTitleArabic || ''} onChange={e => updateSectionField('home', 'heritageTitleArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Heritage Story Full Narrative</label>
              <textarea rows={4} value={cmsForm.home?.heritageText || ''} onChange={e => updateSectionField('home', 'heritageText', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-500/70 mb-1.5" dir="rtl">سرد قصة التراث (عربي)</label>
              <textarea rows={4} dir="rtl" value={cmsForm.home?.heritageTextArabic || ''} onChange={e => updateSectionField('home', 'heritageTextArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Reviews Section Title</label>
              <input type="text" value={cmsForm.home?.reviewsTitle || ''} onChange={e => updateSectionField('home', 'reviewsTitle', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-500/70 mb-1.5" dir="rtl">عنوان قسم التقييمات (عربي)</label>
              <input type="text" dir="rtl" value={cmsForm.home?.reviewsTitleArabic || ''} onChange={e => updateSectionField('home', 'reviewsTitleArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Reviews Section Subtitle</label>
              <input type="text" value={cmsForm.home?.reviewsSubtitle || ''} onChange={e => updateSectionField('home', 'reviewsSubtitle', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-500/70 mb-1.5" dir="rtl">وصف قسم التقييمات (عربي)</label>
              <input type="text" dir="rtl" value={cmsForm.home?.reviewsSubtitleArabic || ''} onChange={e => updateSectionField('home', 'reviewsSubtitleArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Newsletter Title</label>
              <input type="text" value={cmsForm.home?.newsletterTitle || ''} onChange={e => updateSectionField('home', 'newsletterTitle', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-500/70 mb-1.5" dir="rtl">عنوان النشرة البريدية (عربي)</label>
              <input type="text" dir="rtl" value={cmsForm.home?.newsletterTitleArabic || ''} onChange={e => updateSectionField('home', 'newsletterTitleArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Newsletter Button Label</label>
              <input type="text" value={cmsForm.home?.newsletterButtonText || ''} onChange={e => updateSectionField('home', 'newsletterButtonText', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-500/70 mb-1.5" dir="rtl">زر النشرة البريدية (عربي)</label>
              <input type="text" dir="rtl" value={cmsForm.home?.newsletterButtonTextArabic || ''} onChange={e => updateSectionField('home', 'newsletterButtonTextArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
            </div>
          </div>
        </div>
      )}
      
      {activeTab !== 'home' && (
        <div className="bg-[#121222] border border-white/10 rounded-3xl p-12 text-center">
          <p className="text-slate-400 mb-2">This section is currently being optimized.</p>
          <p className="text-sm text-slate-500">Please use the Home Sections tab for now while the interface is being upgraded.</p>
        </div>
      )}
    </div>
  );
};
