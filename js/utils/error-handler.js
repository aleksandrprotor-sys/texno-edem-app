// js/utils/error-handler.js
class ErrorHandler {
    static init() {
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }

    static handleGlobalError(event) {
        const error = {
            type: 'Global Error',
            message: event.error?.message,
            stack: event.error?.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        this.logError(error);
        this.showUserFriendlyError(error);
    }

    static handlePromiseRejection(event) {
        const error = {
            type: 'Promise Rejection',
            reason: event.reason,
            timestamp: new Date().toISOString()
        };
        
        this.logError(error);
        event.preventDefault();
    }

    static logError(error) {
        console.error('Application Error:', error);
    }

    static showUserFriendlyError(error) {
        const message = this.getUserMessage(error);
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'error');
        }
    }

    static getUserMessage(error) {
        const messages = {
            'Network Error': 'Проблемы с подключением к интернету',
            'Failed to fetch': 'Ошибка загрузки данных',
            'QuotaExceededError': 'Недостаточно места в хранилище'
        };
        
        return messages[error.message] || 'Произошла непредвиденная ошибка';
    }
}

// js/utils/logger.js
class Logger {
    static levels = {
        ERROR: 0,
        WARN: 1, 
        INFO: 2,
        DEBUG: 3
    };

    constructor(level = 'INFO') {
        this.level = Logger.levels[level] || Logger.levels.INFO;
    }

    error(message, data = null) {
        this.log('ERROR', message, data);
    }

    warn(message, data = null) {
        if (this.level >= Logger.levels.WARN) {
            this.log('WARN', message, data);
        }
    }

    info(message, data = null) {
        if (this.level >= Logger.levels.INFO) {
            this.log('INFO', message, data);
        }
    }

    log(level, message, data) {
        const timestamp = new Date().toISOString();
        console[level.toLowerCase()](`[${timestamp}] ${level}: ${message}`, data);
    }
}

// js/utils/cache-manager.js
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 минут
    }

    async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
        const cached = this.get(key);
        if (cached) return cached;

        const data = await fetchFn();
        this.set(key, data, ttl);
        return data;
    }

    set(key, data, ttl) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { data, expiry });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    }
}
