// Главный класс приложения TEXNO EDEM
class TexnoEdemApp {
    constructor() {
        this.config = new AppConfig();
        this.orders = {
            all: [],
            cdek: [],
            megamarket: []
        };
        this.analytics = {};
        this.components = {};
        this.init();
    }

    async init() {
        try {
            // Инициализация Telegram WebApp
            this.initTelegram();
            
            // Загрузка конфигурации
            await this.loadConfig();
            
            // Инициализация компонентов
            this.initComponents();
            
            // Загрузка начальных данных
            await this.loadInitialData();
            
            // Запуск автосинхронизации
            this.startAutoSync();
            
            console.log('✅ TEXNO EDEM App initialized successfully');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showNotification('Ошибка инициализации приложения', 'error');
        }
    }

    initTelegram() {
        if (window.Telegram && Telegram.WebApp) {
            this.tg = Telegram.WebApp;
            this.tg.expand();
            
            // Безопасная установка подтверждения закрытия
            try {
                this.tg.enableClosingConfirmation();
            } catch (error) {
                console.warn('Closing confirmation not supported:', error.message);
            }
            
            // Показываем информацию о пользователе
            this.showUserInfo();
        } else {
            console.warn('Telegram WebApp not available, running in browser mode');
        }
    }

    showUserInfo() {
        const userInfoEl = document.getElementById('userInfo');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        if (this.tg?.initDataUnsafe?.user) {
            const user = this.tg.initDataUnsafe.user;
            const name = user.first_name || user.username || 'Пользователь';
            const initial = name.charAt(0).toUpperCase();
            
            userAvatar.textContent = initial;
            userName.textContent = name;
            userInfoEl.style.display = 'flex';
        }
    }

    async loadConfig() {
        try {
            // Загрузка конфигурации из localStorage
            const savedConfig = Storage.get('config');
            if (savedConfig) {
                this.config = Object.assign(new AppConfig(), savedConfig);
            }
            
            // Применяем тему
            this.applyTheme();
            
        } catch (error) {
            console.error('Config loading error:', error);
        }
    }

    saveConfig() {
        try {
            Storage.set('config', this.config);
        } catch (error) {
            console.error('Config saving error:', error);
        }
    }

    applyTheme() {
        const theme = this.config.SETTINGS?.THEME || 'auto';
        if (theme === 'auto') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    initComponents() {
        this.components.orders = new OrdersComponent(this);
        this.components.analytics = new AnalyticsComponent(this);
        this.components.settings = new SettingsComponent(this);
        
        console.log('✅ Components initialized');
    }

    async loadInitialData() {
        this.showLoading('Загрузка данных...');
        
        try {
            await Promise.all([
                this.loadOrders(),
                this.loadAnalytics()
            ]);
            
            this.updateDashboard();
            this.hideLoading();
            
        } catch (error) {
            console.error('Initial data loading error:', error);
            this.hideLoading();
            this.showNotification('Ошибка загрузки данных', 'error');
        }
    }

    async loadOrders() {
        try {
            // Загрузка заказов CDEK
            if (this.config.API?.CDEK?.ENABLED) {
                try {
                    this.orders.cdek = await CDEKService.getOrders({
                        date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        size: 50
                    });
                } catch (error) {
                    console.warn('CDEK orders load failed:', error);
                    this.orders.cdek = this.generateDemoCDEKOrders();
                }
            } else {
                this.orders.cdek = this.generateDemoCDEKOrders();
            }

            // Загрузка заказов Megamarket
            if (this.config.API?.MEGAMARKET?.ENABLED) {
                try {
                    this.orders.megamarket = await MegamarketService.getOrders({
                        date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        limit: 50
                    });
                } catch (error) {
                    console.warn('Megamarket orders load failed:', error);
                    this.orders.megamarket = this.generateDemoMegamarketOrders();
                }
            } else {
                this.orders.megamarket = this.generateDemoMegamarketOrders();
            }

            // Объединение всех заказов
            this.orders.all = [...this.orders.cdek, ...this.orders.megamarket]
                .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

            console.log(`✅ Orders loaded: CDEK ${this.orders.cdek.length}, Megamarket ${this.orders.megamarket.length}`);

        } catch (error) {
            console.error('Orders loading error:', error);
            this.useDemoData();
        }
    }

    async loadAnalytics() {
        try {
            // Здесь будет загрузка аналитики
            this.analytics = {
                revenue: {
                    total: this.orders.all.reduce((sum, order) => sum + (order.cost || order.totalAmount || 0), 0),
                    cdek: this.orders.cdek.reduce((sum, order) => sum + (order.cost || 0), 0),
                    megamarket: this.orders.megamarket.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
                },
                orders: {
                    total: this.orders.all.length,
                    cdek: this.orders.cdek.length,
                    megamarket: this.orders.megamarket.length
                }
            };
            
        } catch (error) {
            console.error('Analytics loading error:', error);
        }
    }

    updateDashboard() {
        // Обновление быстрой статистики
        document.getElementById('total-orders').textContent = this.orders.all.length;
        document.getElementById('total-revenue').textContent = formatCurrency(this.analytics.revenue?.total || 0);
        document.getElementById('success-rate').textContent = '95%';
        document.getElementById('problem-orders').textContent = this.orders.all.filter(order => order.status === 'problem').length;

        // Обновление виджетов платформ
        document.getElementById('cdek-active').textContent = this.orders.cdek.filter(order => 
            order.status === 'active' || order.status === 'processing'
        ).length;
        
        document.getElementById('megamarket-new').textContent = this.orders.megamarket.filter(order => 
            order.status === 'new'
        ).length;

        // Обновление последних заказов
        this.updateRecentOrders();
        
        // Обновление бейджей
        this.updateBadges();
    }

    updateRecentOrders() {
        const container = document.getElementById('recent-orders-list');
        const recentOrders = this.orders.all.slice(0, 5);
        
        if (recentOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-activity">
                    <i class="fas fa-inbox"></i>
                    <p>Нет заказов для отображения</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentOrders.map(order => `
            <div class="activity-item" onclick="app.showOrderDetails('${order.platform}', '${order.id}')">
                <div class="activity-icon platform-${order.platform}">
                    <i class="fas fa-${order.platform === 'cdek' ? 'shipping-fast' : 'store'}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">
                        ${order.platform === 'cdek' ? order.trackingNumber : 'Заказ #' + order.orderNumber}
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
                    ${this.getStatusConfig(order).text}
                </div>
            </div>
        `).join('');
    }

    updateBadges() {
        const ordersBadge = document.getElementById('nav-badge-orders');
        const newOrdersCount = this.orders.all.filter(order => order.status === 'new').length;
        
        if (ordersBadge) {
            ordersBadge.textContent = newOrdersCount > 99 ? '99+' : newOrdersCount;
            ordersBadge.style.display = newOrdersCount > 0 ? 'flex' : 'none';
        }

        const notificationBadge = document.getElementById('notification-badge');
        if (notificationBadge) {
            const problemOrders = this.orders.all.filter(order => order.status === 'problem').length;
            notificationBadge.textContent = problemOrders > 99 ? '99+' : problemOrders;
            notificationBadge.style.display = problemOrders > 0 ? 'flex' : 'none';
        }
    }

    getStatusConfig(order) {
        const statusMap = {
            'new': { text: 'Новый', color: '#3498db', icon: 'clock' },
            'processing': { text: 'В обработке', color: '#f39c12', icon: 'sync' },
            'active': { text: 'Активный', color: '#9b59b6', icon: 'shipping-fast' },
            'delivered': { text: 'Доставлен', color: '#27ae60', icon: 'check' },
            'problem': { text: 'Проблема', color: '#e74c3c', icon: 'exclamation-triangle' },
            'cancelled': { text: 'Отменен', color: '#95a5a6', icon: 'times' }
        };
        
        return statusMap[order.status] || statusMap.new;
    }

    getOrderById(platform, orderId) {
        const orders = platform === 'all' ? this.orders.all : this.orders[platform];
        return orders.find(order => order.id === orderId);
    }

    // Навигация по разделам
    showSection(section, platform = null) {
        // Скрываем все секции
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Скрываем все активные элементы навигации
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Показываем выбранную секцию
        const targetSection = document.getElementById(section + '-section');
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Активируем соответствующий элемент навигации
        const navItem = document.querySelector(`.nav-item[onclick*="${section}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Загружаем контент секции
        this.loadSectionContent(section, platform);
    }

    loadSectionContent(section, platform = null) {
        switch (section) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'orders':
                if (this.components.orders) {
                    this.components.orders.render(platform);
                }
                break;
            case 'analytics':
                if (this.components.analytics) {
                    this.components.analytics.render();
                }
                break;
            case 'settings':
                if (this.components.settings) {
                    this.components.settings.render();
                }
                break;
        }
    }

    showOrderDetails(platform, orderId) {
        const order = this.getOrderById(platform, orderId);
        if (order) {
            this.showNotification(`Детали заказа: ${order.platform === 'cdek' ? order.trackingNumber : '#' + order.orderNumber}`, 'info');
            // Здесь можно открыть модальное окно с деталями
        }
    }

    // Управление синхронизацией
    startAutoSync() {
        if (this.config.SETTINGS?.AUTO_SYNC) {
            this.syncInterval = setInterval(() => {
                this.manualSync();
            }, 5 * 60 * 1000); // 5 минут
        }
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
    }

    async manualSync() {
        this.updateSyncStatus('syncing', 'Синхронизация...');
        
        try {
            await this.loadOrders();
            await this.loadAnalytics();
            this.updateDashboard();
            this.updateSyncStatus('success', 'Данные обновлены');
            this.showNotification('Данные успешно синхронизированы', 'success');
        } catch (error) {
            console.error('Sync error:', error);
            this.updateSyncStatus('error', 'Ошибка синхронизации');
            this.showNotification('Ошибка синхронизации', 'error');
        }
    }

    updateSyncStatus(status, message) {
        const indicator = document.getElementById('sync-indicator');
        const text = document.getElementById('sync-text');
        
        if (indicator && text) {
            indicator.className = 'sync-indicator';
            indicator.classList.add(status);
            text.textContent = message;
        }
    }

    // Утилиты UI
    showLoading(message = 'Загрузка...') {
        const overlay = document.getElementById('loading-overlay');
        const messageEl = document.getElementById('loading-message');
        
        if (overlay && messageEl) {
            messageEl.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        if (window.notifications) {
            window.notifications.show(message, type, duration);
        } else {
            // Fallback для браузера
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    showNotifications() {
        const problemOrders = this.orders.all.filter(order => order.status === 'problem');
        if (problemOrders.length > 0) {
            this.showNotification(`Есть ${problemOrders.length} проблемных заказов`, 'warning');
        } else {
            this.showNotification('Нет новых уведомлений', 'info');
        }
    }

    // Демо данные
    generateDemoCDEKOrders() {
        return [
            {
                id: 'cdek-demo-1',
                platform: 'cdek',
                trackingNumber: 'CDEK123456789',
                status: 'active',
                fromCity: 'Москва',
                toCity: 'Санкт-Петербург',
                weight: 2.5,
                cost: 1500,
                sender: 'ООО "ТЕХНО ЭДЕМ"',
                recipient: 'Иван Иванов',
                createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                id: 'cdek-demo-2',
                platform: 'cdek',
                trackingNumber: 'CDEK987654321',
                status: 'delivered',
                fromCity: 'Москва',
                toCity: 'Екатеринбург',
                weight: 1.8,
                cost: 1200,
                sender: 'ООО "ТЕХНО ЭДЕМ"',
                recipient: 'Мария Петрова',
                createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                deliveredDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    generateDemoMegamarketOrders() {
        return [
            {
                id: 'mm-demo-1',
                platform: 'megamarket',
                orderNumber: 'MM100001',
                status: 'new',
                totalAmount: 15499,
                itemsTotal: 14999,
                deliveryCost: 0,
                discount: 500,
                customerName: 'Алексей Смирнов',
                customerPhone: '+7 912 345-67-89',
                deliveryAddress: 'г. Москва, ул. Примерная, д. 1',
                createdDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        id: 'item-1',
                        name: 'Смартфон Example Pro',
                        quantity: 1,
                        price: 14999,
                        total: 14999
                    }
                ]
            },
            {
                id: 'mm-demo-2',
                platform: 'megamarket',
                orderNumber: 'MM100002',
                status: 'processing',
                totalAmount: 27999,
                itemsTotal: 27499,
                deliveryCost: 0,
                discount: 500,
                customerName: 'Елена Козлова',
                customerPhone: '+7 923 456-78-90',
                deliveryAddress: 'г. Санкт-Петербург, пр. Тестовый, д. 15',
                createdDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        id: 'item-2',
                        name: 'Планшет Example Tab',
                        quantity: 1,
                        price: 27499,
                        total: 27499
                    }
                ]
            }
        ];
    }

    useDemoData() {
        console.warn('Using demo data');
        this.orders.cdek = this.generateDemoCDEKOrders();
        this.orders.megamarket = this.generateDemoMegamarketOrders();
        this.orders.all = [...this.orders.cdek, ...this.orders.megamarket];
        this.loadAnalytics();
        this.updateDashboard();
    }
}

// Инициализация приложения когда DOM загружен
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TexnoEdemApp();
    window.app = app; // Делаем глобально доступным
});

// Обработка ошибок
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (app) {
        app.showNotification('Произошла ошибка в приложении', 'error');
    }
});
