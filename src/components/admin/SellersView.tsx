import React, { useState, useRef } from 'react';
import { useShop } from '../../context/ShopContext';
import { Seller } from '../../types';
import { 
  Store, 
  Plus, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Edit3, 
  Trash2, 
  Power, 
  FileText,
  Search,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { 
  downloadFullMasterReport, 
  downloadSellerPerformanceReport 
} from '../../utils/exportMasterReport';
import { resolveSeller, resolveCategory, parsePrice, parseStock, isCsvRowEmpty } from '../../utils/importerResolvers';

export const SellersView: React.FC = () => {
  const { sellers, addSeller, updateSeller, toggleSellerActive, deleteSeller, bulkImportProducts, products, orders = [], categories, showToast } = useShop();

  const [activeSubTab, setActiveSubTab] = useState<'sellers' | 'import'>('sellers');
  const [searchQuery, setSearchQuery] = useState('');
  const [sellerStatusFilter, setSellerStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);

  // Form state
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formRegion, setFormRegion] = useState('beirut');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Delete reassign state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  // CSV Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [rawImportRows, setRawImportRows] = useState<any[]>([]);
  const [targetSellerId, setTargetSellerId] = useState<string>('auto');
  const [fallbackCategoryId, setFallbackCategoryId] = useState<string>('auto');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSellers = sellers.filter(s => {
    const matchesSearch = s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nameAr && s.nameAr.includes(searchQuery)) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (sellerStatusFilter === 'active') return matchesSearch && s.isActive;
    if (sellerStatusFilter === 'inactive') return matchesSearch && !s.isActive;
    return matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingSeller(null);
    setFormNameEn('');
    setFormNameAr('');
    setFormRegion('beirut');
    setFormPhone('');
    setFormEmail('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Seller) => {
    setEditingSeller(s);
    setFormNameEn(s.nameEn);
    setFormNameAr(s.nameAr || '');
    setFormRegion(s.region || 'beirut');
    setFormPhone(s.contactPhone || '');
    setFormEmail(s.contactEmail || '');
    setFormIsActive(s.isActive);
    setIsModalOpen(true);
  };

  const handleSaveSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameEn.trim()) {
      showToast('Seller English name is required', 'warning');
      return;
    }
    try {
      if (editingSeller) {
        await updateSeller(editingSeller.id, {
          nameEn: formNameEn.trim(),
          nameAr: formNameAr.trim(),
          region: formRegion,
          contactPhone: formPhone.trim(),
          contactEmail: formEmail.trim(),
          isActive: formIsActive
        });
        showToast('Seller updated successfully!');
      } else {
        await addSeller({
          nameEn: formNameEn.trim(),
          nameAr: formNameAr.trim(),
          region: formRegion,
          contactPhone: formPhone.trim(),
          contactEmail: formEmail.trim(),
          isActive: formIsActive
        });
        showToast('Seller created successfully!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save seller', 'warning');
    }
  };

  const handleDeleteClick = async (sellerId: string) => {
    const affected = products.filter(p => p.sellerId === sellerId);
    if (affected.length > 0) {
      setDeleteTargetId(sellerId);
      setReassignTargetId(sellers.find(s => s.id !== sellerId)?.id || '');
    } else {
      if (window.confirm('Are you sure you want to delete this seller?')) {
        try {
          await deleteSeller(sellerId);
          showToast('Seller deleted successfully');
        } catch (err: any) {
          showToast(err.message, 'warning');
        }
      }
    }
  };

  const handleConfirmDeleteWithReassign = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteSeller(deleteTargetId, reassignTargetId);
      showToast('Seller deleted and products reassigned successfully');
      setDeleteTargetId(null);
    } catch (err: any) {
      showToast(err.message, 'warning');
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'sku',
      'name_en',
      'name_ar',
      'seller_id',
      'seller_item_code',
      'category',
      'price_usd',
      'original_price_usd',
      'stock',
      'image_url',
      'additional_images',
      'video_url',
      'additional_videos',
      'description_en',
      'description_ar',
      'tags',
      'is_published',
      'origin_terroir',
      'weight_or_volume'
    ];

    const csvContent = headers.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `yalla_catalog_template_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSellersReport = () => {
    import('papaparse').then((Papa) => {
      const dataToExport = filteredSellers.map(seller => ({
        seller_id: seller.id,
        name_en: seller.nameEn,
        name_ar: seller.nameAr || '',
        status: seller.isActive ? 'Active' : 'Inactive',
        region: seller.region || 'Lebanon',
        contact_phone: seller.contactPhone || '',
        linked_products_count: products.filter(p => p.sellerId === seller.id).length,
        created_at: seller.createdAt || '',
      }));

      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `yalla_sellers_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Sellers report downloaded successfully', 'success');
    });
  };

  const recomputePreview = (rows: any[], targetSeller: string, fallbackCat: string) => {
    const parsedPreview: any[] = [];

    rows.forEach((row, idx) => {
      if (isCsvRowEmpty(row)) return;
      const rowNum = idx + 2;
      const name = (row.name_en || row.name || row.title || '').toString().trim();
      const resolvedSeller = resolveSeller(row, sellers, targetSeller);
      const resolvedCategory = resolveCategory(row, categories, fallbackCat);
      const priceUSD = parsePrice(row.price_usd || row.price || row.unit_price);
      const stock = parseStock(row.stock !== undefined ? row.stock : row.qty);

      const rowIssues: string[] = [];
      if (!name) rowIssues.push('name_en required');
      if (!resolvedSeller) {
        const rawSeller = row.seller_id || row.seller || row.seller_artisan || 'empty';
        rowIssues.push(`seller "${rawSeller}" unknown (Select Target Seller above)`);
      }
      if (!resolvedCategory) {
        const rawCat = row.category || row.category_id || 'empty';
        rowIssues.push(`category "${rawCat}" unknown`);
      }
      if (priceUSD <= 0) rowIssues.push('price_usd must be > 0');
      if (isNaN(stock) || stock < 0) rowIssues.push('stock must be >= 0');

      const sku = (row.sku || row.product_id || '').toString().trim() || `prod-${idx}`;
      const isUpdate = products.some(p => p.id === sku);

      parsedPreview.push({
        rowNum,
        sku,
        name: name || 'Unnamed',
        sellerName: resolvedSeller?.sellerName || 'Unassigned',
        categoryName: resolvedCategory?.categoryName || 'Unassigned',
        action: isUpdate ? 'Update' : 'Create',
        issues: rowIssues
      });
    });

    setPreviewRows(parsedPreview);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Parse with PapaParse for dry run preview
      import('papaparse').then((Papa) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim().toLowerCase(),
          complete: (results) => {
            const rows = (results.data as any[]).filter(r => !isCsvRowEmpty(r));
            setRawImportRows(rows);
            recomputePreview(rows, targetSellerId, fallbackCategoryId);
          }
        });
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleTargetSellerSelect = (newSellerId: string) => {
    setTargetSellerId(newSellerId);
    if (rawImportRows.length > 0) {
      recomputePreview(rawImportRows, newSellerId, fallbackCategoryId);
    }
  };

  const handleFallbackCategorySelect = (newCatId: string) => {
    setFallbackCategoryId(newCatId);
    if (rawImportRows.length > 0) {
      recomputePreview(rawImportRows, targetSellerId, newCatId);
    }
  };

  const handleCommitImport = async () => {
    if (!importFile) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const result = await bulkImportProducts(text, {
          targetSellerId: targetSellerId,
          fallbackCategoryId: fallbackCategoryId
        });
        setImportResult(result);
        if (result.created > 0 || result.updated > 0) {
          showToast(`Successfully imported products! Created: ${result.created}, Updated: ${result.updated}`, 'success');
        } else if (result.errors.length > 0) {
          showToast(`Import encountered issues: ${result.errors[0]}`, 'warning');
        }
      } catch (err: any) {
        showToast(err.message || 'Import failed', 'warning');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(importFile, 'UTF-8');
  };

  return (
    <div className="space-y-6">
      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
            <Store className="w-3.5 h-3.5" />
            <span>Seller Network & Catalog Import</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sellers & CSV Bulk Operations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authenticated suppliers, normalize product linkages, and bulk import/export inventory via CSV.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveSubTab('sellers')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'sellers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Registered Sellers ({sellers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('import')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'import'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            CSV Bulk Import / Export
          </button>
        </div>
      </div>

      {activeSubTab === 'sellers' ? (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sellers by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setSellerStatusFilter('all')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                    sellerStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({sellers.length})
                </button>
                <button
                  onClick={() => setSellerStatusFilter('active')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                    sellerStatusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active ({sellers.filter(s => s.isActive).length})
                </button>
                <button
                  onClick={() => setSellerStatusFilter('inactive')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                    sellerStatusFilter === 'inactive' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Inactive ({sellers.filter(s => !s.isActive).length})
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto">
              <button
                onClick={() => {
                  downloadSellerPerformanceReport(products, sellers, orders);
                  showToast('Seller Performance & Sales report downloaded successfully.', 'success');
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-2xs shrink-0"
                title="Download Artisan Sales, Revenue & Payout Ledger"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Sales & Performance</span>
              </button>
              <button
                onClick={handleDownloadSellersReport}
                className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-2xs shrink-0"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Download Directory</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Seller</span>
              </button>
            </div>
          </div>

          {/* Sellers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredSellers.map((seller) => {
              const productCount = products.filter(p => p.sellerId === seller.id).length;
              return (
                <div 
                  key={seller.id}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-xs flex flex-col justify-between ${
                    seller.isActive ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 truncate max-w-full">
                          {seller.id}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-2 truncate" title={seller.nameEn}>{seller.nameEn}</h3>
                        {seller.nameAr && <p className="text-xs font-semibold text-slate-500 truncate" title={seller.nameAr}>{seller.nameAr}</p>}
                      </div>
                      <button
                        onClick={() => toggleSellerActive(seller.id, !seller.isActive)}
                        className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                          seller.isActive 
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                        title={seller.isActive ? 'Deactivate seller (hides products)' : 'Activate seller'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5 py-3 border-t border-b border-slate-100 text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Region:</span>
                        <span className="font-bold uppercase truncate max-w-[140px] text-right">{seller.region || 'Lebanon'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Linked Products:</span>
                        <span className="font-black text-indigo-600">{productCount} products</span>
                      </div>
                      {seller.contactPhone && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">WhatsApp:</span>
                          <span className="font-bold truncate max-w-[140px] text-right">{seller.contactPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      seller.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {seller.isActive ? 'Active Storefront' : 'Inactive / Hidden'}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(seller)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                        title="Edit seller"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(seller.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Delete seller"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 space-y-6 shadow-xs">
          <div>
            <h3 className="text-lg font-black text-slate-900">CSV Inventory Bulk Import & Template Export</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Download your current catalog template, edit prices or stock in Excel, and re-import via CSV with dry-run preview validation.
            </p>
          </div>

          {/* Quick Target Seller & Fallback Category Mapping */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-indigo-600" />
                <span>Quick Supplier Assignment & Fallbacks</span>
              </span>
              <span className="text-[10px] text-indigo-600 font-medium">Auto-resolves missing or unmapped CSV columns</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Seller / Supplier:
                </label>
                <select
                  value={targetSellerId}
                  onChange={(e) => handleTargetSellerSelect(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
                >
                  <option value="auto">⚡ Auto-Detect from CSV (by ID, Name, or Slug)</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameEn} ({s.id})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Select a seller here to automatically link all imported items to that vendor.
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Default Fallback Category:
                </label>
                <select
                  value={fallbackCategoryId}
                  onChange={(e) => handleFallbackCategorySelect(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
                >
                  <option value="auto">⚡ Auto-Detect from CSV</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} ({c.id})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Used if the CSV row has a blank or unrecognized category.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <button
              onClick={() => {
                downloadFullMasterReport(products, sellers, orders);
                showToast('Full Master Report downloaded successfully (Products, Sellers, Stock & Sales)', 'success');
              }}
              className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black transition-all cursor-pointer inline-flex items-center gap-2 shadow-2xs"
              title="Download 360° master dataset"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>Full Master Export</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-2xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>CSV Catalog Template</span>
            </button>

            <button
              onClick={handleDownloadSellersReport}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-2xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Sellers Directory CSV</span>
            </button>

            <div className="flex-1"></div>

            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Select CSV File</span>
            </button>
          </div>

          {importFile && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-sm text-slate-900">Dry-Run Preview: {importFile.name}</h4>
                  <p className="text-xs text-slate-500">
                    {previewRows.length} rows detected ({previewRows.filter(r => r.issues.length === 0).length} valid, {previewRows.filter(r => r.issues.length > 0).length} with issues)
                  </p>
                </div>
                <button
                  onClick={handleCommitImport}
                  disabled={isImporting || previewRows.filter(r => r.issues.length === 0).length === 0}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2 ${
                    previewRows.filter(r => r.issues.length === 0).length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed w-full sm:w-auto'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm w-full sm:w-auto'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isImporting
                      ? 'Committing...'
                      : previewRows.filter(r => r.issues.length === 0).length > 0
                        ? `Commit ${previewRows.filter(r => r.issues.length === 0).length} Valid ${previewRows.filter(r => r.issues.length === 0).length === 1 ? 'Row' : 'Rows'}`
                        : 'No Valid Rows'}
                  </span>
                </button>
              </div>

              {previewRows.some(r => r.issues.length > 0) && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Validation errors found:</span> Some rows contain missing data or unknown `seller_id` or `category` IDs. Fix them in CSV before committing.
                  </div>
                </div>
              )}

              <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 sticky top-0 text-slate-700 font-bold">
                    <tr>
                      <th className="py-3 px-4">Row</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Assigned Seller</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Issues / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className={row.issues.length > 0 ? 'bg-rose-50/50' : 'bg-white'}>
                        <td className="py-3 px-4 text-slate-500 font-bold">{row.rowNum}</td>
                        <td className="py-3 px-4 font-mono text-slate-700">{row.sku}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                        <td className="py-3 px-4 text-indigo-700 font-medium">{row.sellerName}</td>
                        <td className="py-3 px-4 text-slate-600">{row.categoryName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.action === 'Create' ? 'bg-sky-50 text-sky-700' : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {row.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {row.issues.length > 0 ? (
                            <span className="text-rose-600 font-bold">{row.issues.join(', ')}</span>
                          ) : (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <div className="font-black text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Import Completed Successfully!
              </div>
              <p>Created: <strong className="font-black">{importResult.created}</strong> new products.</p>
              <p>Updated: <strong className="font-black">{importResult.updated}</strong> existing products.</p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Seller Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">
                {editingSeller ? 'Edit Seller Details' : 'Register New Seller'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSeller} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">English Name *</label>
                <input
                  type="text"
                  required
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  placeholder="e.g. Chouf Eco Soap"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Arabic Name</label>
                <input
                  type="text"
                  value={formNameAr}
                  onChange={(e) => setFormNameAr(e.target.value)}
                  placeholder="e.g. صابون الشوف البيئي"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Region</label>
                  <select
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="beirut">Beirut</option>
                    <option value="mount_lebanon">Mount Lebanon</option>
                    <option value="north">North Lebanon</option>
                    <option value="south">South Lebanon</option>
                    <option value="bekaa">Bekaa</option>
                    <option value="chouf">Chouf</option>
                    <option value="byblos">Byblos</option>
                    <option value="tripoli">Tripoli</option>
                    <option value="zahle">Zahle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+961 3 123 456"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveSeller"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="isActiveSeller" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Active Storefront (Products are visible to customers)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  {editingSeller ? 'Save Changes' : 'Create Seller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Reassign Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-black text-slate-900">Reassign Products Before Deleting</h3>
            <p className="text-xs text-slate-600">
              There are <strong className="text-indigo-600">{products.filter(p => p.sellerId === deleteTargetId).length}</strong> products linked to this seller. Choose a new seller to reassign them to:
            </p>
            <select
              value={reassignTargetId}
              onChange={(e) => setReassignTargetId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              {sellers.filter(s => s.id !== deleteTargetId).map(s => (
                <option key={s.id} value={s.id}>{s.nameEn}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteWithReassign}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Reassign & Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
