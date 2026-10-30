// AgriRent Progressive Web App Service Worker
const CACHE_NAME = 'agrirent-cache-v1';

const STATIC_PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-icon.svg',
  '/pwa-192.png',
  '/pwa-512.png',
  '/apple-touch-icon.png',
  '/tractor1.jpeg',
  '/tractor2.jpeg',
  '/tractor3.jpeg',
  '/tractor4.jpeg',
  '/tractor5.jpeg',
  '/tractor6.jpeg',
  '/tractor7.jpeg',
  '/tractor8.jpg',
  '/tractor9.jpg',
  '/tractor10.jpg',
  '/tractor11.jpg',
  '/tractor12.jpg',
  '/tractor13.jpg',
  '/tractor14.jpg',
  '/corn_harvester.jpg',
  '/straw_baler.jpg',
  '/corn_seeder.jpg'
];

// Install Event: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use catch for individual items so one missing optional asset does not abort install
      return Promise.allSettled(
        STATIC_PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Pre-cache skipped for ${url}:`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate with Offline Navigation Fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests from the same origin or CDN fonts
  if (req.method !== 'GET') return;

  // Navigation requests: Network-first, fallback to cached index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match('/');
          if (fallback) return fallback;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Static Assets (Images, Scripts, Styles): Cache-first with background revalidation
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

