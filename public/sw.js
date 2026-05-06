/* Minimal installable shell; extend with workbox if you need offline cards. */
const CACHE = "movie-match-v2";
// Only cache the public shell. Do NOT cache authenticated pages like /swipe or /matches.
const ASSETS = ["/", "/manifest.webmanifest"];

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
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((r) => r || caches.match("/"))),
  );
});
