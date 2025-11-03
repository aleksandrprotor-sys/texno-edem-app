// js/app.js - Полностью обновленный
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
        
        // Загрузка состояния
        this.appState = this.loadAppState();
        
        this.init();
    }

    async init() {
        try {
            this.showLoading('Инициализация TEXNO EDEM...');
            
            // Инициализация Telegram Web App
            await this.initTelegram();
            
            // Применяем сохраненную тему
            CONFIG.applyTheme();
            
            // Инициализация компонентов
            await this.initComponents();
            
            // Загрузка начальных данных
            await this.loadInitialData();
            
            // Восстанавливаем состояние
            this.restoreAppState();
            
            this.isInitialized = true;
            this.hideLoading();
            
            console.log('🎯 TEXNO EDEM App initialized successfully');
            this.showNotification('Система готова к работе', 'success', 3000);
            
            // Запускаем автосинхронизацию
            if (CONFIG.get('SETTINGS.AUTO_SYNC')) {
                this.startAutoSync();
            }
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Ошибка инициализации приложения: ' + error.message);
            this.hideLoading();
        }
    }

    async initTelegram() {
        if (window.Telegram && Telegram.WebApp) {
            this.tg = Telegram.WebApp;
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            
            // Инициализация темы Telegram
            this.setupTelegramTheme();
            
            // Получение данных пользователя
            this.initTelegramUser();
            
            // Настройка основных кнопок
            this.setupTelegramButtons();
            
            console.log('✅ Telegram Web App initialized');
        } else {
            console.log('🌐 Desktop mode activated');
            this.initDesktopMode();
        }
    }

    setupTelegramTheme() {
        if (!this.tg) return;
        
        const themeParams = this.tg.themeParams;
        document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#999999');
        document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
        
        this.tg.onEvent('themeChanged', this.setupTelegramTheme.bind(this));
    }

    initTelegramUser() {
        const user = this.tg.initDataUnsafe?.user;
        if (user) {
            this.user = {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                language: user.language_code,
                isPremium: user.is_premium || false,
                photoUrl: user.photo_url
            };
            
            // Сохраняем язык пользователя
            if (user.language_code) {
                CONFIG.set('SETTINGS.LANGUAGE', user.language_code);
            }
        }
    }

    setupTelegramButtons() {
        if (!this.tg) return;
        
        // Основная кнопка
        this.tg.MainButton.setText('Обновить данные');
        this.tg.MainButton.onClick(this.manualSync.bind(this));
        
        // Кнопка назад
        this.tg.BackButton.show();
        this.tg.BackButton.onClick(this.handleBackButton.bind(this));
        
        // Кнопка настроек
        this.tg.SettingsButton.show();
        this.tg.SettingsButton.onClick(() => {
            this.showSection('settings');
        });
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

    // Сохранение и восстановление состояния
    loadAppState() {
        try {
            const saved = localStorage.getItem('texno_edem_app_state');
            return saved ? JSON.parse(saved) : {
                currentSection: 'dashboard',
                currentPlatform: null,
                searchQuery: '',
                filters: {},
                sortBy: 'date_desc'
            };
        } catch (error) {
            console.error('Error loading app state:', error);
            return {};
        }
    }

    saveAppState() {
        try {
            const state = {
                currentSection: this.currentSection,
                currentPlatform: this.currentPlatform,
                lastSyncTime: this.lastSyncTime,
                timestamp: Date.now()
            };
            localStorage.setItem('texno_edem_app_state', JSON.stringify(state));
        } catch (error) {
            console.error('Error saving app state:', error);
        }
    }

    restoreAppState() {
        if (this.appState.currentSection) {
            this.showSection(this.appState.currentSection, this.appState.currentPlatform);
        }
    }

    // Основные методы приложения
    async loadInitialData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading('Загрузка бизнес-данных...');
        
        try {
            await Promise.all([
                this.loadOrders(),
                this.loadAnalytics()
            ]);
            
            this.updateDashboard();
            this.updateNavigationBadges();
            
            this.lastSyncTime = new Date();
            this.saveAppState();
            
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
        try {
            // Загрузка из кэша
            const cached = localStorage.getItem('texno_edem_orders');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < 300000) { // 5 минут
                    this.orders = parsed.data;
                    console.log('📦 Orders loaded from cache');
                    return;
                }
            }

            // Загрузка из API или mock данных
            if (CONFIG.get('API.CDEK.ENABLED')) {
                this.orders.cdek = await CDEKService.getOrders();
            } else {
                this.orders.cdek = mockDataGenerator.generateCDEKOrders(8);
            }

            if (CONFIG.get('API.MEGAMARKET.ENABLED')) {
                this.orders.megamarket = await MegamarketService.getOrders();
            } else {
                this.orders.megamarket = mockDataGenerator.generateMegamarketOrders(12);
            }

            this.orders.all = [...this.orders.cdek, ...this.orders.megamarket]
                .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

            // Сохраняем в кэш
            localStorage.setItem('texno_edem_orders', JSON.stringify({
                data: this.orders,
                timestamp: Date.now()
            }));

            console.log(`✅ Orders loaded: CDEK ${this.orders.cdek.length}, Megamarket ${this.orders.megamarket.length}`);

        } catch (error) {
            console.error('Error loading orders:', error);
            // Используем mock данные как fallback
            this.orders.cdek = mockDataGenerator.generateCDEKOrders(8);
            this.orders.megamarket = mockDataGenerator.generateMegamarketOrders(12);
            this.orders.all = [...this.orders.cdek, ...this.orders.megamarket];
            this.showNotification('Используются демо-данные', 'warning');
        }
    }

    async loadAnalytics() {
        try {
            this.analytics = mockDataGenerator.generateAnalyticsData();
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.analytics = {};
        }
    }

    // Навигация
    showSection(sectionId, platform = null) {
        // Сохраняем текущее состояние
        this.currentSection = sectionId;
        this.currentPlatform = platform;
        this.saveAppState();

        // Скрываем все секции
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Показываем активную секцию
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Обновляем навигацию
            this.updateActiveNavigation(sectionId, platform);
            
            // Загружаем данные для секции
            this.loadSectionData(sectionId, platform);
        }

        // Обновляем кнопки Telegram
        this.updateTelegramButtons(sectionId);
    }

    updateTelegramButtons(sectionId) {
        if (!this.tg) return;

        if (sectionId === 'dashboard') {
            this.tg.MainButton.setText('Обновить данные');
            this.tg.MainButton.show();
            this.tg.BackButton.hide();
        } else {
            this.tg.MainButton.hide();
            this.tg.BackButton.show();
        }
    }

    updateActiveNavigation(sectionId, platform = null) {
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

    loadSectionData(sectionId, platform) {
        switch (sectionId) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'orders':
                if (this.ordersComponent) {
                    this.ordersComponent.render(platform);
                }
                break;
            case 'analytics':
                if (this.analyticsComponent) {
                    this.analyticsComponent.render();
                }
                break;
            case 'settings':
                if (this.settingsComponent) {
                    this.settingsComponent.render();
                }
                break;
        }
    }

    handleBackButton() {
        if (this.currentSection !== 'dashboard') {
            this.showSection('dashboard');
        } else {
            if (this.tg) {
                this.tg.close();
            }
        }
    }

    // Автосинхронизация
    startAutoSync() {
        const interval = CONFIG.get('SETTINGS.SYNC_INTERVAL', 300000);
        this.syncInterval = setInterval(() => {
            if (!this.isSyncing && CONFIG.get('SETTINGS.AUTO_SYNC')) {
                this.manualSync();
            }
        }, interval);
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
    }

    async manualSync() {
        if (this.isSyncing) {
            this.showNotification('Синхронизация уже выполняется', 'warning');
            return;
        }
        
        this.isSyncing = true;
        this.showLoading('Синхронизация с платформами...');
        this.renderHeader();
        
        try {
            await this.loadOrders();
            this.updateDashboard();
            this.updateNavigationBadges();
            this.lastSyncTime = new Date();
            this.saveAppState();
            
            this.showNotification('Данные успешно обновлены', 'success');
            
        } catch (error) {
            console.error('Sync error:', error);
            this.showNotification('Ошибка синхронизации', 'error');
        } finally {
            this.isSyncing = false;
            this.hideLoading();
            this.renderHeader();
        }
    }

    // Управление состоянием UI
    showLoading(message = 'Загрузка...') {
        this.isLoading = true;
        const overlay = document.getElementById('loading-overlay');
        const messageEl = document.getElementById('loading-message');
        
        if (overlay && messageEl) {
            messageEl.textContent = message;
            overlay.classList.add('active');
        }
    }

    hideLoading() {
        this.isLoading = false;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    // Улучшенные уведомления
    showNotification(message, type = 'info', duration = 5000) {
        // Используем улучшенный менеджер уведомлений
        if (window.NotificationManager) {
            NotificationManager.show(message, type, { duration });
        } else {
            // Fallback для простых уведомлений
            this.showSimpleNotification(message, type, duration);
        }
    }

    showSimpleNotification(message, type, duration) {
        const notification = document.createElement('div');
        notification.className = `simple-notification simple-notification-${type}`;
        notification.innerHTML = `
            <div class="simple-notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    // Вспомогательные методы
    getStatusConfig(order) {
        const platform = order.platform.toUpperCase();
        const statusConfig = CONFIG.STATUSES?.[platform]?.[order.statusCode];
        
        if (statusConfig) {
            return statusConfig;
        }
        
        // Fallback для неизвестных статусов
        const fallbackStatuses = {
            'new': { text: 'Новый', color: '#3b82f6' },
            'processing': { text: 'В обработке', color: '#f59e0b' },
            'active': { text: 'Активный', color: '#8b5cf6' },
            'delivered': { text: 'Доставлен', color: '#10b981' },
            'problem': { text: 'Проблема', color: '#ef4444' },
            'cancelled': { text: 'Отменен', color: '#6b7280' }
        };
        
        return fallbackStatuses[order.status] || { text: order.status, color: '#6b7280' };
    }

    getPlatformOrders(platform) {
        return this.orders[platform] || [];
    }

    getOrderById(platform, orderId) {
        const orders = this.getPlatformOrders(platform);
        return orders.find(order => order.id === orderId) || null;
    }

    // Обновление интерфейса
    renderHeader() {
        const header = document.getElementById('header');
        if (!header) return;

        header.innerHTML = `
            <div class="header-content">
                <div class="logo" onclick="app.showSection('dashboard')">
                    <div class="logo-icon">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <div class="logo-text">
                        <div class="logo-title">${CONFIG.get('APP.NAME')}</div>
                        <div class="logo-subtitle">Business Intelligence v${CONFIG.get('APP.VERSION')}</div>
                    </div>
                </div>
                
                <div class="header-actions">
                    <div class="sync-status ${this.isSyncing ? 'syncing' : ''}">
                        <div class="sync-indicator"></div>
                        <span class="sync-text">${this.getSyncText()}</span>
                    </div>
                    
                    <div class="user-info" onclick="app.showSection('settings')">
                        <div class="user-avatar">
                            ${this.getUserAvatar()}
                        </div>
                        <div class="user-details">
                            <div class="user-name">${this.getUserName()}</div>
                            <div class="user-role">${this.user?.isPremium ? 'Premium' : 'Менеджер'}</div>
                        </div>
                    </div>
                    
                    <button class="btn btn-icon" onclick="app.manualSync()" 
                            ${this.isSyncing ? 'disabled' : ''} 
                            title="Обновить данные">
                        <i class="fas fa-sync-alt ${this.isSyncing ? 'fa-spin' : ''}"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderNavigation() {
        const nav = document.getElementById('main-nav');
        if (!nav) return;

        nav.innerHTML = `
            <div class="nav-container">
                <div class="nav-items">
                    <button class="nav-item ${this.currentSection === 'dashboard' ? 'active' : ''}" 
                            onclick="app.showSection('dashboard')">
                        <i class="fas fa-chart-line"></i>
                        <span>Дашборд</span>
                    </button>
                    
                    <button class="nav-item ${this.currentSection === 'orders' && this.currentPlatform === 'cdek' ? 'active' : ''}" 
                            onclick="app.showSection('orders', 'cdek')">
                        <i class="fas fa-shipping-fast"></i>
                        <span>CDEK</span>
                        <span class="nav-badge" id="cdek-badge">0</span>
                    </button>
                    
                    <button class="nav-item ${this.currentSection === 'orders' && this.currentPlatform === 'megamarket' ? 'active' : ''}" 
                            onclick="app.showSection('orders', 'megamarket')">
                        <i class="fas fa-store"></i>
                        <span>Мегамаркет</span>
                        <span class="nav-badge" id="megamarket-badge">0</span>
                    </button>
                    
                    <button class="nav-item ${this.currentSection === 'analytics' ? 'active' : ''}" 
                            onclick="app.showSection('analytics')">
                        <i class="fas fa-chart-bar"></i>
                        <span>Аналитика</span>
                    </button>
                </div>
            </div>
        `;

        this.updateNavigationBadges();
    }

    updateDashboard() {
        this.updateQuickStats();
        this.updateRecentActivity();
        this.updatePlatformWidgets();
        this.updateAnalyticsPreview();
    }

    updateQuickStats() {
        const totalOrders = this.orders.all.length;
        const totalRevenue = this.orders.all.reduce((sum, order) => sum + (order.cost || order.totalAmount || 0), 0);
        const problemOrders = this.orders.all.filter(order => order.status === 'problem').length;
        const successRate = totalOrders > 0 ? Math.round((totalOrders - problemOrders) / totalOrders * 100) : 0;

        const elements = {
            'total-orders': totalOrders.toString(),
            'total-revenue': formatCurrency(totalRevenue),
            'success-rate': `${successRate}%`,
            'problem-orders': problemOrders.toString()
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    updateNavigationBadges() {
        const cdekActive = this.orders.cdek.filter(order => 
            ['active', 'processing', 'new'].includes(order.status)
        ).length;
        
        const megamarketNew = this.orders.megamarket.filter(order => 
            order.status === 'new'
        ).length;

        const badges = {
            'cdek-badge': cdekActive,
            'megamarket-badge': megamarketNew
        };

        Object.entries(badges).forEach(([id, count]) => {
            const badge = document.getElementById(id);
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        });
    }

    getSyncText() {
        if (this.isSyncing) return 'Синхронизация...';
        if (this.lastSyncTime) return `Обновлено ${formatRelativeTime(this.lastSyncTime)}`;
        return 'Не синхронизировано';
    }

    getUserAvatar() {
        if (this.user?.firstName) {
            return this.user.firstName.charAt(0).toUpperCase();
        }
        return 'U';
    }

    getUserName() {
        if (this.user) {
            return `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() || 'Пользователь';
        }
        return 'Гость';
    }

    // Инициализация компонентов
    async initComponents() {
        this.ordersComponent = new OrdersComponent(this);
        this.analyticsComponent = new AnalyticsComponent(this);
        this.settingsComponent = new SettingsComponent(this);
        this.modal = new ModalComponent(this);
        
        this.renderHeader();
        this.renderNavigation();
        
        console.log('✅ All components initialized');
    }

    // Очистка приложения
    destroy() {
        this.stopAutoSync();
        if (this.tg) {
            this.tg.disableClosingConfirmation();
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
    if (app.ordersComponent) {
        app.ordersComponent.showOrderDetails(platform, orderId);
    }
};

window.closeModal = () => {
    if (app.modal) {
        app.modal.close();
    }
};

// Обработка закрытия приложения
window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});
