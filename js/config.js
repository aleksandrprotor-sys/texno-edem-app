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
    }
}

// Создаем глобальный экземпляр ДО его использования
const CONFIG = new ConfigManager();
