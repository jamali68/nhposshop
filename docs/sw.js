/**
 * Service Worker for Taj POS Pro PWA
 */
const SW_VERSION = 'v15.8.8';
const CACHE_NAME = 'taj-pos-' + SW_VERSION;

const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon.png',
  'icon1.png'
];

// 1. 🛡️ FAIL-SAFE INSTALL:
// Ek file missing ho to SIRF wo skip hogi — poora cache NAHI tootega!
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('⚠️ Cache skip (file missing?):', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. Clear old caches on activate
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Old cache deleted:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Network first, fallback to cache (with Firebase streaming bypass)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Bypass service worker for Firebase, Google APIs, and external backend endpoints
  // This prevents Firestore WebChannel streaming and Auth requests from hanging or timing out
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('firestore') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});

// 4. Live version messaging
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: SW_VERSION, cacheName: CACHE_NAME });
  }
});
