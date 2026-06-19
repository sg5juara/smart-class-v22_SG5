// Ganti versi ini setiap kali Anda mengubah kode HTML/CSS/JS
// agar browser otomatis membersihkan cache lama dan memuat pembaruan aplikasi
const CACHE_NAME = 'smart-class-pro-v2.1';

// Daftar file lokal yang WAJIB disimpan di penyimpanan offline
const urlsToCache = [
  './',
  './index.html', // Sesuaikan jika nama file HTML Anda berbeda (misal: class-pro.html)
  './manifest.json'
];

// 1. EVENT INSTALL: Menginstal Service Worker dan menyimpan file inti ke Cache
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Memaksa service worker baru untuk langsung aktif
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching App Shell untuk V2.1');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. EVENT ACTIVATE: Membersihkan cache versi lama saat ada pembaruan versi (CACHE_NAME berubah)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Memastikan SW langsung mengontrol semua halaman yang terbuka
  );
});

// 3. EVENT FETCH: Strategi "Network First, fallback to Cache"
// Cocok agar aplikasi selalu menampilkan versi terbaru jika ada internet, 
// tapi tetap bisa dibuka jika sedang offline/tanpa sinyal.
self.addEventListener('fetch', (event) => {
  // Hanya proses request GET (mencegah error pada request lain)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Jika berhasil ambil dari jaringan, simpan salinannya ke Dynamic Cache untuk offline
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Jika gagal (Offline), ambil dari Cache
        console.log('[Service Worker] Offline, memuat dari cache:', event.request.url);
        return caches.match(event.request);
      })
  );
});
