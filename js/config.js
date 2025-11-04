// js/config.js - Полная конфигурация TEXNO EDEM
class ConfigManager {
    constructor() {
        this.defaultConfig = {
            APP: {
                NAME: 'TEXNO EDEM',
                VERSION: '1.0.0',
                COMPANY: 'TEXNO EDEM LLC',
                BUILD: '2024.01.15',
                DESCRIPTION: 'Business Intelligence Platform'
            },
            
            API: {
                CDEK: {
                    URL: 'https://api.cdek.ru/v2',
                    AUTH_URL: 'https://api.cdek.ru/v2/oauth/token',
                    CLIENT_ID: '',
                    CLIENT_SECRET: '',
                    ENABLED: true,
                    SYNC_INTERVAL: 300000,
                    TIMEOUT: 30000,
                    RETRY_ATTEMPTS: 3
                },
                
                MEGAMARKET: {
                    URL: 'https://api.megamarket.ru/api/merchant',
                    API_KEY: '',
                    SECRET_KEY: '',
                    CAMPAIGN_ID: '',
                    ENABLED: true,
                    SYNC_INTERVAL: 300000,
                    TIMEOUT: 30000,
                    RETRY_ATTEMPTS: 3
                }
            },
            
            FEATURES: {
                REAL_TIME_SYNC: true,
                ADVANCED_ANALYTICS: true,
                ORDER_MANAGEMENT: true,
                NOTIFICATIONS: true,
                EXPORT_REPORTS: true,
                MULTI_USER: false,
                DARK_MODE: true,
                OFFLINE_MODE: true,
                TELEGRAM_INTEGRATION: true
            },
            
            SETTINGS: {
                DEFAULT_PLATFORM: 'all',
                ITEMS_PER_PAGE: 20,
                NOTIFICATION_SOUND: true,
                AUTO_SYNC: true,
                SYNC_INTERVAL: 300000,
                THEME: 'auto',
                LANGUAGE: 'ru',
                CURRENCY: 'RUB',
                TIMEZONE: Intl.DateTimeFormat().resolvedOptions().timeZone,
                DATE_FORMAT: 'dd.MM.yyyy',
                TIME_FORMAT: 'HH:mm'
            },
            
            UI: {
                ANIMATIONS: true,
                COMPACT_MODE: false,
                SIDEBAR_COLLAPSED: false,
                GRID_VIEW: false,
                SHOW_STATISTICS: true,
                SHOW_CHARTS: true
            },
            
            STATUSES: {
                CDEK: {
                    'CREATED': { text: 'Создан', color: '#3b82f6', action: 'accept', icon: 'clock' },
                    'ACCEPTED': { text: 'Принят', color: '#f59e0b', action: 'process', icon: 'check-circle' },
                    'IN_PROGRESS': { text: 'В пути', color: '#8b5cf6', action: 'deliver', icon: 'shipping-fast' },
                    'DELIVERED': { text: 'Доставлен', color: '#10b981', action: null, icon: 'check-double' },
                    'PROBLEM': { text: 'Проблема', color: '#ef4444', action: 'resolve', icon: 'exclamation-triangle' },
                    'CANCELLED': { text: 'Отменен', color: '#6b7280', action: null, icon: 'times-circle' }
                },
                MEGAMARKET: {
                    'NEW': { text: 'Новый', color: '#3b82f6', action: 'confirm', icon: 'clock' },
                    'CONFIRMED': { text: 'Подтвержден', color: '#f59e0b', action: 'pack', icon: 'check-circle' },
                    'PACKAGING': { text: 'Упаковка', color: '#8b5cf6', action: 'ship', icon: 'box' },
                    'READY_FOR_SHIPMENT': { text: 'Готов к отправке', color: '#8b5cf6', action: 'ship', icon: 'shipping-fast' },
                    'SHIPPED': { text: 'Отправлен', color: '#10b981', action: 'deliver', icon: 'truck' },
                    'DELIVERED': { text: 'Доставлен', color: '#10b981', action: null, icon: 'check-double' },
                    'CANCELLED': { text: 'Отменен', color: '#6b7280', action: null, icon: 'times-circle' },
                    'RETURNED': { text: 'Возврат', color: '#ef4444', action: 'processReturn', icon: 'undo' }
                }
            },
            
            ACTIONS: {
                CDEK: {
                    'accept': { name: 'Принять заказ', icon: 'check', method: 'acceptOrder' },
                    'process': { name: 'В обработку', icon: 'cog', method: 'processOrder' },
                    'deliver': { name: 'Доставить', icon: 'truck', method: 'deliverOrder' },
                    'cancel': { name: 'Отменить', icon: 'times', method: 'cancelOrder' },
                    'resolve': { name: 'Решить проблему', icon: 'wrench', method: 'resolveIssue' }
                },
                MEGAMARKET: {
                    'confirm': { name: 'Подтвердить', icon: 'check', method: 'confirmOrder' },
                    'pack': { name: 'Упаковать', icon: 'box', method: 'packOrder' },
                    'ship': { name: 'Отправить', icon: 'shipping-fast', method: 'shipOrder' },
                    'deliver': { name: 'Доставить', icon: 'truck', method: 'deliverOrder' },
                    'cancel': { name: 'Отменить', icon: 'times', method: 'cancelOrder' },
                    'processReturn': { name: 'Обработать возврат', icon: 'undo', method: 'processReturn' }
                }
            },
            
            COLORS: {
                primary: '#3b82f6',
                secondary: '#6b7280',
                success: '#10b981',
                danger: '#ef4444',
                warning: '#f59e0b',
                info: '#06b6d4',
                light: '#f8fafc',
                dark: '#1f2937',
                cdek: '#FF6B35',
                megamarket: '#2980B9'
            },
            
            NOTIFICATIONS: {
                ENABLED: true,
                SOUND: true,
                DURATION: 5000,
                POSITION: 'top-right',
                TYPES: ['success', 'error', 'warning', 'info']
            }
        };
        
        this.loadConfig();
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem('texno_edem_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.config = this.deepMerge(this.defaultConfig, parsed);
                console.log('✅ Config loaded from localStorage');
            } else {
                this.config = { ...this.defaultConfig };
                console.log('✅ Default config loaded');
            }
            this.saveConfig(); // Сохраняем для инициализации
        } catch (error) {
            console.error('❌ Error loading config:', error);
            this.config = { ...this.defaultConfig };
        }
    }

    saveConfig() {
        try {
            localStorage.setItem('texno_edem_config', JSON.stringify(this.config));
            console.log('✅ Config saved successfully');
            
            // Генерируем событие об изменении конфигурации
            window.dispatchEvent(new CustomEvent('configChanged', {
                detail: { config: this.config }
            }));
            
            return true;
        } catch (error) {
            console.error('❌ Error saving config:', error);
            return false;
        }
    }

    get(keyPath, defaultValue = null) {
        try {
            const keys = keyPath.split('.');
            let value = this.config;
            
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    return defaultValue;
                }
            }
            
            return value !== undefined ? value : defaultValue;
        } catch (error) {
            console.error('❌ Config get error:', error);
            return defaultValue;
        }
    }

    set(keyPath, value) {
        try {
            const keys = keyPath.split('.');
            let current = this.config;
            
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!(key in current)) {
                    current[key] = {};
                }
                current = current[key];
            }
            
            const lastKey = keys[keys.length - 1];
            current[lastKey] = value;
            
            const success = this.saveConfig();
            
            if (success) {
                console.log(`✅ Config updated: ${keyPath} =`, value);
            }
            
            return success;
        } catch (error) {
            console.error('❌ Config set error:', error);
            return false;
        }
    }

    reset() {
        try {
            this.config = { ...this.defaultConfig };
            this.saveConfig();
            console.log('✅ Config reset to defaults');
            return true;
        } catch (error) {
            console.error('❌ Config reset error:', error);
            return false;
        }
    }

    deepMerge(target, source) {
        const output = { ...target };
        
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        output[key] = source[key];
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    output[key] = source[key];
                }
            });
        }
        
        return output;
    }

    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    // Методы для работы с настройками платформ
    isPlatformEnabled(platform) {
        return this.get(`API.${platform.toUpperCase()}.ENABLED`, false);
    }

    setPlatformEnabled(platform, enabled) {
        return this.set(`API.${platform.toUpperCase()}.ENABLED`, enabled);
    }

    getPlatformConfig(platform) {
        return this.get(`API.${platform.toUpperCase()}`, {});
    }

    // Методы для работы с настройками UI
    getTheme() {
        return this.get('SETTINGS.THEME', 'auto');
    }

    setTheme(theme) {
        const success = this.set('SETTINGS.THEME', theme);
        if (success) {
            this.applyTheme();
        }
        return success;
    }

    applyTheme() {
        const theme = this.getTheme();
        const html = document.documentElement;
        
        if (theme === 'auto') {
            // Автоматическое определение темы
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            html.setAttribute('data-theme', theme);
        }
    }

    // Получение цветовой схемы
    getColorScheme() {
        return this.get('COLORS', this.defaultConfig.COLORS);
    }

    // Получение конфигурации статусов
    getStatusConfig(platform, statusCode) {
        return this.get(`STATUSES.${platform.toUpperCase()}.${statusCode}`);
    }

    // Получение конфигурации действий
    getActionConfig(platform, action) {
        return this.get(`ACTIONS.${platform.toUpperCase()}.${action}`);
    }

    // Экспорт/импорт настроек
    exportConfig() {
        try {
            const configData = {
                ...this.config,
                _exported: new Date().toISOString(),
                _version: this.get('APP.VERSION')
            };
            return JSON.stringify(configData, null, 2);
        } catch (error) {
            console.error('❌ Config export error:', error);
            return null;
        }
    }

    importConfig(configString) {
        try {
            const imported = JSON.parse(configString);
            
            // Проверяем версию
            if (imported._version && imported._version !== this.get('APP.VERSION')) {
                console.warn('⚠️ Config version mismatch');
            }
            
            // Убираем служебные поля
            delete imported._exported;
            delete imported._version;
            
            this.config = this.deepMerge(this.defaultConfig, imported);
            const success = this.saveConfig();
            
            if (success) {
                console.log('✅ Config imported successfully');
                this.applyTheme();
            }
            
            return success;
        } catch (error) {
            console.error('❌ Config import error:', error);
            return false;
        }
    }

    // Получение информации о конфигурации
    getInfo() {
        return {
            version: this.get('APP.VERSION'),
            build: this.get('APP.BUILD'),
            company: this.get('APP.COMPANY'),
            theme: this.get('SETTINGS.THEME'),
            language: this.get('SETTINGS.LANGUAGE'),
            autoSync: this.get('SETTINGS.AUTO_SYNC'),
            cdekEnabled: this.get('API.CDEK.ENABLED'),
            megamarketEnabled: this.get('API.MEGAMARKET.ENABLED')
        };
    }

    // Валидация конфигурации
    validate() {
        const errors = [];
        
        // Проверка обязательных полей
        if (!this.get('APP.NAME')) {
            errors.push('APP.NAME is required');
        }
        
        if (!this.get('APP.VERSION')) {
            errors.push('APP.VERSION is required');
        }
        
        // Проверка настроек API
        if (this.get('API.CDEK.ENABLED')) {
            if (!this.get('API.CDEK.CLIENT_ID') || !this.get('API.CDEK.CLIENT_SECRET')) {
                errors.push('CDEK API requires CLIENT_ID and CLIENT_SECRET');
            }
        }
        
        if (this.get('API.MEGAMARKET.ENABLED')) {
            if (!this.get('API.MEGAMARKET.API_KEY') || !this.get('API.MEGAMARKET.CAMPAIGN_ID')) {
                errors.push('Megamarket API requires API_KEY and CAMPAIGN_ID');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Создаем глобальный экземпляр
const CONFIG = new ConfigManager();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConfigManager, CONFIG };
}
