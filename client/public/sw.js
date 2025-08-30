const SW_VERSION = '3';

self.skipWaiting();
self.clientsClaim();

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass SW cache for API routes
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Default: let the request pass through
});
