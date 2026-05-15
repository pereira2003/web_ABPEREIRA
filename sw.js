const CACHE_NAME = 'abpereira-v1';
const ASSETS = [
  '/Vistas/index.html',
  '/styles/style.css',
  '/img/ABP.ico',
  '/img/ABPEREIRA L.png',
  '/img/icono de mantenimiento.jpg'
];

// Instalar y cachear recursos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Estrategia: Cache First para velocidad, Network Fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
