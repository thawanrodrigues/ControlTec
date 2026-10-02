const CACHE_NAME = 'controltec-v2'; // Incrementado para forçar atualização do service worker
const HTML_CACHE = 'controltec-html';
const STATIC_CACHE = 'controltec-static';

// Não pré-cacheamos de forma estática no install para evitar travar index.html antigo
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== HTML_CACHE && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Ignorar chamadas de API (sempre rede)
  if (url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Ignorar o próprio manifesto e service worker (sempre rede para garantir atualizações)
  if (url.pathname.endsWith('service-worker.js') || url.pathname.endsWith('manifest.json')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3. Estratégia Network-First para páginas HTML (garante que sempre carregue o HTML mais novo)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(HTML_CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 4. Estratégia Cache-First para arquivos estáticos (JS, CSS, Imagens com hashes)
  if (
    url.pathname.includes('/_expo/static/') ||
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // 5. Fallback padrão: Rede com Fallback para Cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
