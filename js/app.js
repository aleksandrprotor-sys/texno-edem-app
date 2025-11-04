// app.js - ПОЛНОЦЕННАЯ ВЕРСИЯ ДЛЯ TEXNO EDEM BUSINESS INTELLIGENCE
class TexnoEdemApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPlatform = null;
        this.orders = [];
        this.analyticsData = null;
        this.settings = {};
        this.isLoading = false;
        
        this.components = {
            orders: null,
            analytics: null,
            settings: null,
            modal: null
        };

        this.init();
    }

    async init() {
        console.log('🚀 TEXNO EDEM Business Intelligence App инициализирован');
        
        try {
            // Инициализация Telegram WebApp
            await this.initTelegram();
            
            // Загрузка конфигурации
            await this.loadConfig();
            
            // Настройка обработчиков событий
            this.setupEventListeners();
            
            // Инициализация компонентов
            await this.initComponents();
            
            // Загрузка начальных данных
            await this.loadInitialData();
            
            // Показ начального раздела
            this.showSection('dashboard');
            
            console.log('✅ Приложение успешно инициализировано');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации приложения:', error);
            this.showNotification('Ошибка инициализации приложения', 'error');
        }
    }

    async initTelegram() {
        if (window.Telegram && Telegram.WebApp) {
            this.tg = Telegram.WebApp;
            
            // Расширяем на весь экран
            this.tg.expand();
            
            // Настройка темы Telegram
            this.applyTelegramTheme();
            
            // Инициализация BackButton
            this.tg.BackButton.onClick(() => {
                this.handleBackButton();
            });
            
            // Показываем основную кнопку
            this.tg.MainButton.setText('ГЛАВНАЯ');
            this.tg.MainButton.onClick(() => {
                this.showSection('dashboard');
            });
            
            console.log('✅ Telegram WebApp инициализирован');
        } else {
            console.log('ℹ️ Telegram WebApp не обнаружен, работаем в standalone режиме');
        }
    }

    applyTelegramTheme() {
        if (!this.tg) return;
        
        document.body.classList.add('tg-webapp');
        
        // Применяем тему Telegram
        if (this.tg.colorScheme === 'dark') {
            document.body.classList.add('tg-theme-dark');
        }
        
        // Устанавливаем цвета из Telegram
        const themeParams = this.tg.themeParams;
        if (themeParams) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#999999');
            document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#2481cc');
            document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#2481cc');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
        }
    }

    async loadConfig() {
        try {
            // Загрузка конфигурации из localStorage или использование значений по умолчанию
            const savedConfig = localStorage.getItem('texno_edem_config');
            this.config = savedConfig ? JSON.parse(savedConfig) : {
                api: {
                    cdek: { enabled: true, apiKey: '' },
                    megamarket: { enabled: true, apiKey: '' }
                },
                sync: {
                    autoSync: true,
                    syncInterval: 300000 // 5 минут
                },
                notifications: {
                    enabled: true,
                    sound: true,
                    vibration: true
                },
                theme: 'auto'
            };
            
            console.log('✅ Конфигурация загружена');
        } catch (error) {
            console.error('Ошибка загрузки конфигурации:', error);
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            api: {
                cdek: { enabled: true, apiKey: '' },
                megamarket: { enabled: true, apiKey: '' }
            },
            sync: {
                autoSync: true,
                syncInterval: 300000
            },
            notifications: {
                enabled: true,
                sound: true,
                vibration: true
            },
            theme: 'auto'
        };
    }

    setupEventListeners() {
        // Обработчики навигации
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                const section = this.getSectionFromNavItem(navItem);
                if (section) {
                    this.showSection(section);
                }
            }
        });

        // Обработчики для виджетов платформ
        document.querySelectorAll('.widget').forEach(widget => {
            widget.addEventListener('click', () => {
                const platform = widget.classList.contains('cdek-widget') ? 'cdek' : 'megamarket';
                this.showSection('orders', platform);
            });
        });

        // Обработчики для кнопок действий
        document.addEventListener('click', (e) => {
            if (e.target.closest('[onclick*="app.manualSync"]')) {
                this.manualSync();
            }
            if (e.target.closest('[onclick*="app.toggleTheme"]')) {
                this.toggleTheme();
            }
            if (e.target.closest('[onclick*="app.showNotifications"]')) {
                this.showNotifications();
            }
        });

        // Обработчики для фильтров
        document.addEventListener('change', (e) => {
            if (e.target.id === 'platform-filter' && this.components.orders) {
                this.components.orders.filterByPlatform(e.target.value);
            }
            if (e.target.id === 'status-filter' && this.components.orders) {
                this.components.orders.filterByStatus(e.target.value);
            }
            if (e.target.id === 'analytics-period' && this.components.analytics) {
                this.components.analytics.changePeriod(e.target.value);
            }
        });

        // Обработчик онлайн/офлайн статуса
        window.addEventListener('online', () => this.handleOnlineStatus());
        window.addEventListener('offline', () => this.handleOfflineStatus());

        console.log('✅ Обработчики событий настроены');
    }

    getSectionFromNavItem(navItem) {
        const onclick = navItem.getAttribute('onclick');
        const match = onclick?.match(/showSection\('([^']+)'/);
        return match ? match[1] : null;
    }

    async initComponents() {
        try {
            // Инициализация компонента заказов
            if (typeof OrdersComponent !== 'undefined') {
                this.components.orders = new OrdersComponent(this);
            } else {
                console.warn('OrdersComponent не найден');
            }

            // Инициализация компонента аналитики
            if (typeof AnalyticsComponent !== 'undefined') {
                this.components.analytics = new AnalyticsComponent(this);
            } else {
                console.warn('AnalyticsComponent не найден');
            }

            // Инициализация компонента настроек
            if (typeof SettingsComponent !== 'undefined') {
                this.components.settings = new SettingsComponent(this);
            } else {
                console.warn('SettingsComponent не найден');
            }

            // Инициализация компонента модальных окон
            if (typeof ModalComponent !== 'undefined') {
                this.components.modal = new ModalComponent(this);
            } else {
                console.warn('ModalComponent не найден');
            }
            
// Инициализация компонента уведомлений
        if (typeof NotificationsComponent !== 'undefined') {
            this.components.notifications = new NotificationsComponent(this);
        } else {
            console.warn('NotificationsComponent не найден');
        }

        // Инициализация менеджера синхронизации
        if (typeof SyncManager !== 'undefined') {
            this.syncManager = new SyncManager(this);
        } else {
            console.warn('SyncManager не найден');
        }

        console.log('✅ Все компоненты инициализированы');
    } catch (error) {
        console.error('Ошибка инициализации компонентов:', error);
    }
}

// Добавим методы для работы с новыми компонентами
getSyncManager() {
    return this.syncManager;
}

getNotificationsComponent() {
    return this.components.notifications;
}

// В метод manualSync() добавить использование SyncManager
async manualSync() {
    if (this.syncManager) {
        await this.syncManager.forceSync();
    } else {
        // Fallback реализация
        this.showLoading('Синхронизация данных...');
        await this.delay(2000);
        await this.loadDashboardData();
        await this.loadOrders();
        this.hideLoading();
        this.showNotification('Синхронизация завершена', 'success');
    }
}

    async loadInitialData() {
        this.showLoading('Загрузка начальных данных...');
        
        try {
            // Загрузка данных дашборда
            await this.loadDashboardData();
            
            // Загрузка заказов
            await this.loadOrders();
            
            // Загрузка аналитики
            await this.loadAnalytics();
            
            // Загрузка настроек
            await this.loadSettings();
            
            this.hideLoading();
            console.log('✅ Начальные данные загружены');
            
        } catch (error) {
            this.hideLoading();
            console.error('Ошибка загрузки начальных данных:', error);
            this.showNotification('Ошибка загрузки данных', 'error');
        }
    }

    async loadDashboardData() {
        try {
            // Имитация загрузки данных с API
            await this.delay(1000);
            
            const dashboardData = {
                quickStats: {
                    totalOrders: 247,
                    totalRevenue: 4589200,
                    successRate: 94.5,
                    problemOrders: 13
                },
                platformStats: {
                    cdek: { active: 23, delivered: 156, problems: 8 },
                    megamarket: { new: 12, processing: 34, delivered: 89, problems: 5 }
                },
                recentActivity: this.generateRecentActivity(10)
            };
            
            this.updateDashboardUI(dashboardData);
            
        } catch (error) {
            console.error('Ошибка загрузки данных дашборда:', error);
            throw error;
        }
    }

    updateDashboardUI(data) {
        // Обновление быстрой статистики
        this.updateQuickStats(data.quickStats);
        
        // Обновление виджетов платформ
        this.updatePlatformWidgets(data.platformStats);
        
        // Обновление последних активностей
        this.updateRecentActivity(data.recentActivity);
        
        // Обновление превью аналитики
        this.updateAnalyticsPreview();
    }

    updateQuickStats(stats) {
        const elements = {
            'total-orders': stats.totalOrders?.toString() || '0',
            'total-revenue': this.formatCurrency(stats.totalRevenue || 0),
            'success-rate': `${stats.successRate || 0}%`,
            'problem-orders': stats.problemOrders?.toString() || '0'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Обновление трендов
        this.updateTrendIndicators();
    }

    updateTrendIndicators() {
        // Имитация обновления трендов
        const trends = {
            'orders-change': { value: 12, positive: true },
            'revenue-change': { value: 8, positive: true },
            'success-change': { value: 3, positive: true },
            'problems-change': { value: 5, positive: false }
        };

        Object.entries(trends).forEach(([id, trend]) => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = `
                    <i class="fas fa-arrow-${trend.positive ? 'up' : 'down'}"></i>
                    ${Math.abs(trend.value)}%
                `;
                element.className = `stat-change ${trend.positive ? 'positive' : 'negative'}`;
            }
        });
    }

    updatePlatformWidgets(platformStats) {
        // Обновление CDEK виджета
        const cdekActive = document.getElementById('cdek-active');
        if (cdekActive) {
            cdekActive.textContent = platformStats.cdek?.active || 0;
        }

        // Обновление Мегамаркет виджета
        const megamarketNew = document.getElementById('megamarket-new');
        if (megamarketNew) {
            megamarketNew.textContent = platformStats.megamarket?.new || 0;
        }
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recent-orders-list');
        if (!container) return;

        if (activities && activities.length > 0) {
            container.innerHTML = activities.map(activity => `
                <div class="activity-item" onclick="app.showOrderDetails('${activity.id}')">
                    <div class="activity-icon platform-${activity.platform}">
                        <i class="fas ${activity.platform === 'cdek' ? 'fa-shipping-fast' : 'fa-store'}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-details">
                            <span class="status-badge status-${activity.status}">${this.getStatusText(activity.status)}</span>
                            <span class="activity-date">${this.formatDateTime(activity.date)}</span>
                        </div>
                    </div>
                    <div class="activity-amount">${activity.amount}</div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>Нет последних заказов</h3>
                    <p>Здесь будут отображаться ваши последние заказы</p>
                </div>
            `;
        }
    }

    updateAnalyticsPreview() {
        const container = document.getElementById('analytics-preview');
        if (!container) return;

        container.innerHTML = `
            <div class="metric-card">
                <div class="metric-header">
                    <h4>Эффективность доставки</h4>
                </div>
                <div class="metric-content">
                    <div class="success-metric">
                        <span>CDEK</span>
                        <div class="success-bar">
                            <div class="success-fill cdek" style="width: 92%">92%</div>
                        </div>
                    </div>
                    <div class="success-metric">
                        <span>Мегамаркет</span>
                        <div class="success-bar">
                            <div class="success-fill megamarket" style="width: 88%">88%</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-header">
                    <h4>Среднее время доставки</h4>
                </div>
                <div class="metric-content">
                    <div class="delivery-metric">
                        <span>CDEK</span>
                        <span class="metric-value">2.3 дн</span>
                    </div>
                    <div class="delivery-metric">
                        <span>Мегамаркет</span>
                        <span class="metric-value">4.1 дн</span>
                    </div>
                </div>
            </div>
        `;
    }

    async loadOrders() {
        try {
            this.showLoading('Загрузка заказов...');
            
            // Имитация загрузки заказов
            await this.delay(1500);
            
            // Генерация тестовых данных
            this.orders = [
                ...this.generateCDEKOrders(8),
                ...this.generateMegamarketOrders(12)
            ];
            
            console.log(`✅ Загружено ${this.orders.length} заказов`);
            
            // Обновление бейджа заказов
            this.updateOrdersBadge(this.orders.length);
            
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            this.showNotification('Ошибка загрузки заказов', 'error');
        } finally {
            this.hideLoading();
        }
    }

    generateCDEKOrders(count) {
        const orders = [];
        for (let i = 0; i < count; i++) {
            orders.push({
                id: `CDEK-${1000 + i}`,
                platform: 'cdek',
                orderNumber: `CDEK${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                status: ['new', 'processing', 'active', 'delivered', 'problem'][Math.floor(Math.random() * 5)],
                createdDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                amount: Math.floor(Math.random() * 50000) + 1000,
                customer: `Клиент ${i + 1}`,
                deliveryCity: ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург'][Math.floor(Math.random() * 4)],
                items: Math.floor(Math.random() * 5) + 1
            });
        }
        return orders;
    }

    generateMegamarketOrders(count) {
        const orders = [];
        for (let i = 0; i < count; i++) {
            orders.push({
                id: `MEGA-${2000 + i}`,
                platform: 'megamarket',
                orderNumber: `MM${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                status: ['new', 'processing', 'shipped', 'delivered', 'cancelled'][Math.floor(Math.random() * 5)],
                createdDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                amount: Math.floor(Math.random() * 80000) + 2000,
                customer: `Покупатель ${i + 1}`,
                deliveryCity: ['Москва', 'Казань', 'Ростов-на-Дону', 'Нижний Новгород'][Math.floor(Math.random() * 4)],
                items: Math.floor(Math.random() * 3) + 1
            });
        }
        return orders;
    }

    updateOrdersBadge(count) {
        const badge = document.getElementById('orders-badge');
        if (badge) {
            badge.textContent = count > 99 ? '99+' : count.toString();
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    async loadAnalytics() {
        try {
            // Имитация загрузки аналитики
            await this.delay(1000);
            
            this.analyticsData = {
                platformComparison: {
                    cdek: { orders: 156, revenue: 2450000, successRate: 92 },
                    megamarket: { orders: 234, revenue: 3890000, successRate: 88 }
                },
                monthlyTrends: this.generateMonthlyTrends(),
                performanceMetrics: {
                    overall: { successRate: 90, avgDeliveryTime: 3.2, customerSatisfaction: 4.5 },
                    cdek: { successRate: 92, avgDeliveryTime: 2.3, costEfficiency: 85 },
                    megamarket: { successRate: 88, avgDeliveryTime: 4.1, revenueGrowth: 23 }
                }
            };
            
            console.log('✅ Данные аналитики загружены');
            
        } catch (error) {
            console.error('Ошибка загрузки аналитики:', error);
        }
    }

    generateMonthlyTrends() {
        const months = [];
        const baseDate = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(baseDate);
            date.setMonth(date.getMonth() - i);
            months.push({
                month: date.toISOString().substr(0, 7),
                cdek: Math.floor(Math.random() * 50) + 30,
                megamarket: Math.floor(Math.random() * 80) + 40
            });
        }
        
        return months;
    }

    async loadSettings() {
        try {
            // Загрузка настроек из localStorage
            const savedSettings = localStorage.getItem('texno_edem_settings');
            this.settings = savedSettings ? JSON.parse(savedSettings) : {};
            
            // Применение настроек темы
            this.applyThemeSettings();
            
            console.log('✅ Настройки загружены');
            
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
        }
    }

    applyThemeSettings() {
        const theme = this.settings.theme || 'auto';
        
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (theme === 'light') {
            document.body.classList.remove('dark-theme');
        }
        // auto theme определяется системными настройками
    }

    // ОСНОВНЫЕ МЕТОДЫ ИНТЕРФЕЙСА

    showSection(section, platform = null) {
        console.log(`Переход к разделу: ${section}`, platform ? `платформа: ${platform}` : '');
        
        // Скрываем все секции
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Убираем активный класс у всех пунктов навигации
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Показываем выбранную секцию
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Активируем соответствующий пункт навигации
            const navItem = document.querySelector(`.nav-item[onclick*="showSection('${section}')"]`);
            if (navItem) {
                navItem.classList.add('active');
            }

            // Обновляем заголовок если указана платформа
            if (platform && section === 'orders') {
                this.currentPlatform = platform;
                this.updateOrdersHeader(platform);
            }

            // Загружаем данные для секции
            this.loadSectionData(section, platform);
            
            // Показываем/скрываем кнопку назад в Telegram
            this.updateTelegramBackButton(section);
        }

        this.currentSection = section;
    }

    updateOrdersHeader(platform) {
        const title = document.getElementById('orders-title');
        const subtitle = document.getElementById('orders-subtitle');
        
        if (title && subtitle) {
            const platformNames = {
                cdek: 'CDEK',
                megamarket: 'Мегамаркет'
            };
            
            title.textContent = `Заказы - ${platformNames[platform] || platform}`;
            subtitle.textContent = `Управление заказами ${platformNames[platform] || platform}`;
        }
    }

    updateTelegramBackButton(section) {
        if (!this.tg) return;
        
        if (section !== 'dashboard') {
            this.tg.BackButton.show();
        } else {
            this.tg.BackButton.hide();
        }
    }

    handleBackButton() {
        if (this.currentSection !== 'dashboard') {
            this.showSection('dashboard');
        } else if (this.tg) {
            this.tg.close();
        }
    }

    async loadSectionData(section, platform = null) {
        console.log(`Загрузка данных для раздела: ${section}`);
        
        switch(section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'orders':
                await this.loadOrdersData(platform);
                break;
            case 'analytics':
                await this.loadAnalyticsData();
                break;
            case 'settings':
                await this.loadSettingsData();
                break;
        }
    }

    async loadOrdersData(platform = null) {
        if (this.components.orders) {
            await this.components.orders.load(platform);
        }
    }

    async loadAnalyticsData() {
        if (this.components.analytics) {
            await this.components.analytics.load();
        }
    }

    async loadSettingsData() {
        if (this.components.settings) {
            await this.components.settings.load();
        }
    }

    async manualSync() {
        this.showLoading('Синхронизация данных...');
        
        try {
            // Имитация синхронизации
            await this.delay(2000);
            
            // Обновление статуса синхронизации
            this.updateSyncStatus('success', 'Данные обновлены');
            
            // Перезагрузка данных
            await this.loadDashboardData();
            await this.loadOrders();
            
            this.showNotification('Синхронизация завершена успешно', 'success');
            
        } catch (error) {
            this.updateSyncStatus('error', 'Ошибка синхронизации');
            this.showNotification('Ошибка синхронизации', 'error');
            console.error('Ошибка синхронизации:', error);
        } finally {
            this.hideLoading();
        }
    }

    updateSyncStatus(status, message = '') {
        const statusElement = document.getElementById('sync-status');
        if (!statusElement) return;

        const statusConfig = {
            'idle': { class: '', icon: 'fa-check-circle', color: 'var(--success)' },
            'syncing': { class: 'syncing', icon: 'fa-sync-alt fa-spin', color: 'var(--warning)' },
            'success': { class: 'success', icon: 'fa-check-circle', color: 'var(--success)' },
            'error': { class: 'error', icon: 'fa-exclamation-circle', color: 'var(--danger)' }
        };

        const config = statusConfig[status] || statusConfig.idle;
        
        statusElement.innerHTML = `
            <i class="fas ${config.icon}"></i>
            <span>${message}</span>
        `;
        statusElement.className = `sync-status ${config.class}`;
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        const icon = document.getElementById('theme-icon');
        
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        // Сохранение настройки темы
        this.settings.theme = isDark ? 'dark' : 'light';
        this.saveSettings();
        
        this.showNotification(isDark ? 'Темная тема включена' : 'Светлая тема включена', 'success');
    }

    showNotifications() {
        // Временная реализация - можно расширить полноценным компонентом уведомлений
        this.showNotification('У вас нет новых уведомлений', 'info');
    }

    showOrderDetails(orderId) {
        if (this.components.modal) {
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                this.components.modal.showOrderDetails(order);
            }
        } else {
            this.showNotification('Детали заказа: ' + orderId, 'info');
        }
    }

    // УТИЛИТЫ

    showLoading(message = 'Загрузка...') {
        this.isLoading = true;
        const overlay = document.getElementById('loading-overlay');
        const messageEl = document.getElementById('loading-message');
        
        if (overlay) overlay.classList.add('active');
        if (messageEl) messageEl.textContent = message;
    }

    hideLoading() {
        this.isLoading = false;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.remove('active');
    }

    showNotification(message, type = 'info') {
        console.log(`Уведомление [${type}]: ${message}`);
        
        // Создаем временное уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое скрытие
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'fa-info-circle',
            'success': 'fa-check-circle',
            'warning': 'fa-exclamation-triangle',
            'error': 'fa-exclamation-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    formatCurrency(amount, currency = 'RUB') {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDateTime(date) {
        return new Intl.DateTimeFormat('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
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

    generateRecentActivity(count) {
        const activities = [];
        const platforms = ['cdek', 'megamarket'];
        const statuses = ['new', 'processing', 'active', 'delivered', 'problem'];
        
        for (let i = 0; i < count; i++) {
            const platform = platforms[Math.floor(Math.random() * platforms.length)];
            activities.push({
                id: `${platform.toUpperCase()}-${1000 + i}`,
                platform: platform,
                title: platform === 'cdek' ? 'Доставка товаров' : 'Новый заказ',
                description: platform === 'cdek' ? 'Электроника - 3 товара' : 'Смартфоны - 2 шт',
                status: statuses[Math.floor(Math.random() * statuses.length)],
                amount: this.formatCurrency(Math.floor(Math.random() * 50000) + 1000),
                date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        
        return activities;
    }

    handleOnlineStatus() {
        this.showNotification('Соединение восстановлено', 'success');
        this.updateSyncStatus('success', 'Онлайн');
    }

    handleOfflineStatus() {
        this.showNotification('Отсутствует интернет-соединение', 'warning');
        this.updateSyncStatus('error', 'Офлайн');
    }

    async saveSettings() {
        try {
            localStorage.setItem('texno_edem_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ПУБЛИЧНЫЕ МЕТОДЫ ДЛЯ ГЛОБАЛЬНОГО ДОСТУПА

    getOrders() {
        return this.orders;
    }

    getAnalyticsData() {
        return this.analyticsData;
    }

    getConfig() {
        return this.config;
    }

    getSettings() {
        return this.settings;
    }
}

// ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ

let app;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        app = new TexnoEdemApp();
        window.app = app;
        
        console.log('🌐 TEXNO EDEM Business Intelligence запущен');
        
    } catch (error) {
        console.error('Критическая ошибка инициализации:', error);
        
        // Fallback для отображения базового интерфейса
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; font-family: sans-serif;">
                <h1>😕 TEXNO EDEM</h1>
                <p>Произошла ошибка при загрузке приложения</p>
                <button onclick="location.reload()">Перезагрузить</button>
            </div>
        `;
    }
});

// ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК

window.addEventListener('error', function(e) {
    console.error('Глобальная ошибка:', e.error);
    
    if (app) {
        app.showNotification('Произошла непредвиденная ошибка', 'error');
    }
});

// ОБРАБОТЧИКИ ДЛЯ HTML АТРИБУТОВ

window.showSection = function(section, platform) {
    if (app) {
        app.showSection(section, platform);
    }
};

window.toggleTheme = function() {
    if (app) {
        app.toggleTheme();
    }
};

window.manualSync = function() {
    if (app) {
        app.manualSync();
    }
};

// Fallback для совместимости
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TexnoEdemApp;
}
