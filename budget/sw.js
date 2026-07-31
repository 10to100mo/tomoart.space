const CACHE_NAME = 'flow-v2';
const CORE_ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Network-first so online visits always get the latest version; falls back
// to the cache when offline so the app still opens without a connection.
// Cross-origin requests (Google Fonts) are left alone so an offline font
// fetch can't stall the page load — the CSS font-family fallback handles it.
// cache: 'no-store' forces a real network round-trip instead of letting the
// browser's own HTTP cache transparently satisfy this fetch() with a stale
// response — without it, "network-first" could silently return old cached
// bytes even while fully online, and force-quitting/reopening the app
// wouldn't fix it since that doesn't clear the browser's HTTP cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
