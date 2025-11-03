// js/utils/storage.js - Улучшенный менеджер хранилища
class StorageManager {
    constructor() {
        this.prefix = 'texno_edem_';
        this.cache = new Map();
        this.init();
    }

    init() {
        // Проверяем доступность localStorage
        this.isAvailable = this.testStorage();
        console.log(`📦 Storage available: ${this.isAvailable}`);
    }

    testStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('⚠️ localStorage not available, using memory storage');
            return false;
        }
    }

    set(key, value, ttl = null) {
        const storageKey = this.prefix + key;
        const item = {
            value: value,
            timestamp: Date.now(),
            ttl: ttl
        };

        // Кэшируем в памяти
        this.cache.set(storageKey, item);

        // Сохраняем в localStorage если доступно
        if (this.isAvailable) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(item));
            } catch (error) {
                console.warn('⚠️ localStorage set failed:', error);
                this.isAvailable = false;
            }
        }
    }

    get(key, defaultValue = null) {
        const storageKey = this.prefix + key;

        // Проверяем кэш памяти
        if (this.cache.has(storageKey)) {
            const item = this.cache.get(storageKey);
            if (!this.isExpired(item)) {
                return item.value;
            }
            this.cache.delete(storageKey);
        }

        // Пробуем получить из localStorage
        if (this.isAvailable) {
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const item = JSON.parse(stored);
                    if (!this.isExpired(item)) {
                        // Кэшируем в памяти
                        this.cache.set(storageKey, item);
                        return item.value;
                    } else {
                        this.remove(key);
                    }
                }
            } catch (error) {
                console.warn('⚠️ localStorage get failed:', error);
                this.isAvailable = false;
            }
        }

        return defaultValue;
    }

    remove(key) {
        const storageKey = this.prefix + key;
        
        this.cache.delete(storageKey);
        
        if (this.isAvailable) {
            try {
                localStorage.removeItem(storageKey);
            } catch (error) {
                console.warn('⚠️ localStorage remove failed:', error);
            }
        }
    }

    clear() {
        this.cache.clear();
        
        if (this.isAvailable) {
            try {
                // Удаляем только ключи с нашим префиксом
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        localStorage.removeItem(key);
                    }
                }
            } catch (error) {
                console.warn('⚠️ localStorage clear failed:', error);
            }
        }
    }

    isExpired(item) {
        if (!item.ttl) return false;
        return Date.now() - item.timestamp > item.ttl;
    }

    getSize() {
        let size = 0;
        
        // Размер в памяти
        this.cache.forEach((value, key) => {
            size += key.length + JSON.stringify(value).length;
        });

        return size;
    }

    // Методы для работы с сессиями
    setSession(key, value) {
        this.set(key, value, 30 * 60 * 1000); // 30 минут
    }

    // Методы для работы с пользовательскими данными
    setUserData(key, value) {
        this.set(`user_${key}`, value);
    }

    getUserData(key, defaultValue = null) {
        return this.get(`user_${key}`, defaultValue);
    }

    // Экспорт/импорт данных
    exportData() {
        const data = {};
        
        if (this.isAvailable) {
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        const value = localStorage.getItem(key);
                        data[key] = value;
                    }
                }
            } catch (error) {
                console.warn('⚠️ Export from localStorage failed:', error);
            }
        }

        // Добавляем данные из кэша памяти
        this.cache.forEach((value, key) => {
            data[key] = JSON.stringify(value);
        });

        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try
