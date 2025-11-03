// js/config.js - Улучшенная конфигурация с сохранением
class ConfigManager {
    constructor() {
        this.defaultConfig = {
            APP: {
                NAME: 'TEXNO EDEM',
                VERSION: '1.0.0',
                COMPANY: 'TEXNO EDEM LLC',
                BUILD: '2024.01.15'
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
        
        this.loadConfig();
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem('texno_edem_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.config = this.deepMerge(this.defaultConfig, parsed);
            } else {
                this.config = this.defaultConfig;
            }
            this.saveConfig(); // Сохраняем для инициализации
        } catch (error) {
            console.error('Error loading config:', error);
            this.config = this.defaultConfig;
        }
    }

    saveConfig() {
        try {
            localStorage.setItem('texno_edem_config', JSON.stringify(this.config));
            console.log('✅ Config saved successfully');
        } catch (error) {
            console.error('Error saving config:', error);
        }
    }

    get(keyPath, defaultValue = null) {
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
    }

    set(keyPath, value) {
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
        
        // Генерируем событие об изменении конфигурации
        window.dispatchEvent(new CustomEvent('configChanged', {
            detail: { keyPath, value }
        }));
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

    // Методы для работы с настройками платформ
    isPlatformEnabled(platform) {
        return this.get(`API.${platform.toUpperCase()}.ENABLED`, false);
    }

    setPlatformEnabled(platform, enabled) {
        this.set(`API.${platform.toUpperCase()}.ENABLED`, enabled);
    }

    getPlatformConfig(platform) {
        return this.get(`API.${platform.toUpperCase()}`, {});
    }

    // Методы для работы с настройками UI
    getTheme() {
        return this.get('SETTINGS.THEME', 'auto');
    }

    setTheme(theme) {
        this.set('SETTINGS.THEME', theme);
        this.applyTheme();
    }

    applyTheme() {
        const theme = this.getTheme();
        const html = document.documentElement;
        
        if (theme === 'auto') {
            html.removeAttribute('data-theme');
        } else {
            html.setAttribute('data-theme', theme);
        }
    }

    // Экспорт/импорт настроек
    exportConfig() {
        return JSON.stringify(this.config, null, 2);
    }

    importConfig(configString) {
        try {
            const imported = JSON.parse(configString);
            this.config = this.deepMerge(this.defaultConfig, imported);
            this.saveConfig();
            return true;
        } catch (error) {
            console.error('Error importing config:', error);
            return false;
        }
    }
}

// Создаем глобальный экземпляр
const CONFIG = new ConfigManager();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConfigManager, CONFIG };
}
