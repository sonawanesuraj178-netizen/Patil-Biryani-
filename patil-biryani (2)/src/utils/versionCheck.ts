/**
 * Automatic Version & Update Manager for Patil Biryani POS
 * Ensures installed Mobile Apps (PWA/WebAPK), tablets, and desktop instances
 * automatically detect republished versions and update instantly without getting stuck in old cache.
 */

export interface VersionInfo {
  version: string;
  buildTime: number;
  appName: string;
  serverTime: number;
}

export type UpdateListener = (hasUpdate: boolean, latestVersion: VersionInfo | null) => void;

const listeners: Set<UpdateListener> = new Set();
let swRegistration: ServiceWorkerRegistration | null = null;
let currentClientVersion: string | null = null;
let latestDetectedVersion: VersionInfo | null = null;
let isUpdateAvailable = false;
let checkIntervalTimer: any = null;

// Unique client start timestamp or build identifier
export const CLIENT_BUILD_TIMESTAMP = typeof window !== 'undefined' && (window as any).__APP_BUILD_TIME__
  ? (window as any).__APP_BUILD_TIME__
  : Date.now();

/**
 * Initialize the Auto-Update Monitor
 */
export function initAutoUpdateMonitor(onUpdate?: UpdateListener): () => void {
  if (onUpdate) {
    listeners.add(onUpdate);
  }

  if (typeof window === 'undefined') return () => {};

  // Store initial version locally if none exists
  try {
    const savedVer = localStorage.getItem('patil_biryani_app_version');
    if (savedVer) {
      currentClientVersion = savedVer;
    }
  } catch {}

  // 1. Setup Service Worker listeners
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      swRegistration = registration;

      // Check for SW updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[AutoUpdate] New Service Worker installed and waiting!');
              setUpdateAvailable(true, latestDetectedVersion);
            }
          });
        }
      });

      // Periodic SW update check
      try {
        registration.update().catch(() => {});
      } catch {}
    }).catch(() => {});

    // Listen for SW messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_NEW_VERSION_AVAILABLE') {
        console.log('[AutoUpdate] SW notified new version:', event.data);
        setUpdateAvailable(true, event.data.versionInfo);
      }
    });

    // When new SW takes control, notify or reload
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[AutoUpdate] New Service Worker activated - reloading app...');
        window.location.reload();
      }
    });
  }

  // 2. Perform initial server version check
  checkForServerUpdate();

  // 3. Periodic background polling (every 20 seconds)
  if (checkIntervalTimer) clearInterval(checkIntervalTimer);
  checkIntervalTimer = setInterval(() => {
    checkForServerUpdate();
    if (swRegistration) {
      try {
        swRegistration.update().catch(() => {});
      } catch {}
    }
  }, 20000);

  // 4. Check whenever the user returns to the app (focus or visibility changed)
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible' || document.hasFocus()) {
      checkForServerUpdate();
      if (swRegistration) {
        try {
          swRegistration.update().catch(() => {});
        } catch {}
      }
    }
  };

  window.addEventListener('visibilitychange', handleVisibilityOrFocus);
  window.addEventListener('focus', handleVisibilityOrFocus);
  window.addEventListener('online', handleVisibilityOrFocus);

  return () => {
    if (onUpdate) listeners.delete(onUpdate);
    window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    window.removeEventListener('focus', handleVisibilityOrFocus);
    window.removeEventListener('online', handleVisibilityOrFocus);
    if (checkIntervalTimer) clearInterval(checkIntervalTimer);
  };
}

/**
 * Checks the server /api/version endpoint for republishing/build differences
 */
export async function checkForServerUpdate(): Promise<{ hasUpdate: boolean; versionInfo: VersionInfo | null }> {
  try {
    const res = await fetch(`/api/version?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (res.ok) {
      const data: VersionInfo = await res.json();
      latestDetectedVersion = data;

      if (!currentClientVersion) {
        // First load
        currentClientVersion = data.version;
        try {
          localStorage.setItem('patil_biryani_app_version', data.version);
        } catch {}
        return { hasUpdate: false, versionInfo: data };
      }

      // If server version is different from current client version
      if (data.version && data.version !== currentClientVersion) {
        console.log(`[AutoUpdate] Version mismatch! Client: ${currentClientVersion}, Server: ${data.version}`);
        setUpdateAvailable(true, data);
        return { hasUpdate: true, versionInfo: data };
      }
    }
  } catch (e) {
    // Network offline or endpoint unreachable
  }

  return { hasUpdate: isUpdateAvailable, versionInfo: latestDetectedVersion };
}

function setUpdateAvailable(available: boolean, versionInfo: VersionInfo | null) {
  isUpdateAvailable = available;
  if (versionInfo) latestDetectedVersion = versionInfo;

  listeners.forEach((listener) => {
    try {
      listener(available, latestDetectedVersion);
    } catch (e) {
      console.error('Error in update listener:', e);
    }
  });
}

/**
 * Manually trigger update check with user feedback
 */
export async function triggerManualUpdateCheck(): Promise<{
  status: 'updated' | 'already-latest' | 'offline';
  message: string;
  version?: string;
}> {
  try {
    // 1. Tell service worker to check for new sw.js
    if (swRegistration) {
      await swRegistration.update().catch(() => {});
    }

    // 2. Query server version
    const res = await checkForServerUpdate();

    if (res.hasUpdate) {
      return {
        status: 'updated',
        message: 'A newer version has been published! Applying update now...',
        version: res.versionInfo?.version,
      };
    }

    return {
      status: 'already-latest',
      message: 'Your installed app is running the latest published version.',
      version: currentClientVersion || res.versionInfo?.version || '4.5.0',
    };
  } catch (err) {
    return {
      status: 'offline',
      message: 'Could not connect to update server. You can continue working offline.',
    };
  }
}

/**
 * Seamlessly applies the update by activating waiting SW, clearing old caches, and reloading
 */
export async function applyAppUpdate(): Promise<void> {
  if (latestDetectedVersion?.version) {
    try {
      localStorage.setItem('patil_biryani_app_version', latestDetectedVersion.version);
    } catch {}
  }

  // 1. Tell waiting Service Worker to skipWaiting
  if (swRegistration && swRegistration.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // 2. Clear old browser caches
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {}
  }

  // 3. Hard reload without cache
  if (typeof window !== 'undefined') {
    // Clear session storage if needed, preserving local storage data
    window.location.href = window.location.href.split('#')[0];
    window.location.reload();
  }
}

/**
 * Get current client version string
 */
export function getAppVersion(): string {
  return currentClientVersion || '4.5.0';
}
