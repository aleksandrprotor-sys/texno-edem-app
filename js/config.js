// Конфигурация приложения TEXNO EDEM
class AppConfig {
    constructor() {
        this.API = {
            CDEK: {
                ENABLED: true,
                CLIENT_ID: '',
                CLIENT_SECRET: '',
                SYNC_INTERVAL: 300000
            },
            MEGAMARKET: {
                ENABLED: true,
                API_KEY: '',
                SECRET_KEY: '',
                CAMPAIGN_ID: '',
                SYNC_INTERVAL: 300000
            }
        };
        
        this.SETTINGS = {
            AUTO_SYNC: true,
            NOTIFICATION_SOUND: true,
            ITEMS_PER_PAGE: 20,
            THEME: 'auto',
            LANGUAGE: 'ru',
            CURRENCY: 'RUB'
        };
        
        this.FEATURES = {
            NOTIFICATIONS: true,
            ANALYTICS: true,
            EXPORT: true
        };
        
        this.APP = {
            VERSION: '2.0.0',
            NAME: 'TEXNO EDEM',
            COMPANY: 'TEXNO EDEM LLC',
            BUILD: new Date().toISOString().split('T')[0]
        };
    }

    // Геттер для удобного доступа к настройкам
    get(key, defaultValue = null) {
        const keys = key.split('.');
        let value = this;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }
        
        return value !== undefined ? value : defaultValue;
    }

    // Сеттер для установки значений
    set(key, value) {
        const keys = key.split('.');
        let obj = this;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in obj)) {
                obj[k] = {};
            }
            obj = obj[k];
        }
        
        obj[keys[keys.length - 1]] = value;
        return true;
    }

    // Экспорт конфигурации
    exportConfig() {
        return JSON.stringify(this, null, 2);
    }

    // Импорт конфигурации
    importConfig(configString) {
        try {
            const config = JSON.parse(configString);
            Object.assign(this, config);
            return true;
        } catch (error) {
            console.error('Config import error:', error);
            return false;
        }
    }

    // Сброс к значениям по умолчанию
    reset() {
        const defaultConfig = new AppConfig();
        Object.assign(this, defaultConfig);
    }

    // Применение темы
    applyTheme() {
        const theme = this.SETTINGS.THEME;
        if (theme === 'auto') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }
}
