import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { 
  FolderTree, 
  Plus, 
  MapPin, 
  Tag, 
  Sparkles, 
  Layers, 
  Search, 
  Edit3, 
  Check, 
  Trash2,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';
import { LEBANON_REGIONS } from '../../data/regions';

interface CategoryItem {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  description: string;
  subcategories: string[];
  bannerUrl: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'grocery',
    nameEn: 'Grocery & Terroir Pantry',
    nameAr: 'المونة والأغذية البلدية',
    icon: '🫒',
    description: 'Cold-pressed olive oils, cedar honey, Zaatar mixes, blossom waters, jams, and authentic mouneh items.',
    subcategories: ['Olive Oils', 'Cedar Honey', 'Wild Zaatar', 'Orange Blossom', 'Artisan Jams', 'Dried Herbs'],
    bannerUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'consumable',
    nameEn: 'Consumable Essentials',
    nameAr: 'الأساسيات الاستهلاكية',
    icon: '🧼',
    description: 'Everyday pantry staples, natural soap bars, organic household staples, and refillable goods.',
    subcategories: ['Laurel Soaps', 'Cold Brew Teas', 'Organic Grains', 'Spices & Sumac'],
    bannerUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'yalla-global',
    nameEn: 'Yalla-Global (Diaspora Express)',
    nameAr: 'شحن عالمي للمغتربين',
    icon: '✈️',
    description: 'Specially packaged air-freight gift baskets, mouneh hampers, and craft bundles shipped internationally via DHL/Aramex.',
    subcategories: ['Diaspora Gift Baskets', 'Artisan Bundles', 'Cedar Heritage Sets'],
    bannerUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'home',
    nameEn: 'Home, Living & Crafts',
    nameAr: 'المنزل والديكور الحرفي',
    icon: '🏺',
    description: 'Hand-blown glassware from Sarafand, Phoenician glazed pottery from Beit Chabab, and woven linens.',
    subcategories: ['Sarafand Glassware', 'Handmade Ceramics', 'Embroidered Linens', 'Aromatic Candles'],
    bannerUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'fashion',
    nameEn: 'Fashion & Apparel',
    nameAr: 'الأزياء والملبوسات',
    icon: '🧵',
    description: 'Silk embroidery, modern abayas, heritage caftans, and contemporary streetwear crafted in Beirut.',
    subcategories: ['Traditional Embroideries', 'Contemporary Apparel', 'Handmade Footwear', 'Leather Accessories'],
    bannerUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'beauty',
    nameEn: 'Beauty & Personal Care',
    nameAr: 'العناية الشخصية والجمال',
    icon: '✨',
    description: 'Tripoli herbal soaps, pure rose water mists, natural body oils, and traditional hammam essentials.',
    subcategories: ['Olive Oil Soaps', 'Rose Water Toner', 'Herbal Balms', 'Aromatherapy Mists'],
    bannerUrl: 'https://images.unsplash.com/photo-1608248597359-548c772b2259?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'toys',
    nameEn: 'Toys & Educational Crafts',
    nameAr: 'ألعاب وأنشطة تعليمية',
    icon: '🧸',
    description: 'Building bricks, puzzle maps of Lebanon, artisanal wooden toys, and educational activity sets.',
    subcategories: ['Building Bricks', 'Wooden Puzzles', 'Heritage Board Games'],
    bannerUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'electronics',
    nameEn: 'Electronics & Tech Accessories',
    nameAr: 'إلكترونيات واكسسوارات',
    icon: '⚡',
    description: 'Smart solar accessories, battery backups, audio gear, and modern studio essentials.',
    subcategories: ['Solar Backup Tech', 'Audio & Sound', 'Desk Ergonomics'],
    bannerUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'tools-hardware',
    nameEn: 'Tools, Hardware & Maintenance',
    nameAr: 'العدد والأدوات اليدوية',
    icon: '🔧',
    description: 'Reliable repair tools, multi-tools, electrical testers, and hardware equipment.',
    subcategories: ['Hand Tools', 'Electrical Testers', 'Hardware Sets'],
    bannerUrl: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'plumbing',
    nameEn: 'Plumbing & Water Care',
    nameAr: 'التمديدات وصيانة المياه',
    icon: '🚰',
    description: 'Water filtration cartridges, brass fixtures, and durable pipe connectors for Lebanese homes.',
    subcategories: ['Filters & Cartridges', 'Brass Fixtures', 'Valves & Connectors'],
    bannerUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'lighting',
    nameEn: 'Lighting & Solar Solutions',
    nameAr: 'الإنارة وحلول الطاقة',
    icon: '💡',
    description: 'Rechargeable emergency bulbs, architectural brass sconces, and solar outdoor lanterns.',
    subcategories: ['Solar Lanterns', 'Rechargeable Bulbs', 'Ambient Pendant Lights'],
    bannerUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'electrical',
    nameEn: 'Electrical & Power Protection',
    nameAr: 'التجهيزات الكهربائية والحماية',
    icon: '🔌',
    description: 'Heavy-duty surge protectors, automatic voltage regulators, and UPS accessories.',
    subcategories: ['Voltage Protectors', 'Surge Strips', 'Battery Inverters'],
    bannerUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cleaning',
    nameEn: 'Cleaning & Eco Solutions',
    nameAr: 'المنظفات والحلول البيئية',
    icon: '🧹',
    description: 'Biodegradable detergents, pine-oil disinfectants, and natural citrus multi-surface cleaners.',
    subcategories: ['Pine Disinfectants', 'Natural Detergents', 'Eco Sponges'],
    bannerUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'decor',
    nameEn: 'Art & Terroir Decor',
    nameAr: 'الفنون والديكور الجداري',
    icon: '🎨',
    description: 'Calligraphy art prints, cedar wood sculptures, and brass wall accents.',
    subcategories: ['Calligraphy Wall Art', 'Cedar Sculptures', 'Brass Ornaments'],
    bannerUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80'
  }
];

export const CategoriesDetailsView: React.FC = () => {
  const { products, showToast } = useShop();
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'regions'>('categories');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCat, setNewCat] = useState({
    id: '',
    nameEn: '',
    nameAr: '',
    icon: '🏷️',
    description: '',
    subcategoriesStr: '',
    bannerUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80'
  });

  const filteredCategories = categories.filter(c => 
    c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nameAr.includes(searchQuery) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subcategories.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getProductCountForCategory = (catId: string) => {
    return products.filter(p => p.category === catId).length;
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.nameEn) return;

    const id = newCat.id.trim().toLowerCase().replace(/\s+/g, '-') || newCat.nameEn.toLowerCase().replace(/\s+/g, '-');
    const subcats = newCat.subcategoriesStr.split(',').map(s => s.trim()).filter(Boolean);

    const added: CategoryItem = {
      id,
      nameEn: newCat.nameEn,
      nameAr: newCat.nameAr || newCat.nameEn,
      icon: newCat.icon || '🏷️',
      description: newCat.description || 'Artisanal collection.',
      subcategories: subcats.length > 0 ? subcats : ['General'],
      bannerUrl: newCat.bannerUrl
    };

    setCategories([...categories, added]);
    setIsAddModalOpen(false);
    showToast(`Added category "${added.nameEn}"!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4f46e5]">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Categories & Details Management
              </h2>
              <p className="text-xs text-slate-500">
                Structure taxonomy, subcategories, artisan guilds, and Lebanese terroir regional origins.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'categories' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Categories & Sub-tags ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('regions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'regions' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lebanon Terroir Regions ({LEBANON_REGIONS.length})
          </button>
        </div>

        {activeTab === 'categories' && (
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search category, subcategory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white text-xs text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4f46e5]"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Categories Cards Grid */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const count = getProductCountForCategory(cat.id);

            return (
              <div key={cat.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 hover:border-indigo-200 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-2xl flex items-center justify-center">
                        {cat.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{cat.nameEn}</h4>
                        <p className="text-xs text-[#c5a059] font-serif font-semibold">{cat.nameAr}</p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-[#4f46e5]">
                      {count} {count === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>

                  {/* Subcategories tags */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Subcategories & Guilds:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subcategories.map((sub, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px]">slug: <strong className="text-slate-700">{cat.id}</strong></span>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Active in Store
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Lebanon Terroir Regions & Logistics Map */}
      {activeTab === 'regions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEBANON_REGIONS.map((reg) => (
            <div key={reg.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#c5a059] flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{reg.nameEn}</h4>
                    <p className="text-xs text-amber-700 font-serif font-bold">{reg.nameAr}</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-800">
                  ${reg.baseDeliveryUSD.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Major Artisan Villages & Delivery Hubs:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {reg.majorCities.map((city, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-700 text-[11px]">
                      {city}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Express Delivery:</span>
                <span className={`font-bold ${reg.expressAvailable ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {reg.expressAvailable ? '✓ Available (Same Day)' : 'Standard (24-48h)'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white max-w-lg w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add New Store Category</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Name (English) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Mouneh"
                    value={newCat.nameEn}
                    onChange={(e) => setNewCat({ ...newCat, nameEn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Name (Arabic)</label>
                  <input
                    type="text"
                    placeholder="e.g. مونة عضوية"
                    value={newCat.nameAr}
                    onChange={(e) => setNewCat({ ...newCat, nameAr: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4f46e5] text-right font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Icon Emoji</label>
                  <input
                    type="text"
                    value={newCat.icon}
                    onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Slug / Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. organic-mouneh"
                    value={newCat.id}
                    onChange={(e) => setNewCat({ ...newCat, id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subcategories (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Cedar Honey, Pickled Olives, Zaatar, Labneh"
                  value={newCat.subcategoriesStr}
                  onChange={(e) => setNewCat({ ...newCat, subcategoriesStr: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description for category banner..."
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] text-white font-bold cursor-pointer shadow-md"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
