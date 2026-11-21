/* ==========================================================================
   Service worker — makes "close your Wi-Fi and it still works" literal.

   Bump CACHE_VERSION on every deploy that changes any file in PRECACHE.
   A new version installs quietly; the page then offers a Reload instead of
   swapping the code under a running session. Old caches are dropped on
   activate, so storage never grows past one copy of the app.
   ========================================================================== */
'use strict';

var CACHE_VERSION = 'v4';
var CACHE_PREFIX = 'qr-offline-';
var CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

var PRECACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.webmanifest',
  './js/app.js',
  './js/qr.js',
  './js/scanner.js',
  './js/store.js',
  './jsqr.js',
  './zxing.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

/* Without the shell there is nothing to serve offline, so those two are fatal;
   an icon that fails to cache is not worth failing the whole install over. */
var REQUIRED = ['./index.html', './js/app.js'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(PRECACHE.map(function (url) {
        /* cache: 'reload' skips the HTTP cache, so a fresh deploy is picked up
           even though Surge asks clients to revalidate. */
        return fetch(new Request(url, { cache: 'reload' }))
          .then(function (response) {
            if (!response || !response.ok) throw new Error('precache failed: ' + url);
            return cache.put(url, response);
          })
          .catch(function (error) {
            if (REQUIRED.indexOf(url) !== -1) throw error;
          });
      }));
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key.indexOf(CACHE_PREFIX) === 0 && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }));
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

/* The page decides when to take the update, so a scan in progress is never
   interrupted by new code. */
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/* The app shell, from cache. Used whenever the network cannot answer. */
function cachedShell() {
  return caches.match('./index.html', { ignoreSearch: true }).then(function (hit) {
    return hit || caches.match('./');
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }

  /* Only our own files. Search, links and anything else must go straight to
     the network, untouched. */
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    /* Network first: a deploy is picked up on the next load. Offline — or when
       the host answers with an error page — the cached shell answers instead,
       so the app still boots. */
    event.respondWith(
      fetch(request)
        .then(function (response) {
          if (response && response.ok) return response;
          return cachedShell();
        })
        .catch(cachedShell)
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;

      return fetch(request)
        .then(function (response) {
          if (response && response.ok && response.type === 'basic') {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(function () {
          return new Response('', { status: 504, statusText: 'Offline' });
        });
    })
  );
});
