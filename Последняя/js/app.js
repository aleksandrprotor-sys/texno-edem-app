// js/app.js - Полностью обновленный с исправлением бесконечной инициализации
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
        
        // Безопасная инициализация с таймаутом
        this.safeInit();
    }

    async safeInit() {
        try {
            // Таймаут на инициализацию - максимум 10 секунд
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
        // Проверяем, не инициализировано ли уже
        if (this.isInitialized) {
            console.log('⚠️ Already initialized');
            return;
        }

        try {
            this.showLoading('Инициализация TEXNO EDEM...');
            console.log('🚀 Starting initialization...');

            // 1. Базовая инициализация
            await this.initBasic();
            
            // 2. Инициализация Telegram (не блокирующая)
            await this.initTelegram();
            
            // 3. Загрузка конфигурации
            await this.loadConfig();
            
            // 4. Быстрая инициализация компонентов
            await this.initComponentsFast();
            
            // 5. Загрузка данных (не блокирующая)
            this.loadInitialDataAsync();
            
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
        // Базовая инициализация, которая всегда должна работать
        console.log('🔧 Basic initialization...');
        
        // Применяем базовые стили
        document.documentElement.setAttribute('data-theme', 'light');
        
        // Создаем минимальный UI
        this.renderBasicUI();
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async initTelegram() {
        try {
            if (window.Telegram && Telegram.WebApp) {
                this.tg = Telegram.WebApp;
                this.tg.expand();
                
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
            // Простая загрузка конфигурации
            if (typeof CONFIG !== 'undefined' && CONFIG.get) {
                console.log('✅ Config loaded');
            } else {
                console.warn('⚠️ Config not available, using defaults');
            }
        } catch (error) {
            console.warn('⚠️ Config load failed:', error);
        }
    }

    async initComponentsFast() {
        try {
            // Быстрая инициализация только основных компонентов
            this.ordersComponent = new OrdersComponent(this);
            this.analyticsComponent = new AnalyticsComponent(this);
            this.settingsComponent = new SettingsComponent(this);
            this.modal = new ModalComponent(this);
            
            this.renderHeader();
            this.renderNavigation();
            
            console.log('✅ Components initialized');
        } catch (error) {
            console.warn('⚠️ Components init failed:', error);
        }
    }

    async loadInitialDataAsync() {
        // Не блокирующая загрузка данных
        setTimeout(async () => {
            try {
                await this.loadOrders();
                this.updateDashboard();
                this.updateNavigationBadges();
                this.lastSyncTime = new Date();
                
                console.log('✅ Initial data loaded');
            } catch (error) {
                console.warn('⚠️ Initial data load failed:', error);
                // Используем демо-данные
                this.useDemoData();
            }
        }, 500);
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
            // Используем fallback данные
            this.useDemoData();
        }
    }

    useDemoData() {
        // Используем демо-данные при ошибках
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
            }
        ];
    }

    emergencyInit() {
        console.log('🚨 Emergency initialization');
        
        // Останавливаем таймаут
        clearTimeout(this.initTimeout);
        
        // Показываем базовый интерфейс
        this.renderBasicUI();
        this.useDemoData();
        
        // Помечаем как инициализированное
        this.isInitialized = true;
        this.hideLoading();
        
        this.showNotification('Приложение запущено в безопасном режиме', 'warning');
    }

    renderBasicUI() {
        // Минимальный UI который всегда работает
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

        // Показываем дашборд
        this.showSection('dashboard');
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

    // Навигация
    showSection(sectionId, platform = null) {
        // Сохраняем текущее состояние
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

        document.getElementById('cdek-active').textContent = cdekActive;
        document.getElementById('megamarket-new').textContent = megamarketNew;
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
    } catch (error) {
        console.error('❌ Failed to create app instance:', error);
        // Экстренная инициализация
        const emergencyApp = new TexnoEdemApp();
        emergencyApp.emergencyInit();
        window.app = emergencyApp;
    }
});

// Глобальные функции с обработкой ошибок
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

// Обработка закрытия приложения
window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});
