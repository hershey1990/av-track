const CACHE = "bb-time-v3";
// Only pre-cache offline page — never cache / (it breaks Next.js RSC requests)
const URLS = ["/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Navigation: always network, fallback to offline page
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline"))
    );
    return;
  }

  // Only cache static assets (JS, CSS, fonts, images) — never HTML/RSC
  const url = new URL(event.request.url);
  const isStaticAsset =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons") ||
    /\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico|json)$/.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
  // Everything else: network only (RSC requests, API calls, etc.)
});
