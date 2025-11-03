// js/main.js
class TexnoEdemApp {
    constructor() {
        this.components = {};
        this.currentView = 'dashboard';
        this.user = null;
        this.isInitialized = false;
        
        // Инициализация компонентов с защитой от ошибок
        this.initializeComponents();
    }

    initializeComponents() {
        try {
            console.log('🔄 Initializing components...');
            
            // Инициализация ConfigManager должна быть уже выполнена в config.js
            if (typeof CONFIG === 'undefined') {
                throw new Error('CONFIG is not defined. Check config.js loading.');
            }

            // Инициализация компонента настроек
            this.components.settings = new SettingsComponent(this);
            console.log('✅ SettingsComponent initialized');

            // Инициализация SyncManager если он существует
            if (typeof SyncManager !== 'undefined') {
                this.components.sync = new SyncManager(this);
                console.log('✅ SyncManager initialized');
            }

            // Инициализация других компонентов
            this.components.dashboard = new DashboardComponent(this);
            this.components.orders = new OrdersComponent(this);
            this.components.analytics = new AnalyticsComponent(this);
            
            console.log('✅ All components initialized');

        } catch (error) {
            console.error('❌ Error initializing components:', error);
            this.showError('Ошибка инициализации компонентов: ' + error.message);
        }
    }

    async initialize() {
        console.log('🚀 Initializing Texno Edem App...');
        
        try {
            // Проверка поддержки localStorage
            if (!this.checkLocalStorage()) {
                throw new Error('LocalStorage is not supported');
            }

            // Инициализация Telegram WebApp
            this.initTelegramApp();
            
            // Загрузка пользовательских данных
            await this.loadUserData();
            
            // Применение темы
            this.applyTheme();
            
            // Показать главный экран
            this.showMainView();
            
            // Запуск синхронизации если доступен
            if (this.components.sync) {
                this.components.sync.startAutoSync();
            }
            
            this.isInitialized = true;
            console.log('✅ App initialized successfully');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Ошибка инициализации приложения: ' + error.message);
        }
    }

    initializeComponents() {
        try {
            console.log('🔄 Initializing components...');
            
            // Проверка что CONFIG загружен
            if (typeof CONFIG === 'undefined') {
                console.warn('⚠️ CONFIG not found, using fallback');
                this.createFallbackConfig();
            }

            // Инициализация компонента настроек с защитой
            try {
                this.components.settings = new SettingsComponent(this);
                console.log('✅ SettingsComponent initialized');
            } catch (error) {
                console.error('❌ SettingsComponent failed:', error);
                this.components.settings = this.createFallbackSettings();
            }

            // Инициализация SyncManager с защитой
            if (typeof SyncManager !== 'undefined') {
                try {
                    this.components.sync = new SyncManager(this);
                    console.log('✅ SyncManager initialized');
                } catch (error) {
                    console.error('❌ SyncManager failed:', error);
                }
            }

            // Инициализация других компонентов
            try {
                this.components.dashboard = new DashboardComponent(this);
                this.components.orders = new OrdersComponent(this);
                this.components.analytics = new AnalyticsComponent(this);
                console.log('✅ UI components initialized');
            } catch (error) {
                console.error('❌ UI components failed:', error);
            }

        } catch (error) {
            console.error('❌ Error initializing components:', error);
        }
    }

    createFallbackConfig() {
        // Простой fallback конфиг
        window.CONFIG = {
            get: (key, defaultValue) => {
                const fallbackValues = {
                    'SETTINGS.THEME_MODE': 'light',
                    'SETTINGS.AUTO_SYNC': true,
                    'API.CDEK.ENABLED': true,
                    'API.MEGAMARKET.ENABLED': true
                };
                return fallbackValues[key] || defaultValue;
            },
            set: (key, value) => {
                console.log('Fallback config set:', key, value);
            },
            applyTheme: () => {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        };
    }

    createFallbackSettings() {
        // Fallback компонент настроек
        return {
            render: () => {
                const container = document.getElementById('settings-container');
                if (container) {
                    container.innerHTML = `
                        <div class="error-message">
                            <h3>⚠️ Компонент настроек временно недоступен</h3>
                            <p>Попробуйте обновить страницу</p>
                        </div>
                    `;
                }
            },
            loadCurrentSettings: () => ({}),
            saveSettings: () => false
        };
    }

    initTelegramApp() {
        try {
            if (window.Telegram && Telegram.WebApp) {
                this.telegramApp = Telegram.WebApp;
                
                // Расширить интерфейс
                this.telegramApp.expand();
                this.telegramApp.enableClosingConfirmation();
                
                // Использование данных Telegram пользователя
                if (this.telegramApp.initDataUnsafe && this.telegramApp.initDataUnsafe.user) {
                    const tgUser = this.telegramApp.initDataUnsafe.user;
                    this.user = {
                        id: tgUser.id,
                        firstName: tgUser.first_name,
                        lastName: tgUser.last_name,
                        username: tgUser.username,
                        languageCode: tgUser.language_code,
                        isPremium: tgUser.is_premium || false
                    };
                }
                
                // Применение темы Telegram
                this.applyTelegramTheme();
                
                console.log('📱 Telegram WebApp initialized', this.user);
            } else {
                console.log('🌐 Running in browser mode');
                this.initBrowserMode();
            }
        } catch (error) {
            console.error('❌ Telegram WebApp init error:', error);
            this.initBrowserMode();
        }
    }

    applyTelegramTheme() {
        if (this.telegramApp) {
            const theme = this.telegramApp.colorScheme;
            document.documentElement.setAttribute('data-theme', theme);
            
            // Использование цветов Telegram
            this.telegramApp.setHeaderColor('secondary_bg_color');
            this.telegramApp.setBackgroundColor('secondary_bg_color');
        }
    }

    initBrowserMode() {
        // Заглушка пользователя для браузерного режима
        if (!this.user) {
            this.user = {
                id: Date.now(),
                firstName: 'Демо',
                lastName: 'Пользователь',
                username: 'demo_user',
                languageCode: 'ru',
                isPremium: false
            };
        }
    }

    applyTheme() {
        try {
            if (CONFIG && typeof CONFIG.applyTheme === 'function') {
                CONFIG.applyTheme();
            } else {
                // Fallback тема
                document.documentElement.setAttribute('data-theme', 'light');
            }
        } catch (error) {
            console.error('❌ Error applying theme:', error);
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    async loadUserData() {
        try {
            // Загрузка из localStorage
            const userData = localStorage.getItem('texno_edem_user_data');
            if (userData) {
                const parsed = JSON.parse(userData);
                this.user = { ...this.user, ...parsed };
            }
            
            console.log('👤 User data loaded:', this.user);
            return true;
            
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            return false;
        }
    }

    saveUserData() {
        try {
            localStorage.setItem('texno_edem_user_data', JSON.stringify(this.user));
            return true;
        } catch (error) {
            console.error('❌ Error saving user data:', error);
            return false;
        }
    }

    showMainView() {
        try {
            this.hideAllViews();
            
            const mainView = document.getElementById('main-view');
            if (mainView) {
                mainView.style.display = 'block';
            }
            
            // Показать дашборд по умолчанию
            this.showDashboard();
            
        } catch (error) {
            console.error('❌ Error showing main view:', error);
            this.showError('Ошибка отображения интерфейса');
        }
    }

    showDashboard() {
        this.showView('dashboard');
        if (this.components.dashboard) {
            this.components.dashboard.render();
        }
    }

    showOrders() {
        this.showView('orders');
        if (this.components.orders) {
            this.components.orders.render();
        }
    }

    showAnalytics() {
        this.showView('analytics');
        if (this.components.analytics) {
            this.components.analytics.render();
        }
    }

    showSettings() {
        this.showView('settings');
        if (this.components.settings) {
            this.components.settings.render();
        }
    }

    showView(viewName) {
        this.hideAllViews();
        this.currentView = viewName;
        
        const viewElement = document.getElementById(`${viewName}-view`);
        if (viewElement) {
            viewElement.style.display = 'block';
        }
        
        // Обновление активной кнопки навигации
        this.updateNavigation(viewName);
    }

    hideAllViews() {
        const views = ['dashboard', 'orders', 'analytics', 'settings'];
        views.forEach(view => {
            const element = document.getElementById(`${view}-view`);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    updateNavigation(activeView) {
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.view === activeView) {
                button.classList.add('active');
            }
        });
    }

    showNotification(message, type = 'info') {
        try {
            // Использование Telegram уведомлений если доступно
            if (this.telegramApp) {
                this.telegramApp.showPopup({
                    title: type === 'error' ? 'Ошибка' : 
                          type === 'success' ? 'Успех' : 'Информация',
                    message: message,
                    buttons: [{ type: 'ok' }]
                });
            } else {
                // Fallback уведомление
                alert(`${type.toUpperCase()}: ${message}`);
            }
            
            console.log(`📢 Notification [${type}]:`, message);
        } catch (error) {
            console.error('❌ Error showing notification:', error);
            alert(message);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    checkLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.error('❌ LocalStorage not supported:', error);
            return false;
        }
    }

    // Методы для работы с настройками
    getSettings() {
        return this.components.settings ? this.components.settings.currentSettings : {};
    }

    async saveSettings(settings) {
        if (this.components.settings) {
            return await this.components.settings.saveSettings(settings);
        }
        return false;
    }

    // Деструктор для очистки
    destroy() {
        if (this.components.sync) {
            this.components.sync.stopAutoSync();
        }
        console.log('🧹 App destroyed');
    }
}

// Инициализация приложения при загрузке страницы
let app;

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Content Loaded');
    
    try {
        app = new TexnoEdemApp();
        window.app = app; // Глобальный доступ для отладки
        
        // Небольшая задержка для полной загрузки всех скриптов
        setTimeout(() => {
            app.initialize();
        }, 100);
        
    } catch (error) {
        console.error('❌ Failed to create app instance:', error);
        document.body.innerHTML = `
            <div class="error-container">
                <h1>⚠️ Ошибка загрузки приложения</h1>
                <p>${error.message}</p>
                <button onclick="window.location.reload()">Обновить страницу</button>
            </div>
        `;
    }
});

// Глобальные методы для HTML атрибутов onclick
window.showDashboard = function() {
    if (window.app) window.app.showDashboard();
};

window.showOrders = function() {
    if (window.app) window.app.showOrders();
};

window.showAnalytics = function() {
    if (window.app) window.app.showAnalytics();
};

window.showSettings = function() {
    if (window.app) window.app.showSettings();
};

// Обработчик ошибок
window.addEventListener('error', function(event) {
    console.error('🌐 Global error:', event.error);
    if (window.app) {
        window.app.showError('Произошла непредвиденная ошибка');
    }
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('⏰ Unhandled promise rejection:', event.reason);
    event.preventDefault();
});
