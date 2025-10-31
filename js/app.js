// Основной файл приложения TEXNO EDEM
class TexnoEdemApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPlatform = 'all';
        this.orders = [];
        this.analytics = {};
        this.settings = {};
        
        // Флаги для предотвращения бесконечных циклов
        this.isLoading = false;
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.lastRenderTime = null;
        
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
        
        // Слушатель изменения темы
        this.tg.onEvent('themeChanged', () => {
            document.documentElement.setAttribute('data-theme', this.tg.colorScheme);
        });
    }

    async loadConfig() {
        // Загрузка конфигурации из localStorage или сервера
        const savedConfig = localStorage.getItem('texno_edem_config');
        if (savedConfig) {
            this.config = { ...CONFIG, ...JSON.parse(savedConfig) };
        } else {
            this.config = CONFIG;
        }
    }

    async initComponents() {
        // Инициализация компонентов
        this.header = new HeaderComponent(this);
        this.navigation = new NavigationComponent(this);
        this.analyticsComponent = new AnalyticsComponent(this);
        this.ordersComponent = new OrdersComponent(this);
        this.modal = new ModalComponent(this);
        this.notifications = new NotificationComponent();
        
        // Рендеринг статического контента
        this.header.render();
        this.navigation.render();
    }

    async loadInitialData() {
        // Защита от повторных вызовов
        if (this.isLoading) {
            console.log('Load already in progress, skipping...');
            return;
        }
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            await Promise.all([
                this.loadOrders(),
                this.loadAnalytics(),
                this.loadSettings()
            ]);
            
            this.updateDashboard();
            this.showNotification('Данные успешно загружены', 'success');
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Ошибка загрузки данных');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async loadOrders() {
        // Защита от множественных вызовов
        if (this.isLoadingOrders) {
            console.log('Orders load already in progress');
            return;
        }
        
        this.isLoadingOrders = true;
        
        try {
            const [cdekOrders, megamarketOrders] = await Promise.all([
                CDEKService.getOrders(),
                MegamarketService.getOrders()
            ]);
            
            this.orders = {
                cdek: cdekOrders,
                megamarket: megamarketOrders,
                all: [...cdekOrders, ...megamarketOrders].sort((a, b) => 
                    new Date(b.createdDate) - new Date(a.createdDate)
                )
            };
            
            // Обновляем компонент заказов только если он активен
            if (this.currentSection === 'orders' || this.currentSection === 'dashboard') {
                this.ordersComponent.render();
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            throw error;
        } finally {
            this.isLoadingOrders = false;
        }
    }

    async loadAnalytics() {
        try {
            const analyticsData = await AnalyticsComponent.calculateAnalytics(this.orders);
            this.analytics = analyticsData;
            
            // Обновляем компонент аналитики только если он активен
            if (this.currentSection === 'analytics' || this.currentSection === 'dashboard') {
                this.analyticsComponent.render();
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            throw error;
        }
    }

    async loadSettings() {
        // Загрузка настроек из localStorage
        const savedSettings = localStorage.getItem('texno_edem_settings');
        this.settings = savedSettings ? JSON.parse(savedSettings) : {};
    }

    setupAutoSync() {
        // Автоматическая синхронизация только если включено в настройках
        if (this.config.SETTINGS.AUTO_SYNC) {
            console.log('Auto-sync enabled, interval:', this.config.SYNC_INTERVAL);
            this.syncInterval = setInterval(() => {
                this.syncData();
            }, this.config.SYNC_INTERVAL);
        }
        
        // Синхронизация при возвращении на вкладку (с задержкой)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.isSyncing) {
                // Добавляем задержку чтобы избежать множественных вызовов
                setTimeout(() => {
                    this.syncData();
                }, 2000);
            }
        });
    }

    async syncData() {
        // Защита от множественных одновременных синхронизаций
        if (this.isSyncing) {
            console.log('Sync already in progress, skipping...');
            return;
        }
        
        this.isSyncing = true;
        console.log('Starting sync...');
        
        try {
            await this.loadOrders();
            await this.loadAnalytics();
            this.lastSyncTime = new Date();
            
            // Показываем уведомление только если пользователь активно использует приложение
            if (document.visibilityState === 'visible') {
                this.showNotification(`Данные обновлены ${formatDateTime(this.lastSyncTime)}`, 'info');
            }
        } catch (error) {
            console.error('Sync failed:', error);
            // Не показываем ошибку пользователю для авто-синхронизации
        } finally {
            this.isSyncing = false;
            console.log('Sync completed');
        }
    }

    // Навигация
    showSection(sectionId) {
        // Защита от повторных кликов
        if (this.currentSection === sectionId && Date.now() - (this.lastSectionChange || 0) < 500) {
            return;
        }
        
        this.lastSectionChange = Date.now();
        
        // Скрыть все секции
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Показать выбранную секцию
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Обновить навигацию
            this.navigation.updateActiveNav(sectionId);
            
            // Загрузить данные секции если нужно
            this.loadSectionData(sectionId);
        }
    }

    loadSectionData(sectionId) {
        // Задержка для предотвращения множественных рендеров
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
                    this.renderSettings();
                    break;
            }
        }, 100);
    }

    updateDashboard() {
        // Защита от множественных обновлений
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
        // Защита от повторных кликов
        if (this.currentPlatform === platform && Date.now() - (this.lastPlatformChange || 0) < 300) {
            return;
        }
        
        this.lastPlatformChange = Date.now();
        this.currentPlatform = platform;
        
        // Задержка для предотвращения мерцания
        setTimeout(() => {
            this.ordersComponent.render();
        }, 50);
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
        this.notifications.show(message, type);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    // Сохранение настроек
    saveSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem('texno_edem_settings', JSON.stringify(this.settings));
        this.showNotification('Настройки сохранены', 'success');
    }

    // Обновление конфигурации
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        localStorage.setItem('texno_edem_config', JSON.stringify(this.config));
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
                    
                    <button class="btn btn-outline btn-sm" onclick="app.syncData()" ${this.app.isSyncing ? 'disabled' : ''}>
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
                        <button class="platform-btn ${this.app.currentPlatform === 'all' ? 'active' : ''}" 
                                onclick="app.setPlatform('all')">
                            Все площадки
                        </button>
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

// Глобальные функции для использования в HTML
window.showOrderDetails = (platform, orderId) => {
    app.ordersComponent.showOrderDetails(platform, orderId);
};

window.closeModal = () => {
    app.modal.close();
};

window.exportData = (type) => {
    app.analyticsComponent.exportData(type);
};
