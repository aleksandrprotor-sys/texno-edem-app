// js/config.js - Улучшенная конфигурация с автосохранением
class ConfigManager {
    constructor() {
        this.defaultConfig = {
            APP: {
                NAME: 'TEXNO EDEM',
                VERSION: '1.0.0',
                COMPANY: 'TEXNO EDEM LLC',
                BUILD: '2024.01.001'
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
                GRID_VIEW: false,
                FONT_SIZE: 'medium'
            },
            
            NOTIFICATIONS: {
                NEW_ORDERS: true,
                STATUS_CHANGES: true,
                PROBLEMS: true,
                SOUND: true,
                DESKTOP_NOTIFICATIONS: false,
                PUSH_NOTIFICATIONS: false
            }
        };

        this.load();
    }

    load() {
        try {
            const savedConfig = storageManager.get('config');
            if (savedConfig) {
                this.config = this.deepMerge(this.defaultConfig, savedConfig);
                console.log('✅ Config loaded from storage');
            } else {
                this.config = this.defaultConfig;
                this.save();
                console.log('✅ Default config loaded');
            }
        } catch (error) {
            console.error('❌ Config load error:', error);
            this.config = this.defaultConfig;
        }
    }

    save() {
        try {
            const success = storageManager.set('config', this.config);
            if (success) {
                console.log('✅ Config saved');
            } else {
                console.error('❌ Config save failed');
            }
            return success;
        } catch (error) {
            console.error('❌ Config save error:', error);
            return false;
        }
    }

    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value !== undefined ? value : defaultValue;
    }

    set(path, value) {
        const keys = path.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
        this.save();
        
        // Генерируем событие изменения конфигурации
        this.dispatchChangeEvent(path, value);
    }

    reset() {
        this.config = this.defaultConfig;
        this.save();
        console.log('✅ Config reset to defaults');
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

    dispatchChangeEvent(path, value) {
        const event = new CustomEvent('configChanged', {
            detail: { path, value, timestamp: new Date() }
        });
        window.dispatchEvent(event);
    }

    // Методы для работы с настройками
    enableFeature(feature) {
        this.set(`FEATURES.${feature}`, true);
    }

    disableFeature(feature) {
        this.set(`FEATURES.${feature}`, false);
    }

    setTheme(theme) {
        this.set('SETTINGS.THEME', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }

    setLanguage(language) {
        this.set('SETTINGS.LANGUAGE', language);
        // Здесь можно добавить логику смены языка
    }

    // Получение всей конфигурации
    getAll() {
        return { ...this.config };
    }

    // Экспорт конфигурации
    export() {
        return {
            config: this.config,
            timestamp: new Date().toISOString(),
            version: this.config.APP.VERSION
        };
    }

    // Импорт конфигурации
    import(configData) {
        if (configData && configData.config) {
            this.config = this.deepMerge(this.defaultConfig, configData.config);
            this.save();
            console.log('✅ Config imported');
            return true;
        }
        return false;
    }
}

// Создаем глобальный экземпляр
const configManager = new ConfigManager();
const CONFIG = configManager.config;

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConfigManager, configManager, CONFIG };
}
