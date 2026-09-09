import React, { useState } from 'react';
import { useShop } from '../../../context/ShopContext';
import { CMSPromoBannerConfig } from '../../../types';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  Image as ImageIcon, 
  Type, 
  ShoppingBag, 
  Tag, 
  Grid, 
  Calendar, 
  Clock, 
  Palette, 
  Link as LinkIcon, 
  RotateCcw, 
  Trash2, 
  ExternalLink, 
  Layers, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { BilingualField } from './BilingualField';
import { MediaAssetPicker } from './MediaAssetPicker';
import { HomePromoBanner } from '../../HomePromoBanner';

// Lebanese Craft / Cultural Preset Images for Quick Selection
const PROMO_IMAGE_PRESETS = [
  {
    name: 'Sarafand Hand-Blown Glass',
    url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Artisan Pottery & Clay',
    url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Koura Olive Harvest & Terroir',
    url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Cedar Wood & Heritage Crafting',
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Tripoli Olive Laurel Soap',
    url: 'https://images.unsplash.com/photo-1607006483669-e0d0ca17013e?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Back to School & Essentials',
    url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800'
  }
];

const TARGET_URL_PRESETS = [
  { label: 'All Products Catalog (/products)', url: '/products' },
  { label: 'Pantry & Mouneh (/products?category=Pantry)', url: '/products?category=Pantry' },
  { label: 'Home & Blown Glass (/products?category=Home & Art)', url: '/products?category=Home & Art' },
  { label: 'Fashion & Textiles (/products?category=Fashion)', url: '/products?category=Fashion' },
  { label: 'Beauty & Laurel Soaps (/products?category=Beauty)', url: '/products?category=Beauty' },
  { label: 'Special Offers & Deals (/products?category=all)', url: '/products' },
  { label: 'My Account (/account)', url: '/account' },
];

interface CMSPromoBannerEditorProps {
  promoBannerData?: CMSPromoBannerConfig;
  onChangePromoBanner: (updates: Partial<CMSPromoBannerConfig>) => void;
}

export const CMSPromoBannerEditor: React.FC<CMSPromoBannerEditorProps> = ({
  promoBannerData,
  onChangePromoBanner
}) => {
  const { products = [], categories = [], language } = useShop();
  const [productSearch, setProductSearch] = useState('');

  const config: CMSPromoBannerConfig = promoBannerData || {
    enabled: true,
    type: 'custom',
    badge: 'Artisan Spotlight',
    badgeArabic: 'تسليط الضوء الحرفي',
    title: 'Authentic Heritage Crafts & Mouneh',
    titleArabic: 'حرف ومونة تراثية أصيلة',
    description: 'Directly supporting independent Lebanese artisans & cooperatives.',
    descriptionArabic: 'دعم مباشر للحرفيين والتعاونيات والمشاغل اللبنانية الأصيلة.',
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=800',
    imageFit: 'contain',
    bgStyle: 'default',
    showCta: true,
    ctaText: 'Explore Collection',
    ctaTextArabic: 'تصفح التشكيلة',
    ctaUrl: '/products',
    ctaType: 'button',
    contentAlignment: 'left',
    isPublished: true,
    scheduleActive: false
  };

  const isScheduleActive = () => {
    if (config.isPublished === false) {
      return {
        label: 'Unpublished / Draft',
        labelAr: 'مسودة غير منشورة',
        color: 'bg-slate-800 text-slate-400 border-slate-700'
      };
    }
    if (!config.enabled) {
      return {
        label: 'Disabled by Admin',
        labelAr: 'معطل من المشرف',
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      };
    }
    if (config.scheduleActive) {
      const now = new Date();
      if (config.startDate && new Date(config.startDate) > now) {
        return {
          label: `Scheduled (${new Date(config.startDate).toLocaleDateString()})`,
          labelAr: `مجدول`,
          color: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
        };
      }
      if (config.endDate && new Date(config.endDate) < now) {
        return {
          label: `Expired (${new Date(config.endDate).toLocaleDateString()})`,
          labelAr: `منتهي الصلاحية`,
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
      }
    }
    return {
      label: 'Live on Website',
      labelAr: 'نشط على الموقع',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };
  };

  const scheduleStatus = isScheduleActive();

  const handleResetDefault = () => {
    onChangePromoBanner({
      enabled: true,
      type: 'custom',
      badge: 'Artisan Spotlight',
      badgeArabic: 'تسليط الضوء الحرفي',
      title: 'Authentic Heritage Crafts & Mouneh',
      titleArabic: 'حرف ومونة تراثية أصيلة',
      description: 'Directly supporting independent Lebanese artisans, cooperatives, and traditional workshops.',
      descriptionArabic: 'دعم مباشر للحرفيين والتعاونيات والمشاغل اللبنانية الأصيلة في مختلف المناطق.',
      imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=800',
      imageFit: 'contain',
      bgStyle: 'default',
      showCta: true,
      ctaText: 'Explore Collection',
      ctaTextArabic: 'تصفح التشكيلة',
      ctaUrl: '/products',
      ctaType: 'button',
      contentAlignment: 'left',
      isPublished: true,
      scheduleActive: false
    });
  };

  const handleClearEmpty = () => {
    onChangePromoBanner({
      enabled: false,
      type: 'custom',
      badge: '',
      badgeArabic: '',
      title: '',
      titleArabic: '',
      description: '',
      descriptionArabic: '',
      imageUrl: '',
      selectedProductId: '',
      targetCategory: '',
      isPublished: false
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    (p.arabicName && p.arabicName.includes(productSearch)) ||
    (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* 1. Header with Status & Enable/Disable Toggle */}
      <div className="bg-slate-900/90 rounded-2xl border border-white/10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B89753]/20 flex items-center justify-center text-[#F3E5AB]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Homepage Promotional Content Banner</h3>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${scheduleStatus.color}`}>
                {scheduleStatus.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Admin-controlled banner block positioned alongside the homepage hero slider
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-800/80 px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
            <input
              type="checkbox"
              checked={config.enabled !== false}
              onChange={(e) => onChangePromoBanner({ enabled: e.target.checked })}
              className="w-4 h-4 rounded text-[#B89753] focus:ring-[#B89753] bg-slate-900 border-white/20"
            />
            <span className="text-xs font-semibold text-slate-200">
              {config.enabled !== false ? 'Banner Enabled' : 'Banner Disabled'}
            </span>
          </label>

          <button
            type="button"
            onClick={handleResetDefault}
            title="Reset to default banner preset"
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-white/10 transition-colors text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={handleClearEmpty}
            title="Wipe all content and set to empty"
            className="p-2 rounded-xl bg-rose-500/10 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 border border-rose-500/20 transition-colors text-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Empty</span>
          </button>
        </div>
      </div>

      {/* 2. Content Type Selection Grid */}
      <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-4 sm:p-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#F3E5AB] mb-3">
          Content Structure & Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { id: 'custom', label: 'Image + Text', icon: Layers, desc: 'Promotional card with image & copy' },
            { id: 'product_promotion', label: 'Product Promo', icon: ShoppingBag, desc: 'Showcase specific artisan product' },
            { id: 'category_promotion', label: 'Category Promo', icon: Grid, desc: 'Highlight a departmental category' },
            { id: 'image_only', label: 'Image Only', icon: ImageIcon, desc: 'Full graphical visual banner' },
            { id: 'text_only', label: 'Text Only', icon: Type, desc: 'Typography headline & CTA only' },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = (config.type || 'custom') === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangePromoBanner({ type: item.id as any })}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected 
                    ? 'bg-[#B89753]/20 border-[#B89753] text-white shadow-sm ring-1 ring-[#B89753]' 
                    : 'bg-slate-800/40 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#F3E5AB]' : 'text-slate-400'}`} />
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#F3E5AB]" />}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Product Selection (If Product Promotion Selected) */}
      {config.type === 'product_promotion' && (
        <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#F3E5AB]">
              Select Featured Artisan Product
            </label>
            <span className="text-[11px] text-slate-400">
              {products.length} products in store
            </span>
          </div>

          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search by product name, Arabic name, or category..."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#B89753]"
          />

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {filteredProducts.slice(0, 15).map((p) => {
              const isChosen = config.selectedProductId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onChangePromoBanner({ 
                    selectedProductId: p.id,
                    imageUrl: p.image,
                    title: p.name,
                    titleArabic: p.arabicName || p.name,
                    badge: p.category,
                    badgeArabic: p.category
                  })}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChosen 
                      ? 'bg-[#B89753]/20 border-[#B89753] text-white' 
                      : 'bg-slate-800/40 border-white/5 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-lg object-contain bg-white/5 border border-white/10 p-0.5"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{p.artisan || p.category} • ${p.priceUSD}</p>
                    </div>
                  </div>
                  {isChosen && <Check className="w-4 h-4 text-[#F3E5AB] shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Category Selection (If Category Promotion Selected) */}
      {config.type === 'category_promotion' && (
        <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-4 sm:p-5 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#F3E5AB]">
            Target Product Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'all', name: 'All Products', ar: 'جميع المنتجات' },
              { id: 'Pantry', name: 'Pantry & Mouneh', ar: 'المونة والبهارات' },
              { id: 'Home & Art', name: 'Home & Blown Glass', ar: 'الزجاج المنفوخ والديكور' },
              { id: 'Fashion', name: 'Fashion & Textiles', ar: 'الأزياء والأقمشة' },
              { id: 'Beauty', name: 'Natural Beauty & Soap', ar: 'صابون الغار والعناية' },
              { id: 'Books', name: 'Books & Cultural Heritage', ar: 'الكتب والتراث' }
            ].map((cat) => {
              const isSelected = config.targetCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onChangePromoBanner({ 
                    targetCategory: cat.id,
                    ctaUrl: `/products?category=${cat.id}`,
                    badge: cat.name,
                    badgeArabic: cat.ar
                  })}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                    isSelected
                      ? 'bg-[#B89753]/20 border-[#B89753] text-white'
                      : 'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate">{cat.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate">{cat.ar}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Bilingual Text Content (Badge, Title, Description) */}
      {config.type !== 'image_only' && (
        <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-4 sm:p-5 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#F3E5AB]">
            Banner Copy & Typography
          </label>

          <BilingualField
            labelEn="Eyebrow / Badge Label (Optional)"
            labelAr="شارة أو تصنيف البانر"
            valueEn={config.badge || ''}
            valueAr={config.badgeArabic || ''}
            onChangeEn={(val) => onChangePromoBanner({ badge: val })}
            onChangeAr={(val) => onChangePromoBanner({ badgeArabic: val })}
            placeholderEn="e.g., Artisan Spotlight, Flash Offer, Back to School"
            placeholderAr="مثال: تسليط الضوء، عرض مميز، العودة للمدارس"
          />

          <BilingualField
            labelEn="Headline / Title"
            labelAr="العنوان الرئيسي للبانر"
            valueEn={config.title || ''}
            valueAr={config.titleArabic || ''}
            onChangeEn={(val) => onChangePromoBanner({ title: val })}
            onChangeAr={(val) => onChangePromoBanner({ titleArabic: val })}
            placeholderEn="e.g., Authentic Lebanese Heritage Crafts"
            placeholderAr="مثال: كنوز وتحف لبنانية أصيلة"
          />

          <BilingualField
            labelEn="Description / Subtext (Optional)"
            labelAr="الوصف أو النص الفرعي"
            valueEn={config.description || ''}
            valueAr={config.descriptionArabic || ''}
            onChangeEn={(val) => onChangePromoBanner({ description: val })}
            onChangeAr={(val) => onChangePromoBanner({ descriptionArabic: val })}
            placeholderEn="e.g., Directly supporting independent artisan workshops across Lebanon."
            placeholderAr="مثال: دعم مباشر للحرفيين والمشاغل العائلية اللبنانية."
          />
        </div>
      )}

      {/* 6. Image & Media Controls */}
      {config.type !== 'text_only' && (
        <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-4 sm:p-5 space-y-4">
          <MediaAssetPicker
            label="Banner Image & Media Asset"
            subLabel="Upload an image, enter an image URL, or pick from Lebanese heritage presets"
            value={config.imageUrl || ''}
            onChange={(url: string) => onChangePromoBanner({ imageUrl: url })}
            recommendedRatio="4:3"
            recommendedDimensions="1200×800px"
          />

          {/* Quick Image Presets */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">Quick Lebanese Artisanal Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {PROMO_IMAGE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChangePromoBanner({ imageUrl: preset.url })}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Image Fit Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Image Fit</label>
              <select
                value={config.imageFit || 'contain'}
                onChange={(e) => onChangePromoBanner({ imageFit: e.target.value as any })}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white focus:outline-none focus:border-[#B89753]"
              >
                <option value="contain">Contain (Best for isolated craft objects)</option>
                <option value="cover">Cover (Full bleed background)</option>
                <option value="fill">Fill (Stretch)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 7. Background & Styling Configuration */}
      <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-4 sm:p-5 space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#F3E5AB]">
          Card Background & Styling
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: 'default', label: 'Default Light', preview: 'bg-[#ededed] text-black' },
            { id: 'dark', label: 'Dark Slate', preview: 'bg-[#111111] text-white' },
            { id: 'light', label: 'Pure Off-White', preview: 'bg-[#fafafa] text-black' },
            { id: 'gold_gradient', label: 'Gold Gradient', preview: 'bg-gradient-to-br from-amber-950 to-stone-900 text-white' },
            { id: 'emerald_gradient', label: 'Olive Emerald', preview: 'bg-gradient-to-br from-emerald-950 to-slate-900 text-white' },
            { id: 'custom_color', label: 'Custom Hex', preview: 'bg-slate-800 text-white' },
          ].map((style) => {
            const isSelected = (config.bgStyle || 'default') === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onChangePromoBanner({ bgStyle: style.id as any })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-[#B89753] ring-1 ring-[#B89753] bg-slate-800'
                    : 'border-white/10 bg-slate-850 hover:bg-slate-800'
                }`}
              >
                <div className={`w-full h-8 rounded-lg mb-1.5 border border-white/10 ${style.preview}`} />
                <span className="text-[11px] font-bold text-slate-200 block truncate">{style.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Color Pickers if 'custom_color' chosen */}
        {config.bgStyle === 'custom_color' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Custom Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.customBgColor || '#111111'}
                  onChange={(e) => onChangePromoBanner({ customBgColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={config.customBgColor || '#111111'}
                  onChange={(e) => onChangePromoBanner({ customBgColor: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Custom Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.customTextColor || '#ffffff'}
                  onChange={(e) => onChangePromoBanner({ customTextColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={config.customTextColor || '#ffffff'}
                  onChange={(e) => onChangePromoBanner({ customTextColor: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 8. Call To Action (CTA) Configuration */}
      <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#F3E5AB]">
            Call-to-Action (CTA Button & Link)
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showCta !== false}
              onChange={(e) => onChangePromoBanner({ showCta: e.target.checked })}
              className="w-4 h-4 rounded text-[#B89753] focus:ring-[#B89753] bg-slate-900 border-white/20"
            />
            <span className="text-xs font-semibold text-slate-300">Show CTA Button</span>
          </label>
        </div>

        {config.showCta !== false && (
          <div className="space-y-3">
            <BilingualField
              labelEn="Button Text"
              labelAr="نص زر التوجيه"
              valueEn={config.ctaText || ''}
              valueAr={config.ctaTextArabic || ''}
              onChangeEn={(val) => onChangePromoBanner({ ctaText: val })}
              onChangeAr={(val) => onChangePromoBanner({ ctaTextArabic: val })}
              placeholderEn="e.g., Explore Collection, Claim Offer, Shop Now"
              placeholderAr="مثال: استكشف التشكيلة، تسوق الآن"
            />

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target URL / Link</label>
              <input
                type="text"
                value={config.ctaUrl || '/products'}
                onChange={(e) => onChangePromoBanner({ ctaUrl: e.target.value })}
                placeholder="e.g. /products, /products?category=Pantry, or https://..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#B89753]"
              />

              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400 py-0.5">Quick Presets:</span>
                {TARGET_URL_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChangePromoBanner({ ctaUrl: preset.url })}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 9. Scheduling & Publishing */}
      <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#F3E5AB]">
            Publishing & Date Scheduling
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.isPublished !== false}
              onChange={(e) => onChangePromoBanner({ isPublished: e.target.checked })}
              className="w-4 h-4 rounded text-[#B89753] focus:ring-[#B89753] bg-slate-900 border-white/20"
            />
            <span className="text-xs font-semibold text-slate-300">Published Status</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(config.scheduleActive)}
              onChange={(e) => onChangePromoBanner({ scheduleActive: e.target.checked })}
              className="w-4 h-4 rounded text-[#B89753] focus:ring-[#B89753] bg-slate-900 border-white/20"
            />
            <span className="text-xs text-slate-300">Enable Automated Date Schedule</span>
          </label>
        </div>

        {config.scheduleActive && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Start Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={config.startDate ? config.startDate.substring(0, 16) : ''}
                onChange={(e) => onChangePromoBanner({ startDate: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                End Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={config.endDate ? config.endDate.substring(0, 16) : ''}
                onChange={(e) => onChangePromoBanner({ endDate: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* 10. Real-time Live Preview Card */}
      <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-4 sm:p-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#F3E5AB] mb-3">
          Live Storefront Preview
        </label>
        <div className="max-w-md mx-auto p-2 bg-slate-950 rounded-2xl border border-white/10">
          <HomePromoBanner bannerConfig={config} />
        </div>
      </div>
    </div>
  );
};
