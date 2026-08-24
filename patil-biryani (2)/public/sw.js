// Patil Biryani POS Advanced Service Worker with Instant Auto-Update & Full Offline POS/KDS Operation
const SW_VERSION = 'patil-biryani-v2.6.0';
const CACHE_NAME = 'patil-biryani-app-cache-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
];

// Install: Cache initial static shell safely and skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of STATIC_ASSETS) {
        try {
          const res = await fetch(asset, { cache: 'no-cache' });
          if (res && res.status === 200) {
            await cache.put(asset, res);
          }
        } catch {
          // Non-blocking: continue if individual asset is unavailable
        }
      }
    }).catch(() => {})
  );
});

// Activate: Claim clients immediately and clean up old legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      }),
    ]).catch(() => {})
  );
});

// Message listener for forced update / skip waiting
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data.action === 'skipWaiting')) {
    self.skipWaiting();
  }
});

// Fetch handler:
// 1. Navigation / HTML requests -> NETWORK FIRST, fallback to cached index.html for offline POS & KDS
// 2. API / Sync requests -> NETWORK ONLY (handled by syncEngine offline mutation queue)
// 3. Fonts / External CDNs -> CACHE FIRST with network background revalidation
// 4. Static Assets (JS/CSS/Images) -> STALE-WHILE-REVALIDATE
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests
  if (req.method !== 'GET') return;

  // Never intercept or cache real-time SSE streams or backend API requests
  if (url.pathname.startsWith('/api/') || url.pathname.includes('eventsource') || url.pathname.includes('/sse')) {
    return;
  }

  // Google Fonts & Static CDNs: Cache First with network fallback
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        }).catch(() => cached || Response.error());
      })
    );
    return;
  }

  // 1. HTML / Navigation Request: NETWORK-FIRST with offline SPA Fallback
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html') || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseClone);
              cache.put('/index.html', responseClone.clone());
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback for POS, KDS, Tables, Billing views
          const match = await caches.match(req);
          if (match) return match;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return caches.match('/');
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, SVGs): Stale-While-Revalidate with cache update
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, cache used if present
          return null;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
