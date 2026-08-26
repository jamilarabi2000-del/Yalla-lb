import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { SectionVisibilityConfig } from '../types';
import { 
  HomeIcon, 
  Layout, 
  ShoppingBag, 
  Search, 
  CreditCard, 
  User, 
  Newspaper, 
  Navigation, 
  Type, 
  Blocks, 
  Settings,
  Save,
  RotateCcw,
  Sparkles,
  Palette
} from 'lucide-react';

import { CMSVisibilityTab } from './admin/cms/CMSVisibilityTab';
import { CMSNavbarTab } from './admin/cms/CMSNavbarTab';
import { CMSFooterTab } from './admin/cms/CMSFooterTab';
import { CMSHomeTab } from './admin/cms/CMSHomeTab';
import { CMSProductsTab } from './admin/cms/CMSProductsTab';
import { CMSProductDetailTab } from './admin/cms/CMSProductDetailTab';
import { CMSCheckoutTab } from './admin/cms/CMSCheckoutTab';
import { CMSAccountTab } from './admin/cms/CMSAccountTab';
import { CMSNewsTab } from './admin/cms/CMSNewsTab';
import { CMSCustomBlocksTab } from './admin/cms/CMSCustomBlocksTab';
import { CMSSeoTab } from './admin/cms/CMSSeoTab';
import { CMSThemeTab } from './admin/cms/CMSThemeTab';

interface PageCMSManagerProps {
  initialTab?: string;
}

export const PageCMSManager: React.FC<PageCMSManagerProps> = ({ initialTab = 'home' }) => {
  const { siteContent, updateSiteContent, showToast } = useShop();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [cmsForm, setCmsForm] = useState(siteContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    setCmsForm(siteContent);
    setIsDirty(false);
  }, [siteContent]);

  const handleUpdate = (updater: (prev: typeof cmsForm) => typeof cmsForm) => {
    setCmsForm(prev => {
      const next = updater(prev);
      setIsDirty(true);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSiteContent(cmsForm);
      setIsDirty(false);
      showToast('CMS changes successfully published to the live storefront.', 'success');
    } catch (err: any) {
      console.error('[PageCMSManager] Failed to save site content:', err);
      showToast(`Could not save CMS content: ${err?.message || 'the write was rejected.'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Revert all unsaved CMS edits back to currently published live store content?')) {
      setCmsForm(siteContent);
      setIsDirty(false);
      showToast('Reverted unsaved edits.', 'info');
    }
  };

  const tabs = [
    { id: 'visibility', label: 'Section Visibility', icon: Settings },
    { id: 'navbar', label: 'Navbar & Ticker', icon: Navigation },
    { id: 'home', label: 'Home Page', icon: HomeIcon },
    { id: 'productsPage', label: 'Catalog Page', icon: ShoppingBag },
    { id: 'productDetailPage', label: 'Product Detail', icon: Search },
    { id: 'checkoutPage', label: 'Checkout & Success', icon: CreditCard },
    { id: 'accountPage', label: 'Account Page', icon: User },
    { id: 'newsSection', label: 'News & Stories', icon: Newspaper },
    { id: 'footer', label: 'Footer & Support', icon: Layout },
    { id: 'customBlocks', label: 'Custom Divs / Blocks', icon: Blocks },
    { id: 'seo', label: 'SEO & SERP', icon: Type },
    { id: 'theme', label: 'Theme & Design', icon: Palette }
  ];

  return (
    <div className="bg-[#1a1a2e] p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-6">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Storefront CMS Studio
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full visual management, bilingual EN/AR copywriting, section toggles, and marketing controls.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center">
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Discard unsaved changes"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>
          )}

          <button 
            type="button"
            onClick={handleSave} 
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
              isDirty 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/50' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            } disabled:opacity-50`}
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Publishing Changes...' : isDirty ? 'Publish Unsaved Changes' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* CMS Navigation Tabs Bar */}
      <div className="flex flex-wrap gap-2 pb-2">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400' 
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-white/5'
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {/* 1. Section Visibility */}
        {activeTab === 'visibility' && (
          <CMSVisibilityTab
            visibility={cmsForm.visibility}
            onChange={(key: keyof SectionVisibilityConfig, value: boolean) => {
              handleUpdate(prev => ({
                ...prev,
                visibility: {
                  ...prev.visibility,
                  [key]: value
                }
              }));
            }}
            onSetAll={(value: boolean) => {
              handleUpdate(prev => {
                const nextVis = { ...prev.visibility };
                (Object.keys(nextVis) as Array<keyof SectionVisibilityConfig>).forEach(k => {
                  nextVis[k] = value;
                });
                return {
                  ...prev,
                  visibility: nextVis
                };
              });
            }}
          />
        )}

        {/* 2. Navbar & Brand */}
        {activeTab === 'navbar' && (
          <CMSNavbarTab
            navbarData={cmsForm.navbar as any}
            onChangeField={(field, value) => {
              handleUpdate(prev => ({
                ...prev,
                navbar: {
                  ...(prev.navbar as any),
                  [field]: value
                }
              }));
            }}
          />
        )}

        {/* 3. Home Page Sections */}
        {activeTab === 'home' && (
          <CMSHomeTab
            homeData={cmsForm.home as any}
            heroData={cmsForm.hero as any}
            offersData={cmsForm.offers as any}
            onChangeHomeField={(field, value) => {
              handleUpdate(prev => ({
                ...prev,
                home: {
                  ...(prev.home as any),
                  [field]: value
                }
              }));
            }}
            onChangeHeroField={(field, value) => {
              handleUpdate(prev => ({
                ...prev,
                hero: {
                  ...(prev.hero as any),
                  [field]: value
                }
              }));
            }}
            onChangeOffersField={(field, value) => {
              handleUpdate(prev => ({
                ...prev,
                offers: {
                  ...(prev.offers as any),
                  [field]: value
                }
              }));
            }}
          />
        )}

        {/* 4. Products Catalog Page */}
        {activeTab === 'productsPage' && (
          <CMSProductsTab
            productsData={cmsForm.productsPage as any}
            onChangeField={(field, value) => {
              handleUpdate(prev => ({
                ...prev,
                productsPage: {
                  ...(prev.productsPage as any),
                  [field]: value
                }
              }));
            }}
          />
        )}

        {/* 5. Product Detail Page */}
        {activeTab === 'productDetailPage' && (
          <CMSProductDetailTab
            detailData={cmsForm.productDetailPage as any}
            onChangeField={(field, value) => {
              handleUpdate(prev => ({
                ...prev,
                productDetailPage: {
                  ...(prev.productDetailPage as any),
                  [field]: value
                }
              }));
            }}
          />
        )}

        {/* 6. Checkout & Success Pages */}
        {activeTab === 'checkoutPage' && (
          <CMSCheckoutTab
            checkoutData={cmsForm.checkoutPage as any}
            checkoutSuccessData={cmsForm.checkoutSuccessPage as any}
            onChangeCheckoutField={(field, value) => {
              handleUpdate(prev => ({
                ...prev,
                checkoutPage: {
                  ...(prev.checkoutPage as any),
                  [field]: value
                }
              }));
            }}
            onChangeSuccessField={(field, value) => {
              handleUpdate(prev => ({
                ...prev,
                checkoutSuccessPage: {
                  ...(prev.checkoutSuccessPage as any),
                  [field]: value
                }
              }));
            }}
          />
        )}

        {/* 7. Patron Account Page */}
        {activeTab === 'accountPage' && (
          <CMSAccountTab
            accountData={cmsForm.accountPage as any}
            onChangeField={(field, value) => {
              handleUpdate(prev => ({
                ...prev,
                accountPage: {
                  ...(prev.accountPage as any),
                  [field]: value
                }
              }));
            }}
          />
        )}

        {/* 8. News & Blog Stories */}
        {activeTab === 'newsSection' && (
          <CMSNewsTab
            newsData={cmsForm.newsSection as any}
            onChangeField={(field, value) => {
              handleUpdate(prev => ({
                ...prev,
                newsSection: {
                  ...(prev.newsSection as any),
                  [field]: value
                }
              }));
            }}
          />
        )}

        {/* 9. Footer & Social Links */}
        {activeTab === 'footer' && (
          <CMSFooterTab
            footerData={cmsForm.footer as any}
            socialLinks={cmsForm.socialLinks as any}
            onChangeFooterField={(field, value) => {
              handleUpdate(prev => ({
                ...prev,
                footer: {
                  ...(prev.footer as any),
                  [field]: value
                }
              }));
            }}
            onChangeSocialField={(field, value) => {
              handleUpdate(prev => ({
                ...prev,
                socialLinks: {
                  ...(prev.socialLinks as any),
                  [field]: value
                }
              }));
            }}
          />
        )}

        {/* 10. Custom Divs / Visual Blocks */}
        {activeTab === 'customBlocks' && (
          <CMSCustomBlocksTab
            customBlocks={cmsForm.customBlocks || []}
            onChange={(blocks) => {
              handleUpdate(prev => ({
                ...prev,
                customBlocks: blocks
              }));
            }}
          />
        )}

        {/* 11. SEO & SERP */}
        {activeTab === 'seo' && (
          <CMSSeoTab
            seoData={cmsForm.seo as any}
            onChangeField={(field, value) => {
              handleUpdate(prev => ({
                ...prev,
                seo: {
                  ...(prev.seo as any),
                  [field]: value
                }
              }));
            }}
          />
        )}

        {/* 12. Theme & Global Design */}
        {activeTab === 'theme' && (
          <CMSThemeTab />
        )}
      </div>
    </div>
  );
};
