// Forest Duel service worker.
// Network-first: whenever the phone is online it fetches the newest files (re-checking with the server each time),
// so new uploads show up on the next launch with no version number to bump. The copies it saves along the way
// let the game keep working offline.
const CACHE = 'forest-duel';
const FILES = ['./', './index.html', './hero.png', './goblin.png', './teacher.png', './frost.png', './warlord.png', './head.png', './press-start-2p.woff2', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(FILES.map(f => fetch(f, { cache: 'reload' }).then(r => (r.ok ? c.put(f, r) : null)).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);          // slow connection: fall back to the saved copy
    try {
      const res = await fetch(req.url, { cache: 'no-cache', signal: ctl.signal });
      clearTimeout(timer);
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req.url, copy)); }
      return res;
    } catch (err) {
      clearTimeout(timer);
      return (await caches.match(req.url, { ignoreSearch: true })) || (await caches.match('./index.html'));
    }
  })());
});
