// service-worker.js
// Version 1

'use strict';

const CACHE_NAME = 'prayer-feed-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets (CSS, JS, images) here
];

self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated and old caches deleted.');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  // Use a cache-first strategy for requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request);
      })
      .catch(error => {
        console.error('Fetch failed:', error);
      })
  );
});

// Optional: Listener for when a push message is received from a server.
// This is required for true push notifications that work when the app is closed.
self.addEventListener('push', event => {
  console.log('Push received!');
  const data = event.data.json();
  const title = data.title || 'New Update';
  const options = {
    body: data.body || 'A new post is available. Tap to view.',
    icon: data.icon || '/path/to/default-icon.png' // Use a proper icon URL here
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Optional: Listener for when a user clicks on a notification.
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked!');
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
