/**
 * Service Worker for NH POS Shop PWA
 * Version: v16.4.3
 * Comprehensive Offline Support for GitHub Pages & Netlify
 */
const SW_VERSION = 'v16.4.3';
const CACHE_NAME = 'nh-pos-' + SW_VERSION;

// Core static assets to precache immediately on install
const CORE_ASSETS = [
  './',
  'index.html',
  '404.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon.png',
  'icon1.png',
  'apple-touch-icon.png',
  'icon.svg'
];

// INJECTED_ASSETS will be populated by scripts/ensure-pwa.js with compiled bundle hashes
const INJECTED_ASSETS = [
  /* __BUILD_ASSETS__ */
];

const PRECACHE_ASSETS = Array.from(new Set([...CORE_ASSETS, ...INJECTED_ASSETS]));

// 1. 🛡️ FAIL-SAFE INSTALL:
// Precache all assets; if one file fails, keep going so cache installation succeeds
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        PRECACHE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn('[SW] Precache skipped for:', asset, err && err.message);
          })
        )
      );
    })
  );
});

// 2. ACTIVATE: Purge older caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH: Robust Offline Strategy (No ERR_FAILED ever)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Exclude Firebase, Google APIs, and external backend endpoints from SW interception
  // This prevents Firestore WebChannel streaming and Auth requests from hanging or timing out
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('firestore')
  ) {
    return;
  }

  // Exclude dev environments and Vite modules to prevent dual-React / HMR cache collisions
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname.includes('run.app') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('/src/') ||
    url.pathname.includes('hot-update') ||
    url.searchParams.has('v') ||
    url.searchParams.has('t')
  ) {
    return;
  }

  // A. Navigation Requests (HTML Pages / SPAs / Offline Launch / Subpath)
  const isNavigation =
    req.mode === 'navigate' ||
    req.destination === 'document' ||
    (req.headers.get('accept') && req.headers.get('accept').includes('text/html'));

  if (isNavigation) {
    event.respondWith(
      new Promise((resolve) => {
        let didResolve = false;

        // Fast 2.5s timeout: if network hangs or offline, instantly fall back to cached HTML
        const timeoutId = setTimeout(() => {
          if (!didResolve) {
            fallbackToCachedHtml().then((res) => {
              if (!didResolve) {
                didResolve = true;
                resolve(res);
              }
            });
          }
        }, 2500);

        fetch(req)
          .then((networkResp) => {
            clearTimeout(timeoutId);
            if (!didResolve) {
              didResolve = true;
              if (networkResp && networkResp.status === 200) {
                const clone = networkResp.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
              }
              resolve(networkResp);
            }
          })
          .catch(() => {
            clearTimeout(timeoutId);
            if (!didResolve) {
              didResolve = true;
              fallbackToCachedHtml().then(resolve);
            }
          });
      })
    );
    return;
  }

  // Helper to retrieve cached index.html under various path formats (e.g., GitHub Pages subpaths)
  async function fallbackToCachedHtml() {
    const cache = await caches.open(CACHE_NAME);
    const candidates = [
      req,
      './',
      'index.html',
      './index.html',
      '404.html',
      './404.html'
    ];

    for (const candidate of candidates) {
      const match = await cache.match(candidate, { ignoreSearch: true });
      if (match) return match;
    }

    // Try finding any cached HTML file
    const keys = await cache.keys();
    for (const k of keys) {
      if (k.url.endsWith('/') || k.url.endsWith('index.html') || k.url.endsWith('404.html')) {
        const match = await cache.match(k);
        if (match) return match;
      }
    }

    // If completely offline and somehow empty, return a graceful offline HTML page instead of throwing ERR_FAILED
    return new Response(
      '<!doctype html><html lang="ur"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NH POS - Offline</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#FAF8EC;color:#1e5631;text-align:center;padding:50px 20px;}h1{margin-bottom:8px;font-size:24px;}p{color:#64748b;font-size:14px;margin-bottom:20px;}</style></head><body><h1>NH POS Shop</h1><p>Offline Mode: App is ready. Reopen or reconnect to sync with cloud.</p><button onclick="window.location.reload()" style="background:#1e5631;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-weight:bold;cursor:pointer;">Try Again</button></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // B. Static Assets (JS, CSS, Images, Fonts, Manifest) - Cache First with Background Update & Auto-Caching
  const isStaticAsset =
    url.pathname.includes('/assets/') ||
    req.destination === 'script' ||
    req.destination === 'style' ||
    req.destination === 'image' ||
    req.destination === 'font' ||
    req.destination === 'manifest' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.json') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((cached) => {
        if (cached) {
          // Serve from cache immediately; update cache in background if online
          fetch(req)
            .then((networkResp) => {
              if (networkResp && (networkResp.status === 200 || networkResp.type === 'opaque')) {
                caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResp));
              }
            })
            .catch(() => {});
          return cached;
        }

        // Not in cache: fetch from network and store in cache
        return fetch(req)
          .then((networkResp) => {
            if (networkResp && (networkResp.status === 200 || networkResp.type === 'opaque')) {
              const clone = networkResp.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return networkResp;
          })
          .catch(async () => {
            const cache = await caches.open(CACHE_NAME);
            const fallback = await cache.match(req, { ignoreSearch: true });
            if (fallback) return fallback;
            // Prevent Chrome ERR_FAILED by returning a 503 response instead of failing
            return new Response('', { status: 503, statusText: 'Offline Asset Unavailable' });
          });
      })
    );
    return;
  }

  // C. General Requests: Network-first, fallback to cache
  event.respondWith(
    fetch(req)
      .then((networkResp) => {
        if (networkResp && networkResp.status === 200) {
          const clone = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResp;
      })
      .catch(async () => {
        const cached = await caches.match(req, { ignoreSearch: true });
        if (cached) return cached;
        return new Response('', { status: 503, statusText: 'Offline' });
      })
  );
});

// 4. Live version messaging
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: SW_VERSION, cacheName: CACHE_NAME });
  }
});
