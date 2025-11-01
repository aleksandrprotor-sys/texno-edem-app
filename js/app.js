// Основной файл приложения TEXNO EDEM
class TexnoEdemApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPlatform = 'cdek';
        this.orders = {
            cdek: [],
            megamarket: []
        };
        this.analytics = {};
        this.settings = this.loadSettings();
        
        // Флаги для предотвращения бесконечных циклов
        this.isLoading = false;
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.initialLoadCompleted = false;
        
        this.init();
    }

    async init() {
        try {
            this.showLoading();
            
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
            
            this.hideLoading();
            this.initialLoadCompleted = true;
            
            console.log('TEXNO EDEM App initialized successfully');
        } catch (error) {
            console.error('App initialization failed:', error);
            this.showError('Ошибка инициализации приложения');
            this.hideLoading();
        }
    }

    async initTelegram() {
        if (window.Telegram && Telegram.WebApp) {
            this.tg = Telegram.WebApp;
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            
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

    async loadConfig() {
        const savedConfig = localStorage.getItem('texno_edem_config');
        if (savedConfig) {
            this.config = { ...CONFIG, ...JSON.parse(savedConfig) };
        } else {
            this.config = CONFIG;
        }
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('texno_edem_settings');
        return savedSettings ? JSON.parse(savedSettings) : {
            cdekEnabled: true,
            megamarketEnabled: true,
            autoSync: true,
            notifications: true,
            theme: 'auto'
        };
    }

    async initComponents() {
        this.header = new HeaderComponent(this);
        this.navigation = new NavigationComponent(this);
        this.analyticsComponent = new AnalyticsComponent(this);
        this.ordersComponent = new OrdersComponent(this);
        this.modal = new ModalComponent(this);
        this.settingsComponent = new SettingsComponent(this);
        this.notifications = new NotificationComponent();
        
        this.header.render();
        this.navigation.render();
    }

    async loadInitialData() {
        if (this.isLoading) {
            console.log('Load already in progress, skipping...');
            return;
        }
        
        this.isLoading = true;
        
        try {
            // Загружаем данные последовательно чтобы избежать race conditions
            await this.loadOrders();
            await this.loadAnalytics();
            
            this.updateDashboard();
            
            if (!this.initialLoadCompleted) {
                this.showNotification('Данные успешно загружены', 'success');
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Ошибка загрузки данных');
        } finally {
            this.isLoading = false;
        }
    }

    async loadOrders() {
        if (this.isLoadingOrders) {
            console.log('Orders load already in progress');
            return;
        }
        
        this.isLoadingOrders = true;
        
        try {
            const promises = [];
            
            if (this.settings.cdekEnabled) {
                promises.push(this.safeLoadCDEKOrders());
            }
            
            if (this.settings.megamarketEnabled) {
                promises.push(this.safeLoadMegamarketOrders());
            }
            
            const results = await Promise.allSettled(promises);
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    if (index === 0 && this.settings.cdekEnabled) {
                        this.orders.cdek = result.value;
                    } else if (index === 1 && this.settings.megamarketEnabled) {
                        this.orders.megamarket = result.value;
                    }
                } else {
                    console.error('Error loading orders:', result.reason);
                }
            });
            
        } catch (error) {
            console.error('Error in loadOrders:', error);
        } finally {
            this.isLoadingOrders = false;
        }
    }

    async safeLoadCDEKOrders() {
        try {
            return await CDEKService.getOrders();
        } catch (error) {
            console.error('CDEK service error:', error);
            return [];
        }
    }

    async safeLoadMegamarketOrders() {
        try {
            return await MegamarketService.getOrders();
        } catch (error) {
            console.error('Megamarket service error:', error);
            return [];
        }
    }

    async loadAnalytics() {
        try {
            const analyticsData = await AnalyticsComponent.calculateAnalytics(this.orders);
            this.analytics = analyticsData;
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    setupAutoSync() {
        if (this.settings.autoSync && !this.syncInterval) {
            console.log('Auto-sync enabled');
            this.syncInterval = setInterval(() => {
                if (!this.isSyncing && this.initialLoadCompleted) {
                    this.syncData(false);
                }
            }, this.config.SETTINGS.SYNC_INTERVAL);
        }
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.isSyncing && this.settings.autoSync && this.initialLoadCompleted) {
                setTimeout(() => {
                    this.syncData(false);
                }, 2000);
            }
        });
    }

    async syncData(isManual = false) {
        if (this.isSyncing) {
            console.log('Sync already in progress, skipping...');
            return;
        }
        
        this.isSyncing = true;
        
        try {
            await this.loadOrders();
            await this.loadAnalytics();
            this.lastSyncTime = new Date();
            
            if (isManual) {
                this.showNotification(`Данные обновлены`, 'success');
            }
            
        } catch (error) {
            console.error('Sync failed:', error);
            if (isManual) {
                this.showError('Ошибка синхронизации данных');
            }
        } finally {
            this.isSyncing = false;
        }
    }

    // Навигация
    showSection(sectionId) {
        if (this.currentSection === sectionId) {
            return;
        }
        
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            this.navigation.updateActiveNav(sectionId);
            this.loadSectionData(sectionId);
        }
    }

    loadSectionData(sectionId) {
        if (this.sectionLoadTimeout) {
            clearTimeout(this.sectionLoadTimeout);
        }
        
        this.sectionLoadTimeout = setTimeout(() => {
            switch (sectionId) {
                case 'dashboard':
                    this.updateDashboard();
                    break;
                case 'orders':
                    this.ordersComponent.render();
                    break;
                case 'analytics':
                    this.analyticsComponent.render();
                    break;
                case 'settings':
                    this.settingsComponent.render();
                    break;
            }
        }, 100);
    }

    updateDashboard() {
        if (this.dashboardUpdateTimeout) {
            clearTimeout(this.dashboardUpdateTimeout);
        }
        
        this.dashboardUpdateTimeout = setTimeout(() => {
            this.analyticsComponent.renderOverview();
            this.analyticsComponent.renderPlatformComparison();
            this.ordersComponent.renderRecentActivity();
        }, 150);
    }

    // Платформы
    setPlatform(platform) {
        if (this.currentPlatform === platform) {
            return;
        }
        
        this.currentPlatform = platform;
        
        setTimeout(() => {
            if (this.currentSection === 'orders') {
                this.ordersComponent.render();
            }
        }, 50);
    }

    // Действия с заказами
    async performOrderAction(platform, orderId, action) {
        try {
            this.showLoading();
            
            let result;
            if (platform === 'cdek') {
                result = await CDEKService.performAction(orderId, action);
            } else {
                result = await MegamarketService.performAction(orderId, action);
            }
            
            this.showNotification('Действие выполнено успешно', 'success');
            await this.syncData(true);
            
            return result;
        } catch (error) {
            console.error('Error performing order action:', error);
            this.showError('Ошибка выполнения действия');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Настройки
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem('texno_edem_settings', JSON.stringify(this.settings));
        
        if (newSettings.autoSync !== undefined) {
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
            this.setupAutoSync();
        }
        
        this.showNotification('Настройки сохранены', 'success');
    }

    // Утилиты
    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('active');
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.remove('active');
    }

    showNotification(message, type = 'info') {
        if (!this.settings.notifications && type === 'info') return;
        this.notifications.show(message, type);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    manualSync() {
        this.syncData(true);
    }

    getCurrentOrders() {
        return this.orders[this.currentPlatform] || [];
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
                <div class="logo">
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
                        <span>${this.app.lastSyncTime ? formatRelativeTime(this.app.lastSyncTime) : 'Не синхронизировано'}</span>
                    </div>
                    
                    <div class="user-info">
                        <div class="user-avatar">
                            ${this.getUserAvatar()}
                        </div>
                        <div class="user-details">
                            <div class="user-name">${this.getUserName()}</div>
                            <div class="user-role">Менеджер</div>
                        </div>
                    </div>
                    
                    <button class="btn btn-outline btn-sm" onclick="app.manualSync()" ${this.app.isSyncing ? 'disabled' : ''}>
                        <i class="fas fa-sync-alt ${this.app.isSyncing ? 'fa-spin' : ''}"></i>
                    </button>
                </div>
            </div>
        `;
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
                    
                    <button class="nav-item" onclick="app.showSection('orders')">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Заказы</span>
                        <span class="nav-badge" id="orders-badge">0</span>
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
                
                <div class="nav-platforms">
                    <div class="platform-filter">
                        <button class="platform-btn ${this.app.currentPlatform === 'cdek' ? 'active' : ''}" 
                                onclick="app.setPlatform('cdek')">
                            <i class="fas fa-shipping-fast"></i> CDEK
                        </button>
                        <button class="platform-btn ${this.app.currentPlatform === 'megamarket' ? 'active' : ''}" 
                                onclick="app.setPlatform('megamarket')">
                            <i class="fas fa-store"></i> Мегамаркет
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    updateActiveNav(sectionId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[onclick="app.showSection('${sectionId}')"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    updateOrdersBadge(count) {
        const badge = document.getElementById('orders-badge');
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

window.performOrderAction = (platform, orderId, action) => {
    app.performOrderAction(platform, orderId, action);
};
