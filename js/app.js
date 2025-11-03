// js/app.js - Полностью исправленная версия
class TexnoEdemApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPlatform = null;
        this.orders = {
            cdek: [],
            megamarket: [],
            all: []
        };
        this.analytics = {};
        this.user = null;
        
        this.isLoading = false;
        this.isSyncing = false;
        this.isInitialized = false;
        this.lastSyncTime = null;
        this.initTimeout = null;
        this.syncInterval = null;
        
        // Компоненты
        this.ordersComponent = null;
        this.analyticsComponent = null;
        this.settingsComponent = null;
        this.modal = null;
        
        this.safeInit();
    }

    async safeInit() {
        try {
            this.initTimeout = setTimeout(() => {
                if (!this.isInitialized) {
                    console.error('❌ Init timeout reached');
                    this.emergencyInit();
                }
            }, 10000);

            await this.init();
            
        } catch (error) {
            console.error('❌ Safe init failed:', error);
            this.emergencyInit();
        }
    }

    async init() {
        if (this.isInitialized) {
            console.log('⚠️ Already initialized');
            return;
        }

        try {
            this.showLoading('Инициализация TEXNO EDEM...');
            console.log('🚀 Starting initialization...');

            // 1. Базовая инициализация
            await this.initBasic();
            
            // 2. Инициализация компонентов
            await this.initComponents();
            
            // 3. Загрузка данных
            await this.loadInitialData();
            
            // 4. Запуск автосинхронизации
            this.startAutoSync();
            
            this.isInitialized = true;
            clearTimeout(this.initTimeout);
            
            console.log('✅ TEXNO EDEM App initialized successfully');
            this.showNotification('Система готова к работе', 'success', 3000);
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.emergencyInit();
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async initBasic() {
        console.log('🔧 Basic initialization...');
        
        // Применяем базовые стили
        document.documentElement.setAttribute('data-theme', 'light');
        
        // Создаем минимальный UI
        this.renderBasicUI();
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async initComponents() {
        try {
            // Инициализация Telegram
            await this.initTelegram();
            
            // Инициализация компонентов
            this.ordersComponent = new OrdersComponent(this);
            this.analyticsComponent = new AnalyticsComponent(this);
            this.settingsComponent = new SettingsComponent(this);
            this.modal = new ModalComponent(this);
            
            this.renderHeader();
            this.renderNavigation();
            
            console.log('✅ Components initialized');
        } catch (error) {
            console.warn('⚠️ Components init failed:', error);
            throw error;
        }
    }

    async initTelegram() {
        try {
            if (window.Telegram && Telegram.WebApp) {
                this.tg = Telegram.WebApp;
                this.tg.expand();
                this.tg.enableClosingConfirmation();
                
                // Настройка кнопок
                this.tg.BackButton.onClick(() => this.handleBackButton());
                
                // Получение данных пользователя
                const user = this.tg.initDataUnsafe?.user;
                if (user) {
                    this.user = {
                        id: user.id,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        username: user.username,
                        language: user.language_code,
                        isPremium: user.is_premium || false
                    };
                }
                
                console.log('✅ Telegram Web App initialized');
            } else {
                console.log('🌐 Desktop mode');
                this.initDesktopMode();
            }
        } catch (error) {
            console.warn('⚠️ Telegram init failed, using desktop mode:', error);
            this.initDesktopMode();
        }
    }

    initDesktopMode() {
        this.user = {
            id: 1,
            firstName: 'Демо',
            lastName: 'Пользователь', 
            username: 'demo_user',
            language: 'ru',
            isPremium: true
        };
    }

    async loadInitialData() {
        try {
            await this.loadOrders();
            this.updateDashboard();
            this.updateNavigationBadges();
            this.lastSyncTime = new Date();
            
            console.log('✅ Initial data loaded');
        } catch (error) {
            console.warn('⚠️ Initial data load failed:', error);
            this.useDemoData();
        }
    }

    async loadOrders() {
        try {
            // Используем mock данные для демонстрации
            this.orders.cdek = mockDataGenerator.generateCDEKOrders(8);
            this.orders.megamarket = mockDataGenerator.generateMegamarketOrders(12);
            this.orders.all = [...this.orders.cdek, ...this.orders.megamarket]
                .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

            console.log(`✅ Orders loaded: CDEK ${this.orders.cdek.length}, Megamarket ${this.orders.megamarket.length}`);

        } catch (error) {
            console.error('Error loading orders:', error);
            this.useDemoData();
        }
    }

    useDemoData() {
        this.orders.cdek = this.generateDemoCDEKOrders();
        this.orders.megamarket = this.generateDemoMegamarketOrders();
        this.orders.all = [...this.orders.cdek, ...this.orders.megamarket];
        
        this.updateDashboard();
        this.updateNavigationBadges();
        
        this.showNotification('Используются демо-данные', 'warning');
    }

    // ... остальные методы без изменений ...

    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        const interval = CONFIG.get('SETTINGS.SYNC_INTERVAL', 300000);
        this.syncInterval = setInterval(() => {
            if (!this.isSyncing && CONFIG.get('SETTINGS.AUTO_SYNC', true)) {
                this.manualSync();
            }
        }, interval);
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    destroy() {
        this.stopAutoSync();
        if (this.tg) {
            this.tg.disableClosingConfirmation();
            this.tg.BackButton.offClick();
        }
    }
}

// Безопасная инициализация
let app;

document.addEventListener('DOMContentLoaded', () => {
    try {
        app = new TexnoEdemApp();
        window.app = app; // Делаем глобально доступным
    } catch (error) {
        console.error('❌ Failed to create app instance:', error);
        // Экстренная инициализация
        const emergencyApp = new TexnoEdemApp();
        emergencyApp.emergencyInit();
        window.app = emergencyApp;
    }
});

// Глобальные функции
window.showOrderDetails = (platform, orderId) => {
    if (app && app.ordersComponent) {
        app.ordersComponent.showOrderDetails(platform, orderId);
    }
};

window.closeModal = () => {
    if (app && app.modal) {
        app.modal.close();
    }
};

window.formatCurrency = (amount, currency = 'RUB') => {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

window.formatRelativeTime = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин. назад`;
        if (diffHours < 24) return `${diffHours} ч. назад`;
        if (diffDays === 1) return 'вчера';
        if (diffDays < 7) return `${diffDays} дн. назад`;
        
        return date.toLocaleDateString('ru-RU');
    } catch (error) {
        return '-';
    }
};
