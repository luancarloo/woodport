// WoodPort — service worker (o que permite instalar como app no celular)
// Páginas: REDE PRIMEIRO. A publicação é subir um index.html novo por cima; servir
// cópia guardada congelaria a versão antiga no aparelho. O cache só entra sem internet.
// Supabase (dados) e CDNs nunca são guardados.
var VERSAO = 'woodport-2026-10-28';
var BASICOS = ['./', 'manifest.webmanifest', 'icone-192.png', 'icone-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSAO).then(function (c) { return c.addAll(BASICOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSAO; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // Supabase, CDNs, fontes: direto na rede
  e.respondWith(
    fetch(req).then(function (r) {
      if (r && r.ok && r.type === 'basic') {
        var copia = r.clone();
        caches.open(VERSAO).then(function (c) { c.put(req, copia); });
      }
      return r;
    }).catch(function () {
      return caches.match(req).then(function (r) {
        return r || (req.mode === 'navigate' ? caches.match('./') : Response.error());
      });
    })
  );
});
