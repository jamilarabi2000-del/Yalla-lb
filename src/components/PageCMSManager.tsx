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
  Palette,
  Eye,
  EyeOff,
  History,
  FileCode2,
  Maximize2,
  Minimize2,
  SplitSquareVertical,
  CheckCircle2,
  AlertCircle
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
import { CMSLivePreview } from './admin/cms/CMSLivePreview';
import { CMSGlobalSearch } from './admin/cms/CMSGlobalSearch';
import { CMSDiffModal } from './admin/cms/CMSDiffModal';
import { CMSVersionHistoryModal } from './admin/cms/CMSVersionHistoryModal';
import { saveCmsSnapshot, getCmsSnapshots } from '../utils/cmsSnapshots';

interface PageCMSManagerProps {
  initialTab?: string;
}

export const PageCMSManager: React.FC<PageCMSManagerProps> = ({ initialTab = 'home' }) => {
  const { siteContent, updateSiteContent, showToast } = useShop();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [cmsForm, setCmsForm] = useState(siteContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // UX Improvements states
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [snapshotCount, setSnapshotCount] = useState(0);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    setCmsForm(siteContent);
    setIsDirty(false);
  }, [siteContent]);

  useEffect(() => {
    setSnapshotCount(getCmsSnapshots().length);
  }, []);

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
      // Create snapshot before saving
      saveCmsSnapshot(cmsForm, `Published updates (${new Date().toLocaleTimeString()})`);
      setSnapshotCount(getCmsSnapshots().length);

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

  const handleRollback = (restoredContent: any) => {
    setCmsForm(restoredContent);
    setIsDirty(true);
    showToast('Version restored to draft editor. Review and click Publish to go live.', 'info');
  };

  const tabs = [
    { id: 'visibility', label: 'Section Visibility & Order', icon: Settings },
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
    <div className="bg-[#1a1a2e] p-4 sm:p-6 lg:p-8 rounded-3xl text-white shadow-2xl space-y-6 relative">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Storefront CMS Studio
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                Live Interactive
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual storefront management, bilingual EN/AR copywriting, instant live split preview, and version rollback.
            </p>
          </div>
        </div>

        {/* Global Instant Search & Quick Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-end">
          <div className="flex-1 sm:w-64 min-w-[200px]">
            <CMSGlobalSearch onSelectTab={(tabId) => setActiveTab(tabId)} />
          </div>

          {/* Toggle Live Preview */}
          <button
            type="button"
            onClick={() => setShowLivePreview(prev => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showLivePreview
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
            }`}
            title={showLivePreview ? "Hide live preview pane" : "Show live split preview"}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showLivePreview ? 'Hide Preview' : 'Live Preview'}</span>
          </button>

          {/* Version History Button */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="View CMS version history and snapshots"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">History</span>
            {snapshotCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                {snapshotCount}
              </span>
            )}
          </button>

          {/* Diff Modal Button */}
          {isDirty && (
            <button
              type="button"
              onClick={() => setShowDiffModal(true)}
              className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
              title="Review differences against live site"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Review Diff</span>
            </button>
          )}

          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
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
            className={`px-5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
              isDirty 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/50 shadow-amber-500/20' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            } disabled:opacity-50`}
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Publishing...' : isDirty ? 'Publish Changes' : 'Save & Publish Live'}</span>
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

      {/* Main Workspace Layout (Split Pane or Full Form) */}
      <div className={`grid gap-6 ${showLivePreview ? 'grid-cols-1 xl:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Left/Editor Form Column */}
        <div className={showLivePreview ? 'xl:col-span-7 space-y-6' : 'space-y-6'}>
          {/* 1. Section Visibility & Order */}
          {activeTab === 'visibility' && (
            <CMSVisibilityTab
              visibility={cmsForm.visibility}
              sectionOrder={(cmsForm.home as any)?.sectionOrder}
              onOrderChange={(order) => {
                handleUpdate(prev => ({
                  ...prev,
                  home: {
                    ...(prev.home as any),
                    sectionOrder: order
                  }
                }));
              }}
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

        {/* Right/Split Live Storefront Preview Column */}
        {showLivePreview && (
          <div className="xl:col-span-5 relative">
            <CMSLivePreview
              content={cmsForm}
              activeTab={activeTab}
              onClose={() => setShowLivePreview(false)}
            />
          </div>
        )}
      </div>

      {/* Sticky Bottom Save / Unsaved Edits Indicator Bar */}
      {isDirty && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-xl z-40 bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 animate-bounce-short">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <div>
              <p className="text-xs font-bold text-white">You have unpublished draft edits</p>
              <p className="text-[10px] text-slate-400">Edits are previewing live above but not yet published to customers.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDiffModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold border border-purple-500/30 transition-all"
            >
              Review Diff
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showDiffModal && (
        <CMSDiffModal
          currentSiteContent={siteContent}
          draftSiteContent={cmsForm}
          onClose={() => setShowDiffModal(false)}
          onPublish={async () => {
            setShowDiffModal(false);
            await handleSave();
          }}
          onDiscard={() => {
            setShowDiffModal(false);
            handleReset();
          }}
        />
      )}

      {showHistoryModal && (
        <CMSVersionHistoryModal
          onClose={() => setShowHistoryModal(false)}
          onRollback={handleRollback}
        />
      )}
    </div>
  );
};

