{
  "name": "TEXNO EDEM - Business Intelligence",
  "short_name": "TEXNO EDEM",
  "description": "Система управления заказами CDEK и Мегамаркет с аналитикой и бизнес-метриками",
  "version": "1.2.0",
  "author": "TEXNO EDEM LLC",
  
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "scope": "/",
  "theme_color": "#2C3E50",
  "background_color": "#FFFFFF",
  
  "categories": [
    "business",
    "productivity",
    "utilities"
  ],
  
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Дашборд с аналитикой заказов"
    },
    {
      "src": "/screenshots/orders-mobile.png",
      "sizes": "375x667",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Управление заказами на мобильном"
    }
  ],
  
  "shortcuts": [
    {
      "name": "Дашборд",
      "short_name": "Дашборд",
      "description": "Открыть главный дашборд",
      "url": "/",
      "icons": [
        {
          "src": "/icons/shortcut-dashboard.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Заказы CDEK",
      "short_name": "CDEK",
      "description": "Управление заказами CDEK",
      "url": "/?section=orders&platform=cdek",
      "icons": [
        {
          "src": "/icons/shortcut-cdek.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Заказы Мегамаркет",
      "short_name": "Мегамаркет",
      "description": "Управление заказами Мегамаркет",
      "url": "/?section=orders&platform=megamarket",
      "icons": [
        {
          "src": "/icons/shortcut-megamarket.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Аналитика",
      "short_name": "Аналитика",
      "description": "Просмотр аналитики и отчетов",
      "url": "/?section=analytics",
      "icons": [
        {
          "src": "/icons/shortcut-analytics.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  
  "related_applications": [
    {
      "platform": "web",
      "url": "https://texno-edem.ru"
    }
  ],
  
  "prefer_related_applications": false,
  
  "features": [
    "Cross Platform",
    "fast",
    "simple",
    "Offline Capabilities"
  ],
  
  "edge_side_panel": {
    "preferred_width": 400
  },
  
  "protocol_handlers": [
    {
      "protocol": "web+texnoedem",
      "url": "/?action=%s"
    }
  ],
  
  "share_target": {
    "action": "/?share-target",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  },
  
  "permissions": [
    "storage",
    "notifications"
  ],
  
  "display_override": [
    "window-controls-overlay"
  ],
  
  "launch_handler": {
    "client_mode": "focus-existing"
  },
  
  "handle_links": "preferred",
  
  "id": "/"
}
