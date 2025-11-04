class TexnoEdemApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPlatform = 'all';
        this.orders = [];
        this.analytics = null;
        this.settings = {};
        this.isLoading = false;
        
        // Инициализация компонентов
        this.analyticsComponent = new AnalyticsComponent(this);
        this.ordersComponent = new OrdersComponent(this);
        this.modalComponent = new ModalComponent();
        this.settingsComponent = new SettingsComponent(this);
        
        this.init();
    }

    async init() {
        console.log('🚀 TEXNO EDEM App Initializing...');
        
        // Инициализация Telegram Web App
        if (window.Telegram && Telegram.WebApp) {
            this.initTelegram();
        }
        
        // Загрузка настроек
        this.settings = StorageManager.loadSettings();
        
        // Инициализация UI
        this.initUI();
        
        // Загрузка данных
        await this.loadInitialData();
        
        // Запуск автообновления
        this.startAutoSync();
        
        console.log('✅ TEXNO EDEM App Ready');
    }

    initTelegram() {
        try {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            Telegram.WebApp.enableClosingConfirmation();
            
            // Установка темы Telegram
            if (Telegram.WebApp.colorScheme === 'dark') {
                document.body.classList.add('dark-theme');
                document.getElementById('theme-icon').className = 'fas fa-sun';
            }
            
            console.log('✅ Telegram Web App initialized');
        } catch (error) {
            console.warn('⚠️ Telegram Web App not available:', error);
        }
    }

    initUI() {
        this.updateNavigation();
        this.bindEvents();
        this.applyTheme();
    }

    bindEvents() {
        // Обработчики клавиш
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.showSection('dashboard');
                        break;
                    case '2':
                        e.preventDefault();
                        this.showSection('orders');
                        break;
                    case '3':
                        e.preventDefault();
                        this.showSection('analytics');
                        break;
                    case '4':
                        e.preventDefault();
                        this.showSection('settings');
                        break;
                    case 'r':
                        e.preventDefault();
                        this.manualSync();
                        break;
                }
            }
        });

        // Обработчики свайпов для мобильных устройств
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        });
    }

    handleSwipe(startX, endX) {
        const swipeThreshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Свайп влево - следующая секция
                this.nextSection();
            } else {
                // Свайп вправо - предыдущая секция
                this.prevSection();
            }
        }
    }

    nextSection() {
        const sections = ['dashboard', 'orders', 'analytics', 'settings'];
        const currentIndex = sections.indexOf(this.currentSection);
        const nextIndex = (currentIndex + 1) % sections.length;
        this.showSection(sections[nextIndex]);
    }

    prevSection() {
        const sections = ['dashboard', 'orders', 'analytics', 'settings'];
        const currentIndex = sections.indexOf(this.currentSection);
        const prevIndex = (currentIndex - 1 + sections.length) % sections.length;
        this.showSection(sections[prevIndex]);
    }

    async loadInitialData() {
        await this.showLoading('Загрузка данных...');
        
        try {
            // Загрузка заказов
            await this.loadOrders();
            
            // Загрузка аналитики
            await this.loadAnalytics();
            
            // Обновление UI
            this.updateDashboard();
            this.updateNavigationBadges();
            
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            Notifications.show('Ошибка загрузки данных', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadOrders() {
        try {
            // Загрузка из localStorage или генерация mock данных
            const savedOrders = StorageManager.loadData('orders');
            
            if (savedOrders && savedOrders.length > 0) {
                this.orders = savedOrders;
            } else {
                // Генерация mock данных
                const cdekOrders = mockDataGenerator.generateCDEKOrders(15);
                const megamarketOrders = mockDataGenerator.generateMegamarketOrders(20);
                this.orders = [...cdekOrders, ...megamarketOrders];
                StorageManager.saveData('orders', this.orders);
            }
            
            console.log(`✅ Loaded ${this.orders.length} orders`);
            return this.orders;
        } catch (error) {
            console.error('❌ Error loading orders:', error);
            throw error;
        }
    }

    async loadAnalytics() {
        try {
            const savedAnalytics = StorageManager.loadData('analytics');
            
            if (savedAnalytics) {
                this.analytics = savedAnalytics;
            } else {
                this.analytics = mockDataGenerator.generateAnalyticsData();
                StorageManager.saveData('analytics', this.analytics);
            }
            
            console.log('✅ Analytics data loaded');
            return this.analytics;
        } catch (error) {
            console.error('❌ Error loading analytics:', error);
            throw error;
        }
    }

    showSection(section, platform = null) {
        // Скрыть все секции
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Обновить навигацию
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Показать выбранную секцию
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            sectionElement.classList.add('active');
            
            // Активировать соответствующий пункт навигации
            const navItem = document.querySelector(`.nav-item[onclick*="${section}"]`);
            if (navItem) {
                navItem.classList.add('active');
            }
            
            this.currentSection = section;
            
            // Загрузить контент секции
            this.loadSectionContent(section, platform);
            
            // Прокрутка вверх
            window.scrollTo(0, 0);
            
            console.log(`📍 Section changed: ${section}`);
        }
    }

    loadSectionContent(section, platform = null) {
        switch(section) {
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

    updateDashboard() {
        this.updateQuickStats();
        this.updatePlatformWidgets();
        this.updateAnalyticsPreview();
        this.updateRecentOrders();
    }

    updateQuickStats() {
        const stats = this.calculateQuickStats();
        
        // Обновление DOM элементов
        document.getElementById('total-orders').textContent = stats.totalOrders.toLocaleString();
        document.getElementById('total-revenue').textContent = Formatters.formatCurrency(stats.totalRevenue);
        document.getElementById('success-rate').textContent = `${stats.successRate}%`;
        document.getElementById('problem-orders').textContent = stats.problemOrders;
        
        // Обновление изменений
        this.updateChangeIndicator('orders-change', stats.ordersChange);
        this.updateChangeIndicator('revenue-change', stats.revenueChange);
        this.updateChangeIndicator('success-change', stats.successRateChange);
        this.updateChangeIndicator('problems-change', -stats.problemOrdersChange);
    }

    calculateQuickStats() {
        const cdekOrders = this.orders.filter(o => o.platform === 'cdek');
        const megamarketOrders = this.orders.filter(o => o.platform === 'megamarket');
        
        const totalOrders = this.orders.length;
        const deliveredOrders = this.orders.filter(o => 
            o.status === 'delivered' || o.statusCode === 'DELIVERED'
        ).length;
        
        const successRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
        
        const totalRevenue = this.orders.reduce((sum, order) => {
            if (order.platform === 'cdek') {
                return sum + (order.cost || 0);
            } else {
                return sum + (order.totalAmount || 0);
            }
        }, 0);
        
        const problemOrders = this.orders.filter(o => 
            o.status === 'problem' || o.status === 'cancelled' || o.statusCode === 'PROBLEM' || o.statusCode === 'CANCELLED'
        ).length;
        
        return {
            totalOrders,
            totalRevenue,
            successRate,
            problemOrders,
            ordersChange: 12, // Mock данные
            revenueChange: 8,
            successRateChange: 3,
            problemOrdersChange: -5
        };
    }

    updateChangeIndicator(elementId, change) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
        element.innerHTML = `<i class="fas fa-arrow-${change >= 0 ? 'up' : 'down'}"></i> ${Math.abs(change)}%`;
    }

    updatePlatformWidgets() {
        const cdekActive = this.orders.filter(o => 
            o.platform === 'cdek' && 
            !['delivered', 'cancelled'].includes(o.status)
        ).length;
        
        const megamarketNew = this.orders.filter(o => 
            o.platform === 'megamarket' && 
            o.status === 'new'
        ).length;
        
        document.getElementById('cdek-active').textContent = cdekActive;
        document.getElementById('megamarket-new').textContent = megamarketNew;
    }

    updateAnalyticsPreview() {
        const container = document.getElementById('analytics-preview');
        if (!container) return;
        
        if (!this.analytics) {
            container.innerHTML = '<div class="empty-state">Данные аналитики не загружены</div>';
            return;
        }
        
        const { platformComparison, trends } = this.analytics;
        
        container.innerHTML = `
            <div class="metric-card">
                <div class="metric-header">
                    <h4>Сравнение платформ</h4>
                </div>
                <div class="metric-content">
                    <div class="platform-metric">
                        <span class="platform-name cdek">CDEK</span>
                        <span class="platform-value">${platformComparison.cdek.orders} заказов</span>
                    </div>
                    <div class="platform-metric">
                        <span class="platform-name megamarket">Мегамаркет</span>
                        <span class="platform-value">${platformComparison.megamarket.orders} заказов</span>
                    </div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-header">
                    <h4>Среднее время доставки</h4>
                </div>
                <div class="metric-content">
                    <div class="delivery-metric">
                        <span>CDEK:</span>
                        <span class="metric-value">${platformComparison.cdek.deliveryTime} дн.</span>
                    </div>
                    <div class="delivery-metric">
                        <span>Мегамаркет:</span>
                        <span class="metric-value">${platformComparison.megamarket.deliveryTime} дн.</span>
                    </div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-header">
                    <h4>Успешность доставки</h4>
                </div>
                <div class="metric-content">
                    <div class="success-metric">
                        <div class="success-bar">
                            <div class="success-fill cdek" style="width: ${platformComparison.cdek.successRate}%">
                                <span>CDEK: ${platformComparison.cdek.successRate}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="success-metric">
                        <div class="success-bar">
                            <div class="success-fill megamarket" style="width: ${platformComparison.megamarket.successRate}%">
                                <span>Мегамаркет: ${platformComparison.megamarket.successRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateRecentOrders() {
        const container = document.getElementById('recent-orders-list');
        if (!container) return;
        
        const recentOrders = this.orders
            .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
            .slice(0, 5);
        
        if (recentOrders.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет recent заказов</div>';
            return;
        }
        
        container.innerHTML = recentOrders.map(order => `
            <div class="activity-item" onclick="app.ordersComponent.showOrderDetails('${order.id}')">
                <div class="activity-icon ${order.platform}">
                    <i class="fas ${order.platform === 'cdek' ? 'fa-shipping-fast' : 'fa-store'}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">
                        ${order.platform === 'cdek' ? order.trackingNumber : order.orderNumber}
                    </div>
                    <div class="activity-details">
                        <span class="status-badge status-${order.status}">${this.getStatusText(order.status)}</span>
                        <span class="activity-date">${Formatters.formatDate(order.createdDate)}</span>
                    </div>
                </div>
                <div class="activity-amount">
                    ${Formatters.formatCurrency(order.platform === 'cdek' ? order.cost : order.totalAmount)}
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'new': 'Новый',
            'processing': 'В обработке',
            'active': 'Активный',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'problem': 'Проблема',
            'cancelled': 'Отменен'
        };
        return statusMap[status] || status;
    }

    updateNavigationBadges() {
        const newOrders = this.orders.filter(o => o.status === 'new').length;
        const badge = document.getElementById('orders-badge');
        
        if (badge) {
            badge.textContent = newOrders > 0 ? newOrders : '0';
            badge.style.display = newOrders > 0 ? 'flex' : 'none';
        }
        
        // Обновление бейджа уведомлений
        const notificationBadge = document.getElementById('notification-badge');
        if (notificationBadge) {
            const notifications = StorageManager.loadData('notifications') || [];
            const unreadCount = notifications.filter(n => !n.read).length;
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    updateNavigation() {
        // Навигация уже встроена в HTML
        this.updateNavigationBadges();
    }

    async manualSync() {
        await this.showLoading('Синхронизация данных...');
        
        try {
            // Имитация синхронизации
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Обновление данных
            await this.loadOrders();
            await this.loadAnalytics();
            
            // Обновление UI
            this.updateDashboard();
            this.updateNavigationBadges();
            
            if (this.currentSection === 'orders') {
                this.ordersComponent.render(this.currentPlatform);
            } else if (this.currentSection === 'analytics') {
                this.analyticsComponent.render();
            }
            
            Notifications.show('Данные успешно обновлены', 'success');
            
            // Обновление статуса синхронизации
            this.updateSyncStatus('success');
            
        } catch (error) {
            console.error('❌ Sync error:', error);
            Notifications.show('Ошибка синхронизации', 'error');
            this.updateSyncStatus('error');
        } finally {
            this.hideLoading();
        }
    }

    updateSyncStatus(status) {
        const syncElement = document.getElementById('sync-status');
        if (!syncElement) return;
        
        const icon = syncElement.querySelector('i');
        const text = syncElement.querySelector('span');
        
        switch(status) {
            case 'success':
                icon.className = 'fas fa-check-circle';
                text.textContent = 'Данные актуальны';
                syncElement.className = 'sync-status success';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-circle';
                text.textContent = 'Ошибка синхронизации';
                syncElement.className = 'sync-status error';
                break;
            case 'syncing':
                icon.className = 'fas fa-sync-alt fa-spin';
                text.textContent = 'Синхронизация...';
                syncElement.className = 'sync-status syncing';
                break;
        }
    }

    startAutoSync() {
        // Автосинхронизация каждые 5 минут
        setInterval(() => {
            if (this.settings.autoSync !== false) {
                this.manualSync();
            }
        }, 5 * 60 * 1000);
    }

    async showLoading(message = 'Загрузка...') {
        this.isLoading = true;
        const overlay = document.getElementById('loading-overlay');
        const messageElement = document.getElementById('loading-message');
        
        if (overlay && messageElement) {
            messageElement.textContent = message;
            overlay.style.display = 'flex';
            
            // Анимация появления
            setTimeout(() => overlay.classList.add('active'), 10);
        }
    }

    hideLoading() {
        this.isLoading = false;
        const overlay = document.getElementById('loading-overlay');
        
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }

    toggleTheme() {
        const body = document.body;
        const themeIcon = document.getElementById('theme-icon');
        
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            themeIcon.className = 'fas fa-moon';
            StorageManager.saveData('theme', 'light');
        } else {
            body.classList.add('dark-theme');
            themeIcon.className = 'fas fa-sun';
            StorageManager.saveData('theme', 'dark');
        }
    }

    applyTheme() {
        const savedTheme = StorageManager.loadData('theme') || 'light';
        const themeIcon = document.getElementById('theme-icon');
        
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            if (themeIcon) themeIcon.className = 'fas fa-sun';
        } else {
            document.body.classList.remove('dark-theme');
            if (themeIcon) themeIcon.className = 'fas fa-moon';
        }
    }

    showNotifications() {
        this.modalComponent.showNotifications();
    }

    // Экстренный режим
    enableEmergencyMode() {
        document.body.classList.add('emergency-mode');
        Notifications.show('Включен экстренный режим', 'warning');
    }

    disableEmergencyMode() {
        document.body.classList.remove('emergency-mode');
        Notifications.show('Экстренный режим отключен', 'success');
    }
}

// Глобальный экземпляр приложения
let app;

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    app = new TexnoEdemApp();
});

// Обработка ошибок
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    Notifications.show('Произошла ошибка в приложении', 'error');
});

// Обработка обещаний без catch
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    Notifications.show('Ошибка в асинхронной операции', 'error');
});
