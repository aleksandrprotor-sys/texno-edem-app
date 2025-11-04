// js/components/mock-components.js
// Временные заглушки для компонентов, которые еще не реализованы

class MockOrdersComponent {
    constructor(app) {
        this.app = app;
        console.warn('⚠️ Используется MockOrdersComponent');
    }

    async load(platform = null) {
        console.log('Mock: Загрузка заказов для платформы', platform);
        await this.app.delay(500);
        
        const container = document.getElementById('orders-container');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>Компонент заказов в разработке</h3>
                    <p>Функциональность управления заказами будет доступна в ближайшем обновлении</p>
                    <button class="btn btn-primary" onclick="app.showSection('dashboard')">
                        <i class="fas fa-arrow-left"></i> Назад к дашборду
                    </button>
                </div>
            `;
        }
    }

    filterByPlatform(platform) {
        console.log('Mock: Фильтрация по платформе', platform);
    }

    filterByStatus(status) {
        console.log('Mock: Фильтрация по статусу', status);
    }

    refreshOrdersList() {
        console.log('Mock: Обновление списка заказов');
    }

    clearCache() {
        console.log('Mock: Очистка кэша заказов');
    }
}

class MockAnalyticsComponent {
    constructor(app) {
        this.app = app;
        console.warn('⚠️ Используется MockAnalyticsComponent');
    }

    async load() {
        console.log('Mock: Загрузка аналитики');
        await this.app.delay(500);
        
        const container = document.getElementById('analytics-container');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <h3>Аналитика в разработке</h3>
                    <p>Расширенная аналитика и графики будут доступны в следующем обновлении</p>
                    <div class="analytics-preview">
                        <div class="preview-header">
                            <h3>Пример будущей аналитики</h3>
                        </div>
                        <div class="preview-grid">
                            <div class="metric-card">
                                <h4>CDEK Статистика</h4>
                                <p>Будет отображаться детальная статистика по доставкам CDEK</p>
                            </div>
                            <div class="metric-card">
                                <h4>Мегамаркет Статистика</h4>
                                <p>Будет отображаться аналитика по заказам с Мегамаркета</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    changePeriod(period) {
        console.log('Mock: Изменение периода аналитики', period);
    }

    exportReport() {
        this.app.showNotification('Экспорт отчетов будет доступен в следующем обновлении', 'info');
    }
}

class MockSettingsComponent {
    constructor(app) {
        this.app = app;
        console.warn('⚠️ Используется MockSettingsComponent');
    }

    async load() {
        console.log('Mock: Загрузка настроек');
        await this.app.delay(300);
        
        const container = document.getElementById('settings-container');
        if (container) {
            container.innerHTML = `
                <div class="settings-grid">
                    <div class="settings-section">
                        <h3 class="section-title">Настройки приложения</h3>
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-title">Тема оформления</div>
                                <div class="setting-description">Выберите светлую или темную тему</div>
                            </div>
                            <button class="btn btn-outline" onclick="app.toggleTheme()">
                                Переключить тему
                            </button>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-title">Уведомления</div>
                                <div class="setting-description">Управление системными уведомлениями</div>
                            </div>
                            <button class="btn btn-outline" onclick="app.showNotifications()">
                                Показать уведомления
                            </button>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3 class="section-title">Интеграции</h3>
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-title">CDEK API</div>
                                <div class="setting-description">Настройка интеграции с CDEK</div>
                            </div>
                            <button class="btn btn-outline" onclick="app.showNotification('Настройки API будут доступны в следующем обновлении', 'info')">
                                Настроить
                            </button>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-title">Мегамаркет API</div>
                                <div class="setting-description">Настройка интеграции с Мегамаркет</div>
                            </div>
                            <button class="btn btn-outline" onclick="app.showNotification('Настройки API будут доступны в следующем обновлении', 'info')">
                                Настроить
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

class MockSyncManager {
    constructor(app) {
        this.app = app;
        this.autoSyncInterval = null;
        console.warn('⚠️ Используется MockSyncManager');
    }

    async forceSync() {
        this.app.showLoading('Синхронизация данных...');
        await this.app.delay(2000);
        this.app.hideLoading();
        this.app.showNotification('Данные успешно синхронизированы', 'success');
    }

    startAutoSync() {
        console.log('Mock: Запуск авто-синхронизации');
        this.autoSyncInterval = setInterval(() => {
            console.log('Mock: Авто-синхронизация');
        }, 300000);
    }

    pauseAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
        }
    }

    resumeAutoSync() {
        this.startAutoSync();
    }
}
