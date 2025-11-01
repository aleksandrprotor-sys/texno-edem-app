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
            SYNC_INTERVAL: 300000, // 5 минут
            TIMEOUT: 30000
        },
        
        MEGAMARKET: {
            URL: 'https://api.megamarket.ru/api/merchant',
            API_KEY: '',
            SECRET_KEY: '',
            CAMPAIGN_ID: '',
            ENABLED: true,
            SYNC_INTERVAL: 300000, // 5 минут
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
        DEFAULT_PLATFORM: 'cdek',
        ITEMS_PER_PAGE: 20,
        NOTIFICATION_SOUND: true,
        AUTO_SYNC: true,
        THEME: 'auto',
        SYNC_INTERVAL: 300000 // 5 минут
    },
    
    STATUSES: {
        CDEK: {
            'CREATED': { text: 'Создан', color: '#3b82f6', type: 'info', action: 'accept' },
            'ACCEPTED': { text: 'Принят', color: '#8b5cf6', type: 'info', action: 'process' },
            'IN_PROGRESS': { text: 'В пути', color: '#f59e0b', type: 'warning', action: 'deliver' },
            'DELIVERED': { text: 'Доставлен', color: '#10b981', type: 'success', action: null },
            'PROBLEM': { text: 'Проблема', color: '#ef4444', type: 'error', action: 'resolve' },
            'CANCELLED': { text: 'Отменен', color: '#6b7280', type: 'cancelled', action: null }
        },
        
        MEGAMARKET: {
            'NEW': { text: 'Новый', color: '#3b82f6', type: 'info', action: 'confirm' },
            'CONFIRMED': { text: 'Подтвержден', color: '#8b5cf6', type: 'info', action: 'pack' },
            'PACKAGING': { text: 'Упаковка', color: '#f59e0b', type: 'warning', action: 'ship' },
            'READY_FOR_SHIPMENT': { text: 'Готов к отправке', color: '#f59e0b', type: 'warning', action: 'ship' },
            'SHIPPED': { text: 'Отправлен', color: '#6366f1', type: 'info', action: 'deliver' },
            'DELIVERED': { text: 'Доставлен', color: '#10b981', type: 'success', action: null },
            'CANCELLED': { text: 'Отменен', color: '#6b7280', type: 'cancelled', action: null },
            'RETURNED': { text: 'Возврат', color: '#ef4444', type: 'error', action: 'process_return' }
        }
    },
    
    ACTIONS: {
        CDEK: {
            'accept': { name: 'Принять заказ', method: 'acceptOrder', icon: 'fa-check' },
            'process': { name: 'В обработку', method: 'processOrder', icon: 'fa-cog' },
            'deliver': { name: 'Доставить', method: 'deliverOrder', icon: 'fa-truck' },
            'cancel': { name: 'Отменить', method: 'cancelOrder', icon: 'fa-times' },
            'resolve': { name: 'Решить проблему', method: 'resolveIssue', icon: 'fa-wrench' }
        },
        MEGAMARKET: {
            'confirm': { name: 'Подтвердить', method: 'confirmOrder', icon: 'fa-check' },
            'pack': { name: 'Упаковать', method: 'packOrder', icon: 'fa-box' },
            'ship': { name: 'Отправить', method: 'shipOrder', icon: 'fa-shipping-fast' },
            'deliver': { name: 'Доставить', method: 'deliverOrder', icon: 'fa-truck' },
            'cancel': { name: 'Отменить', method: 'cancelOrder', icon: 'fa-times' },
            'process_return': { name: 'Обработать возврат', method: 'processReturn', icon: 'fa-undo' }
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
        CACHE_DURATION: 300000 // 5 минут
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
