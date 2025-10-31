// Базовый API сервис для TEXNO EDEM
class ApiService {
    constructor(baseURL, config = {}) {
        this.baseURL = baseURL;
        this.config = {
            timeout: 30000,
            retries: 3,
            retryDelay: 1000,
            ...config
        };
        this.authToken = null;
    }

    setAuthToken(token) {
        this.authToken = token;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const config = {
            method: 'GET',
            ...options,
            headers,
            signal: controller.signal
        };

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            throw this.handleError(error);
        }
    }

    async requestWithRetry(endpoint, options = {}, retries = this.config.retries) {
        try {
            return await this.request(endpoint, options);
        } catch (error) {
            if (retries > 0 && this.shouldRetry(error)) {
                await this.delay(this.config.retryDelay);
                return this.requestWithRetry(endpoint, options, retries - 1);
            }
            throw error;
        }
    }

    shouldRetry(error) {
        // Повторяем запрос при сетевых ошибках и 5xx статусах
        return error.name === 'AbortError' || 
               error.message.includes('Network') ||
               (error.status >= 500 && error.status < 600);
    }

    handleError(error) {
        console.error('API Error:', error);
        
        if (error.name === 'AbortError') {
            return new Error('Таймаут запроса');
        }
        
        if (error.message.includes('Network')) {
            return new Error('Ошибка сети');
        }
        
        return error;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // CRUD операции
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.requestWithRetry(url);
    }

    async post(endpoint, data = {}) {
        return this.requestWithRetry(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.requestWithRetry(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.requestWithRetry(endpoint, {
            method: 'DELETE'
        });
    }
}

// Менеджер кэширования
class CacheManager {
    constructor() {
        this.cache = new Map();
    }

    set(key, data, ttl = 300000) { // 5 минут по умолчанию
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

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }
}

// Глобальный менеджер API
class ApiManager {
    constructor() {
        this.services = new Map();
        this.cache = new CacheManager();
        this.isOnline = navigator.onLine;
        
        this.setupOnlineHandler();
    }

    registerService(name, service) {
        this.services.set(name, service);
    }

    getService(name) {
        return this.services.get(name);
    }

    async makeRequest(serviceName, endpoint, options = {}) {
        const cacheKey = `${serviceName}:${endpoint}:${JSON.stringify(options)}`;
        
        // Пробуем получить из кэша
        if (options.method === 'GET') {
            const cached = this.cache.get(cacheKey);
            if (cached) return cached;
        }

        const service = this.getService(serviceName);
        if (!service) {
            throw new Error(`Service ${serviceName} not found`);
        }

        try {
            const data = await service.requestWithRetry(endpoint, options);
            
            // Кэшируем успешные GET запросы
            if (options.method === 'GET') {
                this.cache.set(cacheKey, data);
            }
            
            return data;
        } catch (error) {
            // Пробуем вернуть закэшированные данные при ошибке
            if (options.method === 'GET') {
                const cached = this.cache.get(cacheKey);
                if (cached) {
                    console.warn('Returning cached data due to API error');
                    return cached;
                }
            }
            throw error;
        }
    }

    setupOnlineHandler() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.dispatchEvent(new CustomEvent('apiOnline'));
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.dispatchEvent(new CustomEvent('apiOffline'));
        });
    }

    clearCache() {
        this.cache.clear();
    }
}

// Создаем глобальный экземпляр API менеджера
const apiManager = new ApiManager();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiService, CacheManager, ApiManager, apiManager };
}
