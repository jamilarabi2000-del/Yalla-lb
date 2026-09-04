import { SiteContent } from '../types';

export interface CmsSnapshot {
  id: string;
  timestamp: string;
  author: string;
  note?: string;
  changesCount: number;
  data: SiteContent;
}

export interface CmsDiffItem {
  tab: string;
  tabLabel: string;
  path: string;
  label: string;
  before: any;
  after: any;
  type: 'modified' | 'added' | 'removed';
}

const STORAGE_KEY = 'yalla_cms_history_snapshots_v1';

export const getCmsSnapshots = (): CmsSnapshot[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load CMS snapshots:', e);
    return [];
  }
};

export const saveCmsSnapshot = (data: SiteContent, author = 'Admin', note?: string, changesCount = 1): CmsSnapshot => {
  try {
    const snapshots = getCmsSnapshots();
    const newSnapshot: CmsSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      author,
      note: note || 'CMS live update published',
      changesCount,
      data: JSON.parse(JSON.stringify(data))
    };

    // Keep up to 25 recent revisions
    const updated = [newSnapshot, ...snapshots].slice(0, 25);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newSnapshot;
  } catch (e) {
    console.error('Failed to save CMS snapshot:', e);
    return {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      author,
      changesCount,
      data
    };
  }
};

export const deleteCmsSnapshot = (id: string): CmsSnapshot[] => {
  try {
    const snapshots = getCmsSnapshots();
    const updated = snapshots.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete CMS snapshot:', e);
    return getCmsSnapshots();
  }
};

export const clearAllCmsSnapshots = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear snapshots:', e);
  }
};

const TAB_LABELS: Record<string, string> = {
  visibility: 'Section Visibility',
  navbar: 'Navbar & Header',
  hero: 'Hero Banner',
  offers: 'Offers & Promos',
  home: 'Home Page Sections',
  productsPage: 'Catalog Page',
  productDetailPage: 'Product Detail',
  checkoutPage: 'Checkout Page',
  checkoutSuccessPage: 'Checkout Success',
  accountPage: 'Patron Account',
  newsSection: 'News & Press',
  footer: 'Footer & Support',
  socialLinks: 'Social Links',
  customBlocks: 'Custom Visual Blocks',
  seo: 'SEO & SERP',
  theme: 'Theme & Styling'
};

export const computeCmsDiff = (original: Partial<SiteContent> = {}, current: Partial<SiteContent> = {}): CmsDiffItem[] => {
  const diffs: CmsDiffItem[] = [];

  const compareObjects = (origObj: any, currObj: any, tabKey: string, parentPath = '') => {
    if (!origObj && !currObj) return;
    const allKeys = Array.from(new Set([...Object.keys(origObj || {}), ...Object.keys(currObj || {})]));

    for (const key of allKeys) {
      const origVal = origObj ? origObj[key] : undefined;
      const currVal = currObj ? currObj[key] : undefined;
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      const formattedLabel = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/Arabic$/, ' (Arabic)')
        .replace(/Ar$/, ' (Arabic)')
        .replace(/En$/, ' (English)');

      if (typeof currVal === 'object' && currVal !== null && !Array.isArray(currVal)) {
        compareObjects(origVal, currVal, tabKey, currentPath);
      } else if (Array.isArray(currVal) || Array.isArray(origVal)) {
        const origJson = JSON.stringify(origVal || []);
        const currJson = JSON.stringify(currVal || []);
        if (origJson !== currJson) {
          diffs.push({
            tab: tabKey,
            tabLabel: TAB_LABELS[tabKey] || tabKey,
            path: currentPath,
            label: formattedLabel,
            before: origVal,
            after: currVal,
            type: !origVal ? 'added' : !currVal ? 'removed' : 'modified'
          });
        }
      } else if (origVal !== currVal) {
        diffs.push({
          tab: tabKey,
          tabLabel: TAB_LABELS[tabKey] || tabKey,
          path: currentPath,
          label: formattedLabel,
          before: origVal,
          after: currVal,
          type: origVal === undefined ? 'added' : currVal === undefined ? 'removed' : 'modified'
        });
      }
    }
  };

  const topSections = Array.from(new Set([...Object.keys(original || {}), ...Object.keys(current || {})]));
  for (const section of topSections) {
    compareObjects((original as any)[section], (current as any)[section], section);
  }

  return diffs;
};

export const computeCmsDiffs = computeCmsDiff;
