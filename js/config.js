// config.js - УЛУЧШЕННАЯ ВЕРСИЯ
class ConfigManager {
    constructor() {
        this.defaultConfig = {
            APP: {
                NAME: 'TEXNO EDEM',
                VERSION: '1.4.0', // Обновленная версия
                COMPANY: 'TEXNO EDEM LLC',
                BUILD: '2024.01.28',
                ENVIRONMENT: this.detectEnvironment()
            },
            
            // Улучшенная конфигурация API
            API: {
                CDEK: {
                    URL: 'https://api.cdek.ru/v2',
                    AUTH_URL: 'https://api.cdek.ru/v2/oauth/token',
                    CLIENT_ID: '',
                    CLIENT_SECRET: '',
                    ENABLED: true,
                    SYNC_INTERVAL: 300000,
                    TIMEOUT: 30000,
                    RETRY_ATTEMPTS: 3,
                    RETRY_DELAY: 1000
                },
                
                MEGAMARKET: {
                    URL: 'https://api.megamarket.ru/api/merchant',
                    API_KEY: '',
                    SECRET_KEY: '',
                    CAMPAIGN_ID: '',
                    ENABLED: true,
                    SYNC_INTERVAL: 300000,
                    TIMEOUT: 30000,
                    RETRY_ATTEMPTS: 3,
                    RETRY_DELAY: 1000
                },
                
                // Новые настройки для резервных API
                FALLBACK: {
                    ENABLED: true,
                    TIMEOUT: 10000,
                    RETRY_ATTEMPTS: 2
                }
            },
            
            // Расширенные статусы
            STATUSES: {
                CDEK: {
                    'CREATED': { text: 'Создан', color: '#3B82F6', priority: 1 },
                    'ACCEPTED': { text: 'Принят', color: '#F59E0B', priority: 2 },
                    'IN_PROGRESS': { text: 'В пути', color: '#8B5CF6', priority: 3 },
                    'DELIVERED': { text: 'Доставлен', color: '#10B981', priority: 5 },
                    'PROBLEM': { text: 'Проблема', color: '#EF4444', priority: 4 },
                    'CANCELLED': { text: 'Отменен', color: '#6B7280', priority: 0 }
                },
                MEGAMARKET: {
                    'NEW': { text: 'Новый', color: '#3B82F6', priority: 1 },
                    'CONFIRMED': { text: 'Подтвержден', color: '#F59E0B', priority: 2 },
                    'PACKAGING': { text: 'Упаковка', color: '#8B5CF6', priority: 3 },
                    'SHIPPED': { text: 'Отправлен', color: '#6366F1', priority: 4 },
                    'DELIVERED': { text: 'Доставлен', color: '#10B981', priority: 5 },
                    'CANCELLED': { text: 'Отменен', color: '#6B7280', priority: 0 }
                }
            },
            
            // Улучшенные темы
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
                    '--shadow-lg': '0 10px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)',
                    '--border-radius': '8px',
                    '--border-radius-lg': '12px',
                    '--transition': 'all 0.3s ease'
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
                    '--shadow-lg': '0 10px 25px rgba(0,0,0,0.3), 0 5px 10px rgba(0,0,0,0.2)',
                    '--border-radius': '8px',
                    '--border-radius-lg': '12px',
                    '--transition': 'all 0.3s ease'
                }
            },
            
            // Расширенные функции
            FEATURES: {
                REAL_TIME_SYNC: true,
                ADVANCED_ANALYTICS: true,
                ORDER_MANAGEMENT: true,
                NOTIFICATIONS: true,
                EXPORT_REPORTS: true,
                MULTI_USER: false,
                DARK_MODE: true,
                OFFLINE_MODE: true,
                PERFORMANCE_MONITORING: true, // НОВОЕ
                ERROR_TRACKING: true, // НОВОЕ
                CACHING: true // НОВОЕ
            },
            
            // Улучшенные настройки
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
                TIMEZONE: Intl.DateTimeFormat().resolvedOptions().timeZone,
                CACHE_TTL: 300000, // НОВОЕ: Время жизни кэша
                PERFORMANCE_SAMPLING: 0.1 // НОВОЕ: Частота сбора метрик
            },
            
            UI: {
                ANIMATIONS: true,
                COMPACT_MODE: false,
                SIDEBAR_COLLAPSED: false,
                GRID_VIEW: false,
                DENSITY: 'comfortable' // НОВОЕ: Плотность интерфейса
            },
            
            // НОВЫЙ РАЗДЕЛ: Аналитика и мониторинг
            ANALYTICS: {
                ENABLED: true,
                ENDPOINT: '',
                SAMPLE_RATE: 0.1,
                TRACK_PAGE_VIEWS: true,
                TRACK_ERRORS: true,
                TRACK_PERFORMANCE: true
            }
        };
        
        this.config = { ...this.defaultConfig };
        this.migrationHistory = this.loadMigrationHistory();
        this.loadConfig();
        this.applyTheme();
        this.runMigrations(); // НОВОЕ: Миграции конфигурации
    }

    // НОВЫЙ МЕТОД: Определение окружения
    detectEnvironment() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'development';
        }
        if (window.location.hostname.includes('staging')) {
            return 'staging';
        }
        if (window.location.hostname.includes('test')) {
            return 'test';
        }
        return 'production';
    }

    // НОВЫЙ МЕТОД: Миграции конфигурации
    runMigrations() {
        const currentVersion = this.get('APP.VERSION');
        const lastMigratedVersion = this.migrationHistory[this.migrationHistory.length - 1];
        
        if (lastMigratedVersion === currentVersion) {
            return;
        }
        
        console.log('🔄 Running config migrations...');
        
        // Миграция с версии 1.3.0 на 1.4.0
        if (!lastMigratedVersion || lastMigratedVersion === '1.3.0') {
            this.migrateTo_1_4_0();
        }
        
        this.migrationHistory.push(currentVersion);
        this.saveMigrationHistory();
    }

    migrateTo_1_4_0() {
        console.log('🔄 Migrating to version 1.4.0');
        
        // Добавляем новые настройки если их нет
        if (this.get('SETTINGS.CACHE_TTL') === null) {
            this.set('SETTINGS.CACHE_TTL', 300000);
        }
        
        if (this.get('SETTINGS.PERFORMANCE_SAMPLING') === null) {
            this.set('SETTINGS.PERFORMANCE_SAMPLING', 0.1);
        }
        
        if (this.get('UI.DENSITY') === null) {
            this.set('UI.DENSITY', 'comfortable');
        }
        
        // Обновляем настройки API
        const apiConfigs = ['CDEK', 'MEGAMARKET'];
        apiConfigs.forEach(platform => {
            if (this.get(`API.${platform}.RETRY_ATTEMPTS`) === null) {
                this.set(`API.${platform}.RETRY_ATTEMPTS`, 3);
            }
            if (this.get(`API.${platform}.RETRY_DELAY`) === null) {
                this.set(`API.${platform}.RETRY_DELAY`, 1000);
            }
        });
        
        this.saveConfig();
    }

    loadMigrationHistory() {
        try {
            return JSON.parse(localStorage.getItem('texno_edem_migrations') || '[]');
        } catch {
            return [];
        }
    }

    saveMigrationHistory() {
        try {
            localStorage.setItem('texno_edem_migrations', JSON.stringify(this.migrationHistory));
        } catch (error) {
            console.warn('⚠️ Failed to save migration history:', error);
        }
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem('texno_edem_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.config = this.deepMerge(this.defaultConfig, parsed);
                console.log('✅ Config loaded successfully');
                
                // Валидация загруженной конфигурации
                const validation = this.validateConfig();
                if (!validation.isValid) {
                    console.warn('⚠️ Config validation warnings:', validation.errors);
                }
            }
        } catch (error) {
            console.error('❌ Error loading config:', error);
            this.config = { ...this.defaultConfig };
            this.backupCorruptedConfig(saved);
        }
    }

    // НОВЫЙ МЕТОД: Резервное копирование поврежденной конфигурации
    backupCorruptedConfig(corruptedConfig) {
        try {
            if (corruptedConfig) {
                const backupKey = `texno_edem_config_backup_${Date.now()}`;
                localStorage.setItem(backupKey, corruptedConfig);
                console.log('💾 Created config backup:', backupKey);
            }
        } catch (error) {
            console.warn('⚠️ Failed to backup corrupted config:', error);
        }
    }

    // НОВЫЙ МЕТОД: Валидация конфигурации
    validateConfig() {
        const errors = [];
        
        // Проверка обязательных полей
        const requiredPaths = [
            'APP.NAME',
            'APP.VERSION',
            'SETTINGS.DEFAULT_PLATFORM',
            'SETTINGS.THEME_MODE'
        ];
        
        requiredPaths.forEach(path => {
            if (this.get(path) === null || this.get(path) === undefined) {
                errors.push(`Missing required config: ${path}`);
            }
        });
        
        // Проверка допустимых значений
        const platform = this.get('SETTINGS.DEFAULT_PLATFORM');
        if (platform && !['cdek', 'megamarket'].includes(platform)) {
            errors.push(`Invalid default platform: ${platform}`);
        }
        
        const themeMode = this.get('SETTINGS.THEME_MODE');
        if (themeMode && !['light', 'dark', 'auto'].includes(themeMode)) {
            errors.push(`Invalid theme mode: ${themeMode}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    saveConfig() {
        try {
            const configToSave = this.prepareConfigForSave();
            localStorage.setItem('texno_edem_config', JSON.stringify(configToSave));
            console.log('✅ Config saved successfully');
            
            // Применяем изменения
            this.applyTheme();
            
            return true;
        } catch (error) {
            console.error('❌ Error saving config:', error);
            return false;
        }
    }

    // НОВЫЙ МЕТОД: Подготовка конфигурации к сохранению
    prepareConfigForSave() {
        const configToSave = { ...this.config };
        
        // Удаляем чувствительные данные перед сохранением
        delete configToSave.API.CDEK.CLIENT_SECRET;
        delete configToSave.API.MEGAMARKET.SECRET_KEY;
        
        // Удаляем временные настройки
        delete configToSave.APP.ENVIRONMENT;
        
        return configToSave;
    }

    get(path, defaultValue = null) {
        return this.getNestedValue(this.config, path, defaultValue);
    }

    set(path, value) {
        this.setNestedValue(this.config, path, value);
        this.saveConfig();
    }

    reset() {
        this.config = { ...this.defaultConfig };
        this.saveConfig();
        this.applyTheme();
    }

    // НОВЫЙ МЕТОД: Сброс только определенного раздела
    resetSection(section) {
        if (this.defaultConfig[section]) {
            this.config[section] = { ...this.defaultConfig[section] };
            this.saveConfig();
            return true;
        }
        return false;
    }

    // НОВЫЙ МЕТОД: Экспорт конфигурации
    exportConfig() {
        const configToExport = this.prepareConfigForSave();
        const blob = new Blob([JSON.stringify(configToExport, null, 2)], {
            type: 'application/json'
        });
        return URL.createObjectURL(blob);
    }

    // НОВЫЙ МЕТОД: Импорт конфигурации
    importConfig(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedConfig = JSON.parse(e.target.result);
                    this.config = this.deepMerge(this.defaultConfig, importedConfig);
                    
                    const validation = this.validateConfig();
                    if (!validation.isValid) {
                        reject(new Error(`Invalid config: ${validation.errors.join(', ')}`));
                        return;
                    }
                    
                    this.saveConfig();
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    applyTheme() {
        const themeMode = this.get('SETTINGS.THEME_MODE');
        const theme = this.get('THEMES')[themeMode] || this.get('THEMES').light;
        
        Object.entries(theme).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });
        
        // Применяем настройки шрифтов
        const fontSize = this.get('SETTINGS.FONT_SIZE');
        if (fontSize) {
            document.documentElement.style.setProperty('--font-size', this.getFontSize(fontSize));
        }
        
        // Применяем настройки анимаций
        const animations = this.get('SETTINGS.ANIMATIONS');
        const reduceMotion = this.get('SETTINGS.REDUCE_MOTION');
        document.documentElement.classList.toggle('no-animations', !animations);
        document.documentElement.classList.toggle('reduce-motion', reduceMotion);
        
        // Применяем плотность интерфейса
        const density = this.get('UI.DENSITY');
        document.documentElement.setAttribute('data-density', density);
    }

    getFontSize(size) {
        const sizes = {
            'small': '12px',
            'medium': '14px',
            'large': '16px'
        };
        return sizes[size] || sizes.medium;
    }

    // НОВЫЙ МЕТОД: Получение конфигурации для конкретной платформы
    getPlatformConfig(platform) {
        const baseConfig = this.get(`API.${platform.toUpperCase()}`);
        if (!baseConfig) {
            throw new Error(`Unknown platform: ${platform}`);
        }
        
        return {
            ...baseConfig,
            // Добавляем общие настройки
            timeout: baseConfig.TIMEOUT || 30000,
            retryAttempts: baseConfig.RETRY_ATTEMPTS || 3,
            retryDelay: baseConfig.RETRY_DELAY || 1000
        };
    }

    // НОВЫЙ МЕТОД: Получение статуса по коду
    getStatusConfig(platform, statusCode) {
        const statuses = this.get(`STATUSES.${platform.toUpperCase()}`);
        return statuses?.[statusCode] || { 
            text: statusCode, 
            color: '#6B7280', 
            priority: 0 
        };
    }

    // НОВЫЙ МЕТОД: Получение всех статусов для платформы
    getPlatformStatuses(platform) {
        return this.get(`STATUSES.${platform.toUpperCase()}`) || {};
    }

    // Вспомогательные методы остаются без изменений...
    getNestedValue(obj, path, defaultValue = null) {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current !== undefined ? current : defaultValue;
    }

    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
}

// Глобальный экземпляр конфигурации
window.configManager = new ConfigManager();
