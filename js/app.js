// Основной файл приложения TEXNO EDEM
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
        this.settings = {};
        this.user = null;
        
        // Флаги для управления состоянием
        this.isLoading = false;
        this.isSyncing = false;
        this.isInitialized = false;
        this.lastSyncTime = null;
        this.notificationCount = 0;
        this.maxNotifications = 2;
        
        // Кэш для оптимизации
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 минут
        
        this.init();
    }

    async init() {
        try {
            this.showLoading('Инициализация приложения...');
            
            // Инициализация Telegram Web App
            await this.initTelegram();
            
            // Загрузка конфигурации
            await this.loadConfig();
            
            // Инициализация компонентов
            await this.initComponents();
            
            // Загрузка начальных данных
            await this.loadInitialData();
            
            // Настройка периодической синхронизации
            this.setupAutoSync();
            
            this.isInitialized = true;
            this.hideLoading();
            
            console.log('🎯 TEXNO EDEM App initialized successfully');
            this.showNotification('Приложение готово к работе', 'success');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Ошибка инициализации приложения');
            this.hideLoading();
        }
    }

    async initTelegram() {
        if (window.Telegram && Telegram.WebApp) {
            this.tg = Telegram.WebApp;
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            this.tg.BackButton.show();
            
            // Обработка кнопки назад
            this.tg.BackButton.onClick(() => {
                this.handleBackButton();
            });
            
            // Настройка темы
            this.setupTelegramTheme();
            
            // Получение данных пользователя
            const user = this.tg.initDataUnsafe?.user;
            if (user) {
                this.user = {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username,
                    language: user.language_code
                };
            }
        } else {
            // Режим разработки - mock пользователь
            this.user = {
                id: 1,
                firstName: 'Демо',
                lastName: 'Пользователь',
                username: 'demo_user',
                language: 'ru'
            };
        }
    }

    setupTelegramTheme() {
        if (!this.tg) return;
        
        const theme = this.tg.colorScheme;
        document.documentElement.setAttribute('data-theme', theme);
        
        this.tg.onEvent('themeChanged', () => {
            document.documentElement.setAttribute('data-theme', this.tg.colorScheme);
        });
    }

    handleBackButton() {
        if (this.currentSection !== 'dashboard') {
            this.showSection('dashboard');
        } else {
            this.tg.close();
        }
    }

    async loadConfig() {
        try {
            const savedConfig = localStorage.getItem('texno_edem_config');
            if (savedConfig) {
                this.config = { ...CONFIG, ...JSON.parse(savedConfig) };
            } else {
                this.config = CONFIG;
                this.saveConfig();
            }
        } catch (error) {
            console.error('Error loading config:', error);
            this.config = CONFIG;
        }
    }

    saveConfig() {
        localStorage.setItem('texno_edem_config', JSON.stringify(this.config));
    }

    async initComponents() {
        // Инициализация компонентов
        this.header = new HeaderComponent(this);
        this.navigation = new NavigationComponent(this);
        this.analyticsComponent = new AnalyticsComponent(this);
        this.ordersComponent = new OrdersComponent(this);
        this.settingsComponent = new SettingsComponent(this);
        this.modal = new ModalComponent(this);
        this.notifications = new NotificationComponent();
        
        // Рендеринг статического контента
        this.header.render();
        this.navigation.render();
    }

    async loadInitialData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading('Загрузка данных...');
        
        try {
            // Параллельная загрузка данных
            await Promise.all([
                this.loadOrders(),
                this.loadAnalytics(),
                this.loadUserSettings()
            ]);
            
            this.updateDashboard();
            console.log('✅ Initial data loaded successfully');
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            throw error;
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async loadOrders() {
        const cacheKey = 'orders_data';
        const cached = this.getCachedData(cacheKey);
        
        if (cached && !this.config.SETTINGS.FORCE_REFRESH) {
            this.orders = cached;
            console.log('📦 Orders loaded from cache');
            return;
        }

        this.showLoading('Загрузка заказов...', 30);
        
        try {
            const [cdekOrders, megamarketOrders] = await Promise.allSettled([
                this.loadCDEKOrders(),
                this.loadMegamarketOrders()
            ]);

            this.orders.cdek = cdekOrders.status === 'fulfilled' ? cdekOrders.value : [];
            this.orders.megamarket = megamarketOrders.status === 'fulfilled' ? megamarketOrders.value : [];
            this.orders.all = [...this.orders.cdek, ...this.orders.megamarket]
                .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

            // Кэшируем данные
            this.setCachedData(cacheKey, this.orders);
            
            this.updateLoadingProgress(60);
            console.log(`✅ Orders loaded: CDEK ${this.orders.cdek.length}, Megamarket ${this.orders.megamarket.length}`);

        } catch (error) {
            console.error('Error loading orders:', error);
            // Используем mock данные в случае ошибки
            this.orders.cdek = mockDataGenerator.generateCDEKOrders(8);
            this.orders.megamarket = mockDataGenerator.generateMegamarketOrders(12);
            this.orders.all = [...this.orders.cdek, ...this.orders.megamarket];
            this.showNotification('Используются демо-данные', 'warning');
        }
    }

    async loadCDEKOrders() {
        if (!this.config.API.CDEK.ENABLED) {
            return mockDataGenerator.generateCDEKOrders(8);
        }
        
        try {
            const orders = await CDEKService.getOrders();
            return Array.isArray(orders) ? orders : [];
        } catch (error) {
            console.error('CDEK API error:', error);
            return mockDataGenerator.generateCDEKOrders(8);
        }
    }

    async loadMegamarketOrders() {
        if (!this.config.API.MEGAMARKET.ENABLED) {
            return mockDataGenerator.generateMegamarketOrders(12);
        }
        
        try {
            const orders = await MegamarketService.getOrders();
            return Array.isArray(orders) ? orders : [];
        } catch (error) {
            console.error('Megamarket API error:', error);
            return mockDataGenerator.generateMegamarketOrders(12);
        }
    }

    async loadAnalytics() {
        this.updateLoadingProgress(80);
        
        try {
            const analyticsData = await AnalyticsComponent.calculateAnalytics(this.orders);
            this.analytics = analyticsData;
            console.log('📊 Analytics calculated');
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.analytics = mockDataGenerator.generateAnalyticsData();
        }
    }

    async loadUserSettings() {
        try {
            const savedSettings = localStorage.getItem('texno_edem_settings');
            this.settings = savedSettings ? JSON.parse(savedSettings) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            notifications: {
                newOrders: true,
                problemOrders: true,
                syncComplete: false
            },
            appearance: {
                theme: 'auto',
                compactMode: false
            },
            sync: {
                autoSync: true,
                syncInterval: 10
            }
        };
    }

    setupAutoSync() {
        if (this.settings.sync?.autoSync) {
            const interval = (this.settings.sync.syncInterval || 10) * 60 * 1000;
            
            this.syncInterval = setInterval(() => {
                this.syncData(false);
            }, interval);
            
            console.log(`🔄 Auto-sync enabled: ${interval}ms`);
        }
        
        // Синхронизация при возвращении на вкладку
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.isSyncing && this.isInitialized) {
                setTimeout(() => this.syncData(false), 1000);
            }
        });
    }

    async syncData(isManual = false) {
        if (this.isSyncing) {
            if (isManual) {
                this.showNotification('Синхронизация уже выполняется', 'info');
            }
            return;
        }
        
        this.isSyncing = true;
        const startTime = Date.now();
        
        try {
            await this.loadOrders();
            await this.loadAnalytics();
            this.lastSyncTime = new Date();
            
            const syncDuration = Date.now() - startTime;
            
            if (isManual) {
                this.showNotification(`Данные обновлены за ${syncDuration}ms`, 'success');
            } else if (this.notificationCount < this.maxNotifications) {
                this.showNotification('Данные автоматически обновлены', 'info');
                this.notificationCount++;
            }
            
            this.header.updateSyncStatus();
            console.log(`✅ Sync completed in ${syncDuration}ms`);
            
        } catch (error) {
            console.error('Sync failed:', error);
            if (isManual) {
                this.showError('Ошибка синхронизации');
            }
        } finally {
            this.isSyncing = false;
        }
    }

    // Навигация
    showSection(sectionId, platform = null) {
        // Оптимизация: предотвращение лишних рендеров
        if (this.currentSection === sectionId && this.currentPlatform === platform) {
            return;
        }
        
        const previousSection = this.currentSection;
        this.currentSection = sectionId;
        this.currentPlatform = platform;
        
        // Обновление навигации
        this.navigation.updateActiveNav(sectionId, platform);
        
        // Обновление кнопки "Назад" в Telegram
        if (this.tg) {
            if (sectionId === 'dashboard') {
                this.tg.BackButton.hide();
            } else {
                this.tg.BackButton.show();
            }
        }
        
        // Скрытие всех секций
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Показ активной секции
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.loadSectionData(sectionId, platform, previousSection);
        }
    }

    loadSectionData(sectionId, platform, previousSection) {
        // Задержка для анимации перехода
        setTimeout(() => {
            switch (sectionId) {
                case 'dashboard':
                    this.updateDashboard();
                    break;
                case 'orders':
                    this.ordersComponent.render(platform);
                    break;
                case 'analytics':
                    this.analyticsComponent.render();
                    break;
                case 'settings':
                    this.settingsComponent.render();
                    break;
            }
        }, 50);
    }

    updateDashboard() {
        if (!this.analyticsComponent) return;
        
        this.analyticsComponent.renderOverview();
        this.analyticsComponent.renderPlatformComparison();
        this.ordersComponent.renderRecentActivity();
        this.updateQuickStats();
    }

    updateQuickStats() {
        const stats = {
            totalOrders: this.orders.all.length,
            cdekActive: this.orders.cdek.filter(o => o.status === 'active').length,
            megamarketNew: this.orders.megamarket.filter(o => o.status === 'new').length,
            problemOrders: this.orders.all.filter(o => o.status === 'problem').length
        };
        
        // Обновляем виджеты на дашборде
        document.getElementById('cdek-active').textContent = stats.cdekActive;
        document.getElementById('megamarket-new').textContent = stats.megamarketNew;
    }

    // Кэширование данных
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache cleared');
    }

    // Управление состоянием
    showLoading(message = 'Загрузка...', progress = 0) {
        const overlay = document.getElementById('loading-overlay');
        const progressEl = document.getElementById('loading-progress');
        
        if (overlay) {
            overlay.querySelector('p').textContent = message;
            if (progressEl && progress > 0) {
                progressEl.style.width = `${progress}%`;
                progressEl.style.display = 'block';
            }
            overlay.classList.add('active');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        const progressEl = document.getElementById('loading-progress');
        
        if (overlay) {
            overlay.classList.remove('active');
            if (progressEl) {
                progressEl.style.display = 'none';
            }
        }
    }

    updateLoadingProgress(percent) {
        const progressEl = document.getElementById('loading-progress');
        if (progressEl) {
            progressEl.style.width = `${percent}%`;
        }
    }

    showNotification(message, type = 'info') {
        if (this.notificationCount >= this.maxNotifications && type === 'info') {
            return;
        }
        
        this.notifications.show(message, type);
        
        if (type === 'info') {
            this.notificationCount++;
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    // Публичные методы
    manualSync() {
        this.syncData(true);
    }

    refreshData() {
        this.clearCache();
        this.config.SETTINGS.FORCE_REFRESH = true;
        this.loadInitialData().finally(() => {
            this.config.SETTINGS.FORCE_REFRESH = false;
        });
    }

    saveSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem('texno_edem_settings', JSON.stringify(this.settings));
        
        // Перезапускаем авто-синхронизацию если настройки изменились
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.setupAutoSync();
        
        this.showNotification('Настройки сохранены', 'success');
    }

    getPlatformOrders(platform) {
        return this.orders[platform] || [];
    }

    getOrderById(platform, orderId) {
        const orders = this.getPlatformOrders(platform);
        return orders.find(order => order.id === orderId) || null;
    }
}

// Компоненты
class HeaderComponent {
    constructor(app) {
        this.app = app;
    }

    render() {
        const header = document.getElementById('header');
        if (!header) return;

        header.innerHTML = `
            <div class="header-content">
                <div class="logo" onclick="app.showSection('dashboard')">
                    <div class="logo-icon">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <div class="logo-text">
                        <div class="logo-title">TEXNO EDEM</div>
                        <div class="logo-subtitle">Business Intelligence</div>
                    </div>
                </div>
                
                <div class="header-actions">
                    <div class="sync-status">
                        <div class="sync-indicator ${this.app.isSyncing ? 'syncing' : ''}"></div>
                        <span class="sync-text">${this.getSyncText()}</span>
                    </div>
                    
                    <div class="user-info">
                        <div class="user-avatar">
                            ${this.getUserAvatar()}
                        </div>
                        <div class="user-details">
                            <div class="user-name">${this.getUserName()}</div>
                            <div class="user-role">${this.getUserRole()}</div>
                        </div>
                    </div>
                    
                    <button class="btn btn-icon" onclick="app.manualSync()" 
                            ${this.app.isSyncing ? 'disabled' : ''} 
                            title="Обновить данные">
                        <i class="fas fa-sync-alt ${this.app.isSyncing ? 'fa-spin' : ''}"></i>
                    </button>
                </div>
            </div>
        `;
    }

    updateSyncStatus() {
        const syncIndicator = document.querySelector('.sync-indicator');
        const syncText = document.querySelector('.sync-text');
        
        if (syncIndicator && syncText) {
            syncIndicator.className = 'sync-indicator';
            if (this.app.isSyncing) {
                syncIndicator.classList.add('syncing');
            }
            syncText.textContent = this.getSyncText();
        }
    }

    getSyncText() {
        if (this.app.isSyncing) return 'Синхронизация...';
        if (this.app.lastSyncTime) return `Обновлено ${formatRelativeTime(this.app.lastSyncTime)}`;
        return 'Не синхронизировано';
    }

    getUserAvatar() {
        if (this.app.user) {
            return this.app.user.firstName?.charAt(0) || 'U';
        }
        return 'U';
    }

    getUserName() {
        if (this.app.user) {
            return `${this.app.user.firstName || ''} ${this.app.user.lastName || ''}`.trim() || 'Пользователь';
        }
        return 'Гость';
    }

    getUserRole() {
        return 'Менеджер';
    }
}

class NavigationComponent {
    constructor(app) {
        this.app = app;
    }

    render() {
        const nav = document.getElementById('main-nav');
        if (!nav) return;

        nav.innerHTML = `
            <div class="nav-container">
                <div class="nav-items">
                    <button class="nav-item active" onclick="app.showSection('dashboard')">
                        <i class="fas fa-chart-line"></i>
                        <span>Дашборд</span>
                    </button>
                    
                    <button class="nav-item" onclick="app.showSection('orders', 'cdek')">
                        <i class="fas fa-shipping-fast"></i>
                        <span>CDEK</span>
                        <span class="nav-badge" id="cdek-badge">0</span>
                    </button>
                    
                    <button class="nav-item" onclick="app.showSection('orders', 'megamarket')">
                        <i class="fas fa-store"></i>
                        <span>Мегамаркет</span>
                        <span class="nav-badge" id="megamarket-badge">0</span>
                    </button>
                    
                    <button class="nav-item" onclick="app.showSection('analytics')">
                        <i class="fas fa-chart-bar"></i>
                        <span>Аналитика</span>
                    </button>
                    
                    <button class="nav-item" onclick="app.showSection('settings')">
                        <i class="fas fa-cog"></i>
                        <span>Настройки</span>
                    </button>
                </div>
            </div>
        `;

        this.updateBadges();
    }

    updateActiveNav(sectionId, platform = null) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        let activeNav;
        if (sectionId === 'orders' && platform) {
            activeNav = document.querySelector(`[onclick="app.showSection('orders', '${platform}')"]`);
        } else {
            activeNav = document.querySelector(`[onclick="app.showSection('${sectionId}')"]`);
        }
        
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    updateBadges() {
        this.updateOrdersBadge('cdek', this.app.orders.cdek.filter(o => o.status === 'active').length);
        this.updateOrdersBadge('megamarket', this.app.orders.megamarket.filter(o => o.status === 'new').length);
    }

    updateOrdersBadge(platform, count) {
        const badge = document.getElementById(`${platform}-badge`);
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
}

// Инициализация приложения
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new TexnoEdemApp();
});

// Глобальные функции
window.showOrderDetails = (platform, orderId) => {
    app.ordersComponent.showOrderDetails(platform, orderId);
};

window.closeModal = () => {
    app.modal.close();
};

window.exportData = (type) => {
    app.analyticsComponent.exportData(type);
};
