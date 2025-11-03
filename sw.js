// sw.js - Service Worker для офлайн-работы и кэширования
const CACHE_NAME = 'texno-edem-v1.2.0';
const API_CACHE_NAME = 'texno-edem-api-v1.0.0';

// Ресурсы для кэширования при установке
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/404.html',
  '/css/style.css',
  '/css/emergency.css',
  '/css/enhanced-styles.css',
  '/css/responsive.css',
  '/css/telegram.css',
  '/css/components/header.css',
  '/css/components/dashboard.css',
  '/css/components/orders.css',
  '/css/components/modal.css',
  '/css/components/settings.css',
  '/css/analytics/charts.css',
  '/css/analytics/metrics.css',
  '/js/config.js',
  '/js/app.js',
  '/js/utils/error-handler.js',
  '/js/utils/logger.js',
  '/js/utils/cache-manager.js',
  '/js/utils/storage.js',
  '/js/utils/notifications.js',
  '/js/utils/formatters.js',
  '/js/components/modal.js',
  '/js/components/orders.js',
  '/js/components/analytics.js',
  '/js/components/settings.js',
  '/data/mock-data.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static resources');
        return cache.addAll(STATIC_RESOURCES).catch(error => {
          console.warn('⚠️ Service Worker: Failed to cache some resources:', error);
        });
      })
      .then(() => {
        console.log('✅ Service Worker: Installation completed');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Installation failed:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем старые кэши
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log(`🧹 Service Worker: Deleting old cache ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Service Worker: Activation completed');
      return self.clients.claim();
    })
    .catch(error => {
      console.error('❌ Service Worker: Activation failed:', error);
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Пропускаем неподдерживаемые схемы
  if (request.method !== 'GET') return;

  // Стратегии кэширования для разных типов ресурсов
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    // Стратегия "Сеть сначала, затем кэш" для HTML
    event.respondWith(networkFirstStrategy(request));
  } else if (url.pathname.includes('/css/') || url.pathname.includes('/js/')) {
    // Стратегия "Кэш сначала, затем сеть" для статических ресурсов
    event.respondWith(cacheFirstStrategy(request));
  } else if (url.pathname.includes('/api/')) {
    // Стратегия для API запросов
    event.respondWith(apiStrategy(request));
  } else {
    // Стандартная стратегия для остальных запросов
    event.respondWith(networkFirstStrategy(request));
  }
});

// Стратегия "Сеть сначала, затем кэш"
async function networkFirstStrategy(request) {
  try {
    // Пробуем получить из сети
    const networkResponse = await fetch(request);
    
    // Кэшируем успешный ответ
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Если сеть недоступна, пробуем кэш
    console.log('🌐 Network failed, trying cache...');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback для основных страниц
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    
    // Fallback для API запросов
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({
        error: 'Offline mode',
        message: 'Network unavailable, using cached data',
        timestamp: new Date().toISOString()
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Стратегия "Кэш сначала, затем сеть"
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Обновляем кэш в фоне
    updateCacheInBackground(request);
    return cachedResponse;
  }
  
  // Если нет в кэше, загружаем из сети
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    throw error;
  }
}

// Стратегия для API запросов
async function apiStrategy(request) {
  try {
    // Пробуем сеть для API
    const networkResponse = await fetch(request);
    
    // Кэшируем успешные GET запросы
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 API network failed, trying cache...');
    
    // Пробуем кэш для GET запросов
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Возвращаем ошибку для других методов
    return new Response(JSON.stringify({
      error: 'NetworkError',
      message: 'API unavailable in offline mode',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Фоновая синхронизация кэша
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Фоновая ошибка - не прерываем основной поток
    console.debug('Background cache update failed:', error);
  }
}

// Обработка сообщений от основного потока
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearCache();
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo().then(info => {
        event.ports[0].postMessage(info);
      });
      break;
      
    case 'PRELOAD_RESOURCES':
      preloadResources(payload.urls);
      break;
  }
});

// Очистка кэша
async function clearCache() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('🧹 Service Worker: All caches cleared');
}

// Получение информации о кэше
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const cacheInfo = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    cacheInfo[cacheName] = {
      size: requests.length,
      urls: requests.map(req => req.url)
    };
  }
  
  return cacheInfo;
}

// Предзагрузка ресурсов
async function preloadResources(urls) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    await cache.addAll(urls);
    console.log(`✅ Preloaded ${urls.length} resources`);
  } catch (error) {
    console.warn('⚠️ Some resources failed to preload:', error);
  }
}

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Здесь можно добавить логику фоновой синхронизации данных
    console.log('🔄 Performing background sync...');
    
    // Пример: обновление кэша API данных
    const cache = await caches.open(API_CACHE_NAME);
    // Дополнительная логика синхронизации...
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push уведомления
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Новое уведомление от TEXNO EDEM',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Открыть'
      },
      {
        action: 'close',
        title: 'Закрыть'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'TEXNO EDEM', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Обработка ошибок Service Worker
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('✅ Service Worker loaded successfully');
