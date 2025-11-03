// js/config.js - Полностью исправленный
class ConfigManager {
    constructor() {
        this.defaultConfig = {
            APP: {
                NAME: 'TEXNO EDEM',
                VERSION: '1.2.0',
                COMPANY: 'TEXNO EDEM LLC',
                BUILD: '2024.01.20'
            },
            
            API: {
                CDEK: {
                    URL: 'https://api.cdek.ru/v2',
                    AUTH_URL: 'https://api.cdek.ru/v2/oauth/token',
                    CLIENT_ID: '',
                    CLIENT_SECRET: '',
                    ENABLED: true,
                    SYNC_INTERVAL: 300000,
                    TIMEOUT: 30000
                },
                
                MEGAMARKET: {
                    URL: 'https://api.megamarket.ru/api/merchant',
                    API_KEY: '',
                    SECRET_KEY: '',
                    CAMPAIGN_ID: '',
                    ENABLED: true,
                    SYNC_INTERVAL: 300000,
                    TIMEOUT: 30000
                }
            },
            
            STATUSES: {
                CDEK: {
                    'CREATED': { text: 'Создан', color: '#3B82F6' },
                    'ACCEPTED': { text: 'Принят', color: '#F59E0B' },
                    'IN_PROGRESS': { text: 'В пути', color: '#8B5CF6' },
                    'DELIVERED': { text: 'Доставлен', color: '#10B981' },
                    'PROBLEM': { text: 'Проблема', color: '#EF4444' },
                    'CANCELLED': { text: 'Отменен', color: '#6B7280' }
                },
                MEGAMARKET: {
                    'NEW': { text: 'Новый', color: '#3B82F6' },
                    'CONFIRMED': { text: 'Подтвержден', color: '#F59E0B' },
                    'PACKAGING': { text: 'Упаковка', color: '#8B5CF6' },
                    'SHIPPED': { text: 'Отправлен', color: '#6366F1' },
                    'DELIVERED': { text: 'Доставлен', color: '#10B981' },
                    'CANCELLED': { text: 'Отменен', color: '#6B7280' }
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
                OFFLINE_MODE: true
            },
            
            SETTINGS: {
                DEFAULT_PLATFORM: 'cdek',
                ITEMS_PER_PAGE: 20,
                NOTIFICATION_SOUND: true,
                AUTO_SYNC: true,
                SYNC_INTERVAL: 300000,
                THEME: 'auto',
                LANGUAGE: 'ru',
                CURRENCY: 'RUB',
                TIMEZONE: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            
            UI: {
                ANIMATIONS: true,
                COMPACT_MODE: false,
                SIDEBAR_COLLAPSED: false,
                GRID_VIEW: false
            }
        };
        
        this.config = { ...this.defaultConfig };
        this.loadConfig();
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem('texno_edem_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.config = this.deepMerge(this.defaultConfig, parsed);
            }
        } catch (error) {
            console.error('Error loading config:', error);
            this.config = { ...this.defaultConfig };
        }
    }

    saveConfig() {
        try {
            localStorage.setItem('texno_edem_config', JSON.stringify(this.config));
        } catch (error) {
            console.error('Error saving config:', error);
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
            console.warn('Config get error:', error);
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
            
            current[keys[keys.length - 1]] = value;
            this.saveConfig();
            
        } catch (error) {
            console.error('Config set error:', error);
        }
    }

    reset() {
        this.config = { ...this.defaultConfig };
        this.saveConfig();
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

    applyTheme() {
        const theme = this.get('SETTINGS.THEME', 'auto');
        let actualTheme = theme;

        if (theme === 'auto') {
            actualTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        document.documentElement.setAttribute('data-theme', actualTheme);
    }
}

// Создаем глобальный экземпляр ДО его использования
const CONFIG = new ConfigManager();
