// Performance Lab 1.0.7 recovery: no offline cache until deployment is stable.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('performance-lab-')).map(k=>caches.delete(k)));
  await self.registration.unregister();
  await self.clients.claim();
})()));
self.addEventListener('fetch', ()=>{});
