// WhiskNote Mobile PWA Service Worker
const CACHE_NAME = 'whisknote-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.webp',
  '/icons/icon-512.webp',
];

// Install: precache key assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: cleanup older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate for same-origin static GETs only.
// Cross-origin traffic (Supabase auth/data, fonts, images) and API calls are never
// cached here, so signed-in users' data can't end up in the shared Cache Storage.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return networkResponse;
      });

      if (cachedResponse) {
        networkFetch.catch(() => {});
        return cachedResponse;
      }

      return networkFetch.catch(() => {
        // If offline and requesting navigation, return cached app shell
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
        return Response.error();
      });
    })
  );
});
