const CACHE_NAME = 'abpereira-v12';
const ASSETS = [
  '/',
  '/Vistas/index.html',
  '/Vistas/Servicios.html',
  '/Vistas/Contact.html',
  '/Vistas/Appointment.html',
  '/styles/style.css',
  '/styles/menu.css',
  '/styles/Servicios.css',
  '/styles/styleContact.css',
  '/styles/appointmentStyle.css',
  '/img/ABPEREIRA L.png',
  '/img/ABP.ico',
  '/javascript/menu.js',
  '/javascript/scroll-reveal.js',
  '/javascript/home-carousel.js',
  '/javascript/services.js',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap'
];

// Instalar y cachear recursos críticos
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Intentar cachear todo, ignorando errores individuales para que no falle la instalación
      return Promise.allSettled(ASSETS.map(asset => cache.add(asset)));
    })
  );
});

// Activar y limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Estrategia: Cache First para assets estáticos, Network First para HTML
self.addEventListener('fetch', (event) => {
  // Para páginas HTML, intentamos red primero para tener data fresca (como mantenimiento)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Guardar una copia en cache para offline
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Para el resto (CSS, JS, Img, Fonts), Cache First con Network Fallback y Cache Update
  event.respondWith(
    caches.match(event.request).then((response) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      });
      return response || fetchPromise;
    })
  );
});
