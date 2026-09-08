// Minimal hand-written service worker (no next-pwa/workbox — this app doesn't
// need a build-plugin's complexity for what's needed here, and next-pwa has a
// history of friction with the App Router/Turbopack).
//
// Two jobs:
//   1. Cache-first for the static build output, so repeat visits/navigations
//      paint instantly instead of waiting on the network.
//   2. Stale-while-revalidate for the *anonymous* poems feed, so the feed
//      shows something instantly from cache while it revalidates in the
//      background.
//
// Cache Storage keys by request URL only, not headers — so a personalized
// (Authorization-bearing) request must never be cached here, or a shared
// browser could serve one account's cached response to the next login. Same
// reasoning as the server's public/private Cache-Control split for this route.

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `poem-studio-static-${CACHE_VERSION}`;
// Keep this prefix in sync with RUNTIME_CACHE_PREFIX in lib/serviceWorker.js —
// that's what gets cleared on logout.
const RUNTIME_CACHE = `poem-studio-runtime-${CACHE_VERSION}`;

const CACHEABLE_API_PREFIXES = ['/api/poems'];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname === '/manifest.json';
}

function isCacheableApiGet(request, url) {
  if (request.method !== 'GET') return false;
  if (request.headers.has('Authorization')) return false; // never cache personalized responses
  return CACHEABLE_API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never intercept mutations

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/auth')) return; // never touch auth

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  if (isCacheableApiGet(request, url)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => null);

        // Keep revalidating in the background even after we respond from cache.
        event.waitUntil(network);

        if (cached) return cached;
        return (await network) || new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
  }
});
