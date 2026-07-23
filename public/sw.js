/* ⚡ All Tools KYY — Service Worker
   Bikin portal ini kebuka kenceng & tetep nyala walau sinyal lemot.
   Ganti CACHE_NAME tiap update gede biar user auto dapet versi baru. */

const CACHE_NAME = 'kyy-static-v5.2';
const PRECACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/gamedata.js',
  '/manifest.webmanifest',
  '/img/logo.png',
  '/img/pwa-192.png',
  '/img/pwa-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // API & video: selalu dari jaringan, jangan di-cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/video/')) return;

  // dokumen HTML: network-first, fallback cache kalo offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // aset statis: stale-while-revalidate (cache dulu, update di belakang)
  e.respondWith(
    caches.match(req).then((hit) => {
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || fresh;
    })
  );
});
