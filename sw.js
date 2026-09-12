// Minimal offline cache so Buddy the Bat keeps working once it's been loaded
// (handy for a "installed to home screen" mobile play session).
const CACHE_NAME = 'buddy-the-bat-v4';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './manifest.json',
  './assets/icon-favicon.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/player-bat.png',
  './js/main.js',
  './js/game.js',
  './js/constants.js',
  './js/sprites.js',
  './js/audio.js',
  './js/input.js',
  './js/entities.js',
  './js/levels.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: while online, always serve the latest deployed files (so a
// fix like this one shows up immediately instead of being masked by a stale
// cache). Only fall back to the cache when the network request fails, i.e.
// actually offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
