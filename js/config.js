// Конфигурация приложения TEXNO EDEM
const CONFIG = {
    APP: {
        NAME: 'TEXNO EDEM',
        VERSION: '1.0.0',
        COMPANY: 'TEXNO EDEM LLC'
    },
    
    API: {
        CDEK: {
            URL: 'https://api.cdek.ru/v2',
            AUTH_URL: 'https://api.cdek.ru/v2/oauth/token',
            CLIENT_ID: '',
            CLIENT_SECRET: '',
            ENABLED: true,
            SYNC_INTERVAL: 600000, // ⭐ УВЕЛИЧЕНО до 10 минут
            TIMEOUT: 30000
        },
        
        MEGAMARKET: {
            URL: 'https://api.megamarket.ru/v1',
            API_KEY: '',
            ENABLED: true,
            SYNC_INTERVAL: 600000, // ⭐ УВЕЛИЧЕНО до 10 минут
            TIMEOUT: 30000
        },
        
        BACKEND: {
            URL: 'https://api.texno-edem.com/v1',
            TIMEOUT: 15000
        }
    },
    
    FEATURES: {
        REAL_TIME_SYNC: true,
        ADVANCED_ANALYTICS: true,
        ORDER_MANAGEMENT: true,
        NOTIFICATIONS: true,
        EXPORT_REPORTS: true,
        MULTI_USER: false
    },
    
    SETTINGS: {
        DEFAULT_PLATFORM: 'all',
        ITEMS_PER_PAGE: 20,
        NOTIFICATION_SOUND: true,
        AUTO_SYNC: true, // ⭐ ДОБАВЛЕНА НАСТРОЙКА авто-синхронизации
        THEME: 'auto',
        SYNC_INTERVAL: 600000 // 10 минут
    },
    
    STATUSES: {
        CDEK: {
            'CREATED': { text: 'Создан', color: '#3b82f6', type: 'info' },
            'ACCEPTED': { text: 'Принят', color: '#8b5cf6', type: 'info' },
            'IN_PROGRESS': { text: 'В пути', color: '#f59e0b', type: 'warning' },
            'DELIVERED': { text: 'Доставлен', color: '#10b981', type: 'success' },
            'PROBLEM': { text: 'Проблема', color: '#ef4444', type: 'error' },
            'CANCELLED': { text: 'Отменен', color: '#6b7280', type: 'cancelled' }
        },
        
        MEGAMARKET: {
            'NEW': { text: 'Новый', color: '#3b82f6', type: 'info' },
            'CONFIRMED': { text: 'Подтвержден', color: '#8b5cf6', type: 'info' },
            'PACKAGING': { text: 'Упаковка', color: '#f59e0b', type: 'warning' },
            'READY_FOR_SHIPMENT': { text: 'Готов к отправке', color: '#f59e0b', type: 'warning' },
            'SHIPPED': { text: 'Отправлен', color: '#8b5cf6', type: 'info' },
            'DELIVERED': { text: 'Доставлен', color: '#10b981', type: 'success' },
            'CANCELLED': { text: 'Отменен', color: '#6b7280', type: 'cancelled' },
            'RETURNED': { text: 'Возврат', color: '#ef4444', type: 'error' }
        }
    },
    
    ANALYTICS: {
        METRICS: [
            'total_orders',
            'total_revenue',
            'average_order_value',
            'conversion_rate',
            'delivery_success_rate',
            'problem_orders_rate'
        ],
        
        TIME_RANGES: [
            { value: 'today', label: 'Сегодня' },
            { value: 'yesterday', label: 'Вчера' },
            { value: 'week', label: 'Неделя' },
            { value: 'month', label: 'Месяц' },
            { value: 'quarter', label: 'Квартал' },
            { value: 'year', label: 'Год' }
        ],
        
        COMPARISON_METRICS: [
            'orders_count',
            'revenue',
            'delivery_time',
            'success_rate',
            'customer_satisfaction'
        ]
    },
    
    STORAGE: {
        ORDERS_KEY: 'texno_edem_orders',
        ANALYTICS_KEY: 'texno_edem_analytics',
        SETTINGS_KEY: 'texno_edem_settings',
        CACHE_DURATION: 600000 // 10 минут
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
