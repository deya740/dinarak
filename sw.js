/* دينارك: خدمة العمل بدون إنترنت. بتحفظ الواجهة فقط، وما بتحفظ أي طلب من /api ولا من Supabase. */
var VER = 'dinarak-v1';
var SHELL = ['./', 'manifest.webmanifest', 'config.js', 'icon-192.png', 'icon-512.png', 'icon-180.png', 'icon-32.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VER).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VER; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function put(req, res) {
  if (!res || !(res.ok || res.type === 'opaque')) return res;
  var copy = res.clone();
  caches.open(VER).then(function (c) { c.put(req, copy); }).catch(function () {});
  return res;
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === self.location.origin && url.pathname.indexOf('/api/') === 0) return;
  if (/supabase\.co$/.test(url.hostname)) return;

  // الصفحة نفسها: الشبكة أولاً (عشان التحديثات توصل فوراً)، وإذا ما في نت نرجع للنسخة المحفوظة.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      if (res && res.ok && url.origin === self.location.origin) {
        var copy = res.clone();
        caches.open(VER).then(function (c) { c.put('./', copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match('./').then(function (r) {
        return r || new Response('لا يوجد اتصال بالإنترنت', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      });
    }));
    return;
  }

  var okHost = url.origin === self.location.origin || /(^|\.)jsdelivr\.net$|(^|\.)googleapis\.com$|(^|\.)gstatic\.com$/.test(url.hostname);
  if (!okHost) return;
  e.respondWith(caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) { return put(req, res); }).catch(function () { return hit; });
    return hit || net;
  }));
});
