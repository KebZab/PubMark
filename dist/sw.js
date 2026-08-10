const CACHE = "pubmark-shell-v1";
const SHELL = ["/", "/manifest.webmanifest"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  event.respondWith(caches.match(event.request).then(async cached => {
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok && (url.pathname.startsWith("/assets/") || url.pathname === "/" || url.pathname.endsWith(".webmanifest"))) {
      const cache = await caches.open(CACHE); cache.put(event.request, response.clone());
    }
    return response;
  }));
});
