const CACHE_NAME = "roadsos-ai-v4";
const FILES = ["./", "./index.html", "./styles.css", "./app.js"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)));
});

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
