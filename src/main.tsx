import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully absorb transient IndexedDB / database closing errors caused by iframe backgrounding/hiding
if (typeof window !== 'undefined') {
  const isIgnorableDbError = (err: any) => {
    const msg = (err?.message || err?.name || String(err || '')).toLowerCase();
    return (
      msg.includes('database is closing') ||
      msg.includes('database connection is closing') ||
      msg.includes('closing/hidden') ||
      msg.includes('closing') ||
      msg.includes('hidden') ||
      msg.includes('client is offline') ||
      msg.includes('the database connection was closed') ||
      msg.includes('indexeddb') ||
      msg.includes('abort')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isIgnorableDbError(event?.reason)) {
      // Prevent noisy crash on tab switch / iframe hide
      event.preventDefault();
      console.warn('[Yalla.lb] Handled transient background database state:', event.reason);
    }
  });

  window.addEventListener('error', (event) => {
    if (isIgnorableDbError(event?.error || event?.message)) {
      event.preventDefault();
      console.warn('[Yalla.lb] Handled transient database error:', event.message);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
