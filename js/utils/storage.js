// js/utils/storage.js - Улучшенное управление хранилищем
class StorageManager {
    constructor() {
        this.prefix = 'texno_edem_';
        this.encryptionKey = null;
    }

    set(key, value, ttl = null) {
        try {
            const item = {
                value,
                timestamp: Date.now(),
                ttl
            };
            
            const storageKey = this.prefix + key;
            localStorage.setItem(storageKey, JSON.stringify(item));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        try {
            const storageKey = this.prefix + key;
            const item = localStorage.getItem(storageKey);
            
            if (!item) return defaultValue;
            
            const parsed = JSON.parse(item);
            
            // Проверяем TTL
            if (parsed.ttl && Date.now() - parsed.timestamp > parsed.ttl) {
                this.remove(key);
                return defaultValue;
            }
            
            return parsed.value;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    remove(key) {
        try {
            const storageKey = this.prefix + key;
            localStorage.removeItem(storageKey);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    clear() {
        try {
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    getSize() {
        let total = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                const value = localStorage.getItem(key);
                total += key.length + value.length;
            }
        }
        
        return total;
    }

    // Методы для работы с разными типами данных
    setObject(key, value, ttl = null) {
        return this.set(key, value, ttl);
    }

    getObject(key, defaultValue = null) {
        return this.get(key, defaultValue);
    }

    setArray(key, value, ttl = null) {
        return this.set(key, value, ttl);
    }

    getArray(key, defaultValue = []) {
        return this.get(key, defaultValue);
    }

    // Миграция данных
    migrate(fromKey, toKey) {
        const value = this.get(fromKey);
        if (value !== null) {
            this.set(toKey, value);
            this.remove(fromKey);
            return true;
        }
        return false;
    }
}

// Создаем глобальный экземпляр
const Storage = new StorageManager();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, Storage };
}
