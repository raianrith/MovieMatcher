/* Minimal installable shell; extend with workbox if you need offline cards. */
const CACHE = "movie-match-v3";
// Only cache the public shell. Do NOT cache authenticated pages like /swipe or /matches.
const ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/pwa/icon.svg",
  "/pwa/icon-maskable.svg",
  "/pwa/icon-192.png",
  "/pwa/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Never cache API requests.
  if (new URL(request.url).pathname.startsWith("/api/")) return;

  // Never intercept navigations — avoids stale HTML and auth redirect caching.
  if (request.mode === "navigate") return;

  // Cache-first for the tiny public shell only.
  if (ASSETS.includes(new URL(request.url).pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const copy = res.clone();
        void caches.open(CACHE).then((cache) => cache.put(request, copy));
        return res;
      })),
    );
    return;
  }
});
