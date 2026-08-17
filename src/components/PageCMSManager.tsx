import React, { useState } from 'react';
import { SiteContent } from '../types';
import { 
  Save, 
  CheckCircle2, 
  Megaphone, 
  Layout, 
  Home as HomeIcon, 
  ShoppingBag, 
  CreditCard, 
  User as UserIcon, 
  Newspaper, 
  Globe, 
  Sparkles,
  Layers,
  Edit3
} from 'lucide-react';

interface PageCMSManagerProps {
  cmsForm: SiteContent;
  setCmsForm: React.Dispatch<React.SetStateAction<SiteContent>>;
  handleSaveCMS: (e: React.FormEvent) => Promise<void>;
  isCmsSaving: boolean;
  language: string;
}

export const PageCMSManager: React.FC<PageCMSManagerProps> = ({
  cmsForm,
  setCmsForm,
  handleSaveCMS,
  isCmsSaving,
  language
}) => {
  const [activeTab, setActiveTab] = useState<
    'navbar' | 'hero' | 'offers' | 'home' | 'productsPage' | 'checkoutPage' | 'accountPage' | 'newsSection' | 'footer'
  >('navbar');

  const updateSectionField = (section: keyof SiteContent, field: string, value: any) => {
    setCmsForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateNestedField = (
    section: keyof SiteContent, 
    subSection: string, 
    field: string, 
    value: any
  ) => {
    setCmsForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: {
          ...(prev[section] as any)[subSection],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* CMS Header & Live Save Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-[#121222] border border-[#c5a059]/30 shadow-xl">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#c5a059] mb-1 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4" />
            <span>Full Site Content Management System</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Live Page & Component Editor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar'
              ? 'تعديل جميع النصوص والوسوم والعناوين لكافة صفحات الموقع وحفظها مباشرة في قاعدة البيانات.'
              : 'Modify titles, subtitles, banners, and text blocks across all pages with instant Firestore sync.'}
          </p>
        </div>

        <button
          onClick={handleSaveCMS}
          disabled={isCmsSaving}
          className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#c5a059] to-[#d4b36e] hover:from-[#d4b36e] hover:to-[#e2c788] text-[#121222] font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {isCmsSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-[#121222] border-t-transparent rounded-full animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Publish All Content Live</span>
            </>
          )}
        </button>
      </div>

      {/* Page Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/10">
        <button
          onClick={() => setActiveTab('navbar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'navbar'
              ? 'bg-[#c5a059] text-[#121222] shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Navbar & Header</span>
        </button>

        <button
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'hero'
              ? 'bg-[#c5a059] text-[#121222] shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Hero Banner</span>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'offers'
              ? 'bg-[#c5a059] text-[#121222] shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Offers & Banners</span>
        </button>

        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'home'
              ? 'bg-[#c5a059] text-[#121222] shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          <HomeIcon className="w-3.5 h-3.5" />
          <span>Home Sections</span>
        </button>

        <button
          onClick={() => setActiveTab('productsPage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'productsPage'
              ? 'bg-[#c5a059] text-[#121222] shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Catalog Page</span>
        </button>

        <button
          onClick={() => setActiveTab('checkoutPage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'checkoutPage'
              ? 'bg-[#c5a059] text-[#121222] shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Checkout Page</span>
        </button>

        <button
          onClick={() => setActiveTab('accountPage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'accountPage'
              ? 'bg-[#c5a059] text-[#121222] shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Account Page</span>
        </button>

        <button
          onClick={() => setActiveTab('newsSection')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'newsSection'
              ? 'bg-[#c5a059] text-[#121222] shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>News & Dispatches</span>
        </button>

        <button
          onClick={() => setActiveTab('footer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'footer'
              ? 'bg-[#c5a059] text-[#121222] shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Footer & Contact</span>
        </button>
      </div>

      {/* Form Content Area */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121222] border border-white/10 space-y-6">
        
        {/* TAB 1: NAVBAR */}
        {activeTab === 'navbar' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#c5a059] border-b border-white/10 pb-2">
              Navbar & Header Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={cmsForm.navbar.brandName}
                  onChange={(e) => updateSectionField('navbar', 'brandName', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#f1d592] mb-1">Announcement Ticker (Top Bar)</label>
                <input
                  type="text"
                  value={cmsForm.navbar.announcementTicker}
                  onChange={(e) => updateSectionField('navbar', 'announcementTicker', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Hotline</label>
                <input
                  type="text"
                  value={cmsForm.navbar.phoneSupport}
                  onChange={(e) => updateSectionField('navbar', 'phoneSupport', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Search Bar Placeholder</label>
                <input
                  type="text"
                  value={cmsForm.navbar.searchPlaceholder}
                  onChange={(e) => updateSectionField('navbar', 'searchPlaceholder', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HERO BANNER */}
        {activeTab === 'hero' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#c5a059] border-b border-white/10 pb-2">
              Hero Section Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={cmsForm.hero.badgeText}
                  onChange={(e) => updateSectionField('hero', 'badgeText', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Main Heading Title</label>
                <input
                  type="text"
                  value={cmsForm.hero.title}
                  onChange={(e) => updateSectionField('hero', 'title', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">Hero Subtitle Paragraph</label>
                <textarea
                  rows={2}
                  value={cmsForm.hero.subtitle}
                  onChange={(e) => updateSectionField('hero', 'subtitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Primary CTA Button</label>
                <input
                  type="text"
                  value={cmsForm.hero.primaryBtnText}
                  onChange={(e) => updateSectionField('hero', 'primaryBtnText', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Secondary CTA Button</label>
                <input
                  type="text"
                  value={cmsForm.hero.secondaryBtnText}
                  onChange={(e) => updateSectionField('hero', 'secondaryBtnText', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            {/* Hero Stats */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#f1d592] mb-3">Hero Statistics Bar</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Stat 1 Value</label>
                  <input
                    type="text"
                    value={cmsForm.hero.stat1Value}
                    onChange={(e) => updateSectionField('hero', 'stat1Value', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
                  />
                  <label className="block text-[10px] text-slate-400 mt-1 mb-0.5">Stat 1 Label</label>
                  <input
                    type="text"
                    value={cmsForm.hero.stat1Label}
                    onChange={(e) => updateSectionField('hero', 'stat1Label', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Stat 2 Value</label>
                  <input
                    type="text"
                    value={cmsForm.hero.stat2Value}
                    onChange={(e) => updateSectionField('hero', 'stat2Value', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
                  />
                  <label className="block text-[10px] text-slate-400 mt-1 mb-0.5">Stat 2 Label</label>
                  <input
                    type="text"
                    value={cmsForm.hero.stat2Label}
                    onChange={(e) => updateSectionField('hero', 'stat2Label', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Stat 3 Value</label>
                  <input
                    type="text"
                    value={cmsForm.hero.stat3Value}
                    onChange={(e) => updateSectionField('hero', 'stat3Value', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
                  />
                  <label className="block text-[10px] text-slate-400 mt-1 mb-0.5">Stat 3 Label</label>
                  <input
                    type="text"
                    value={cmsForm.hero.stat3Label}
                    onChange={(e) => updateSectionField('hero', 'stat3Label', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Stat 4 Value</label>
                  <input
                    type="text"
                    value={cmsForm.hero.stat4Value}
                    onChange={(e) => updateSectionField('hero', 'stat4Value', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
                  />
                  <label className="block text-[10px] text-slate-400 mt-1 mb-0.5">Stat 4 Label</label>
                  <input
                    type="text"
                    value={cmsForm.hero.stat4Label}
                    onChange={(e) => updateSectionField('hero', 'stat4Label', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OFFERS CAROUSEL */}
        {activeTab === 'offers' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#c5a059] border-b border-white/10 pb-2">
              Offers Carousel Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Carousel Section Title</label>
                <input
                  type="text"
                  value={cmsForm.offers.sectionTitle}
                  onChange={(e) => updateSectionField('offers', 'sectionTitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Carousel Section Subtitle</label>
                <input
                  type="text"
                  value={cmsForm.offers.sectionSubtitle}
                  onChange={(e) => updateSectionField('offers', 'sectionSubtitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#f1d592]">Promotional Banners</h4>
              
              {cmsForm.offers.slides.map((slide, idx) => (
                <div key={slide.id || idx} className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#c5a059]">
                    Banner Slide {idx + 1}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400">Title</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => {
                          const updatedSlides = [...cmsForm.offers.slides];
                          updatedSlides[idx] = { ...updatedSlides[idx], title: e.target.value };
                          updateSectionField('offers', 'slides', updatedSlides);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400">Subtitle</label>
                      <input
                        type="text"
                        value={slide.subtitle}
                        onChange={(e) => {
                          const updatedSlides = [...cmsForm.offers.slides];
                          updatedSlides[idx] = { ...updatedSlides[idx], subtitle: e.target.value };
                          updateSectionField('offers', 'slides', updatedSlides);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400">Badge</label>
                      <input
                        type="text"
                        value={slide.badgeText}
                        onChange={(e) => {
                          const updatedSlides = [...cmsForm.offers.slides];
                          updatedSlides[idx] = { ...updatedSlides[idx], badgeText: e.target.value };
                          updateSectionField('offers', 'slides', updatedSlides);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: HOME SECTIONS */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#c5a059] border-b border-white/10 pb-2">
              Home Page Section Titles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Featured Products Title</label>
                <input
                  type="text"
                  value={cmsForm.home.featuredTitle}
                  onChange={(e) => updateSectionField('home', 'featuredTitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Regions Section Title</label>
                <input
                  type="text"
                  value={cmsForm.home.regionsTitle}
                  onChange={(e) => updateSectionField('home', 'regionsTitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Artisans Section Title</label>
                <input
                  type="text"
                  value={cmsForm.home.artisansTitle}
                  onChange={(e) => updateSectionField('home', 'artisansTitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reviews Title</label>
                <input
                  type="text"
                  value={cmsForm.home.reviewsTitle}
                  onChange={(e) => updateSectionField('home', 'reviewsTitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Newsletter Box Title</label>
                <input
                  type="text"
                  value={cmsForm.home.newsletterTitle}
                  onChange={(e) => updateSectionField('home', 'newsletterTitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Newsletter Subtitle</label>
                <input
                  type="text"
                  value={cmsForm.home.newsletterSubtitle}
                  onChange={(e) => updateSectionField('home', 'newsletterSubtitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PRODUCTS PAGE */}
        {activeTab === 'productsPage' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#c5a059] border-b border-white/10 pb-2">
              Catalog & Products Page Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Page Title</label>
                <input
                  type="text"
                  value={cmsForm.productsPage.title}
                  onChange={(e) => updateSectionField('productsPage', 'title', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Page Subtitle</label>
                <input
                  type="text"
                  value={cmsForm.productsPage.subtitle}
                  onChange={(e) => updateSectionField('productsPage', 'subtitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Search Box Placeholder</label>
                <input
                  type="text"
                  value={cmsForm.productsPage.searchPlaceholder}
                  onChange={(e) => updateSectionField('productsPage', 'searchPlaceholder', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Empty Results Text</label>
                <input
                  type="text"
                  value={cmsForm.productsPage.noProductsText}
                  onChange={(e) => updateSectionField('productsPage', 'noProductsText', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CHECKOUT PAGE */}
        {activeTab === 'checkoutPage' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#c5a059] border-b border-white/10 pb-2">
              Checkout & Payment Page Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Checkout Page Title</label>
                <input
                  type="text"
                  value={cmsForm.checkoutPage.title}
                  onChange={(e) => updateSectionField('checkoutPage', 'title', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Checkout Subtitle</label>
                <input
                  type="text"
                  value={cmsForm.checkoutPage.subtitle}
                  onChange={(e) => updateSectionField('checkoutPage', 'subtitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Order Submit Button Label</label>
                <input
                  type="text"
                  value={cmsForm.checkoutPage.orderButtonText}
                  onChange={(e) => updateSectionField('checkoutPage', 'orderButtonText', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Guarantee Badge Text</label>
                <input
                  type="text"
                  value={cmsForm.checkoutPage.guaranteeBadgeText}
                  onChange={(e) => updateSectionField('checkoutPage', 'guaranteeBadgeText', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: ACCOUNT PAGE */}
        {activeTab === 'accountPage' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#c5a059] border-b border-white/10 pb-2">
              User Account Page Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Account Page Title</label>
                <input
                  type="text"
                  value={cmsForm.accountPage.title}
                  onChange={(e) => updateSectionField('accountPage', 'title', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Account Subtitle</label>
                <input
                  type="text"
                  value={cmsForm.accountPage.subtitle}
                  onChange={(e) => updateSectionField('accountPage', 'subtitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: NEWS SECTION */}
        {activeTab === 'newsSection' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#c5a059] border-b border-white/10 pb-2">
              News & Dispatches Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">News Section Title</label>
                <input
                  type="text"
                  value={cmsForm.newsSection.title}
                  onChange={(e) => updateSectionField('newsSection', 'title', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Section Subtitle</label>
                <input
                  type="text"
                  value={cmsForm.newsSection.subtitle}
                  onChange={(e) => updateSectionField('newsSection', 'subtitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: FOOTER */}
        {activeTab === 'footer' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#c5a059] border-b border-white/10 pb-2">
              Footer & Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">About Us Section Title</label>
                <input
                  type="text"
                  value={cmsForm.footer.aboutTitle}
                  onChange={(e) => updateSectionField('footer', 'aboutTitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Contact</label>
                <input
                  type="text"
                  value={cmsForm.footer.phone}
                  onChange={(e) => updateSectionField('footer', 'phone', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">About Us Narrative Paragraph</label>
                <textarea
                  rows={3}
                  value={cmsForm.footer.aboutText}
                  onChange={(e) => updateSectionField('footer', 'aboutText', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Contact</label>
                <input
                  type="text"
                  value={cmsForm.footer.email}
                  onChange={(e) => updateSectionField('footer', 'email', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Copyright Line</label>
                <input
                  type="text"
                  value={cmsForm.footer.copyrightText}
                  onChange={(e) => updateSectionField('footer', 'copyrightText', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Floating Save Button */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Changes will take effect globally across all user sessions instantly.
        </p>
        <button
          onClick={handleSaveCMS}
          disabled={isCmsSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#c5a059] hover:bg-[#d4b36e] text-[#121222] font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          {isCmsSaving ? 'Saving...' : 'Publish Content'}
        </button>
      </div>

    </div>
  );
};
