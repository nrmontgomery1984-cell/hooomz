// Service worker disabled — self-unregister on activation.
// Any previously registered SW will be replaced by this one,
// which immediately unregisters itself and clears caches.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clear all caches created by the old SW
      caches.keys().then((keys) =>
        Promise.all(keys.map((key) => caches.delete(key)))
      ),
      // Unregister this service worker
      self.registration.unregister(),
    ])
  );
});
