// Конфигурация приложения TEXNO EDEM
class AppConfig {
    static get API_CONFIG() {
        return {
            CDEK: {
                BASE_URL: 'https://api.cdek.ru/v2',
                AUTH_URL: 'https://api.cdek.ru/v2/oauth/token',
                CLIENT_ID: 'texno-edem-client',
                CLIENT_SECRET: 'your-secret-key', // Должен быть защищен
                TIMEOUT: 10000
            },
            MEGAMARKET: {
                BASE_URL: 'https://api.megamarket.ru/v1',
                API_KEY: 'your-megamarket-api-key', // Должен быть защищен
                TIMEOUT: 15000
            },
            APP: {
                VERSION: '2.0.0',
                ENV: 'production',
                DEBUG: false
            }
        };
    }

    static get STORAGE_KEYS() {
        return {
            ORDERS: 'texno_edem_orders',
            ANALYTICS: 'texno_edem_analytics',
            SETTINGS: 'texno_edem_settings',
            NOTIFICATIONS: 'texno_edem_notifications',
            THEME: 'texno_edem_theme',
            LAST_SYNC: 'texno_edem_last_sync'
        };
    }

    static get ORDER_STATUSES() {
        return {
            CDEK: {
                'CREATED': { text: 'Создан', color: '#3498db', type: 'info' },
                'ACCEPTED': { text: 'Принят', color: '#2ecc71', type: 'success' },
                'IN_PROGRESS': { text: 'В процессе', color: '#f39c12', type: 'warning' },
                'DELIVERED': { text: 'Доставлен', color: '#27ae60', type: 'success' },
                'PROBLEM': { text: 'Проблема', color: '#e74c3c', type: 'error' },
                'CANCELLED': { text: 'Отменен', color: '#95a5a6', type: 'default' }
            },
            MEGAMARKET: {
                'NEW': { text: 'Новый', color: '#3498db', type: 'info' },
                'PROCESSING': { text: 'В обработке', color: '#f39c12', type: 'warning' },
                'SHIPPED': { text: 'Отправлен', color: '#9b59b6', type: 'info' },
                'DELIVERED': { text: 'Доставлен', color: '#27ae60', type: 'success' },
                'CANCELLED': { text: 'Отменен', color: '#95a5a6', type: 'default' },
                'PROBLEM': { text: 'Проблема', color: '#e74c3c', type: 'error' }
            }
        };
    }

    static get COLORS() {
        return {
            PRIMARY: '#2563eb',
            SECONDARY: '#64748b',
            SUCCESS: '#10b981',
            WARNING: '#f59e0b',
            ERROR: '#ef4444',
            INFO: '#3b82f6',
            
            CDEK: '#ff6b00',
            MEGAMARKET: '#00a2ff',
            
            BACKGROUND: {
                LIGHT: '#ffffff',
                DARK: '#0f172a'
            },
            TEXT: {
                LIGHT: '#1e293b',
                DARK: '#f1f5f9'
            }
        };
    }

    static get BREAKPOINTS() {
        return {
            MOBILE: 768,
            TABLET: 1024,
            DESKTOP: 1280
        };
    }

    static get DEFAULT_SETTINGS() {
        return {
            autoSync: true,
            syncInterval: 5, // минуты
            notifications: {
                newOrders: true,
                problems: true,
                deliveries: true
            },
            theme: 'auto',
            emergencyMode: false,
            apiKeys: {
                cdek: '',
                megamarket: ''
            }
        };
    }

    static get ANALYTICS_PERIODS() {
        return {
            WEEK: 'week',
            MONTH: 'month',
            QUARTER: 'quarter',
            YEAR: 'year'
        };
    }

    // Метод для получения конфигурации в зависимости от окружения
    static getConfig(env = 'production') {
        const config = this.API_CONFIG;
        
        if (env === 'development') {
            config.APP.DEBUG = true;
            config.APP.ENV = 'development';
            
            // Тестовые API endpoints
            config.CDEK.BASE_URL = 'https://api.edu.cdek.ru/v2';
            config.MEGAMARKET.BASE_URL = 'https://api.test.megamarket.ru/v1';
        }
        
        return config;
    }

    // Валидация конфигурации
    static validateConfig(config) {
        const required = ['CDEK', 'MEGAMARKET', 'APP'];
        const missing = required.filter(section => !config[section]);
        
        if (missing.length > 0) {
            throw new Error(`Missing configuration sections: ${missing.join(', ')}`);
        }
        
        return true;
    }

    // Получение статуса по коду
    static getStatusInfo(platform, statusCode) {
        const statuses = this.ORDER_STATUSES[platform.toUpperCase()];
        return statuses?.[statusCode] || { 
            text: statusCode, 
            color: '#64748b', 
            type: 'default' 
        };
    }

    // Получение цвета платформы
    static getPlatformColor(platform) {
        return this.COLORS[platform.toUpperCase()] || this.COLORS.SECONDARY;
    }

    // Проверка поддержки функций
    static isFeatureSupported(feature) {
        const supportedFeatures = {
            'analytics': true,
            'notifications': true,
            'emergency_mode': true,
            'export_reports': true,
            'multi_platform': true
        };
        
        return supportedFeatures[feature] || false;
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}
