// Clube das Brabas - Custom Service Worker
// This file handles push notifications and caching (injected by workbox via vite-plugin-pwa)

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Take control immediately when installed
self.skipWaiting();
clientsClaim();

// Precache all assets from build manifest (injected by vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST);

// Clean old v1 caches
cleanupOutdatedCaches();

// ============================================================
// PUSH NOTIFICATION HANDLER
// ============================================================
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: 'Clube das Brabas', body: event.data.text() };
    }

    const title = data.title || 'Clube das Brabas';
    const options = {
        body: data.body || 'Você tem uma nova notificação!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        image: data.image,
        data: {
            url: data.url || '/',
        },
        requireInteraction: false,
        vibrate: [200, 100, 200],
        actions: data.actions || [],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ============================================================
// NOTIFICATION CLICK HANDLER
// ============================================================
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
