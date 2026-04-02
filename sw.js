// Service Worker - 自動更新版 (Network First)
const CACHE_NAME = 'line-member-pwa';

// 安裝時不預先快取任何東西
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

// 啟用時立即接管
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(clients.claim());
});

// Network First 策略 - 永遠先從網路載入
self.addEventListener('fetch', event => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') {
    return;
  }
  
  // API 請求直接放行,不快取
  if (event.request.url.includes('script.google.com')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 成功從網路載入,儲存到快取作為備份
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 網路失敗時才用快取
        return caches.match(event.request);
      })
  );
});
