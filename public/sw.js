/* eslint-disable no-undef */
// Service Worker for Push Notifications
// This runs in the background even when the browser tab is closed

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  let notificationData = {
    title: 'ISPSC DMS Notification',
    body: 'You have a new notification',
    icon: '/icons/favicon.ico',
    badge: '/icons/favicon.ico',
    tag: 'ispsc-dms-notification',
    requireInteraction: false,
    data: {
      url: '/#/dashboard'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      // Try to parse as JSON first
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.message || payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || notificationData.tag,
        requireInteraction: payload.requireInteraction || false,
        data: {
          url: payload.url || notificationData.data.url,
          notificationId: payload.notificationId,
          ...payload.data
        }
      };
    } catch (error) {
      // If JSON parsing fails, treat as plain text
      console.log('[Service Worker] Using plain text push data');
      try {
        const textData = event.data.text();
        notificationData.body = textData || notificationData.body;
      } catch (textError) {
        console.error('[Service Worker] Error parsing push data:', error);
      }
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'View'
        },
        {
          action: 'close',
          title: 'Dismiss'
        }
      ]
    }
  );

  event.waitUntil(promiseChain);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open or focus the app
  const urlToOpen = event.notification.data?.url || '/#/dashboard';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              // Navigate to the notification URL
              if (client.navigate) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event);
});
