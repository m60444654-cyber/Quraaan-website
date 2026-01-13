// Service Worker for Quran App
const CACHE_NAME = 'quran-app-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    // Cache-first strategy for static assets
    if (event.request.url.includes('/audio/') || 
        event.request.url.includes('/data/')) {
        // Network-first for audio and data
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache the response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // Cache-first for other assets
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    return response || fetch(event.request);
                })
        );
    }
});

// Background sync for bookmarks
self.addEventListener('sync', event => {
    if (event.tag === 'sync-bookmarks') {
        event.waitUntil(syncBookmarks());
    }
});

async function syncBookmarks() {
    // Implementation for syncing bookmarks with server
    console.log('Syncing bookmarks...');
}
