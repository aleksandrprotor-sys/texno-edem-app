// js/app.js - Основной файл приложения TEXNO EDEM (полностью обновленный)
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
        
        // Инициализация компонентов
        this.ordersComponent = new OrdersComponent(this);
        this.analyticsComponent = new AnalyticsComponent(this);
        this.settingsComponent = new SettingsComponent(this);
        this.modal = new ModalComponent(this);
        
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
            if (this.tg) {
                this.tg.close();
            }
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
        // Рендерим статические компоненты
        this.renderHeader();
        this.renderNavigation();
    }

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
                        <div class="logo-title">TEXNO EDEM</div>
                        <div class="logo-subtitle">Business Intelligence</div>
                    </div>
                </div>
                
                <div class="header-actions">
                    <div class="sync-status">
                        <div class="sync-indicator ${this.isSyncing ? 'syncing' : ''}"></div>
                        <span class="sync-text">${this.getSyncText()}</span>
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

        this.updateNavigationBadges();
    }

    async loadInitialData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading('Загрузка данных...');
        
        try {
            await this.loadOrders();
            this.updateDashboard();
            this.updateNavigationBadges();
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
            // Используем mock данные для демонстрации
            this.orders.cdek = mockDataGenerator.generateCDEKOrders(8);
            this.orders.megamarket = mockDataGenerator.generateMegamarketOrders(12);
            this.orders.all = [...this.orders.cdek, ...this.orders.megamarket]
                .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

            console.log(`✅ Orders loaded: CDEK ${this.orders.cdek.length}, Megamarket ${this.orders.megamarket.length}`);

        } catch (error) {
            console.error('Error loading orders:', error);
            // Используем fallback данные
            this.orders.cdek = [];
            this.orders.megamarket = [];
            this.orders.all = [];
            this.showNotification('Ошибка загрузки заказов', 'error');
        }
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

        document.getElementById('total-orders').textContent = totalOrders;
        document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('success-rate').textContent = `${successRate}%`;
        document.getElementById('problem-orders').textContent = problemOrders;
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
            order.status === 'active' || order.status === 'processing'
        ).length;
        
        const megamarketNew = this.orders.megamarket.filter(order => 
            order.status === 'new'
        ).length;

        const cdekBadge = document.getElementById('cdek-badge');
        const megamarketBadge = document.getElementById('megamarket-badge');

        if (cdekBadge) {
            cdekBadge.textContent = cdekActive;
            cdekBadge.style.display = cdekActive > 0 ? 'flex' : 'none';
        }

        if (megamarketBadge) {
            megamarketBadge.textContent = megamarketNew;
            megamarketBadge.style.display = megamarketNew > 0 ? 'flex' : 'none';
        }
    }

    getStatusConfig(order) {
    const platform = order.platform.toUpperCase();
    const statusConfig = CONFIG.STATUSES[platform]?.[order.statusCode];
    
    if (statusConfig) {
        return statusConfig;
    }
    
    // Fallback для неизвестных статусов
    const fallbackStatuses = {
        'new': { text: 'Новый', color: '#3b82f6', type: 'info' },
        'processing': { text: 'В обработке', color: '#f59e0b', type: 'warning' },
        'active': { text: 'Активный', color: '#8b5cf6', type: 'info' },
        'delivered': { text: 'Доставлен', color: '#10b981', type: 'success' },
        'problem': { text: 'Проблема', color: '#ef4444', type: 'error' },
        'cancelled': { text: 'Отменен', color: '#6b7280', type: 'cancelled' }
    };
    
    return fallbackStatuses[order.status] || { text: order.status, color: '#6b7280', type: 'info' };
}

// Метод для ручной синхронизации
async manualSync() {
    if (this.isSyncing) {
        this.showNotification('Синхронизация уже выполняется', 'warning');
        return;
    }
    
    this.isSyncing = true;
    this.showLoading('Синхронизация данных...');
    this.renderHeader(); // Обновляем статус в хедере
    
    try {
        await this.loadOrders();
        this.updateDashboard();
        this.updateNavigationBadges();
        this.lastSyncTime = new Date();
        
        this.showNotification('Данные успешно синхронизированы', 'success');
        
    } catch (error) {
        console.error('Sync error:', error);
        this.showNotification('Ошибка синхронизации', 'error');
    } finally {
        this.isSyncing = false;
        this.hideLoading();
        this.renderHeader(); // Обновляем статус в хедере
    }
}

// Метод для получения заказа по ID
getOrderById(platform, orderId) {
    const orders = this.orders[platform] || [];
    return orders.find(order => order.id === orderId) || null;
}

    getSyncText() {
        if (this.isSyncing) return 'Синхронизация...';
        if (this.lastSyncTime) return `Обновлено ${formatRelativeTime(this.lastSyncTime)}`;
        return 'Не синхронизировано';
    }

    getUserAvatar() {
        if (this.user) {
            return this.user.firstName?.charAt(0) || 'U';
        }
        return 'U';
    }

    getUserName() {
        if (this.user) {
            return `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() || 'Пользователь';
        }
        return 'Гость';
    }

    // Навигация
    showSection(sectionId, platform = null) {
        // Обновляем текущую секцию
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
            setTimeout(() => {
                this.loadSectionData(sectionId, platform);
            }, 50);
        }

        // Обновляем кнопку "Назад" в Telegram
        if (this.tg) {
            if (sectionId === 'dashboard') {
                this.tg.BackButton.hide();
            } else {
                this.tg.BackButton.show();
            }
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
                this.ordersComponent.render(platform);
                break;
            case 'analytics':
                this.analyticsComponent.render();
                break;
            case 'settings':
                this.settingsComponent.render();
                break;
        }
    }

    // Управление состоянием
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

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    // Публичные методы
    manualSync() {
        this.refreshData();
    }

    refreshData() {
        this.showLoading('Обновление данных...');
        this.loadInitialData().finally(() => {
            this.hideLoading();
            this.lastSyncTime = new Date();
            this.showNotification('Данные обновлены', 'success');
        });
    }

    getPlatformOrders(platform) {
        return this.orders[platform] || [];
    }

    getOrderById(platform, orderId) {
        const orders = this.getPlatformOrders(platform);
        return orders.find(order => order.id === orderId) || null;
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
    if (app.modal) {
        app.modal.close();
    }
};
