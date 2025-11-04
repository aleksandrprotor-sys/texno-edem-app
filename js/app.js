// js/app.js - Полностью обновленная версия TEXNO EDEM
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
        this.config = CONFIG || window.CONFIG;
        
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
        
        // Безопасная инициализация
        this.safeInit();
    }

    async safeInit() {
        try {
            console.log('🚀 Starting safe initialization...');
            
            // Таймаут на инициализацию
            this.initTimeout = setTimeout(() => {
                if (!this.isInitialized) {
                    console.error('❌ Init timeout reached');
                    this.emergencyInit();
                }
            }, 15000);

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
            console.log('🔧 Starting full initialization...');

            // 1. Базовая инициализация UI
            await this.initBasic();
            
            // 2. Инициализация Telegram
            await this.initTelegram();
            
            // 3. Загрузка конфигурации
            await this.loadConfig();
            
            // 4. Инициализация компонентов
            await this.initComponents();
            
            // 5. Загрузка начальных данных
            await this.loadInitialData();
            
            // 6. Запуск автосинхронизации
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
        
        // Применяем тему
        document.documentElement.setAttribute('data-theme', this.config?.get('SETTINGS.THEME') || 'light');
        
        // Создаем базовый UI
        this.renderBasicUI();
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    async initTelegram() {
        try {
            if (window.Telegram && Telegram.WebApp) {
                this.tg = Telegram.WebApp;
                this.tg.ready();
                this.tg.expand();
                
                // Настройка основной кнопки
                this.tg.MainButton.setText('Обновить');
                this.tg.MainButton.onClick(() => this.manualSync());
                
                // Настройка кнопки назад
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

    async loadConfig() {
        try {
            // Загружаем конфигурацию
            if (typeof CONFIG !== 'undefined') {
                this.config = CONFIG;
                console.log('✅ Config loaded');
            } else {
                console.warn('⚠️ Config not available, using defaults');
                this.config = {
                    get: (key, defaultValue) => defaultValue,
                    APP: { NAME: 'TEXNO EDEM', VERSION: '1.0.0' }
                };
            }
        } catch (error) {
            console.warn('⚠️ Config load failed:', error);
        }
    }

    async initComponents() {
        try {
            // Инициализация компонентов
            this.ordersComponent = new OrdersComponent(this);
            this.analyticsComponent = new AnalyticsComponent(this);
            this.settingsComponent = new SettingsComponent(this);
            this.modal = new ModalComponent(this);
            
            // Рендер интерфейса
            this.renderHeader();
            this.renderNavigation();
            
            console.log('✅ Components initialized');
        } catch (error) {
            console.warn('⚠️ Components init failed:', error);
        }
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
            // Загрузка заказов CDEK
            if (this.config?.get('API.CDEK.ENABLED', true)) {
                try {
                    const cdekOrders = await CDEKService.getOrders();
                    this.orders.cdek = cdekOrders;
                } catch (error) {
                    console.warn('⚠️ CDEK orders load failed, using mock data');
                    this.orders.cdek = this.generateDemoCDEKOrders();
                }
            } else {
                this.orders.cdek = this.generateDemoCDEKOrders();
            }

            // Загрузка заказов Megamarket
            if (this.config?.get('API.MEGAMARKET.ENABLED', true)) {
                try {
                    const megamarketOrders = await MegamarketService.getOrders();
                    this.orders.megamarket = megamarketOrders;
                } catch (error) {
                    console.warn('⚠️ Megamarket orders load failed, using mock data');
                    this.orders.megamarket = this.generateDemoMegamarketOrders();
                }
            } else {
                this.orders.megamarket = this.generateDemoMegamarketOrders();
            }

            // Объединение и сортировка всех заказов
            this.orders.all = [...this.orders.cdek, ...this.orders.megamarket]
                .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

            console.log(`✅ Orders loaded: CDEK ${this.orders.cdek.length}, Megamarket ${this.orders.megamarket.length}`);

        } catch (error) {
            console.error('❌ Error loading orders:', error);
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

    generateDemoCDEKOrders() {
        return [
            {
                id: 'cdek-demo-1',
                platform: 'cdek',
                trackingNumber: 'CDEK12345678',
                status: 'delivered',
                statusCode: 'DELIVERED',
                fromCity: 'Москва',
                toCity: 'Санкт-Петербург',
                weight: 2.5,
                cost: 1500,
                sender: 'ООО "ТЕХНО ЭДЕМ"',
                recipient: 'Иван Иванов',
                createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                deliveredDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'cdek-demo-2',
                platform: 'cdek',
                trackingNumber: 'CDEK87654321',
                status: 'active',
                statusCode: 'IN_PROGRESS',
                fromCity: 'Москва',
                toCity: 'Екатеринбург',
                weight: 1.8,
                cost: 1200,
                sender: 'ООО "ТЕХНО ЭДЕМ"',
                recipient: 'Петр Сидоров',
                createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                id: 'cdek-demo-3',
                platform: 'cdek',
                trackingNumber: 'CDEK55554444',
                status: 'problem',
                statusCode: 'PROBLEM',
                fromCity: 'Москва',
                toCity: 'Новосибирск',
                weight: 3.2,
                cost: 2100,
                sender: 'ООО "ТЕХНО ЭДЕМ"',
                recipient: 'Мария Сидорова',
                createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                problemDescription: 'Не удается связаться с получателем'
            }
        ];
    }

    generateDemoMegamarketOrders() {
        return [
            {
                id: 'mm-demo-1',
                platform: 'megamarket', 
                orderNumber: 'MM123456',
                status: 'new',
                statusCode: 'NEW',
                totalAmount: 15670,
                itemsTotal: 15670,
                deliveryCost: 0,
                customerName: 'Мария Петрова',
                customerPhone: '+7 912 345-67-89',
                deliveryAddress: 'г. Москва, ул. Примерная, д. 1',
                createdDate: new Date().toISOString(),
                items: [
                    {
                        id: 'item-1',
                        name: 'Смартфон Samsung Galaxy',
                        quantity: 1,
                        price: 15670,
                        total: 15670
                    }
                ]
            },
            {
                id: 'mm-demo-2',
                platform: 'megamarket',
                orderNumber: 'MM654321',
                status: 'processing',
                statusCode: 'CONFIRMED',
                totalAmount: 28900,
                itemsTotal: 28900,
                deliveryCost: 0,
                customerName: 'Алексей Козлов',
                customerPhone: '+7 923 456-78-90',
                deliveryAddress: 'г. Санкт-Петербург, пр. Невский, д. 25',
                createdDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        id: 'item-2',
                        name: 'Ноутбук ASUS VivoBook',
                        quantity: 1,
                        price: 28900,
                        total: 28900
                    }
                ]
            },
            {
                id: 'mm-demo-3',
                platform: 'megamarket',
                orderNumber: 'MM789012',
                status: 'delivered',
                statusCode: 'DELIVERED',
                totalAmount: 4500,
                itemsTotal: 4500,
                deliveryCost: 0,
                customerName: 'Сергей Иванов',
                customerPhone: '+7 934 567-89-01',
                deliveryAddress: 'г. Казань, ул. Кремлевская, д. 15',
                createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                deliveredDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        id: 'item-3',
                        name: 'Наушники беспроводные',
                        quantity: 1,
                        price: 4500,
                        total: 4500
                    }
                ]
            }
        ];
    }

    emergencyInit() {
        console.log('🚨 Emergency initialization');
        
        clearTimeout(this.initTimeout);
        
        this.renderBasicUI();
        this.useDemoData();
        
        this.isInitialized = true;
        this.hideLoading();
        
        this.showNotification('Приложение запущено в безопасном режиме', 'warning');
    }

    renderBasicUI() {
        const header = document.getElementById('header');
        if (header) {
            header.innerHTML = `
                <div class="header-content">
                    <div class="logo">
                        <div class="logo-icon">
                            <i class="fas fa-rocket"></i>
                        </div>
                        <div class="logo-text">
                            <div class="logo-title">TEXNO EDEM</div>
                            <div class="logo-subtitle">Safe Mode</div>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-icon" onclick="location.reload()">
                            <i class="fas fa-redo"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        const nav = document.getElementById('main-nav');
        if (nav) {
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
                        </button>
                        <button class="nav-item" onclick="app.showSection('orders', 'megamarket')">
                            <i class="fas fa-store"></i>
                            <span>Мегамаркет</span>
                        </button>
                    </div>
                </div>
            `;
        }

        this.showSection('dashboard');
    }

    // Управление состоянием UI
    showLoading(message = 'Загрузка...') {
        this.isLoading = true;
        let overlay = document.getElementById('loading-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div id="loading-message" class="loading-message">${message}</div>
                </div>
            `;
            document.body.appendChild(overlay);
        } else {
            const messageEl = document.getElementById('loading-message');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }
        
        overlay.classList.add('active');
    }

    hideLoading() {
        this.isLoading = false;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        if (window.NotificationManager) {
            NotificationManager.show(message, type, { duration });
        } else {
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
        
        setTimeout(() => notification.classList.add('show'), 100);
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

    // Навигация
    showSection(sectionId, platform = null) {
        this.currentSection = sectionId;
        this.currentPlatform = platform;

        // Скрываем все секции
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Показываем активную секцию
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.updateActiveNavigation(sectionId, platform);
            this.loadSectionData(sectionId, platform);
        }

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
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        const interval = this.config?.get('SETTINGS.SYNC_INTERVAL', 300000);
        if (this.config?.get('SETTINGS.AUTO_SYNC', true)) {
            this.syncInterval = setInterval(() => {
                if (!this.isSyncing) {
                    this.manualSync();
                }
            }, interval);
        }
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
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

    // Вспомогательные методы
    getStatusConfig(order) {
        const platform = order.platform.toUpperCase();
        
        // Получаем конфигурацию статуса из CONFIG
        let statusConfig;
        if (this.config?.STATUSES?.[platform]?.[order.statusCode]) {
            statusConfig = this.config.STATUSES[platform][order.statusCode];
        } else if (this.config?.get(`STATUSES.${platform}.${order.statusCode}`)) {
            statusConfig = this.config.get(`STATUSES.${platform}.${order.statusCode}`);
        }
        
        if (statusConfig) {
            return statusConfig;
        }
        
        // Fallback для неизвестных статусов
        const fallbackStatuses = {
            'new': { text: 'Новый', color: '#3b82f6', icon: 'clock' },
            'processing': { text: 'В обработке', color: '#f59e0b', icon: 'cog' },
            'active': { text: 'Активный', color: '#8b5cf6', icon: 'shipping-fast' },
            'delivered': { text: 'Доставлен', color: '#10b981', icon: 'check-circle' },
            'problem': { text: 'Проблема', color: '#ef4444', icon: 'exclamation-triangle' },
            'cancelled': { text: 'Отменен', color: '#6b7280', icon: 'times-circle' }
        };
        
        return fallbackStatuses[order.status] || { 
            text: order.status, 
            color: '#6b7280', 
            icon: 'question-circle' 
        };
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

        const appName = this.config?.get('APP.NAME') || 'TEXNO EDEM';
        const appVersion = this.config?.get('APP.VERSION') || '1.0.0';

        header.innerHTML = `
            <div class="header-content">
                <div class="logo" onclick="app.showSection('dashboard')">
                    <div class="logo-icon">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <div class="logo-text">
                        <div class="logo-title">${appName}</div>
                        <div class="logo-subtitle">Business Intelligence v${appVersion}</div>
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
                    
                    <button class="nav-item ${this.currentSection === 'settings' ? 'active' : ''}" 
                            onclick="app.showSection('settings')">
                        <i class="fas fa-cog"></i>
                        <span>Настройки</span>
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

    updateAnalyticsPreview() {
        const container = document.getElementById('analytics-preview');
        if (!container) return;

        const metrics = [
            { icon: 'trending-up', label: 'Рост заказов', value: '+15%', change: 'positive' },
            { icon: 'clock', label: 'Среднее время', value: '2.3 ч', change: 'negative' },
            { icon: 'users', label: 'Новые клиенты', value: '24', change: 'positive' },
            { icon: 'repeat', label: 'Повторные заказы', value: '68%', change: 'positive' }
        ];

        container.innerHTML = metrics.map(metric => `
            <div class="preview-card">
                <div class="preview-icon">
                    <i class="fas fa-${metric.icon}"></i>
                </div>
                <div class="preview-content">
                    <div class="preview-value ${metric.change}">${metric.value}</div>
                    <div class="preview-label">${metric.label}</div>
                </div>
            </div>
        `).join('');
    }

    updateRecentActivity() {
        const container = document.getElementById('recent-orders-list');
        if (!container) return;

        const recentOrders = this.orders.all.slice(0, 5);
        
        if (recentOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-activity">
                    <i class="fas fa-inbox"></i>
                    <p>Нет недавних заказов</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentOrders.map(order => {
            const platformIcon = order.platform === 'cdek' ? 'shipping-fast' : 'store';
            const statusConfig = this.getStatusConfig(order);
            
            return `
                <div class="activity-item" onclick="app.showSection('orders', '${order.platform}')">
                    <div class="activity-icon platform-${order.platform}">
                        <i class="fas fa-${platformIcon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">
                            ${order.platform === 'cdek' ? order.trackingNumber : order.orderNumber}
                        </div>
                        <div class="activity-description">
                            ${order.recipient || order.customerName} • ${formatCurrency(order.cost || order.totalAmount)}
                        </div>
                        <div class="activity-meta">
                            <span class="activity-time">${formatRelativeTime(order.createdDate)}</span>
                            <span class="activity-platform">${order.platform === 'cdek' ? 'CDEK' : 'Мегамаркет'}</span>
                        </div>
                    </div>
                    <div class="activity-status status-${order.status}">
                        ${statusConfig.text}
                    </div>
                </div>
            `;
        }).join('');
    }

    updatePlatformWidgets() {
        const cdekActive = this.orders.cdek.filter(order => 
            order.status === 'active' || order.status === 'processing'
        ).length;
        
        const megamarketNew = this.orders.megamarket.filter(order => 
            order.status === 'new'
        ).length;

        const cdekElement = document.getElementById('cdek-active');
        const megamarketElement = document.getElementById('megamarket-new');
        
        if (cdekElement) cdekElement.textContent = cdekActive;
        if (megamarketElement) megamarketElement.textContent = megamarketNew;
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

    // Очистка приложения
    destroy() {
        this.stopAutoSync();
        if (this.tg) {
            this.tg.disableClosingConfirmation();
        }
    }
}

// Безопасная инициализация приложения
let app;

document.addEventListener('DOMContentLoaded', () => {
    try {
        app = new TexnoEdemApp();
        window.app = app;
    } catch (error) {
        console.error('❌ Failed to create app instance:', error);
        const emergencyApp = new TexnoEdemApp();
        emergencyApp.emergencyInit();
        window.app = emergencyApp;
    }
});

// Глобальные функции
window.showOrderDetails = (platform, orderId) => {
    try {
        if (app && app.ordersComponent) {
            app.ordersComponent.showOrderDetails(platform, orderId);
        }
    } catch (error) {
        console.error('Error showing order details:', error);
    }
};

window.closeModal = () => {
    try {
        if (app && app.modal) {
            app.modal.close();
        }
    } catch (error) {
        console.error('Error closing modal:', error);
    }
};

window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});
