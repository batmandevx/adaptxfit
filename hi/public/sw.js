/*
 * AdaptiFit v2 — Offline-First service worker (hand-written, no Workbox).
 *
 * Strategy summary
 * ----------------
 * - install : precache the app shell (/, manifest, icons) and skipWaiting().
 * - activate: purge caches from older versions, clients.claim().
 * - GET /_next/static/*, /icons/*, /images/*, fonts → cache-first (runtime cache).
 * - GET /api/*                            → network-first, fall back to cached response.
 * - Non-GET /api/* (POST/PATCH/...)       → try network; on failure respond
 *                                           503 {"offline":true} so the client
 *                                           outbox (src/lib/offline/outbox.ts)
 *                                           can queue the write and replay it later.
 * - Navigations                           → network-first, offline fallback to the
 *                                           cached app shell ("/").
 *
 * MediaPipe / pose model note
 * ---------------------------
 * The Live Coach pose model is loaded from a CDN (jsDelivr / Google storage) the
 * first time Live Coach is used online. Those responses are cached at runtime
 * (cache-first) by this worker, so repeat sessions work fully offline. If the
 * very first load happens while offline the model cannot be fetched — the Live
 * Coach UI degrades gracefully and asks the user to connect once.
 *
 * Bump CACHE_VERSION on every deploy that changes precached assets.
 */
const CACHE_VERSION = "adaptifit-v2-pwa-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE = `${CACHE_VERSION}-api`;
const KNOWN_CACHES = [SHELL_CACHE, RUNTIME_CACHE, API_CACHE];

const SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const OFFLINE_JSON = JSON.stringify({ offline: true });

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        // Add individually so one missing asset never aborts the install.
        Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !KNOWN_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
      .then(() => notifyClients({ type: "SW_ACTIVATED", version: CACHE_VERSION }))
  );
});

function notifyClients(message) {
  return self.clients
    .matchAll({ includeUncontrolled: true, type: "window" })
    .then((clients) => clients.forEach((client) => client.postMessage(message)));
}

function isApi(url) {
  return url.pathname.startsWith("/api/");
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    /\.(?:png|jpe?g|gif|webp|svg|ico|avif|woff2?|ttf|otf|css|js)$/.test(url.pathname)
  );
}

// CDN hosts for the MediaPipe pose model + wasm (cached at runtime so Live Coach
// keeps working offline after the first online load).
function isPoseModelCdn(url) {
  return (
    url.hostname === "cdn.jsdelivr.net" ||
    url.hostname === "storage.googleapis.com" ||
    url.hostname.endsWith(".googleapis.com")
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedPage = await caches.match(request);
    if (cachedPage) return cachedPage;
    // Offline fallback: serve the precached app shell (SPA-style).
    const shell = await caches.match("/", { ignoreSearch: true });
    if (shell) return shell;
    return new Response(
      "<!doctype html><title>AdaptiFit offline</title><p>You are offline and this page was not cached yet. Reconnect once to enable full offline mode.</p>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API traffic
  if (url.origin === self.location.origin && isApi(url)) {
    if (request.method === "GET") {
      event.respondWith(networkFirst(request, API_CACHE));
      return;
    }
    if (request.method === "POST" || request.method === "PATCH" || request.method === "PUT" || request.method === "DELETE") {
      event.respondWith(
        fetch(request.clone()).catch(() =>
          // Tell the client outbox to queue this write for later replay.
          new Response(OFFLINE_JSON, {
            status: 503,
            headers: { "Content-Type": "application/json" },
          })
        )
      );
      return;
    }
    return; // other API methods: default network behavior
  }

  // Navigations: network-first with offline shell fallback
  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request));
    return;
  }

  if (request.method !== "GET") return;

  // Same-origin static assets: cache-first
  if (url.origin === self.location.origin && isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // Cross-origin: MediaPipe pose model CDN (see header note) + font CDNs
  if (url.origin !== self.location.origin && isPoseModelCdn(url)) {
    event.respondWith(
      cacheFirst(request, RUNTIME_CACHE).catch(() =>
        new Response(OFFLINE_JSON, {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }
});

// Allow the page to trigger skipWaiting for update flows, and let clients ask
// the SW to nudge an outbox flush after activation.
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (data.type === "OUTBOX_FLUSH") {
    notifyClients({ type: "OUTBOX_FLUSH" });
  }
});
