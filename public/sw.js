const CACHE_NAME = "operation-recode-v2";

const CORE_ASSETS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

function shouldIgnoreRequest(request) {
  const url = new URL(request.url);

  if (request.method !== "GET") return true;

  if (url.origin !== self.location.origin) return true;

  if (url.pathname.startsWith("/api")) return true;

  if (url.pathname.startsWith("/_next/webpack-hmr")) return true;

  if (url.pathname.includes("hot-update")) return true;

  return false;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (shouldIgnoreRequest(request)) return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });

          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/offline")))
    );

    return;
  }

  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/icon.svg"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          const clone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });

          return response;
        });
      })
    );

    return;
  }

  event.respondWith(fetch(request));
});