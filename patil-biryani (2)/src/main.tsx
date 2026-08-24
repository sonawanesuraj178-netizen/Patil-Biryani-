import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAutoUpdateMonitor } from './utils/versionCheck';

// Register Service Worker and initialize real-time auto-updater for installed Mobile Apps & Desktops
if ('serviceWorker' in navigator) {
  // Service Workers operate best in top-level windows; in sandboxed iframes we handle errors gracefully
  const isTopWindow = (() => {
    try {
      return window.self === window.top;
    } catch {
      return false;
    }
  })();

  if (isTopWindow || location.protocol === 'https:' || location.hostname === 'localhost') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => {
          // Check for update safely
          try {
            registration.update().catch(() => {});
          } catch {}
        })
        .catch((err) => {
          // Non-critical: app continues in normal web mode
          console.debug('ServiceWorker registration omitted:', err);
        });
    });
  }
}

// Start continuous background version monitoring
initAutoUpdateMonitor();

// Capture PWA Install Prompt globally
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-install-ready'));
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

