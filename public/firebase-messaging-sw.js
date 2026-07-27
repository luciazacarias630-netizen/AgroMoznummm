// Firebase Cloud Messaging (FCM) Service Worker for AgroMoz
// Serves background push notifications for Farmers, Buyers, and Transporters (Drivers)

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase App in Service Worker if config is provided
self.addEventListener('install', (event) => {
  console.log('[AgroMoz FCM SW] Service Worker instalado com sucesso.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[AgroMoz FCM SW] Service Worker ativo e pronto para receber notificações push.');
  event.waitUntil(clients.claim());
});

// Handle Background Push Notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'AgroMoz Notificação Push',
    body: 'Tem uma nova atualização na sua conta agrícola.',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'agromoz-push',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        data.title = payload.notification.title || data.title;
        data.body = payload.notification.body || data.body;
      }
      if (payload.data) {
        data.data = payload.data;
      }
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/1202/1202125.png',
    badge: data.badge || 'https://cdn-icons-png.flaticon.com/512/1202/1202125.png',
    tag: data.tag || 'agromoz-fcm-alert',
    vibrate: [200, 100, 200, 100, 200],
    data: data.data,
    actions: [
      { action: 'open', title: 'Ver na App AgroMoz' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
