// Runs INSIDE the generated service worker (wired in via workbox
// `importScripts` in vite.config.js — the generated sw.js has no custom
// code of its own, and generateSW doesn't offer event hooks, so this file
// is imported at the top of it).
//
// Handles the two message types api/warm-cache.js's daily cron broadcasts:
// deadline reminders and settled-gameweek results. Payload shape comes
// from warm-cache's `broadcast()`: { title, body, url }.
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // Non-JSON push (shouldn't happen — every sender here is our own cron)
    payload = { title: 'BRO League', body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'BRO League', {
      body: payload.body || '',
      icon: '/manifest-icon-192.png',
      badge: '/manifest-icon-192.png',
      data: { url: payload.url || '/' },
    })
  );
});

// Tapping the notification opens (or focuses) the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
