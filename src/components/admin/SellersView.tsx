import React, { useState, useRef } from 'react';
import { sanitizeRowForCsv } from '../../utils/csvSafe';
import { useShop } from '../../context/ShopContext';
import { Seller, Product } from '../../types';
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
import { checkDuplicateSellerItemCode } from '../../lib/productValidation';
import { normalizeLebanesePhone, isValidLebanesePhone } from '../../utils/phoneUtils';
import { initializeApp, deleteApp } from 'firebase/app';
import { 
  getAuth as getSecondaryAuth, 
  createUserWithEmailAndPassword as createSecondaryUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, firebaseConfig } from '../../firebase';

const LEBANON_GOVERNORATES_DATA: Record<string, { nameEn: string; districts: string[] }> = {
  akkar: {
    nameEn: 'Akkar Governorate',
    districts: ['Akkar']
  },
  baalbek_hermel: {
    nameEn: 'Baalbek-Hermel Governorate',
    districts: ['Baalbek', 'Hermel']
  },
  beirut: {
    nameEn: 'Beirut Governorate',
    districts: ['Beirut City']
  },
  bekaa: {
    nameEn: 'Beqaa Governorate',
    districts: ['Zahlé', 'Western Beqaa', 'Rashaya']
  },
  keserwan_jbeil: {
    nameEn: 'Keserwan-Jbeil Governorate',
    districts: ['Keserwan', 'Byblos (Jbeil)']
  },
  mount_lebanon: {
    nameEn: 'Mount Lebanon Governorate',
    districts: ['Baabda', 'Aley', 'Chouf', 'Matn (Metn)']
  },
  nabatieh: {
    nameEn: 'Nabatieh Governorate',
    districts: ['Nabatieh', 'Bint Jbeil', 'Marjeyoun', 'Hasbaya']
  },
  north: {
    nameEn: 'North Governorate',
    districts: ['Tripoli', 'Batroun', 'Bsharri', 'Koura', 'Miniyeh-Danniyeh', 'Zgharta', 'Akkar']
  },
  south: {
    nameEn: 'South Governorate',
    districts: ['Sidon (Saida)', 'Tyre', 'Jezzine']
  }
};

const isProductLinkedToSeller = (p: Product, seller: Seller) => {
  if (p.sellerId && seller.id && p.sellerId.toLowerCase() === seller.id.toLowerCase()) return true;
  const pSeller = (p.seller || p.artisan || '').trim().toLowerCase();
  const sName = seller.nameEn.trim().toLowerCase();
  if (pSeller && sName && pSeller === sName) return true;
  return false;
};

export const SellersView: React.FC = () => {
  const { sellers, addSeller, updateSeller, toggleSellerActive, deleteSeller, bulkImportProducts, products, orders = [], categories, showToast } = useShop();

  const [activeSubTab, setActiveSubTab] = useState<'sellers' | 'import'>('sellers');
  const [searchQuery, setSearchQuery] = useState('');
  const [sellerStatusFilter, setSellerStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);

  // Form state
  const [formSellerCode, setFormSellerCode] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formGovernorate, setFormGovernorate] = useState('mount_lebanon');
  const [formDistrict, setFormDistrict] = useState('Chouf');
  const [formVillage, setFormVillage] = useState('');
  const [formExactAddress, setFormExactAddress] = useState('');
  const [formRegion, setFormRegion] = useState('mount_lebanon');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const handleGovernorateChange = (gov: string) => {
    setFormGovernorate(gov);
    setFormRegion(gov);
    const districts = LEBANON_GOVERNORATES_DATA[gov]?.districts || [];
    setFormDistrict(districts[0] || '');
  };

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

  // Account management state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountTargetSeller, setAccountTargetSeller] = useState<Seller | null>(null);
  const [accountEmailInput, setAccountEmailInput] = useState('');
  const [accountPhoneInput, setAccountPhoneInput] = useState('');
  const [accountPasswordInput, setAccountPasswordInput] = useState('');
  const [isAccountActionLoading, setIsAccountActionLoading] = useState(false);

  const handleOpenAccountModal = (seller: Seller) => {
    setAccountTargetSeller(seller);
    setAccountEmailInput(seller.accountEmail || seller.contactEmail || '');
    setAccountPhoneInput(seller.contactPhone || '');
    setAccountPasswordInput('');
    setIsAccountModalOpen(true);
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountTargetSeller) return;
    if (!accountEmailInput.trim()) {
      showToast('Please enter an email address for this seller.', 'warning');
      return;
    }
    if (!accountPhoneInput.trim()) {
      showToast('Please enter a mobile phone number for this seller.', 'warning');
      return;
    }
    if (accountPasswordInput.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }
    setIsAccountActionLoading(true);
    
    const tempAppName = `TempApp_${accountTargetSeller.id}_${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getSecondaryAuth(tempApp);

    try {
      const userCredential = await createSecondaryUser(tempAuth, accountEmailInput.trim(), accountPasswordInput);
      const uid = userCredential.user.uid;
      const normPhone = normalizeLebanesePhone(accountPhoneInput.trim());
      const formattedPhone = normPhone.isValid ? normPhone.formatted : accountPhoneInput.trim();

      // Create Profile in /users/{uid}
      const userProfileRef = doc(db, 'users', uid);
      await setDoc(userProfileRef, {
        uid,
        name: accountTargetSeller.nameEn,
        firstName: accountTargetSeller.nameEn.split(' ')[0] || accountTargetSeller.nameEn,
        lastName: accountTargetSeller.nameEn.split(' ').slice(1).join(' ') || '',
        email: accountEmailInput.trim(),
        phone: formattedPhone,
        avatar: accountTargetSeller.logoUrl || '',
        defaultGovernorate: accountTargetSeller.governorate || '',
        defaultCity: accountTargetSeller.village || '',
        defaultAddress: accountTargetSeller.exactAddress || '',
        role: 'seller',
        sellerId: accountTargetSeller.id,
        createdAt: new Date().toISOString()
      });

      // Update Seller document
      await updateSeller(accountTargetSeller.id, {
        hasAccount: true,
        accountEmail: accountEmailInput.trim(),
        contactPhone: formattedPhone,
        accountUid: uid
      });

      showToast(`Successfully created login account for "${accountTargetSeller.nameEn}"!`, 'success');
      setIsAccountModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to create seller login account.', 'warning');
    } finally {
      setIsAccountActionLoading(false);
      try {
        await deleteApp(tempApp);
      } catch {}
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      showToast(`A secure password reset link has been dispatched to ${email}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send password reset email.', 'warning');
    }
  };

  const handleDeleteAccountConfirm = async (seller: Seller) => {
    if (!seller.accountUid) return;
    if (window.confirm(`Are you sure you want to revoke account access for "${seller.nameEn}"? They will no longer be able to log in to their dashboard.`)) {
      try {
        // Delete Profile in /users/{uid}
        const userProfileRef = doc(db, 'users', seller.accountUid);
        await deleteDoc(userProfileRef);

        // Update Seller document
        await updateSeller(seller.id, {
          hasAccount: false,
          accountEmail: '',
          accountUid: ''
        });

        showToast(`Revoked access credentials for "${seller.nameEn}".`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to revoke account.', 'warning');
      }
    }
  };

  const filteredSellers = sellers.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    const linkedProducts = products.filter(p => isProductLinkedToSeller(p, s));
    const matchesInfo = s.nameEn.toLowerCase().includes(q) ||
      (s.nameAr && s.nameAr.includes(q)) ||
      s.id.toLowerCase().includes(q) ||
      (s.sellerCode && s.sellerCode.toLowerCase().includes(q)) ||
      (s.contactEmail && s.contactEmail.toLowerCase().includes(q)) ||
      (s.accountEmail && s.accountEmail.toLowerCase().includes(q)) ||
      (s.contactPhone && s.contactPhone.toLowerCase().includes(q));

    const matchesProduct = linkedProducts.some(p =>
      (p.sellerItemCode && p.sellerItemCode.toLowerCase().includes(q)) ||
      p.id.toLowerCase().includes(q) ||
      (p.name && p.name.toLowerCase().includes(q))
    );

    const matchesSearch = !q || matchesInfo || matchesProduct;

    if (sellerStatusFilter === 'active') return matchesSearch && s.isActive;
    if (sellerStatusFilter === 'inactive') return matchesSearch && !s.isActive;
    return matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingSeller(null);
    const nextCodeNum = sellers.length + 101;
    setFormSellerCode(`SLR-${nextCodeNum}`);
    setFormNameEn('');
    setFormNameAr('');
    setFormGovernorate('mount_lebanon');
    setFormDistrict('Chouf');
    setFormVillage('');
    setFormExactAddress('');
    setFormRegion('mount_lebanon');
    setFormPhone('');
    setFormEmail('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const resolveGovernorateAndDistrict = (seller: Seller) => {
    if (seller.governorate && LEBANON_GOVERNORATES_DATA[seller.governorate]) {
      return {
        governorate: seller.governorate,
        district: seller.district || LEBANON_GOVERNORATES_DATA[seller.governorate].districts[0]
      };
    }
    const reg = (seller.region || '').toLowerCase();
    if (reg.includes('beirut')) return { governorate: 'beirut', district: 'Beirut City' };
    if (reg.includes('koura') || reg.includes('batroun') || reg.includes('tripoli') || reg.includes('bsharre') || reg.includes('zgharta')) {
      return { governorate: 'north', district: seller.district || 'Tripoli' };
    }
    if (reg.includes('akkar')) {
      return { governorate: 'akkar', district: 'Akkar' };
    }
    if (reg.includes('chouf') || reg.includes('mount') || reg.includes('baskinta') || reg.includes('baabda') || reg.includes('aley') || reg.includes('matn') || reg.includes('metn')) {
      return { governorate: 'mount_lebanon', district: reg.includes('chouf') ? 'Chouf' : reg.includes('aley') ? 'Aley' : reg.includes('baabda') ? 'Baabda' : 'Matn (Metn)' };
    }
    if (reg.includes('kesrouan') || reg.includes('byblos') || reg.includes('jbeil')) {
      return { governorate: 'keserwan_jbeil', district: reg.includes('byblos') || reg.includes('jbeil') ? 'Byblos (Jbeil)' : 'Keserwan' };
    }
    if (reg.includes('zahle') || reg.includes('bekaa') || reg.includes('rashaya')) {
      return { governorate: 'bekaa', district: reg.includes('zahle') ? 'Zahlé' : 'Rashaya' };
    }
    if (reg.includes('sidon') || reg.includes('tyre') || reg.includes('sarafand') || reg.includes('jezzine') || reg.includes('south')) {
      return { governorate: 'south', district: reg.includes('tyre') ? 'Tyre' : reg.includes('jezzine') ? 'Jezzine' : 'Sidon (Saida)' };
    }
    if (reg.includes('nabatieh') || reg.includes('bint') || reg.includes('marjeyoun') || reg.includes('hasbaya')) {
      return { governorate: 'nabatieh', district: 'Nabatieh' };
    }
    if (reg.includes('baalbek') || reg.includes('hermel')) {
      return { governorate: 'baalbek_hermel', district: reg.includes('hermel') ? 'Hermel' : 'Baalbek' };
    }
    return { governorate: 'mount_lebanon', district: 'Chouf' };
  };

  const handleOpenEdit = (s: Seller) => {
    setEditingSeller(s);
    setFormSellerCode(s.sellerCode || 'SLR-101');
    setFormNameEn(s.nameEn);
    setFormNameAr(s.nameAr || '');
    const resolved = resolveGovernorateAndDistrict(s);
    setFormGovernorate(resolved.governorate);
    setFormDistrict(resolved.district);
    setFormVillage(s.village || (s.region && !['beirut', 'mount_lebanon', 'north', 'south', 'bekaa', 'nabatieh', 'baalbek_hermel', 'keserwan_jbeil', 'akkar'].includes(s.region.toLowerCase()) ? s.region : ''));
    setFormExactAddress(s.exactAddress || '');
    setFormRegion(resolved.governorate);
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
      const trimmedEmail = formEmail.trim().toLowerCase();
      if (editingSeller) {
        await updateSeller(editingSeller.id, {
          sellerCode: formSellerCode.trim() || undefined,
          nameEn: formNameEn.trim(),
          nameAr: formNameAr.trim(),
          governorate: formGovernorate,
          district: formDistrict,
          village: formVillage.trim(),
          exactAddress: formExactAddress.trim(),
          region: formGovernorate,
          contactPhone: formPhone.trim(),
          contactEmail: trimmedEmail,
          accountEmail: editingSeller.hasAccount ? (trimmedEmail || editingSeller.accountEmail) : (trimmedEmail || undefined),
          isActive: formIsActive
        });
        showToast('Seller updated successfully!');
      } else {
        await addSeller({
          sellerCode: formSellerCode.trim() || undefined,
          nameEn: formNameEn.trim(),
          nameAr: formNameAr.trim(),
          governorate: formGovernorate,
          district: formDistrict,
          village: formVillage.trim(),
          exactAddress: formExactAddress.trim(),
          region: formGovernorate,
          contactPhone: formPhone.trim(),
          contactEmail: trimmedEmail,
          accountEmail: trimmedEmail || undefined,
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
    const targetSeller = sellers.find(s => s.id === sellerId);
    const affected = targetSeller ? products.filter(p => isProductLinkedToSeller(p, targetSeller)) : [];
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
    URL.revokeObjectURL(url);
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
        contact_email: seller.contactEmail || seller.accountEmail || '',
        linked_products_count: products.filter(p => isProductLinkedToSeller(p, seller)).length,
        created_at: seller.createdAt || '',
      }));

      const csv = Papa.unparse(dataToExport.map(sanitizeRowForCsv));
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `yalla_sellers_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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

      const sku = (row.sku || row.product_id || '').toString().trim();
      const isUpdate = sku ? products.some(p => p.id === sku) : false;
      const sellerItemCode = (row.seller_item_code || row.seller_code || row.item_code || '').toString().trim();

      if (sellerItemCode) {
        const dupCheck = checkDuplicateSellerItemCode(sellerItemCode, isUpdate ? sku : null, resolvedSeller?.sellerId, resolvedSeller?.sellerName, products);
        if (dupCheck.isDuplicate) {
          rowIssues.push(`Duplicate seller item code "${sellerItemCode}" for seller "${resolvedSeller?.sellerName || ''}"`);
        }
      }

      parsedPreview.push({
        rowNum,
        sku: sku || '(auto-generated)',
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
                  placeholder="Search by name, seller code, or product code..."
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
              const productCount = products.filter(p => isProductLinkedToSeller(p, seller)).length;
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                            {seller.sellerCode || 'SLR-101'}
                          </span>
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-slate-100 text-slate-500 truncate max-w-[120px]">
                            {seller.id}
                          </span>
                        </div>
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
                        <span className="text-slate-400">Location:</span>
                        <span className="font-bold truncate max-w-[150px] text-right" title={`${seller.village ? seller.village + ', ' : ''}${seller.district ? seller.district + ' • ' : ''}${LEBANON_GOVERNORATES_DATA[seller.governorate || seller.region || '']?.nameEn || seller.governorate || seller.region || 'Lebanon'}`}>
                          {seller.village ? `${seller.village}, ` : ''}{seller.district ? `${seller.district}` : (LEBANON_GOVERNORATES_DATA[seller.governorate || seller.region || '']?.nameEn || seller.governorate || seller.region || 'Lebanon')}
                        </span>
                      </div>
                      {seller.exactAddress && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Address:</span>
                          <span className="font-medium truncate max-w-[150px] text-right" title={seller.exactAddress}>{seller.exactAddress}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Linked Products:</span>
                        <span className="font-black text-indigo-600">{productCount} products</span>
                      </div>
                      {seller.contactPhone && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">WhatsApp:</span>
                          <span className="font-bold truncate max-w-[140px] text-right font-mono text-[11px]">{seller.contactPhone}</span>
                        </div>
                      )}
                      {(seller.contactEmail || seller.accountEmail) && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Email:</span>
                          <span className="font-medium truncate max-w-[150px] text-right font-mono text-[11px] text-indigo-600" title={seller.contactEmail || seller.accountEmail}>
                            {seller.contactEmail || seller.accountEmail}
                          </span>
                        </div>
                      )}
                      
                      {/* Admin Credentials Manager for Merchant Portal Access */}
                      <div className="pt-2.5 mt-2.5 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Merchant Portal Access</span>
                        </div>
                        {seller.hasAccount ? (
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-800 truncate flex items-center gap-1.5" title={seller.accountEmail}>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                              <span className="truncate max-w-[170px]">{seller.accountEmail}</span>
                            </p>
                            <div className="flex gap-1 pt-1">
                              <button
                                onClick={() => handleSendPasswordReset(seller.accountEmail || '')}
                                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[9px] font-bold transition-all cursor-pointer"
                                title="Send official password reset email link"
                              >
                                Reset Pass
                              </button>
                              <button
                                onClick={() => handleDeleteAccountConfirm(seller)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[9px] font-bold transition-all cursor-pointer"
                                title="Revoke access and unlink account credentials"
                              >
                                Revoke Account
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 italic">No access configured</p>
                            <button
                              onClick={() => handleOpenAccountModal(seller)}
                              className="w-full mt-1.5 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <span>Configure Credentials</span>
                            </button>
                          </div>
                        )}
                      </div>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Unique Seller Code *</label>
                <input
                  type="text"
                  required
                  value={formSellerCode}
                  onChange={(e) => setFormSellerCode(e.target.value)}
                  placeholder="e.g. SLR-101"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 font-mono uppercase"
                />
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Governorate *</label>
                  <select
                    value={formGovernorate}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {Object.entries(LEBANON_GOVERNORATES_DATA).map(([key, g]) => (
                      <option key={key} value={key}>{g.nameEn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District (Qada) *</label>
                  <select
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {(LEBANON_GOVERNORATES_DATA[formGovernorate]?.districts || []).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Village / Town *</label>
                  <input
                    type="text"
                    required
                    value={formVillage}
                    onChange={(e) => setFormVillage(e.target.value)}
                    placeholder="e.g. Deir El Qamar"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exact Address / Street / Building</label>
                  <input
                    type="text"
                    value={formExactAddress}
                    onChange={(e) => setFormExactAddress(e.target.value)}
                    placeholder="e.g. Main Street, Cooperatives Bldg"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Contact Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. +961 70 123 456"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seller Gmail / Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. artisan@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 -mt-2">
                The seller email is used for order communications and merchant portal authentication.
              </p>

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
              There are <strong className="text-indigo-600">{products.filter(p => {
                const target = sellers.find(s => s.id === deleteTargetId);
                return target ? isProductLinkedToSeller(p, target) : false;
              }).length}</strong> products linked to this seller. Choose a new seller to reassign them to:
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

      {/* Configure Seller Access Modal */}
      {isAccountModalOpen && accountTargetSeller && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">Setup Supplier Credentials</h3>
              <button 
                onClick={() => setIsAccountModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">{accountTargetSeller.sellerCode || 'Supplier'}</span>
              <h4 className="text-sm font-black text-slate-900">{accountTargetSeller.nameEn}</h4>
              <p className="text-xs text-slate-500">Creating login credentials grants the artisan direct portal access to modify their stock, update pricing, write craft stories, and track their dispatches.</p>
            </div>

            <form onSubmit={handleCreateAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Seller Gmail / Email Address *</label>
                <input
                  type="email"
                  required
                  value={accountEmailInput}
                  onChange={(e) => setAccountEmailInput(e.target.value)}
                  placeholder="e.g. artisan@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Seller Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={accountPhoneInput}
                  onChange={(e) => setAccountPhoneInput(e.target.value)}
                  placeholder="e.g. 70 123 456 or +961 70 123456"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Sellers log in using their Gmail, this mobile number, and their password.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={accountPasswordInput}
                  onChange={(e) => setAccountPasswordInput(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAccountActionLoading}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isAccountActionLoading ? 'Creating User...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
