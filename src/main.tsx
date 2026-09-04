import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully absorb transient IndexedDB / database closing errors caused by iframe backgrounding/hiding
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = (reason?.message || String(reason || '')).toLowerCase();
    if (
      msg.includes('database is closing') ||
      msg.includes('database connection is closing') ||
      msg.includes('closing/hidden') ||
      msg.includes('client is offline') ||
      msg.includes('the database connection was closed')
    ) {
      // Prevent noisy crash on tab switch / iframe hide
      event.preventDefault();
      console.warn('[Yalla.lb] Handled transient background database state:', reason);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = (event?.message || '').toLowerCase();
    if (
      msg.includes('database is closing') ||
      msg.includes('database connection is closing') ||
      msg.includes('closing/hidden')
    ) {
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
