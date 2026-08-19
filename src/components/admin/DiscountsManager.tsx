import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { DiscountRule } from '../../types';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Percent, 
  DollarSign, 
  Gift, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const DiscountsManager: React.FC = () => {
  const { 
    discountRules = [], 
    addDiscountRule = async () => {}, 
    updateDiscountRule = async () => {}, 
    deleteDiscountRule = async () => {},
    products = [],
    showToast = () => {}
  } = useShop() || {};

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    target: 'checkout' | 'product' | 'category' | 'seller' | 'brand';
    targetValue: string;
    couponCode: string;
    isActive: boolean;
    minPurchaseUSD: number;
  }>({
    name: '',
    type: 'percentage',
    value: 10,
    target: 'checkout',
    targetValue: '',
    couponCode: '',
    isActive: true,
    minPurchaseUSD: 0
  });

  // Extract unique categories, artisans, and origins from products for selectors
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  const artisans = Array.from(new Set(products.map(p => p.artisan))).filter(Boolean);
  const brands = Array.from(new Set(products.map(p => p.origin))).filter(Boolean);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      name: '',
      type: 'percentage',
      value: 10,
      target: 'checkout',
      targetValue: '',
      couponCode: '',
      isActive: true,
      minPurchaseUSD: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: DiscountRule) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      type: rule.type,
      value: rule.value,
      target: rule.target,
      targetValue: rule.targetValue || '',
      couponCode: rule.couponCode || '',
      isActive: rule.isActive,
      minPurchaseUSD: rule.minPurchaseUSD || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Please enter a discount rule name', 'warning');
      return;
    }
    if (form.value <= 0) {
      showToast('Discount value must be greater than 0', 'warning');
      return;
    }

    try {
      if (editingId) {
        await updateDiscountRule(editingId, {
          name: form.name.trim(),
          type: form.type,
          value: Number(form.value),
          target: form.target,
          targetValue: form.target !== 'checkout' ? form.targetValue : undefined,
          couponCode: form.couponCode.trim() ? form.couponCode.trim().toUpperCase() : undefined,
          isActive: form.isActive,
          minPurchaseUSD: Number(form.minPurchaseUSD) || 0
        });
        showToast('Discount rule updated successfully!', 'success');
      } else {
        await addDiscountRule({
          name: form.name.trim(),
          type: form.type,
          value: Number(form.value),
          target: form.target,
          targetValue: form.target !== 'checkout' ? form.targetValue : undefined,
          couponCode: form.couponCode.trim() ? form.couponCode.trim().toUpperCase() : undefined,
          isActive: form.isActive,
          minPurchaseUSD: Number(form.minPurchaseUSD) || 0
        });
        showToast('Discount rule created successfully!', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(`Error saving discount: ${err.message || err}`, 'warning');
    }
  };

  const getTargetBadgeColor = (target: string) => {
    switch(target) {
      case 'checkout': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'product': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'category': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'seller': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'brand': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#b89753] mb-1">
            <Tag className="w-4 h-4" />
            <span>Promotions & Discounts Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Discount Rules</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure additional checkout discounts, selected items, category sales, artisan/seller specials, and brand offers.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#b89753] to-[#96783d] text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Discount</span>
        </button>
      </div>

      {/* Rules Grid */}
      {discountRules.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#b89753] flex items-center justify-center mx-auto">
            <Gift className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-bold text-slate-900 text-lg">No Active Discount Rules</h3>
            <p className="text-xs text-slate-500">
              Create your first discount rule to offer checkout promotions, category sales, or artisan discounts.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Discount Rule</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discountRules.map((rule) => {
            const isPercentage = rule.type === 'percentage';
            return (
              <div 
                key={rule.id}
                className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all relative overflow-hidden ${
                  rule.isActive ? 'border-slate-200 hover:border-amber-300' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
                }`}
              >
                {!rule.isActive && (
                  <div className="absolute top-4 right-4 bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                    Inactive
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex items-start justify-between pr-16">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase border ${getTargetBadgeColor(rule.target)}`}>
                      {rule.target.toUpperCase()}
                    </span>
                    <span className="text-xl font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
                      {isPercentage ? `${rule.value}% OFF` : `$${rule.value} OFF`}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{rule.name}</h3>
                    {rule.targetValue && (
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        Target: <span className="text-slate-800 font-semibold">{rule.targetValue}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    {rule.couponCode && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-amber-600" />
                        <span>Code: {rule.couponCode}</span>
                      </div>
                    )}
                    {rule.minPurchaseUSD ? (
                      <div className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                        Min: ${rule.minPurchaseUSD}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium">ID: {rule.id.slice(0, 8)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(rule)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit Rule"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteDiscountRule(rule.id)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId ? 'Edit Discount Rule' : 'Create New Discount Rule'}
                </h2>
                <p className="text-xs text-slate-500">Configure promotional discount parameters</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rule Name / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Special 15% Off or Koura Olive Oil Promo"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount Target</label>
                  <select
                    value={form.target}
                    onChange={(e) => setForm({ ...form, target: e.target.value as any, targetValue: '' })}
                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="checkout">Checkout (Entire Order)</option>
                    <option value="category">Category (e.g. Grocery)</option>
                    <option value="seller">Artisan / Seller</option>
                    <option value="brand">Brand / Origin</option>
                    <option value="product">Specific Product</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
              </div>

              {/* Conditional Target Value Selection */}
              {form.target === 'category' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Category</label>
                  <select
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.target === 'seller' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Artisan / Seller</label>
                  <select
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Artisan --</option>
                    {artisans.map((art) => (
                      <option key={art} value={art}>{art}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.target === 'brand' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Brand / Origin</label>
                  <select
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Origin / Brand --</option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.target === 'product' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Product</label>
                  <select
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (${p.priceUSD})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Discount Value ({form.type === 'percentage' ? '%' : '$'})
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Min Purchase ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minPurchaseUSD}
                    onChange={(e) => setForm({ ...form, minPurchaseUSD: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Coupon Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. YALLA20 (leave blank for automatic discount)"
                  value={form.couponCode}
                  onChange={(e) => setForm({ ...form, couponCode: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm uppercase font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Active and Enabled on Store
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#b89753] to-[#96783d] text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-105 transition-all cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Create Discount Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
