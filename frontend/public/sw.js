// Service worker del PAE: cachea la app para que funcione sin conexion
// y se pueda instalar como aplicacion en el celular.
const CACHE = "pae-v1";
const BASE = "/pae/";

// Archivos iniciales que se cachean al activar el service worker
const INICIAL = [
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}favicon.svg`,
  `${BASE}manifest.webmanifest`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(INICIAL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

// Estrategia: cache primero para lo estatico, red para la API.
// Los datos siempre intentan actualizarse, y si no hay conexion se
// devuelve lo que ya habia en cache.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // No interceptamos llamadas a la API (requieren datos frescos)
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navegacion (paginas): red primero, cache como respaldo
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copia));
          return resp;
        })
        .catch(() => caches.match(`${BASE}index.html`))
    );
    return;
  }

  // Recursos estaticos: cache primero, red como actualizacion
  event.respondWith(
    caches.match(event.request).then(
      (cacheado) =>
        cacheado ||
        fetch(event.request).then((resp) => {
          if (resp.ok) {
            const copia = resp.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copia));
          }
          return resp;
        })
    )
  );
});
