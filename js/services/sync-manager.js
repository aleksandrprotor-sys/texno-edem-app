// js/services/sync-manager.js
class SyncManager {
    constructor(app) {
        this.app = app;
        this.isSyncing = false;
        this.lastSync = null;
        this.syncInterval = null;
        this.init();
    }

    init() {
        console.log('✅ SyncManager инициализирован');
        this.loadLastSyncTime();
        this.startAutoSync();
    }

    startAutoSync() {
        const config = this.app.getConfig();
        
        if (config.sync.autoSync) {
            this.syncInterval = setInterval(() => {
                this.autoSync();
            }, config.sync.syncInterval);
            
            console.log(`Автосинхронизация запущена с интервалом ${config.sync.syncInterval}ms`);
        }
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('Автосинхронизация остановлена');
        }
    }

    async autoSync() {
        if (this.isSyncing) {
            console.log('Синхронизация уже выполняется, пропускаем...');
            return;
        }

        try {
            await this.syncAllData();
        } catch (error) {
            console.error('Ошибка автосинхронизации:', error);
        }
    }

    async syncAllData() {
        this.isSyncing = true;
        this.app.updateSyncStatus('syncing', 'Синхронизация...');

        try {
            const results = await Promise.allSettled([
                this.syncCDEKOrders(),
                this.syncMegamarketOrders(),
                this.syncAnalyticsData()
            ]);

            const successfulSyncs = results.filter(result => result.status === 'fulfilled').length;
            const failedSyncs = results.filter(result => result.status === 'rejected').length;

            this.lastSync = new Date();
            this.saveLastSyncTime();

            if (failedSyncs === 0) {
                this.app.updateSyncStatus('success', 'Данные обновлены');
                this.app.showNotification('Синхронизация завершена успешно', 'success');
            } else if (successfulSyncs > 0) {
                this.app.updateSyncStatus('warning', 'Частично обновлено');
                this.app.showNotification('Синхронизация завершена с ошибками', 'warning');
            } else {
                this.app.updateSyncStatus('error', 'Ошибка синхронизации');
                this.app.showNotification('Ошибка синхронизации', 'error');
            }

            // Обновляем UI
            this.app.loadDashboardData();
            this.updateLastSyncDisplay();

        } catch (error) {
            console.error('Критическая ошибка синхронизации:', error);
            this.app.updateSyncStatus('error', 'Ошибка синхронизации');
            this.app.showNotification('Критическая ошибка синхронизации', 'error');
        } finally {
            this.isSyncing = false;
        }
    }

    async syncCDEKOrders() {
        const config = this.app.getConfig();
        
        if (!config.api.cdek.enabled || !config.api.cdek.apiKey) {
            console.log('CDEK синхронизация отключена');
            return;
        }

        try {
            const cdekService = new CDEKService(config.api.cdek.apiKey);
            const orders = await cdekService.getOrders({
                date_from: this.getLastSyncTime()
            });

            // Обновляем заказы в приложении
            this.updateOrders(orders, 'cdek');
            
            console.log(`CDEK: синхронизировано ${orders.length} заказов`);
            return orders;

        } catch (error) {
            console.error('Ошибка синхронизации CDEK:', error);
            throw error;
        }
    }

    async syncMegamarketOrders() {
        const config = this.app.getConfig();
        
        if (!config.api.megamarket.enabled || !config.api.megamarket.apiKey) {
            console.log('Мегамаркет синхронизация отключена');
            return;
        }

        try {
            const megamarketService = new MegamarketService(config.api.megamarket.apiKey);
            const orders = await megamarketService.getOrders({
                created_after: this.getLastSyncTime()
            });

            // Обновляем заказы в приложении
            this.updateOrders(orders, 'megamarket');
            
            console.log(`Мегамаркет: синхронизировано ${orders.length} заказов`);
            return orders;

        } catch (error) {
            console.error('Ошибка синхронизации Мегамаркет:', error);
            throw error;
        }
    }

    async syncAnalyticsData() {
        try {
            // Здесь будет синхронизация аналитических данных
            // Пока используем mock данные
            await this.app.delay(500);
            console.log('Аналитика: данные обновлены');
            return true;

        } catch (error) {
            console.error('Ошибка синхронизации аналитики:', error);
            throw error;
        }
    }

    updateOrders(newOrders, platform) {
        const currentOrders = this.app.getOrders();
        
        // Объединяем заказы, заменяя дубликаты
        const updatedOrders = currentOrders.filter(order => order.platform !== platform);
        updatedOrders.push(...newOrders);
        
        // Сортируем по дате создания (новые сверху)
        updatedOrders.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
        
        // Обновляем в основном приложении
        this.app.orders = updatedOrders;
        
        // Обновляем компоненты если они активны
        if (this.app.components.orders) {
            this.app.components.orders.orders = updatedOrders;
            this.app.components.orders.applyFilters();
        }
    }

    getLastSyncTime() {
        if (!this.lastSync) {
            // Если нет последней синхронизации, берем время сутки назад
            return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        }
        return this.lastSync.toISOString();
    }

    loadLastSyncTime() {
        try {
            const lastSync = localStorage.getItem('texno_edem_last_sync');
            if (lastSync) {
                this.lastSync = new Date(lastSync);
            }
        } catch (error) {
            console.error('Ошибка загрузки времени последней синхронизации:', error);
        }
    }

    saveLastSyncTime() {
        try {
            localStorage.setItem('texno_edem_last_sync', this.lastSync.toISOString());
        } catch (error) {
            console.error('Ошибка сохранения времени синхронизации:', error);
        }
    }

    updateLastSyncDisplay() {
        const syncStatus = document.getElementById('sync-status');
        if (syncStatus && this.lastSync) {
            const timeAgo = this.getTimeAgo(this.lastSync);
            const statusText = syncStatus.querySelector('span');
            if (statusText) {
                statusText.textContent = `Обновлено ${timeAgo}`;
            }
        }
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - timestamp) / 1000);
        
        if (diffInSeconds < 60) {
            return 'только что';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} мин назад`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ч назад`;
        } else {
            return timestamp.toLocaleDateString('ru-RU');
        }
    }

    // Принудительная синхронизация
    async forceSync() {
        this.stopAutoSync();
        await this.syncAllData();
        this.startAutoSync();
    }

    // Синхронизация конкретной платформы
    async syncPlatform(platform) {
        this.isSyncing = true;
        this.app.updateSyncStatus('syncing', `Синхронизация ${platform}...`);

        try {
            let result;
            if (platform === 'cdek') {
                result = await this.syncCDEKOrders();
            } else if (platform === 'megamarket') {
                result = await this.syncMegamarketOrders();
            }

            this.lastSync = new Date();
            this.saveLastSyncTime();
            this.updateLastSyncDisplay();
            
            this.app.updateSyncStatus('success', `${platform} обновлен`);
            this.app.showNotification(`Синхронизация ${platform} завершена`, 'success');
            
            return result;

        } catch (error) {
            this.app.updateSyncStatus('error', `Ошибка ${platform}`);
            this.app.showNotification(`Ошибка синхронизации ${platform}`, 'error');
            throw error;
        } finally {
            this.isSyncing = false;
        }
    }

    // Получение статистики синхронизации
    getSyncStats() {
        return {
            lastSync: this.lastSync,
            isSyncing: this.isSyncing,
            autoSyncEnabled: this.syncInterval !== null
        };
    }
}
