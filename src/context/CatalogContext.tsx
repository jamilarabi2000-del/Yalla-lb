import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CategoryItem, Seller, DiscountRule, ProductBundle } from '../types';
import { db, IS_FIREBASE_ENABLED } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { productConverter, sellerConverter, categoryConverter, discountConverter, bundleConverter } from '../lib/converters';
import { INITIAL_PRODUCTS } from '../data/products';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { DEFAULT_SELLERS } from '../data/sellers';
import { LEBANON_REGIONS, GovernorateOption } from '../data/regions';

export interface CatalogContextType {
  products: Product[];
  categories: CategoryItem[];
  sellers: Seller[];
  regions: GovernorateOption[];
  discountRules: DiscountRule[];
  productBundles: ProductBundle[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedOrigin: string;
  setSelectedOrigin: (origin: string) => void;
  selectedSellerId: string;
  setSelectedSellerId: (sellerId: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  filteredProducts: Product[];
  isLoadingCatalog: boolean;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [sellers, setSellers] = useState<Seller[]>(DEFAULT_SELLERS);
  const [regions] = useState<GovernorateOption[]>(LEBANON_REGIONS);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [productBundles, setProductBundles] = useState<ProductBundle[]>([]);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');
  const [selectedSellerId, setSelectedSellerId] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);

  useEffect(() => {
    if (!IS_FIREBASE_ENABLED || !db) {
      setIsLoadingCatalog(false);
      return;
    }

    const unsubs: (() => void)[] = [];

    // Products
    try {
      const qProd = query(collection(db, 'products').withConverter(productConverter), orderBy('displayOrder', 'asc'));
      const unsubProd = onSnapshot(qProd, (snap) => {
        if (!snap.empty) {
          setProducts(snap.docs.map(d => d.data()));
        }
        setIsLoadingCatalog(false);
      }, () => setIsLoadingCatalog(false));
      unsubs.push(unsubProd);
    } catch {
      setIsLoadingCatalog(false);
    }

    // Categories
    try {
      const qCat = query(collection(db, 'categories').withConverter(categoryConverter), orderBy('displayOrder', 'asc'));
      const unsubCat = onSnapshot(qCat, (snap) => {
        if (!snap.empty) {
          setCategories(snap.docs.map(d => d.data()));
        }
      }, () => {});
      unsubs.push(unsubCat);
    } catch {}

    // Sellers
    try {
      const qSellers = collection(db, 'sellers').withConverter(sellerConverter);
      const unsubSellers = onSnapshot(qSellers, (snap) => {
        if (!snap.empty) {
          setSellers(snap.docs.map(d => d.data()));
        }
      }, () => {});
      unsubs.push(unsubSellers);
    } catch {}

    // Discounts
    try {
      const qDisc = collection(db, 'discounts').withConverter(discountConverter);
      const unsubDisc = onSnapshot(qDisc, (snap) => {
        setDiscountRules(snap.docs.map(d => d.data()));
      }, () => {});
      unsubs.push(unsubDisc);
    } catch {}

    // Bundles
    try {
      const qBundles = collection(db, 'product_bundles').withConverter(bundleConverter);
      const unsubBundles = onSnapshot(qBundles, (snap) => {
        setProductBundles(snap.docs.map(d => d.data()));
      }, () => {});
      unsubs.push(unsubBundles);
    } catch {}

    return () => {
      unsubs.forEach(u => u());
    };
  }, []);

  const filteredProducts = products.filter(p => {
    if (p.isPublished === false) return false;
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (selectedOrigin !== 'all' && p.origin !== selectedOrigin) return false;
    if (selectedSellerId !== 'all' && (p.sellerId !== selectedSellerId && p.seller !== selectedSellerId)) return false;
    if (p.priceUSD < priceRange[0] || p.priceUSD > priceRange[1]) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchArName = p.arabicName?.toLowerCase().includes(q);
      const matchArtisan = p.artisan?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchTags = (p.tags || []).some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchArName && !matchArtisan && !matchDesc && !matchTags) return false;
    }

    return true;
  });

  return (
    <CatalogContext.Provider value={{
      products,
      categories,
      sellers,
      regions,
      discountRules,
      productBundles,
      activeCategory,
      setActiveCategory,
      searchQuery,
      setSearchQuery,
      selectedOrigin,
      setSelectedOrigin,
      selectedSellerId,
      setSelectedSellerId,
      priceRange,
      setPriceRange,
      sortBy,
      setSortBy,
      filteredProducts,
      isLoadingCatalog
    }}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
