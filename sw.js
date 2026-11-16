// Service worker di Art-Studio.
// - app e catalogo: prima la rete (così gli aggiornamenti arrivano subito), poi la copia salvata se sei offline
// - immagini locali (cartella img/): prima la copia salvata, poi la rete
// - immagini di altri siti (wga.hu, Wikimedia): non intercettate, ci pensa il browser
const APP = 'app-v10', IMMAGINI = 'immagini-v1';
const GUSCIO = ['./', 'index.html', 'catalogo.json', 'schede.json', 'manifest.json', 'icona-192.png', 'icona-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(GUSCIO)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== APP && n !== IMMAGINI).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.includes('/img/')) {
    e.respondWith(caches.open(IMMAGINI).then(c => c.match(r).then(m => m || fetch(r).then(risp => { if (risp.ok) c.put(r, risp.clone()); return risp; }))));
    return;
  }
  // 'no-cache': chiedo sempre al sito se il file è cambiato, così gli aggiornamenti si vedono subito
  e.respondWith(fetch(r, { cache: 'no-cache' }).then(risp => { if (risp.ok) { const copia = risp.clone(); caches.open(APP).then(c => c.put(r, copia)); } return risp; })
    .catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
