const CACHE_NAME = 'ward-sec-v2.07';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache all assets for offline use
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache first, fallback to network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Handle notification clicks — navigate to relevant tab
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const tag = e.notification.tag || '';
  const hash = tag === 'ward-schedule-due' ? '#schedule' : '';
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        const c = clients[0];
        if (hash) c.postMessage({ type: 'NAVIGATE', tab: 'schedule' });
        return c.focus();
      }
      return self.clients.openWindow('./index.html' + hash);
    })
  );
});

// Listen for messages from main app to schedule notifications
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay, tag } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        vibrate: [200, 100, 200],
        tag: tag || 'ward-reminder',
        renotify: true,
        requireInteraction: true
      });
    }, delay);
  }
});
