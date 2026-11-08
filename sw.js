// お絵描きバトル Service Worker
// 方針: ページ本体は「ネット優先」(更新がすぐ届く)、つながらない時だけ保存済みを使う。
// AI中継(Cloudflare)とFirebase(通信)は一切キャッシュしない。
const CACHE = 'draw-battle-v1';
const SHELL = ['./', 'index.html', 'config.js', 'fb-shim.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // 他サイト(Firebase/Worker/フォント)は触らない
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
