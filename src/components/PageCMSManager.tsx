import React, { useState } from 'react';
import { SiteContent, SectionVisibilityConfig, CMSCustomBlock, CMSOfferSlide, CMSNewsArticle } from '../types';
import { useShop } from '../context/ShopContext';
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
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Sliders,
  HelpCircle,
  ExternalLink,
  Search,
  Phone,
  Mail,
  Instagram,
  Facebook
} from 'lucide-react';
import { CustomBlockModal } from './CustomBlockModal';
import { dbLogger } from '../utils/dbLogger';

export interface PageCMSManagerProps {
  initialTab?: 'visibility' | 'customBlocks' | 'navbar' | 'hero' | 'offers' | 'home' | 'productsPage' | 'productDetailPage' | 'checkoutPage' | 'accountPage' | 'newsSection' | 'footer' | 'seo';
}

export const PageCMSManager: React.FC<PageCMSManagerProps> = ({ initialTab = 'visibility' }) => {
  const { showToast, siteContent, updateSiteContent, language } = useShop();

  // Local state for the form so we can edit before saving
  const [cmsForm, setCmsForm] = useState<SiteContent>(siteContent);
  const [isCmsSaving, setIsCmsSaving] = useState(false);

  // Sync form when siteContent changes from DB
  React.useEffect(() => {
    setCmsForm(siteContent);
  }, [siteContent]);

  const [activeTab, setActiveTab] = useState<
    'visibility' | 'customBlocks' | 'navbar' | 'hero' | 'offers' | 'home' | 'productsPage' | 'productDetailPage' | 'checkoutPage' | 'accountPage' | 'newsSection' | 'footer' | 'seo'
  >(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCmsSaving(true);
    
    dbLogger.logFormInput({
      sourceComponent: 'PageCMSManager',
      actionName: 'handleSaveCMS',
      targetPath: 'cms/main',
      summary: `User clicked "Save & Publish Live" in PageCMSManager (Tab: ${activeTab})`,
      payload: cmsForm
    });

    try {
      await updateSiteContent(cmsForm);
      showToast('CMS changes published successfully to live website', 'success');
    } catch (err: any) {
      showToast(`Failed to save CMS changes: ${err?.message || 'Database error'}`, 'warning');
    } finally {
      setIsCmsSaving(false);
    }
  };

  const [editingBlock, setEditingBlock] = useState<CMSCustomBlock | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Helper to safely toggle visibility flags
  const toggleVisibility = (key: keyof SectionVisibilityConfig) => {
    setCmsForm(prev => {
      const current = prev.visibility?.[key] ?? true;
      return {
        ...prev,
        visibility: {
          ...(prev.visibility || {} as SectionVisibilityConfig),
          [key]: !current
        }
      };
    });
  };

  const updateSectionField = (section: keyof SiteContent, field: string, value: any) => {
    setCmsForm(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
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
        ...(prev[section] as any),
        [subSection]: {
          ...(prev[section] as any)[subSection],
          [field]: value
        }
      }
    }));
  };

  const visibility: SectionVisibilityConfig = cmsForm.visibility || {
    announcementTicker: true,
    phoneSupport: true,
    navbarSearch: true,
    currencySwitcher: true,
    languageSwitcher: true,
    homeHero: true,
    homeCategories: true,
    homeOffers: true,
    homeFeatured: true,
    homeTrustBadges: true,
    homeDeals: true,
    homeNewArrivals: true,
    homeHeritage: true,
    homeReviews: true,
    homeNewsletter: true,
    homeNews: true,
    productsHeader: true,
    productsSearchFilter: true,
    productsCategoryTabs: true,
    productsSort: true,
    productsGrid: true,
    detailBreadcrumbs: true,
    detailGallery: true,
    detailPriceBox: true,
    detailArtisanBio: true,
    detailCraftStory: true,
    detailWhatsAppInquiry: true,
    detailCustomerReviews: true,
    detailRelatedProducts: true,
    checkoutSteps: true,
    checkoutAddressForm: true,
    checkoutDeliverySpeed: true,
    checkoutPaymentMethod: true,
    checkoutOrderSummary: true,
    checkoutGuarantees: true,
    accountOrders: true,
    accountProfile: true,
    accountWishlist: true,
    accountSupportCard: true,
    footerAbout: true,
    footerQuickLinks: true,
    footerContact: true,
    footerSocial: true,
    footerCopyright: true,
  };

  // Custom Blocks Handler
  const handleDeleteCustomBlock = (id: string) => {
    setCmsForm(prev => ({
      ...prev,
      customBlocks: (prev.customBlocks || []).filter(b => b.id !== id)
    }));
    showToast('Custom div block removed', 'info');
  };

  const handleToggleBlockPublish = (id: string) => {
    setCmsForm(prev => ({
      ...prev,
      customBlocks: (prev.customBlocks || []).map(b => (
        b.id === id ? { ...b, isPublished: !b.isPublished } : b
      ))
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* CMS Header & Live Save Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#4f46e5] mb-1 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4" />
            <span>Store Content & Page Customization</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex flex-wrap items-center gap-2.5">
            <span>Manage Page Content & Section Layouts</span>
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Target: cms/main
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'تحكم كامل بنشر، إخفاء، وتعديل محتوى كل قسم وعنصر في الموقع مع حفظ فوري في قاعدة البيانات.'
              : 'Full control to edit headlines, banners, announcements, guarantees, and visibility for every page.'}
          </p>
        </div>

        <button
          onClick={handleSaveCMS}
          disabled={isCmsSaving}
          className="flex items-center gap-2 px-6 py-3.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {isCmsSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Publishing to Firestore...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Publish Live</span>
            </>
          )}
        </button>
      </div>

      {/* Page & Module Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        <button
          onClick={() => setActiveTab('visibility')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'visibility'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>👁️ Section Visibility</span>
        </button>

        <button
          onClick={() => setActiveTab('customBlocks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'customBlocks'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>🧱 Custom Divs & Banners ({cmsForm.customBlocks?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('navbar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'navbar'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Navbar & Ticker</span>
        </button>

        <button
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'hero'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Hero Banner & Stats</span>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'offers'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Offers Slider</span>
        </button>

        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'home'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <HomeIcon className="w-3.5 h-3.5" />
          <span>Home Sections</span>
        </button>

        <button
          onClick={() => setActiveTab('productsPage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'productsPage'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Catalog Page</span>
        </button>

        <button
          onClick={() => setActiveTab('productDetailPage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'productDetailPage'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Product Details</span>
        </button>

        <button
          onClick={() => setActiveTab('checkoutPage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'checkoutPage'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Checkout Page</span>
        </button>

        <button
          onClick={() => setActiveTab('accountPage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'accountPage'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Account Page</span>
        </button>

        <button
          onClick={() => setActiveTab('newsSection')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'newsSection'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>News & Stories</span>
        </button>

        <button
          onClick={() => setActiveTab('footer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'footer'
              ? 'bg-[#4f46e5] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Footer & Contact</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VISIBILITY MATRIX (1-CLICK PUBLISH / HIDE FOR ALL SECTIONS)        */}
      {/* ========================================================================= */}
      {activeTab === 'visibility' && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-950/30 border border-amber-500/20 rounded-2xl text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
            <Sliders className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300 mb-1">Global Section Visibility Matrix</p>
              <p>
                Click the <strong>Published / Hidden</strong> switches below to toggle any section on or off. Hidden sections are instantly removed from customer view while remaining accessible to the admin in Draft Preview mode.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Header & Global Group */}
            <div className="bg-[#121222] border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>Header & Global Elements</span>
              </h3>
              <div className="space-y-2.5">
                {[
                  { key: 'announcementTicker', label: 'Top Announcement Ticker' },
                  { key: 'navbarSearch', label: 'Header Search Bar' },
                  { key: 'phoneSupport', label: 'Header Phone & WhatsApp' },
                  { key: 'currencySwitcher', label: 'Currency Switcher (USD / LBP)' },
                  { key: 'languageSwitcher', label: 'Language Switcher (AR / EN)' }
                ].map((item) => {
                  const isVisible = visibility[item.key as keyof SectionVisibilityConfig] ?? true;
                  return (
                    <div key={item.key} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                      <span className="text-slate-300 font-medium">{item.label}</span>
                      <button
                        onClick={() => toggleVisibility(item.key as keyof SectionVisibilityConfig)}
                        className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          isVisible 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                        }`}
                      >
                        {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{isVisible ? 'Published' : 'Hidden'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Home Page Sections Group */}
            <div className="bg-[#121222] border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                <HomeIcon className="w-4 h-4 text-amber-400" />
                <span>Home Page Sections</span>
              </h3>
              <div className="space-y-2.5">
                {[
                  { key: 'homeHero', label: 'Hero Banner & Statistics' },
                  { key: 'homeCategories', label: 'Category Grid' },
                  { key: 'homeOffers', label: 'Offers & Special Promotions' },
                  { key: 'homeFeatured', label: 'Featured Treasures Carousel' },
                  { key: 'homeTrustBadges', label: 'Trust & Terroir Badges' },
                  { key: 'homeDeals', label: 'Limited Time Flash Deals' },
                  { key: 'homeNewArrivals', label: 'New Village Arrivals' },
                  { key: 'homeHeritage', label: 'Heritage Story & Bio' },
                  { key: 'homeReviews', label: 'Customer Reviews' },
                  { key: 'homeNewsletter', label: 'Newsletter Signup' },
                  { key: 'homeNews', label: 'Press & Articles' }
                ].map((item) => {
                  const isVisible = visibility[item.key as keyof SectionVisibilityConfig] ?? true;
                  return (
                    <div key={item.key} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                      <span className="text-slate-300 font-medium">{item.label}</span>
                      <button
                        onClick={() => toggleVisibility(item.key as keyof SectionVisibilityConfig)}
                        className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          isVisible 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                        }`}
                      >
                        {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{isVisible ? 'Published' : 'Hidden'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Catalog & Product Detail Group */}
            <div className="bg-[#121222] border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Catalog & Product Detail</span>
              </h3>
              <div className="space-y-2.5">
                {[
                  { key: 'productsHeader', label: 'Catalog Header Banner' },
                  { key: 'productsSearchFilter', label: 'Search & Keyword Filter' },
                  { key: 'productsCategoryTabs', label: 'Category Filter Tabs' },
                  { key: 'productsSort', label: 'Sorting Bar' },
                  { key: 'productsGrid', label: 'Products Grid Cards' },
                  { key: 'detailBreadcrumbs', label: 'Detail: Breadcrumbs' },
                  { key: 'detailGallery', label: 'Detail: Photo Gallery' },
                  { key: 'detailPriceBox', label: 'Detail: Price & Buy Box' },
                  { key: 'detailArtisanBio', label: 'Detail: Artisan Bio' },
                  { key: 'detailCraftStory', label: 'Detail: Craft Story' },
                  { key: 'detailWhatsAppInquiry', label: 'Detail: WhatsApp Concierge' },
                  { key: 'detailRelatedProducts', label: 'Detail: Related Items' }
                ].map((item) => {
                  const isVisible = visibility[item.key as keyof SectionVisibilityConfig] ?? true;
                  return (
                    <div key={item.key} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                      <span className="text-slate-300 font-medium">{item.label}</span>
                      <button
                        onClick={() => toggleVisibility(item.key as keyof SectionVisibilityConfig)}
                        className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          isVisible 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                        }`}
                      >
                        {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{isVisible ? 'Published' : 'Hidden'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checkout & Account Group */}
            <div className="bg-[#121222] border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Checkout & Account</span>
              </h3>
              <div className="space-y-2.5">
                {[
                  { key: 'checkoutSteps', label: 'Checkout Steps Indicator' },
                  { key: 'checkoutAddressForm', label: 'Checkout Address Form' },
                  { key: 'checkoutDeliverySpeed', label: 'Delivery Speed Options' },
                  { key: 'checkoutPaymentMethod', label: 'Payment Method Selector' },
                  { key: 'checkoutOrderSummary', label: 'Order Summary Box' },
                  { key: 'checkoutGuarantees', label: 'Security & Heritage Badges' },
                  { key: 'accountOrders', label: 'Account Orders & Tracking' },
                  { key: 'accountProfile', label: 'Account Profile Form' },
                  { key: 'accountWishlist', label: 'Account Wishlist' },
                  { key: 'accountSupportCard', label: 'Account Support Card' }
                ].map((item) => {
                  const isVisible = visibility[item.key as keyof SectionVisibilityConfig] ?? true;
                  return (
                    <div key={item.key} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                      <span className="text-slate-300 font-medium">{item.label}</span>
                      <button
                        onClick={() => toggleVisibility(item.key as keyof SectionVisibilityConfig)}
                        className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          isVisible 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                        }`}
                      >
                        {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{isVisible ? 'Published' : 'Hidden'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Group */}
            <div className="bg-[#121222] border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Footer & Channels</span>
              </h3>
              <div className="space-y-2.5">
                {[
                  { key: 'footerAbout', label: 'Footer About Story' },
                  { key: 'footerQuickLinks', label: 'Footer Quick Links' },
                  { key: 'footerContact', label: 'Footer Contact & Hours' },
                  { key: 'footerSocial', label: 'Footer Social Media Icons' },
                  { key: 'footerCopyright', label: 'Footer Copyright & Origin Badge' }
                ].map((item) => {
                  const isVisible = visibility[item.key as keyof SectionVisibilityConfig] ?? true;
                  return (
                    <div key={item.key} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                      <span className="text-slate-300 font-medium">{item.label}</span>
                      <button
                        onClick={() => toggleVisibility(item.key as keyof SectionVisibilityConfig)}
                        className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          isVisible 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                        }`}
                      >
                        {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{isVisible ? 'Published' : 'Hidden'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOM DIVS & BANNERS BUILDER                                      */}
      {/* ========================================================================= */}
      {activeTab === 'customBlocks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-[#121222] border border-white/10 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Custom Content Blocks & Divs</h3>
              <p className="text-xs text-slate-400">
                Inject custom banners, special callouts, or rich HTML sections anywhere on any page.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingBlock(null);
                setIsBlockModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b89753] hover:bg-[#c5a059] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Div</span>
            </button>
          </div>

          {(!cmsForm.customBlocks || cmsForm.customBlocks.length === 0) ? (
            <div className="p-12 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl space-y-3">
              <Layers className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300 font-bold">No Custom Divs Created Yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create announcements, diaspora shipping notices, or special artisan spotlights.
              </p>
              <button
                onClick={() => {
                  setEditingBlock(null);
                  setIsBlockModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                + Add Your First Custom Div
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cmsForm.customBlocks.map((block) => (
                <div 
                  key={block.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                    block.isPublished 
                      ? 'bg-[#121222] border-white/10 hover:border-[#b89753]/40' 
                      : 'bg-rose-950/20 border-rose-900/40 opacity-75'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Page: {block.targetPage} ({block.position})
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        block.isPublished 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {block.isPublished ? 'Published' : 'Hidden'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white">{block.title}</h4>
                    {block.subtitle && <p className="text-xs text-slate-300 font-medium">{block.subtitle}</p>}
                    {block.content && (
                      <p className="text-xs text-slate-400 line-clamp-2">{block.content.replace(/<[^>]*>?/gm, '')}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                    <button
                      onClick={() => handleToggleBlockPublish(block.id)}
                      className="text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      {block.isPublished ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{block.isPublished ? 'Hide Div' : 'Publish Div'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingBlock(block);
                          setIsBlockModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteCustomBlock(block.id)}
                        className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                        title="Delete Div"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NAVBAR & ANNOUNCEMENT TICKER                                      */}
      {/* ========================================================================= */}
      {activeTab === 'navbar' && (
        <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span>Navigation Bar & Top Ticker Elements</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Top Announcement Ticker Text
              </label>
              <textarea
                rows={2}
                value={cmsForm.navbar?.announcementTicker || ''}
                onChange={(e) => updateSectionField('navbar', 'announcementTicker', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Brand Logo Text
              </label>
              <input
                type="text"
                value={cmsForm.navbar?.brandName || ''}
                onChange={(e) => updateSectionField('navbar', 'brandName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Brand Subtitle / Tagline
              </label>
              <input
                type="text"
                value={cmsForm.navbar?.brandSubtitle || ''}
                onChange={(e) => updateSectionField('navbar', 'brandSubtitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Support Phone / WhatsApp
              </label>
              <input
                type="text"
                value={cmsForm.navbar?.phoneSupport || ''}
                onChange={(e) => updateSectionField('navbar', 'phoneSupport', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Header Search Placeholder
              </label>
              <input
                type="text"
                value={cmsForm.navbar?.searchPlaceholder || ''}
                onChange={(e) => updateSectionField('navbar', 'searchPlaceholder', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: HERO BANNER & STATS                                               */}
      {/* ========================================================================= */}
      {activeTab === 'hero' && (
        <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layout className="w-4 h-4 text-amber-400" />
            <span>Home Page Hero Banner & Statistics Bar</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Top Badge Text
              </label>
              <input
                type="text"
                value={cmsForm.hero?.badgeText || ''}
                onChange={(e) => updateSectionField('hero', 'badgeText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Main Hero Headline
              </label>
              <input
                type="text"
                value={cmsForm.hero?.title || ''}
                onChange={(e) => updateSectionField('hero', 'title', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Hero Narrative Subtitle
              </label>
              <textarea
                rows={3}
                value={cmsForm.hero?.subtitle || ''}
                onChange={(e) => updateSectionField('hero', 'subtitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Primary Button Text
              </label>
              <input
                type="text"
                value={cmsForm.hero?.primaryBtnText || ''}
                onChange={(e) => updateSectionField('hero', 'primaryBtnText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Primary Button Link (URL)
              </label>
              <input
                type="text"
                value={cmsForm.hero?.targetUrl || ''}
                placeholder="/products, /product/123, or https://..."
                onChange={(e) => updateSectionField('hero', 'targetUrl', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Secondary Button Text
              </label>
              <input
                type="text"
                value={cmsForm.hero?.secondaryBtnText || ''}
                onChange={(e) => updateSectionField('hero', 'secondaryBtnText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Hero Background Image URL
              </label>
              <input
                type="url"
                value={cmsForm.hero?.bgImageUrl || ''}
                onChange={(e) => updateSectionField('hero', 'bgImageUrl', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Hero Statistics Edit Grid */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Hero Statistics Bar (4 Key Metrics)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(cmsForm.hero?.stats || []).map((stat, idx) => (
                <div key={`stat-${idx}`} className="p-3 bg-slate-900 rounded-xl border border-white/10 space-y-2">
                  <input
                    type="text"
                    value={stat.value}
                    onChange={(e) => {
                      const newStats = [...cmsForm.hero.stats];
                      newStats[idx].value = e.target.value;
                      updateSectionField('hero', 'stats', newStats);
                    }}
                    placeholder="Value (e.g. 120+)"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs font-bold text-amber-300"
                  />
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => {
                      const newStats = [...cmsForm.hero.stats];
                      newStats[idx].label = e.target.value;
                      updateSectionField('hero', 'stats', newStats);
                    }}
                    placeholder="Label (e.g. Master Artisans)"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-[11px] text-slate-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: OFFERS SLIDER                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'offers' && (
        <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Promotional Offers & Cultural Banners</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Section Heading
              </label>
              <input
                type="text"
                value={cmsForm.offers?.sectionTitle || ''}
                onChange={(e) => updateSectionField('offers', 'sectionTitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Section Subtitle
              </label>
              <input
                type="text"
                value={cmsForm.offers?.sectionSubtitle || ''}
                onChange={(e) => updateSectionField('offers', 'sectionSubtitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Individual Offer Slides
            </h4>
            {(cmsForm.offers?.slides || []).map((slide, idx) => (
              <div key={slide.id || idx} className="p-4 bg-slate-900 rounded-2xl border border-white/10 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => {
                        const newSlides = [...cmsForm.offers.slides];
                        newSlides[idx].title = e.target.value;
                        updateSectionField('offers', 'slides', newSlides);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={slide.badge}
                      onChange={(e) => {
                        const newSlides = [...cmsForm.offers.slides];
                        newSlides[idx].badge = e.target.value;
                        updateSectionField('offers', 'slides', newSlides);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-amber-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Subtitle Narrative
                  </label>
                  <input
                    type="text"
                    value={slide.subtitle}
                    onChange={(e) => {
                      const newSlides = [...cmsForm.offers.slides];
                      newSlides[idx].subtitle = e.target.value;
                      updateSectionField('offers', 'slides', newSlides);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Button CTA Label
                    </label>
                    <input
                      type="text"
                      value={slide.buttonText}
                      onChange={(e) => {
                        const newSlides = [...cmsForm.offers.slides];
                        newSlides[idx].buttonText = e.target.value;
                        updateSectionField('offers', 'slides', newSlides);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Button Link (URL)
                    </label>
                    <input
                      type="text"
                      value={slide.targetUrl || ''}
                      placeholder="/products, /product/123, or https://..."
                      onChange={(e) => {
                        const newSlides = [...cmsForm.offers.slides];
                        newSlides[idx].targetUrl = e.target.value;
                        updateSectionField('offers', 'slides', newSlides);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Discount Pill
                    </label>
                    <input
                      type="text"
                      value={slide.discountBadge || ''}
                      onChange={(e) => {
                        const newSlides = [...cmsForm.offers.slides];
                        newSlides[idx].discountBadge = e.target.value;
                        updateSectionField('offers', 'slides', newSlides);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: HOME SECTIONS                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'home' && (
        <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HomeIcon className="w-4 h-4 text-amber-400" />
            <span>Home Page Content & Narrative Blocks</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Featured Items Title
              </label>
              <input
                type="text"
                value={cmsForm.home?.featuredTitle || ''}
                onChange={(e) => updateSectionField('home', 'featuredTitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Featured Items Subtitle
              </label>
              <input
                type="text"
                value={cmsForm.home?.featuredSubtitle || ''}
                onChange={(e) => updateSectionField('home', 'featuredSubtitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Heritage Story Title
              </label>
              <input
                type="text"
                value={cmsForm.home?.heritageTitle || ''}
                onChange={(e) => updateSectionField('home', 'heritageTitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Reviews Section Title
              </label>
              <input
                type="text"
                value={cmsForm.home?.reviewsTitle || ''}
                onChange={(e) => updateSectionField('home', 'reviewsTitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Heritage Story Full Narrative
              </label>
              <textarea
                rows={3}
                value={cmsForm.home?.heritageText || ''}
                onChange={(e) => updateSectionField('home', 'heritageText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Newsletter Title
              </label>
              <input
                type="text"
                value={cmsForm.home?.newsletterTitle || ''}
                onChange={(e) => updateSectionField('home', 'newsletterTitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Newsletter Button Label
              </label>
              <input
                type="text"
                value={cmsForm.home?.newsletterButtonText || ''}
                onChange={(e) => updateSectionField('home', 'newsletterButtonText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PRODUCT DETAIL PAGE                                               */}
      {/* ========================================================================= */}
      {activeTab === 'productDetailPage' && (
        <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-400" />
            <span>Product Detail Page & Guarantee Badges</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                WhatsApp Inquiry Number (e.g. 96170889234)
              </label>
              <input
                type="text"
                value={cmsForm.productDetailPage?.inquiryWhatsAppNumber || '96170889234'}
                onChange={(e) => updateSectionField('productDetailPage', 'inquiryWhatsAppNumber', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                WhatsApp Button Text
              </label>
              <input
                type="text"
                value={cmsForm.productDetailPage?.inquiryText || 'Inquire on WhatsApp with Master Artisan'}
                onChange={(e) => updateSectionField('productDetailPage', 'inquiryText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Authenticity Guarantee Text
              </label>
              <input
                type="text"
                value={cmsForm.productDetailPage?.authenticityGuaranteeText || '100% Guaranteed Authentic Lebanese Terroir & Workshop Handcrafted'}
                onChange={(e) => updateSectionField('productDetailPage', 'authenticityGuaranteeText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Dispatch & Delivery Badge Text
              </label>
              <input
                type="text"
                value={cmsForm.productDetailPage?.freeDeliveryBadgeText || 'Fast Courier Dispatched from Lebanon'}
                onChange={(e) => updateSectionField('productDetailPage', 'freeDeliveryBadgeText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Returns Policy Guarantee
              </label>
              <input
                type="text"
                value={cmsForm.productDetailPage?.returnsPolicyText || 'Hassle-free 7-day inspection return guarantee for artisanal crafts.'}
                onChange={(e) => updateSectionField('productDetailPage', 'returnsPolicyText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Related Items Heading
              </label>
              <input
                type="text"
                value={cmsForm.productDetailPage?.relatedItemsTitle || 'More from this Heritage Collection'}
                onChange={(e) => updateSectionField('productDetailPage', 'relatedItemsTitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: CATALOG / PRODUCTS PAGE                                           */}
      {/* ========================================================================= */}
      {activeTab === 'productsPage' && (
        <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Artisan Catalog Page Content</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Catalog Page Title
              </label>
              <input
                type="text"
                value={cmsForm.productsPage?.title || ''}
                onChange={(e) => updateSectionField('productsPage', 'title', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Search Input Placeholder
              </label>
              <input
                type="text"
                value={cmsForm.productsPage?.searchPlaceholder || ''}
                onChange={(e) => updateSectionField('productsPage', 'searchPlaceholder', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Catalog Subtitle Narrative
              </label>
              <textarea
                rows={2}
                value={cmsForm.productsPage?.subtitle || ''}
                onChange={(e) => updateSectionField('productsPage', 'subtitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: CHECKOUT PAGE                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'checkoutPage' && (
        <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Checkout Page Headlines & Guarantee Badge</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Checkout Title
              </label>
              <input
                type="text"
                value={cmsForm.checkoutPage?.title || ''}
                onChange={(e) => updateSectionField('checkoutPage', 'title', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Order Button Text
              </label>
              <input
                type="text"
                value={cmsForm.checkoutPage?.orderButtonText || ''}
                onChange={(e) => updateSectionField('checkoutPage', 'orderButtonText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Authenticity & Dispatch Guarantee Badge Text
              </label>
              <input
                type="text"
                value={cmsForm.checkoutPage?.guaranteeBadgeText || ''}
                onChange={(e) => updateSectionField('checkoutPage', 'guaranteeBadgeText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 space-y-4">
            <h4 className="text-sm font-bold text-amber-400">Checkout Success Screen Content</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Success Badge Text (English)
                </label>
                <input
                  type="text"
                  value={cmsForm.checkoutSuccessPage?.successBadge || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'successBadge', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Success Badge Text (Arabic)
                </label>
                <input
                  type="text"
                  value={cmsForm.checkoutSuccessPage?.successBadgeArabic || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'successBadgeArabic', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Success Title (English)
                </label>
                <input
                  type="text"
                  value={cmsForm.checkoutSuccessPage?.successTitle || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'successTitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Success Title (Arabic)
                </label>
                <input
                  type="text"
                  value={cmsForm.checkoutSuccessPage?.successTitleArabic || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'successTitleArabic', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Next Steps Heading (English)
                </label>
                <input
                  type="text"
                  value={cmsForm.checkoutSuccessPage?.nextStepsHeading || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'nextStepsHeading', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Next Steps Heading (Arabic)
                </label>
                <input
                  type="text"
                  value={cmsForm.checkoutSuccessPage?.nextStepsHeadingArabic || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'nextStepsHeadingArabic', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Step 1 Instructions (English)
                </label>
                <textarea
                  rows={2}
                  value={cmsForm.checkoutSuccessPage?.step1Text || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'step1Text', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Step 1 Instructions (Arabic)
                </label>
                <textarea
                  rows={2}
                  value={cmsForm.checkoutSuccessPage?.step1TextArabic || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'step1TextArabic', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none text-right"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Step 2 Instructions (English)
                </label>
                <textarea
                  rows={2}
                  value={cmsForm.checkoutSuccessPage?.step2Text || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'step2Text', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Step 2 Instructions (Arabic)
                </label>
                <textarea
                  rows={2}
                  value={cmsForm.checkoutSuccessPage?.step2TextArabic || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'step2TextArabic', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none text-right"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Step 3 Settlement Info (English - use {"{price}"} to insert total price dynamically)
                </label>
                <textarea
                  rows={2}
                  value={cmsForm.checkoutSuccessPage?.step3Text || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'step3Text', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Step 3 Settlement Info (Arabic - use {"{price}"} to insert total price dynamically)
                </label>
                <textarea
                  rows={2}
                  value={cmsForm.checkoutSuccessPage?.step3TextArabic || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'step3TextArabic', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none text-right"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Track Button Text (English)
                </label>
                <input
                  type="text"
                  value={cmsForm.checkoutSuccessPage?.buttonTrackText || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'buttonTrackText', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Track Button Text (Arabic)
                </label>
                <input
                  type="text"
                  value={cmsForm.checkoutSuccessPage?.buttonTrackTextArabic || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'buttonTrackTextArabic', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Continue Button Text (English)
                </label>
                <input
                  type="text"
                  value={cmsForm.checkoutSuccessPage?.buttonContinueText || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'buttonContinueText', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Continue Button Text (Arabic)
                </label>
                <input
                  type="text"
                  value={cmsForm.checkoutSuccessPage?.buttonContinueTextArabic || ''}
                  onChange={(e) => updateSectionField('checkoutSuccessPage', 'buttonContinueTextArabic', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: ACCOUNT PAGE                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'accountPage' && (
        <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-amber-400" />
            <span>Account Page Content</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Page Title
              </label>
              <input
                type="text"
                value={cmsForm.accountPage?.title || ''}
                onChange={(e) => updateSectionField('accountPage', 'title', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Orders Tab Label
              </label>
              <input
                type="text"
                value={cmsForm.accountPage?.ordersTabLabel || ''}
                onChange={(e) => updateSectionField('accountPage', 'ordersTabLabel', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 11: NEWS & DISPATCHES                                                */}
      {/* ========================================================================= */}
      {activeTab === 'newsSection' && (
        <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-amber-400" />
            <span>Press, Media & Artisan Revival News</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Section Heading
              </label>
              <input
                type="text"
                value={cmsForm.newsSection?.title || ''}
                onChange={(e) => updateSectionField('newsSection', 'title', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Section Subtitle
              </label>
              <input
                type="text"
                value={cmsForm.newsSection?.subtitle || ''}
                onChange={(e) => updateSectionField('newsSection', 'subtitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            {(cmsForm.newsSection?.articles || []).map((art, idx) => (
              <div key={art.id || idx} className="p-4 bg-slate-900 rounded-2xl border border-white/10 space-y-3">
                <input
                  type="text"
                  value={art.title}
                  onChange={(e) => {
                    const newArticles = [...cmsForm.newsSection.articles];
                    newArticles[idx].title = e.target.value;
                    updateSectionField('newsSection', 'articles', newArticles);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs font-bold text-white"
                />
                <textarea
                  rows={2}
                  value={art.excerpt}
                  onChange={(e) => {
                    const newArticles = [...cmsForm.newsSection.articles];
                    newArticles[idx].excerpt = e.target.value;
                    updateSectionField('newsSection', 'articles', newArticles);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-slate-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 12: FOOTER & SOCIAL LINKS                                            */}
      {/* ========================================================================= */}
      {activeTab === 'footer' && (
        <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>Footer Narrative, Contacts & Social Channels</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                About Us Title
              </label>
              <input
                type="text"
                value={cmsForm.footer?.aboutTitle || ''}
                onChange={(e) => updateSectionField('footer', 'aboutTitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                About Us Narrative
              </label>
              <textarea
                rows={3}
                value={cmsForm.footer?.aboutText || ''}
                onChange={(e) => updateSectionField('footer', 'aboutText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                value={cmsForm.footer?.email || ''}
                onChange={(e) => updateSectionField('footer', 'email', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Support Phone
              </label>
              <input
                type="text"
                value={cmsForm.footer?.phone || ''}
                onChange={(e) => updateSectionField('footer', 'phone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Copyright Text
              </label>
              <input
                type="text"
                value={cmsForm.footer?.copyrightText || ''}
                onChange={(e) => updateSectionField('footer', 'copyrightText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-[#4f46e5]" />
            <span>Global SEO Settings</span>
          </h3>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Site Title (Title Tag)
              </label>
              <input
                type="text"
                value={cmsForm.seo?.title || ''}
                onChange={(e) => updateSectionField('seo', 'title', e.target.value)}
                placeholder="e.g. Yalla.lb - Premium Lebanese Craftsmanship"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-[#4f46e5] focus:outline-none"
              />
              <p className="mt-1.5 text-[10px] text-slate-500">
                This appears in the browser tab and search engine results. Keep it concise (50-60 characters).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Site Description (Meta Description)
              </label>
              <textarea
                rows={4}
                value={cmsForm.seo?.description || ''}
                onChange={(e) => updateSectionField('seo', 'description', e.target.value)}
                placeholder="A short description of your store..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-[#4f46e5] focus:outline-none leading-relaxed"
              />
              <p className="mt-1.5 text-[10px] text-slate-500">
                This appears below the title in search results. Optimal length is between 150-160 characters.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Block Modal */}
      <CustomBlockModal
        isOpen={isBlockModalOpen}
        onClose={() => {
          setIsBlockModalOpen(false);
          setEditingBlock(null);
        }}
        blockToEdit={editingBlock}
      />
    </div>
  );
};
