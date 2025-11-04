// Утилиты для работы с localStorage
class Storage {
    static set(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(`texno_edem_${key}`, serializedValue);
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`texno_edem_${key}`);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(`texno_edem_${key}`);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    static clear() {
        try {
            // Удаляем только ключи приложения
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('texno_edem_')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    static getAll() {
        const result = {};
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('texno_edem_')) {
                    const cleanKey = key.replace('texno_edem_', '');
                    result[cleanKey] = this.get(cleanKey);
                }
            }
        } catch (error) {
            console.error('Storage getAll error:', error);
        }
        return result;
    }

    static getSize() {
        let total = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('texno_edem_')) {
                    const value = localStorage.getItem(key);
                    total += key.length + (value ? value.length : 0);
                }
            }
        } catch (error) {
            console.error('Storage getSize error:', error);
        }
        return total;
    }

    // Специфичные методы для приложения
    static getOrders(platform = 'all') {
        const key = platform === 'all' ? 'orders' : `orders_${platform}`;
        return this.get(key, []);
    }

    static setOrders(orders, platform = 'all') {
        const key = platform === 'all' ? 'orders' : `orders_${platform}`;
        return this.set(key, orders);
    }

    static getConfig() {
        return this.get('config', new AppConfig());
    }

    static setConfig(config) {
        return this.set('config', config);
    }

    static getLastSync() {
        return this.get('last_sync', null);
    }

    static setLastSync(timestamp = null) {
        return this.set('last_sync', timestamp || new Date().toISOString());
    }

    static getSyncState() {
        return this.get('sync_state', {
            lastSuccess: null,
            lastError: null,
            inProgress: false
        });
    }

    static setSyncState(state) {
        return this.set('sync_state', state);
    }
}

// Экспорт для использования в других модулях
window.Storage = Storage;
