const CACHE_NAME = 'rush-timesheet-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  'https://cdn-icons-png.flaticon.com/512/2091/2091665.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
