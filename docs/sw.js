/**
 * Service Worker for Taj POS Pro PWA
 */
const CACHE_NAME = 'taj-pos-v15.8.3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    const vMatch = CACHE_NAME.match(/v?[0-9]+(?:\.[0-9]+)*(?:-[a-zA-Z0-9.]+)?/i);
    const version = vMatch ? vMatch[0] : CACHE_NAME;
    event.ports[0]?.postMessage({ version, cacheName: CACHE_NAME });
  }
});
