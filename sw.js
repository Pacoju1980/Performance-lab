// Performance Lab 1.1.0: service worker neutro durante estabilización.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('performance-lab-')).map(k=>caches.delete(k)));await self.registration.unregister();await self.clients.claim();})()));
self.addEventListener('fetch',()=>{});
