const CACHE_VERSION = "v2";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGES_CACHE = `pages-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGES_CACHE = `images-${CACHE_VERSION}`;
const FONTS_CACHE = `fonts-${CACHE_VERSION}`;

const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const knownCaches = new Set([
    STATIC_CACHE,
    PAGES_CACHE,
    API_CACHE,
    IMAGES_CACHE,
    FONTS_CACHE,
  ]);
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((n) => !knownCaches.has(n)).map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // Google Fonts — CacheFirst, 1 tahun
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirst(request, FONTS_CACHE, 365 * 86400));
    return;
  }

  // Cloudinary images — CacheFirst, 7 hari
  if (url.hostname === "res.cloudinary.com") {
    event.respondWith(cacheFirst(request, IMAGES_CACHE, 7 * 86400));
    return;
  }

  // Next.js static chunks — CacheFirst (hashed filenames, aman cache forever)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, 365 * 86400));
    return;
  }

  // API routes — NetworkFirst, fallback ke cache 1 hari
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE, 86400));
    return;
  }

  // Navigation — hanya handle same-origin (biar Google OAuth tidak diintercepta)
  if (request.mode === "navigate") {
    if (url.origin !== self.location.origin) return;
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Semua lainnya — StaleWhileRevalidate
  event.respondWith(staleWhileRevalidate(request, PAGES_CACHE));
});

async function cacheFirst(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    const date = cached.headers.get("date");
    if (date) {
      const age = (Date.now() - new Date(date).getTime()) / 1000;
      if (age < maxAgeSeconds) return cached;
    } else {
      return cached;
    }
  }
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    if (cached) return cached;
    return new Response("Network error", { status: 408 });
  }
}

async function networkFirst(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 5000)
      ),
    ]);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      const date = cached.headers.get("date");
      const age = date
        ? (Date.now() - new Date(date).getTime()) / 1000
        : 0;
      if (age < maxAgeSeconds) return cached;
    }
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}
