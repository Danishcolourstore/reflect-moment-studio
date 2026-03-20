const CACHE_NAME = 'refyn-shell-v1';

const PRECACHE = [
  '/refyn',
  '/manifest-refyn.json',
  '/icons/refyn-512.png',
  '/icons/refyn-192.png',
];

// Install — cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network-first for navigation, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache OAuth routes
  if (url.pathname.startsWith('/~oauth')) return;

  // Navigation requests (HTML) — network first, fall back to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/refyn') || new Response(
          `<!DOCTYPE html>
          <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Refyn</title>
          <style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{background:#0a0a0a;color:#F0EDE8;font-family:"DM Sans",sans-serif;
                 display:flex;align-items:center;justify-content:center;min-height:100vh;
                 flex-direction:column;text-align:center;padding:2rem}
            h1{font-family:"Cormorant Garamond",serif;font-size:28px;font-weight:300;
               font-style:italic;color:#E8C97A;margin-bottom:24px}
            p{font-size:13px;color:rgba(240,237,232,0.35);max-width:260px;line-height:1.6}
            .dot{width:6px;height:6px;border-radius:50%;background:rgba(232,201,122,0.3);
                 margin:20px auto 0}
          </style></head>
          <body>
            <h1>Refyn</h1>
            <p>Refyn needs a connection to retouch. Please check your network and try again.</p>
            <div class="dot"></div>
          </body></html>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
    return;
  }

  // Static assets — stale-while-revalidate
  if (request.destination === 'script' || request.destination === 'style' ||
      url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then(res => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }
});
