// js/config.js
class ConfigManager {
    constructor() {
        this.defaultConfig = {
            APP: {
                NAME: 'TEXNO EDEM',
                VERSION: '1.3.0',
                COMPANY: 'TEXNO EDEM LLC',
                BUILD: '2024.01.25'
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
            
            THEMES: {
                light: {
                    '--primary': '#2C3E50',
                    '--primary-dark': '#1a252f',
                    '--secondary': '#3498DB',
                    '--accent': '#E74C3C',
                    '--success': '#27AE60',
                    '--warning': '#F39C12',
                    '--danger': '#E74C3C',
                    '--info': '#3498DB',
                    '--white': '#ffffff',
                    '--gray-50': '#f8f9fa',
                    '--gray-100': '#f1f3f4',
                    '--gray-200': '#e8eaed',
                    '--gray-300': '#dadce0',
                    '--gray-400': '#bdc1c6',
                    '--gray-500': '#9aa0a6',
                    '--gray-600': '#80868b',
                    '--gray-700': '#5f6368',
                    '--gray-800': '#3c4043',
                    '--gray-900': '#202124',
                    '--cdek-primary': '#FF6B35',
                    '--cdek-secondary': '#FF8E53',
                    '--megamarket-primary': '#2980B9',
                    '--megamarket-secondary': '#3498DB',
                    '--shadow': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                    '--shadow-md': '0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
                    '--shadow-lg': '0 10px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)'
                },
                dark: {
                    '--primary': '#3498DB',
                    '--primary-dark': '#2980B9',
                    '--secondary': '#2C3E50',
                    '--accent': '#E74C3C',
                    '--success': '#27AE60',
                    '--warning': '#F39C12',
                    '--danger': '#E74C3C',
                    '--info': '#3498DB',
                    '--white': '#1a1a1a',
                    '--gray-50': '#2d2d2d',
                    '--gray-100': '#3d3d3d',
                    '--gray-200': '#4d4d4d',
                    '--gray-300': '#5d5d5d',
                    '--gray-400': '#6d6d6d',
                    '--gray-500': '#7d7d7d',
                    '--gray-600': '#8d8d8d',
                    '--gray-700': '#9d9d9d',
                    '--gray-800': '#adadad',
                    '--gray-900': '#dedede',
                    '--cdek-primary': '#FF8E53',
                    '--cdek-secondary': '#FF6B35',
                    '--megamarket-primary': '#3498DB',
                    '--megamarket-secondary': '#2980B9',
                    '--shadow': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.4)',
                    '--shadow-md': '0 4px 6px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2)',
                    '--shadow-lg': '0 10px 25px rgba(0,0,0,0.3), 0 5px 10px rgba(0,0,0,0.2)'
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
                THEME_MODE: 'light',
                ACCENT_COLOR: '#3498DB',
                FONT_SIZE: 'medium',
                ANIMATIONS: true,
                REDUCE_MOTION: false,
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
        this.applyTheme(); // Применяем тему сразу после загрузки
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem('texno_edem_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.config = this.deepMerge(this.defaultConfig, parsed);
                console.log('✅ Config loaded successfully');
            }
        } catch (error) {
            console.error('❌ Error loading config:', error);
            this.config = { ...this.defaultConfig };
        }
    }

    saveConfig() {
        try {
            localStorage.setItem('texno_edem_config', JSON.stringify(this.config));
            console.log('💾 Config saved');
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
            console.warn('⚠️ Config get error:', error);
            return defaultValue;
        }
    }

    set(keyPath, value) {
        try {
            const keys = keyPath.split('.');
            let current = this.config;
            
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!(key in current) || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key];
            }
            
            current[keys[keys.length - 1]] = value;
            const success = this.saveConfig();
            
            // Автоматически применяем изменения темы
            if (keyPath.includes('THEME') || keyPath.includes('ACCENT_COLOR')) {
                this.applyTheme();
            }
            
            return success;
            
        } catch (error) {
            console.error('❌ Config set error:', error);
            return false;
        }
    }

    reset() {
        this.config = { ...this.defaultConfig };
        const success = this.saveConfig();
        this.applyTheme(); // Применяем тему по умолчанию
        return success;
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
        try {
            const themeMode = this.get('SETTINGS.THEME_MODE', 'light');
            let actualTheme = themeMode;

            if (themeMode === 'auto') {
                actualTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }

            // Применяем выбранную тему
            const themeVars = this.get(`THEMES.${actualTheme}`, this.defaultConfig.THEMES.light);
            this.applyThemeVariables(themeVars);
            
            // Применяем акцентный цвет
            this.applyAccentColor();
            
            document.documentElement.setAttribute('data-theme', actualTheme);
            console.log(`🎨 Theme applied: ${actualTheme}`);
            
        } catch (error) {
            console.error('❌ Error applying theme:', error);
        }
    }

    applyThemeVariables(themeVars) {
        const root = document.documentElement;
        Object.entries(themeVars).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }

    applyAccentColor() {
        const accentColor = this.get('SETTINGS.ACCENT_COLOR', '#3498DB');
        document.documentElement.style.setProperty('--accent', accentColor);
        document.documentElement.style.setProperty('--secondary', this.adjustColor(accentColor, 20));
    }

    adjustColor(color, amount) {
        try {
            let usePound = false;
            if (color[0] === "#") {
                color = color.slice(1);
                usePound = true;
            }
            const num = parseInt(color, 16);
            let r = (num >> 16) + amount;
            if (r > 255) r = 255;
            else if (r < 0) r = 0;
            let b = ((num >> 8) & 0x00FF) + amount;
            if (b > 255) b = 255;
            else if (b < 0) b = 0;
            let g = (num & 0x0000FF) + amount;
            if (g > 255) g = 255;
            else if (g < 0) g = 0;
            return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
        } catch (error) {
            return '#3498DB';
        }
    }

    // Новые методы для работы с API
    getApiConfig(platform) {
        return this.get(`API.${platform.toUpperCase()}`, {});
    }

    isPlatformEnabled(platform) {
        return this.get(`API.${platform.toUpperCase()}.ENABLED`, false);
    }

    setApiCredentials(platform, credentials) {
        const platformKey = platform.toUpperCase();
        Object.entries(credentials).forEach(([key, value]) => {
            this.set(`API.${platformKey}.${key.toUpperCase()}`, value);
        });
        return this.saveConfig();
    }

    // Методы для работы с настройками пользователя
    getUserSettings() {
        return {
            userName: this.get('USER.NAME', 'Пользователь'),
            userEmail: this.get('USER.EMAIL', ''),
            userPhone: this.get('USER.PHONE', ''),
            emailReports: this.get('USER.EMAIL_REPORTS', false),
            pushNotifications: this.get('USER.PUSH_NOTIFICATIONS', true)
        };
    }

    setUserSettings(settings) {
        Object.entries(settings).forEach(([key, value]) => {
            this.set(`USER.${key.toUpperCase()}`, value);
        });
        return this.saveConfig();
    }

    // Валидация конфигурации
    validateConfig() {
        const errors = [];
        
        // Проверка обязательных полей API
        if (this.get('API.CDEK.ENABLED') && (!this.get('API.CDEK.CLIENT_ID') || !this.get('API.CDEK.CLIENT_SECRET'))) {
            errors.push('CDEK: Не заполнены Client ID или Client Secret');
        }
        
        if (this.get('API.MEGAMARKET.ENABLED') && (!this.get('API.MEGAMARKET.API_KEY') || !this.get('API.MEGAMARKET.SECRET_KEY'))) {
            errors.push('Megamarket: Не заполнены API Key или Secret Key');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Экспорт/импорт настроек
    exportSettings() {
        return JSON.stringify(this.config, null, 2);
    }

    importSettings(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.config = this.deepMerge(this.defaultConfig, imported);
            return this.saveConfig();
        } catch (error) {
            console.error('❌ Error importing settings:', error);
            return false;
        }
    }
}

// Создаем глобальный экземпляр с обработкой ошибок
let CONFIG;

try {
    CONFIG = new ConfigManager();
    console.log('✅ ConfigManager initialized successfully');
    
    // Экспортируем для использования в других модулях
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ConfigManager, CONFIG };
    }
    
} catch (error) {
    console.error('❌ Failed to initialize ConfigManager:', error);
    // Fallback конфиг
    CONFIG = {
        get: (key, defaultValue) => defaultValue,
        set: () => false,
        applyTheme: () => {}
    };
}

// Автоматическое применение темы при изменении системных предпочтений
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (CONFIG && CONFIG.get('SETTINGS.THEME_MODE') === 'auto') {
            CONFIG.applyTheme();
        }
    });
}
