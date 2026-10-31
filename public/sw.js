// Service worker mínimo: hace que la app se pueda instalar y que abra aunque se corte internet un momento.
// Va siempre primero a la red (así una versión nueva se ve apenas se publica) y usa la copia guardada solo si no hay conexión.
// Firestore y Firebase Auth son de otro dominio: no pasan por acá.
const CACHE = 'jefe-de-planta-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const pedido = e.request;
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(pedido)
      .then((respuesta) => {
        // Un archivo de la app que ya no existe lo contesta el hosting con index.html (200): eso no se guarda como si fuera el archivo
        const esHtml = (respuesta.headers.get('content-type') ?? '').includes('text/html');
        if (respuesta.ok && (pedido.mode === 'navigate' || !esHtml)) {
          const copia = respuesta.clone();
          caches.open(CACHE).then((c) => c.put(pedido, copia));
        }
        return respuesta;
      })
      .catch(async () => (await caches.match(pedido)) ?? (pedido.mode === 'navigate' ? await caches.match('/') : undefined) ?? Response.error())
  );
});
