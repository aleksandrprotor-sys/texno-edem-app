// js/utils/storage-manager.js
class StorageManager {
    constructor() {
        this.prefix = 'texno_edem_';
        this.encryptionKey = 'texno_edem_secure_2024';
    }

    // Шифрование данных (базовое)
    encrypt(data) {
        try {
            return btoa(encodeURIComponent(JSON.stringify(data)));
        } catch (error) {
            console.error('Encryption error:', error);
            return data;
        }
    }

    // Дешифрование данных
    decrypt(encryptedData) {
        try {
            return JSON.parse(decodeURIComponent(atob(encryptedData)));
        } catch (error) {
            console.error('Decryption error:', error);
            return encryptedData;
        }
    }

    // Сохранение данных
    set(key, data, encrypt = false) {
        try {
            const storageKey = this.prefix + key;
            const dataToStore = encrypt ? this.encrypt(data) : data;
            
            if (typeof dataToStore === 'object') {
                localStorage.setItem(storageKey, JSON.stringify(dataToStore));
            } else {
                localStorage.setItem(storageKey, dataToStore);
            }
            
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    // Получение данных
    get(key, decrypt = false) {
        try {
            const storageKey = this.prefix + key;
            const data = localStorage.getItem(storageKey);
            
            if (!data) return null;

            let parsedData;
            try {
                parsedData = JSON.parse(data);
            } catch {
                parsedData = data;
            }

            return decrypt ? this.decrypt(parsedData) : parsedData;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    }

    // Удаление данных
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

    // Очистка всех данных приложения
    clear() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
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

    // Получение информации о хранилище
    getInfo() {
        const info = {
            totalSize: 0,
            items: 0,
            itemsList: []
        };

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    const value = localStorage.getItem(key);
                    info.totalSize += new Blob([value]).size;
                    info.items++;
                    info.itemsList.push({
                        key: key.replace(this.prefix, ''),
                        size: new Blob([value]).size
                    });
                }
            }
            
            info.totalSizeKB = (info.totalSize / 1024).toFixed(2);
        } catch (error) {
            console.error('Storage info error:', error);
        }

        return info;
    }

    // Проверка поддержки localStorage
    isSupported() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.error('localStorage not supported:', error);
            return false;
        }
    }

    // Резервное копирование данных
    backup() {
        try {
            const backupData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    backupData[key] = localStorage.getItem(key);
                }
            }
            
            return this.encrypt(backupData);
        } catch (error) {
            console.error('Backup error:', error);
            return null;
        }
    }

    // Восстановление из резервной копии
    restore(backupData) {
        try {
            const data = this.decrypt(backupData);
            if (typeof data !== 'object') throw new Error('Invalid backup data');
            
            // Очищаем текущие данные
            this.clear();
            
            // Восстанавливаем данные
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key]);
            });
            
            return true;
        } catch (error) {
            console.error('Restore error:', error);
            return false;
        }
    }
}

// Создаем глобальный экземпляр
const storageManager = new StorageManager();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, storageManager };
}
