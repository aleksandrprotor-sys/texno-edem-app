class TexnoEdemApp {
    constructor() {
        this.megamarketService = null;
        this.cdekService = null;
        this.ordersComponent = null;
        this.analyticsComponent = null;
        this.currentView = 'dashboard';
        this.isInitialized = false;
        this.config = null;
    }

    async init() {
        try {
            this.showLoadingScreen();
            
            await this.loadConfig();
            await this.initializeServices();
            await this.setupTelegramApp();
            this.setupNavigation();
            this.setupGlobalEventListeners();
            
            await this.showDashboard();
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            
            console.log('TexnoEdemApp initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showErrorScreen('Ошибка инициализации приложения');
        }
    }

    async loadConfig() {
        try {
            // Пробуем загрузить конфиг из файла
            const response = await fetch('./js/config.json');
            this.config = await response.json();
        } catch (error) {
            console.warn('Failed to load config file, using defaults');
            // Конфиг по умолчанию
            this.config = {
                megamarket: {
                    apiKey: 'demo-key',
                    baseUrl: 'https://api.megamarket.ru'
                },
                cdek: {
                    apiKey: 'demo-cdek-key',
                    baseUrl: 'https://api.cdek.ru'
                },
                app: {
                    name: 'TexnoEdem App',
                    version: '1.0.0',
                    theme: 'light'
                }
            };
        }

        // Проверяем наличие конфигурации в localStorage
        const savedConfig = localStorage.getItem('texnoEdemConfig');
        if (savedConfig) {
            const userConfig = JSON.parse(savedConfig);
            this.config = { ...this.config, ...userConfig };
        }
    }

    async initializeServices() {
        try {
            // Инициализация сервиса Megamarket
            this.megamarketService = new MegamarketService(
                this.config.megamarket.apiKey,
                this.config.megamarket.baseUrl
            );

            // Инициализация сервиса CDEK
            this.cdekService = new CdekService(
                this.config.cdek.apiKey,
                this.config.cdek.baseUrl
            );

            // Проверяем подключение к API
            await this.testServicesConnection();
            
            // Инициализация компонентов
            this.ordersComponent = new OrdersComponent(this.megamarketService);
            this.analyticsComponent = new AnalyticsComponent(this.megamarketService, this.cdekService);

            // Глобальные ссылки для обработчиков событий
            window.ordersComponent = this.ordersComponent;
            window.analyticsComponent = this.analyticsComponent;
            window.app = this;

        } catch (error) {
            console.error('Failed to initialize services:', error);
            throw new Error(`Service initialization failed: ${error.message}`);
        }
    }

    async testServicesConnection() {
        try {
            const results = await Promise.allSettled([
                this.megamarketService.testConnection(),
                this.cdekService.testConnection()
            ]);

            const megamarketResult = results[0];
            const cdekResult = results[1];

            if (megamarketResult.status === 'rejected') {
                console.warn('Megamarket service connection failed:', megamarketResult.reason);
            }

            if (cdekResult.status === 'rejected') {
                console.warn('CDEK service connection failed:', cdekResult.reason);
            }

            // Сохраняем статус подключения
            this.connectionStatus = {
                megamarket: megamarketResult.status === 'fulfilled',
                cdek: cdekResult.status === 'fulfilled'
            };

        } catch (error) {
            console.warn('Connection test failed:', error);
        }
    }

    async setupTelegramApp() {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            
            // Инициализация Telegram Mini Apps
            tg.ready();
            
            // Расширяем приложение на весь экран
            tg.expand();
            
            // Устанавливаем тему
            this.applyTelegramTheme(tg);
            
            // Настраиваем основную кнопку
            this.setupTelegramMainButton(tg);
            
            // Настраиваем кнопку назад
            this.setupTelegramBackButton(tg);
            
            // Сохраняем данные пользователя
            this.userData = tg.initDataUnsafe?.user;
            
            console.log('Telegram WebApp initialized for user:', this.userData);
        } else {
            console.log('Running in standalone mode (not in Telegram)');
        }
    }

    applyTelegramTheme(tg) {
        const theme = tg.colorScheme;
        document.documentElement.setAttribute('data-theme', theme);
        
        if (theme === 'dark') {
            document.body.classList.add('tg-theme-dark');
        } else {
            document.body.classList.add('tg-theme-light');
        }

        // Устанавливаем цвет фона
        tg.setBackgroundColor(tg.themeParams.bg_color || '#ffffff');
    }

    setupTelegramMainButton(tg) {
        this.tgMainButton = tg.MainButton;
        
        this.tgMainButton.setText('Обновить данные');
        this.tgMainButton.onClick(() => {
            this.refreshCurrentView();
        });
        
        this.updateTelegramMainButton();
    }

    setupTelegramBackButton(tg) {
        tg.BackButton.onClick(() => {
            if (this.currentView !== 'dashboard') {
                this.showDashboard();
            } else {
                tg.BackButton.hide();
            }
        });
    }

    updateTelegramMainButton() {
        if (!this.tgMainButton) return;

        const buttonConfigs = {
            'dashboard': { text: 'Обновить данные', show: true },
            'orders': { text: 'Обновить заказы', show: true },
            'analytics': { text: 'Обновить аналитику', show: true }
        };

        const config = buttonConfigs[this.currentView] || { show: false };
        
        if (config.show) {
            this.tgMainButton.setText(config.text);
            this.tgMainButton.show();
        } else {
            this.tgMainButton.hide();
        }
    }

    setupNavigation() {
        // Навигация для десктопной версии
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // Мобильная навигация
        this.setupMobileNavigation();
    }

    setupMobileNavigation() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileNav = document.getElementById('mobileNav');
        const mobileOverlay = document.getElementById('mobileOverlay');

        if (mobileMenuBtn && mobileNav) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileNav.classList.add('active');
                mobileOverlay.classList.add('active');
            });

            mobileOverlay.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                mobileOverlay.classList.remove('active');
            });

            // Обработчики для мобильных ссылок
            const mobileLinks = mobileNav.querySelectorAll('.nav-link');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileNav.classList.remove('active');
                    mobileOverlay.classList.remove('active');
                });
            });
        }
    }

    setupGlobalEventListeners() {
        // Глобальные горячие клавиши
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R - обновление
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refreshCurrentView();
            }
            
            // Escape - закрытие модальных окон
            if (e.key === 'Escape') {
                if (window.ModalComponent && ModalComponent.isVisible()) {
                    ModalComponent.hide();
                }
            }
        });

        // Обработчик изменения размера окна
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Обработчик видимости страницы
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                this.refreshCurrentView();
            }
        });
    }

    async switchView(view) {
        if (this.currentView === view) return;

        // Скрываем текущую view
        this.hideCurrentView();

        // Показываем новую view
        this.currentView = view;
        await this.showView(view);

        // Обновляем навигацию
        this.updateNavigation();

        // Обновляем Telegram кнопку
        this.updateTelegramMainButton();

        // Показываем кнопку "Назад" в Telegram если не на дашборде
        if (window.Telegram?.WebApp) {
            if (view !== 'dashboard') {
                window.Telegram.WebApp.BackButton.show();
            } else {
                window.Telegram.WebApp.BackButton.hide();
            }
        }

        // Отслеживание аналитики
        this.trackViewChange(view);
    }

    async showView(view) {
        const viewElement = document.getElementById(`${view}View`);
        if (!viewElement) {
            console.error(`View element not found: ${view}View`);
            return;
        }

        viewElement.style.display = 'block';
        
        // Инициализация компонентов при первом показе
        switch (view) {
            case 'dashboard':
                await this.showDashboard();
                break;
            case 'orders':
                await this.ordersComponent.init();
                break;
            case 'analytics':
                await this.analyticsComponent.init();
                break;
        }

        // Анимация появления
        viewElement.classList.add('view-enter');
        setTimeout(() => {
            viewElement.classList.remove('view-enter');
        }, 300);
    }

    hideCurrentView() {
        const currentViewElement = document.getElementById(`${this.currentView}View`);
        if (currentViewElement) {
            currentViewElement.classList.add('view-exit');
            setTimeout(() => {
                currentViewElement.style.display = 'none';
                currentViewElement.classList.remove('view-exit');
            }, 300);
        }
    }

    async showDashboard() {
        await this.switchView('dashboard');
        this.renderDashboard();
    }

    renderDashboard() {
        const container = document.getElementById('dashboardView');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-header">
                <h1>🛍️ TexnoEdem Dashboard</h1>
                <p class="dashboard-subtitle">Управление заказами и аналитика продаж</p>
            </div>

            <div class="dashboard-widgets">
                <div class="widget widget-stats">
                    <div class="widget-header">
                        <h3>📊 Быстрая статистика</h3>
                        <span class="widget-badge">Live</span>
                    </div>
                    <div class="widget-content">
                        <div class="quick-stats">
                            <div class="quick-stat">
                                <div class="stat-value" id="newOrdersCount">--</div>
                                <div class="stat-label">Новые заказы</div>
                            </div>
                            <div class="quick-stat">
                                <div class="stat-value" id="pendingOrdersCount">--</div>
                                <div class="stat-label">Ожидают обработки</div>
                            </div>
                            <div class="quick-stat">
                                <div class="stat-value" id="todayRevenue">--</div>
                                <div class="stat-label">Выручка сегодня</div>
                            </div>
                            <div class="quick-stat">
                                <div class="stat-value" id="successRate">--</div>
                                <div class="stat-label">Успешные доставки</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="widget widget-actions">
                    <div class="widget-header">
                        <h3>⚡ Быстрые действия</h3>
                    </div>
                    <div class="widget-content">
                        <div class="action-buttons">
                            <button class="action-btn btn-primary" onclick="app.switchView('orders')">
                                <span class="action-icon">📦</span>
                                <span class="action-text">Управление заказами</span>
                            </button>
                            <button class="action-btn btn-success" onclick="app.switchView('analytics')">
                                <span class="action-icon">📊</span>
                                <span class="action-text">Аналитика продаж</span>
                            </button>
                            <button class="action-btn btn-info" onclick="app.refreshAllData()">
                                <span class="action-icon">🔄</span>
                                <span class="action-text">Обновить все данные</span>
                            </button>
                            <button class="action-btn btn-warning" onclick="app.showSettings()">
                                <span class="action-icon">⚙️</span>
                                <span class="action-text">Настройки</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="widget widget-recent">
                    <div class="widget-header">
                        <h3>🆕 Последние заказы</h3>
                        <button class="btn btn-sm btn-outline" onclick="app.switchView('orders')">
                            Все заказы
                        </button>
                    </div>
                    <div class="widget-content">
                        <div id="recentOrdersList" class="recent-orders">
                            <div class="loading-text">Загрузка...</div>
                        </div>
                    </div>
                </div>

                <div class="widget widget-system">
                    <div class="widget-header">
                        <h3>🔧 Системная информация</h3>
                    </div>
                    <div class="widget-content">
                        <div class="system-info">
                            <div class="info-item">
                                <span class="info-label">Статус Megamarket:</span>
                                <span class="info-value status-connected" id="megamarketStatus">Проверка...</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Статус CDEK:</span>
                                <span class="info-value status-connected" id="cdekStatus">Проверка...</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Обновлено:</span>
                                <span class="info-value" id="lastUpdateTime">--</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Версия:</span>
                                <span class="info-value">${this.config.app.version}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadDashboardData();
    }

    async loadDashboardData() {
        try {
            // Загружаем быструю статистику
            await this.loadQuickStats();
            
            // Загружаем последние заказы
            await this.loadRecentOrders();
            
            // Обновляем статус сервисов
            this.updateServiceStatus();
            
            // Обновляем время последнего обновления
            document.getElementById('lastUpdateTime').textContent = 
                new Date().toLocaleTimeString('ru-RU');
                
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Ошибка загрузки данных дашборда', 'error');
        }
    }

    async loadQuickStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const analytics = await this.megamarketService.getAnalytics(today, today);
            
            document.getElementById('newOrdersCount').textContent = analytics.totalOrders;
            document.getElementById('pendingOrdersCount').textContent = analytics.pendingOrders;
            document.getElementById('todayRevenue').textContent = 
                this.formatCurrency(analytics.totalRevenue);
            document.getElementById('successRate').textContent = 
                `${analytics.successRate.toFixed(1)}%`;
                
        } catch (error) {
            console.error('Error loading quick stats:', error);
            // Устанавливаем значения по умолчанию при ошибке
            document.getElementById('newOrdersCount').textContent = '0';
            document.getElementById('pendingOrdersCount').textContent = '0';
            document.getElementById('todayRevenue').textContent = '0 ₽';
            document.getElementById('successRate').textContent = '0%';
        }
    }

    async loadRecentOrders() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const orders = await this.megamarketService.getNewOrders(today, today);
            const recentOrders = orders.slice(0, 5);
            
            const ordersList = document.getElementById('recentOrdersList');
            if (ordersList) {
                if (recentOrders.length === 0) {
                    ordersList.innerHTML = '<div class="empty-state">Нет новых заказов</div>';
                } else {
                    ordersList.innerHTML = recentOrders.map(order => `
                        <div class="recent-order-item">
                            <div class="order-id">#${order.id}</div>
                            <div class="order-amount">${this.formatCurrency(order.total_amount || 0)}</div>
                            <div class="order-status status-${order.status}">
                                ${this.getStatusText(order.status)}
                            </div>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Error loading recent orders:', error);
            const ordersList = document.getElementById('recentOrdersList');
            if (ordersList) {
                ordersList.innerHTML = '<div class="error-state">Ошибка загрузки</div>';
            }
        }
    }

    updateServiceStatus() {
        const megamarketStatus = document.getElementById('megamarketStatus');
        const cdekStatus = document.getElementById('cdekStatus');
        
        if (megamarketStatus) {
            megamarketStatus.textContent = this.connectionStatus.megamarket ? 'Подключен' : 'Ошибка';
            megamarketStatus.className = `info-value ${this.connectionStatus.megamarket ? 'status-connected' : 'status-error'}`;
        }
        
        if (cdekStatus) {
            cdekStatus.textContent = this.connectionStatus.cdek ? 'Подключен' : 'Ошибка';
            cdekStatus.className = `info-value ${this.connectionStatus.cdek ? 'status-connected' : 'status-error'}`;
        }
    }

    async refreshCurrentView() {
        switch (this.currentView) {
            case 'dashboard':
                await this.loadDashboardData();
                this.showNotification('Дашборд обновлен', 'success');
                break;
            case 'orders':
                await this.ordersComponent.refreshOrders();
                break;
            case 'analytics':
                await this.analyticsComponent.updateAnalytics();
                break;
        }
    }

    async refreshAllData() {
        try {
            this.showNotification('Обновление всех данных...', 'info');
            
            await Promise.allSettled([
                this.loadDashboardData(),
                this.ordersComponent?.refreshOrders(),
                this.analyticsComponent?.updateAnalytics()
            ]);
            
            this.showNotification('Все данные обновлены', 'success');
        } catch (error) {
            console.error('Error refreshing all data:', error);
            this.showNotification('Ошибка обновления данных', 'error');
        }
    }

    updateNavigation() {
        // Обновляем активные ссылки в навигации
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        document.querySelectorAll(`[data-view="${this.currentView}"]`).forEach(link => {
            link.classList.add('active');
        });
    }

    showSettings() {
        ModalComponent.show({
            title: '⚙️ Настройки приложения',
            content: `
                <div class="settings-form">
                    <div class="form-group">
                        <label for="megamarketApiKey">API ключ Megamarket:</label>
                        <input type="password" id="megamarketApiKey" class="form-control" 
                               value="${this.config.megamarket.apiKey}" placeholder="Введите API ключ">
                    </div>
                    <div class="form-group">
                        <label for="cdekApiKey">API ключ CDEK:</label>
                        <input type="password" id="cdekApiKey" class="form-control" 
                               value="${this.config.cdek.apiKey}" placeholder="Введите API ключ">
                    </div>
                    <div class="form-group">
                        <label for="themeSelect">Тема интерфейса:</label>
                        <select id="themeSelect" class="form-control">
                            <option value="light">Светлая</option>
                            <option value="dark">Темная</option>
                            <option value="auto">Авто</option>
                        </select>
                    </div>
                    <div class="settings-actions">
                        <button class="btn btn-primary" onclick="app.saveSettings()">Сохранить</button>
                        <button class="btn btn-secondary" onclick="app.testConnection()">Проверить подключение</button>
                    </div>
                </div>
            `,
            showCancel: true,
            cancelText: 'Отмена'
        });
    }

    async saveSettings() {
        try {
            const newConfig = {
                megamarket: {
                    apiKey: document.getElementById('megamarketApiKey').value,
                    baseUrl: this.config.megamarket.baseUrl
                },
                cdek: {
                    apiKey: document.getElementById('cdekApiKey').value,
                    baseUrl: this.config.cdek.baseUrl
                },
                app: {
                    ...this.config.app,
                    theme: document.getElementById('themeSelect').value
                }
            };

            // Сохраняем в localStorage
            localStorage.setItem('texnoEdemConfig', JSON.stringify(newConfig));
            
            // Переинициализируем сервисы с новыми настройками
            this.config = newConfig;
            await this.initializeServices();
            
            ModalComponent.hide();
            this.showNotification('Настройки сохранены', 'success');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Ошибка сохранения настроек', 'error');
        }
    }

    async testConnection() {
        try {
            await this.testServicesConnection();
            this.updateServiceStatus();
            this.showNotification('Проверка подключения завершена', 'success');
        } catch (error) {
            this.showNotification('Ошибка проверки подключения', 'error');
        }
    }

    // Вспомогательные методы
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    showErrorScreen(message) {
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = `
                <div class="error-screen">
                    <div class="error-content">
                        <div class="error-icon">❌</div>
                        <h2>Ошибка загрузки приложения</h2>
                        <p>${message}</p>
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            Перезагрузить
                        </button>
                    </div>
                </div>
            `;
        }
    }

    showNotification(message, type = 'info') {
        if (window.Notifications) {
            Notifications.show(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount);
    }

    getStatusText(status) {
        const statusMap = {
            'new': 'Новый',
            'confirmed': 'Подтвержден',
            'packed': 'Упакован',
            'shipped': 'Отгружен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statusMap[status] || status;
    }

    handleResize() {
        // Адаптация интерфейса к размеру окна
        if (window.innerWidth < 768) {
            document.body.classList.add('mobile-view');
        } else {
            document.body.classList.remove('mobile-view');
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    trackViewChange(view) {
        // Отслеживание смены view для аналитики
        if (typeof gtag !== 'undefined') {
            gtag('event', 'view_change', {
                'event_category': 'navigation',
                'event_label': view
            });
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.app = new TexnoEdemApp();
        await window.app.init();
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Показываем экран ошибки
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = `
                <div class="error-screen">
                    <div class="error-content">
                        <div class="error-icon">💥</div>
                        <h2>Критическая ошибка</h2>
                        <p>Не удалось загрузить приложение. Пожалуйста, перезагрузите страницу.</p>
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            Перезагрузить приложение
                        </button>
                    </div>
                </div>
            `;
        }
    }
});

// Глобальные обработчики ошибок
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
