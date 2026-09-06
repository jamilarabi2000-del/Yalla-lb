import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteContent } from '../types';
import { db, IS_FIREBASE_ENABLED } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { DEFAULT_SITE_CONTENT } from '../data/cmsContent';

export interface CmsContextType {
  siteContent: SiteContent;
  updateSiteContent: (content: Partial<SiteContent>) => Promise<void>;
  isCmsLoading: boolean;
}

const CmsContext = createContext<CmsContextType | undefined>(undefined);

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteContent, setSiteContent] = useState<SiteContent>(() => {
    try {
      const saved = localStorage.getItem('yallalb_site_content');
      return saved ? JSON.parse(saved) : DEFAULT_SITE_CONTENT;
    } catch {
      return DEFAULT_SITE_CONTENT;
    }
  });
  const [isCmsLoading, setIsCmsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if we are inside a CMS live preview iframe
    const isCmsPreview = typeof window !== 'undefined' && 
      (window.location.search.includes('cmsPreview=1') || window.name === 'cms-preview-frame');

    if (isCmsPreview) {
      setIsCmsLoading(false);
      return;
    }

    if (!IS_FIREBASE_ENABLED || !db) {
      setIsCmsLoading(false);
      return;
    }

    try {
      const cmsRef = doc(db, 'cms', 'main');
      const unsub = onSnapshot(cmsRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<SiteContent>;
          setSiteContent(prev => ({
            ...prev,
            ...data
          }));
          try {
            localStorage.setItem('yallalb_site_content', JSON.stringify({ ...DEFAULT_SITE_CONTENT, ...data }));
          } catch {}
        }
        setIsCmsLoading(false);
      }, () => setIsCmsLoading(false));

      return () => unsub();
    } catch {
      setIsCmsLoading(false);
    }
  }, []);

  const updateSiteContent = async (content: Partial<SiteContent>): Promise<void> => {
    const updated = { ...siteContent, ...content };
    setSiteContent(updated);
    try {
      localStorage.setItem('yallalb_site_content', JSON.stringify(updated));
    } catch {}

    if (IS_FIREBASE_ENABLED && db) {
      try {
        await setDoc(doc(db, 'cms', 'main'), content, { merge: true });
      } catch (err) {
        console.error('[CmsContext] Failed to persist siteContent to Firestore:', err);
        throw err;
      }
    }
  };

  return (
    <CmsContext.Provider value={{
      siteContent,
      updateSiteContent,
      isCmsLoading
    }}>
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) {
    throw new Error('useCms must be used within a CmsProvider');
  }
  return context;
};
