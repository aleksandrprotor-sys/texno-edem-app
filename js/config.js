// Конфигурация приложения TEXNO EDEM
const CONFIG = {
    APP: {
        NAME: 'TEXNO EDEM',
        VERSION: '1.0.1',
        COMPANY: 'TEXNO EDEM LLC',
        DESCRIPTION: 'Business Intelligence Platform'
    },
    
    API: {
        CDEK: {
            URL: 'https://api.cdek.ru/v2',
            AUTH_URL: 'https://api.cdek.ru/v2/oauth/token',
            CLIENT_ID: '',
            CLIENT_SECRET: '',
            ENABLED: true,
            SYNC_INTERVAL: 600000, // 10 минут
            TIMEOUT: 30000,
            MAX_RETRIES: 3
        },
        
        MEGAMARKET: {
            URL: 'https://api.megamarket.ru/v1',
            API_KEY: '',
            ENABLED: true,
            SYNC_INTERVAL: 600000, // 10 минут
            TIMEOUT: 30000,
            MAX_RETRIES: 3
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
        MULTI_USER: false,
        CACHE_ENABLED: true
    },
    
    SETTINGS: {
        DEFAULT_PLATFORM: null,
        ITEMS_PER_PAGE: 20,
        NOTIFICATION_SOUND: true,
        AUTO_SYNC: true,
        THEME: 'auto',
        FORCE_REFRESH: false,
        CACHE_DURATION: 300000 // 5 минут
    },
    
    STATUSES: {
        CDEK: {
            'CREATED': { text: 'Создан', color: '#3b82f6', type: 'info', priority: 1 },
            'ACCEPTED': { text: 'Принят', color: '#8b5cf6', type: 'info', priority: 2 },
            'IN_PROGRESS': { text: 'В пути', color: '#f59e0b', type: 'warning', priority: 3 },
            'DELIVERED': { text: 'Доставлен', color: '#10b981', type: 'success', priority: 4 },
            'PROBLEM': { text: 'Проблема', color: '#ef4444', type: 'error', priority: 5 },
            'CANCELLED': { text: 'Отменен', color: '#6b7280', type: 'cancelled', priority: 6 }
        },
        
        MEGAMARKET: {
            'NEW': { text: 'Новый', color: '#3b82f6', type: 'info', priority: 1 },
            'CONFIRMED': { text: 'Подтвержден', color: '#8b5cf6', type: 'info', priority: 2 },
            'PACKAGING': { text: 'Упаковка', color: '#f59e0b', type: 'warning', priority: 3 },
            'READY_FOR_SHIPMENT': { text: 'Готов к отправке', color: '#f59e0b', type: 'warning', priority: 4 },
            'SHIPPED': { text: 'Отправлен', color: '#8b5cf6', type: 'info', priority: 5 },
            'DELIVERED': { text: 'Доставлен', color: '#10b981', type: 'success', priority: 6 },
            'CANCELLED': { text: 'Отменен', color: '#6b7280', type: 'cancelled', priority: 7 },
            'RETURNED': { text: 'Возврат', color: '#ef4444', type: 'error', priority: 8 }
        }
    },
    
    ANALYTICS: {
        METRICS: [
            'total_orders',
            'total_revenue', 
            'average_order_value',
            'conversion_rate',
            'delivery_success_rate',
            'problem_orders_rate',
            'customer_satisfaction'
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
        ],
        
        CHARTS: {
            SALES: 'sales',
            ORDERS: 'orders',
            REVENUE: 'revenue',
            PERFORMANCE: 'performance'
        }
    },
    
    STORAGE: {
        ORDERS_KEY: 'texno_edem_orders',
        ANALYTICS_KEY: 'texno_edem_analytics', 
        SETTINGS_KEY: 'texno_edem_settings',
        CONFIG_KEY: 'texno_edem_config',
        CACHE_DURATION: 300000
    },
    
    UI: {
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 500,
        NOTIFICATION_DURATION: 5000,
        LOADING_DELAY: 1000
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
