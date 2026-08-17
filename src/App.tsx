import React, { useEffect } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ProductsView } from './components/ProductsView';
import { CheckoutView } from './components/CheckoutView';
import { AccountView } from './components/AccountView';
import { AdminView } from './components/AdminView';
import { AdminErrorBoundary } from './components/AdminErrorBoundary';
import { ProductDetailView } from './components/ProductDetailView';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab, selectedProductDetail, openProductDetail, setSelectedProductDetail, products, toast, siteContent } = useShop();

  // Dynamically update SEO metadata
  useEffect(() => {
    if (siteContent?.seo) {
      if (siteContent.seo.title) {
        document.title = siteContent.seo.title;
      }
      if (siteContent.seo.description) {
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', siteContent.seo.description);
      }
    }
  }, [siteContent?.seo]);

  // On initial mount, ensure current history entry has depth
  useEffect(() => {
    if (window.history && (!window.history.state || typeof window.history.state.depth !== 'number')) {
      window.history.replaceState({ appNav: true, depth: 0 }, '', window.location.pathname);
    }
  }, []);

  // Sync route / path from URL on initial mount & browser back/forward buttons
  useEffect(() => {
    const syncRouteFromUrl = () => {
      const path = window.location.pathname.replace(/^\/+/, '');
      const searchParams = new URLSearchParams(window.location.search);
      const isAdminQuery = searchParams.get('admin') === 'true' || searchParams.has('admin');

      if (isAdminQuery || path === 'admin' || path === 'admin.html') {
        setSelectedProductDetail(null);
        setActiveTab('admin');
      } else if (path.startsWith('product/')) {
        const prodId = path.replace('product/', '');
        const foundProduct = products.find(p => p.id === prodId);
        if (foundProduct) {
          openProductDetail(foundProduct);
        }
      } else if (path === 'products' || path === 'checkout' || path === 'account' || path === 'home' || path === '') {
        const targetTab = (path === '' || path === 'home' ? 'home' : path) as any;
        if (activeTab !== targetTab) {
          setSelectedProductDetail(null);
          setActiveTab(targetTab);
        }
      }
    };

    // Execute immediately on initial mount
    syncRouteFromUrl();

    window.addEventListener('popstate', syncRouteFromUrl);
    return () => window.removeEventListener('popstate', syncRouteFromUrl);
  }, [products, openProductDetail, setActiveTab, setSelectedProductDetail]);

  // Sync browser URL when activeTab or selectedProductDetail changes
  useEffect(() => {
    let targetPath = activeTab === 'home' ? '' : activeTab;
    if (activeTab === 'product_detail' && selectedProductDetail) {
      targetPath = `product/${selectedProductDetail.id}`;
    }
    const targetUrl = targetPath === '' || targetPath === 'home' ? '/' : `/${targetPath}`;

    if (window.location.pathname !== targetUrl && window.history) {
      const currentDepth = (window.history.state && typeof window.history.state.depth === 'number')
        ? window.history.state.depth
        : 0;
      window.history.pushState({ appNav: true, depth: currentDepth + 1 }, '', targetUrl);
    }
  }, [activeTab, selectedProductDetail]);

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] text-slate-100 selection:bg-[#c5a059] selection:text-[#1a1a2e] font-sans antialiased">
      
      {/* Hidden SEO Snapshot strictly preserving requested markup & links */}
      <div 
        data-seo-source="builder" 
        id="seo-snapshot" 
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        <main>
          <header>
            <h1>Yalla.lb</h1>
            <p>
              A premium, high-velocity marketplace bridging Lebanese craftsmanship with modern digital commerce for a seamless, hyper-local shopping experience.
            </p>
          </header>
          <nav aria-label="Pages">
            <h2>Pages</h2>
            <ul>
              <li>
                <a href="/products">Products</a>
                — Products on Yalla.lb. A premium, high-velocity marketplace bridging Lebanese craftsmanship with modern.
              </li>
              <li>
                <a href="/checkout">Checkout</a>
                — Checkout on Yalla.lb. A premium, high-velocity marketplace bridging Lebanese craftsmanship with modern.
              </li>
              <li>
                <a href="/account">Account</a>
                — Account on Yalla.lb. A premium, high-velocity marketplace bridging Lebanese craftsmanship with modern.
              </li>
              <li>
                <a href="/admin">Admin</a>
                — Admin on Yalla.lb. A premium, high-velocity marketplace bridging Lebanese craftsmanship with modern.
              </li>
            </ul>
          </nav>
        </main>
      </div>

      {/* Main Top Navigation Header */}
      {activeTab !== 'admin' && <Navbar />}

      {/* Dynamic View Display */}
      <main className="flex-1">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'products' && <ProductsView />}
        {activeTab === 'product_detail' && <ProductDetailView />}
        {activeTab === 'checkout' && <CheckoutView />}
        {activeTab === 'account' && <AccountView />}
        {activeTab === 'admin' && (
          <AdminErrorBoundary>
            <AdminView />
          </AdminErrorBoundary>
        )}
      </main>

      {/* Modals & Overlays */}
      <ProductModal />
      <CartDrawer />

      {/* Global Interactive Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-[#1a2e24] border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
              : toast.type === 'warning'
              ? 'bg-[#2e241a] border-[#c5a059]/40 text-[#f1d592] shadow-amber-950/50'
              : 'bg-[#1a1a2e] border-[#c5a059]/30 text-slate-200 shadow-black/60'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-[#c5a059] flex-shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Lebanese Craftsmanship Footer */}
      {activeTab !== 'admin' && <Footer />}

    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <MainAppContent />
    </ShopProvider>
  );
}
