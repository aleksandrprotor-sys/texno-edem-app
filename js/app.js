// Глобальный обработчик ошибок
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

// Обработка ошибок Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('SW registered successfully');
    })
    .catch(error => {
      console.log('SW registration failed:', error);
    });
}
// js/app.js - Доработанная и улучшенная версия
class TexnoEdemApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPlatform = 'cdek';
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
        this.syncInterval = null;
        
        // Компоненты (инициализируем позже)
        this.ordersComponent = null;
        this.analyticsComponent = null;
        this.settingsComponent = null;
        this.modal = null;
        this.notifications = [];

        // Кэш для оптимизации
        this.cache = {
            orders: {
                cdek: null,
                megamarket: null,
                filtered: {}
            },
            analytics: {},
            lastUpdate: null
        };

        console.log('🚀 TEXNO EDEM App constructor called');
    }

    async init() {
        if (this.isInitialized) {
            console.log('⚠️ Already initialized');
            return;
        }

        try {
            console.log('🔧 Starting initialization...');
            this.showLoading('Инициализация TEXNO EDEM...');

            // Таймаут на инициализацию
            this.initTimeout = setTimeout(() => {
                if (!this.isInitialized) {
                    console.error('❌ Init timeout reached');
                    this.emergencyInit();
                }
            }, 10000);

            // 1. Базовая инициализация
            await this.initBasic();
            
            // 2. Инициализация Telegram
            await this.initTelegram();
            
            // 3. Инициализация компонентов
            await this.initComponents();
            
            // 4. Загрузка данных
            await this.loadInitialData();
            
            // 5. Запуск автосинхронизации
            this.startAutoSync();
            
            // 6. Применяем настройки пользователя
            this.applyUserSettings();

            // 7. Инициализация сервис-воркера (если доступен)
            await this.initServiceWorker();
            
            this.isInitialized = true;
            clearTimeout(this.initTimeout);
            
            console.log('✅ TEXNO EDEM App initialized successfully');
            this.showNotification('Система готова к работе', 'success', 3000);
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.emergencyInit();
        } finally {
            this.hideLoading();
        }
    }

    async initBasic() {
        console.log('🔧 Basic initialization...');
        
        // Применяем тему
        CONFIG.applyTheme();
        
        // Создаем базовый UI
        this.renderBasicUI();
        
        // Инициализируем утилиты
        await this.initUtils();
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async initUtils() {
        // Инициализируем необходимые утилиты
        if (typeof ErrorHandler !== 'undefined') {
            ErrorHandler.init();
        }
        
        if (typeof Logger !== 'undefined') {
            window.logger = new Logger('INFO');
        }

        // Инициализация Performance Monitor
        if (typeof PerformanceMonitor !== 'undefined') {
            this.performanceMonitor = new PerformanceMonitor();
            this.performanceMonitor.startMonitoring();
        }
    }

    async initServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ ServiceWorker registered:', registration);
                
                // Обработка обновлений
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 New service worker found');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showNotification('Доступно новое обновление', 'info', 5000);
                        }
                    });
                });
                
            } catch (error) {
                console.warn('⚠️ ServiceWorker registration failed:', error);
            }
        }
    }

    async initTelegram() {
        try {
            if (window.Telegram && Telegram.WebApp) {
                this.tg = Telegram.WebApp;
                this.tg.expand();
                
                // ✅ ИСПРАВЛЕНИЕ: Правильная настройка подтверждения закрытия
                this.setupTelegramCloseHandler();
                
                // Настройка кнопки "Назад"
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

                // Настройка основной кнопки
                this.tg.MainButton.setText('Обновить данные');
                this.tg.MainButton.onClick(() => this.manualSync());
                
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

    setupTelegramCloseHandler() {
        if (!this.tg) return;

        // ✅ ИСПРАВЛЕНИЕ: Отключаем стандартное подтверждение закрытия
        this.tg.disableClosingConfirmation();

        // Вместо этого обрабатываем закрытие самостоятельно
        this.tg.onEvent('viewportChanged', (params) => {
            if (!params.is_expanded) {
                // При сворачивании приложения проверяем несохраненные данные
                this.handleAppMinimize();
            }
        });

        // Обработка попытки закрытия
        window.addEventListener('beforeunload', (event) => {
            if (this.hasUnsavedChanges()) {
                event.preventDefault();
                event.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?';
                return event.returnValue;
            }
        });
    }

    // Проверяем наличие несохраненных изменений
    hasUnsavedChanges() {
        let hasChanges = false;

        // Проверяем настройки
        if (this.settingsComponent && this.settingsComponent.hasUnsavedChanges) {
            hasChanges = hasChanges || this.settingsComponent.hasUnsavedChanges();
        }

        // Можно добавить проверку других компонентов
        // if (this.ordersComponent && this.ordersComponent.hasUnsavedChanges) {
        //     hasChanges = hasChanges || this.ordersComponent.hasUnsavedChanges();
        // }

        return hasChanges;
    }

    // Обработка сворачивания приложения
    handleAppMinimize() {
        if (this.hasUnsavedChanges()) {
            console.log('⚠️ App minimized with unsaved changes');
            // Можно показать уведомление
            this.showNotification('Несохраненные изменения будут сохранены автоматически', 'warning');
            
            // Автоматически сохраняем изменения
            this.forceSaveChanges();
        }
    }

    // Принудительное сохранение всех изменений
    forceSaveChanges() {
        let saved = false;

        // Сохраняем настройки
        if (this.settingsComponent && this.settingsComponent.forceSave) {
            saved = this.settingsComponent.forceSave() || saved;
        }

        // Можно добавить сохранение других компонентов

        if (saved) {
            console.log('✅ Changes saved automatically');
        }
    }

    initDesktopMode() {
        this.user = {
            id: 1,
            firstName: 'Демо',
            lastName: 'Пользователь', 
            username: 'demo_user',
            language: 'ru',
            isPremium: true,
            email: 'demo@texno-edem.ru',
            phone: '+7 999 123-45-67'
        };
    }

    async initComponents() {
        try {
            console.log('🔧 Initializing components...');
            
            // Загружаем компоненты динамически
            await this.loadComponent('orders');
            await this.loadComponent('analytics');
            await this.loadComponent('settings');
            await this.loadComponent('modal');
            
            this.renderHeader();
            this.renderNavigation();
            
            console.log('✅ Components initialized');
        } catch (error) {
            console.warn('⚠️ Components init failed:', error);
            // Создаем заглушки для компонентов
            this.createFallbackComponents();
        }
    }

    async loadComponent(name) {
        try {
            switch (name) {
                case 'orders':
                    if (typeof OrdersComponent !== 'undefined') {
                        this.ordersComponent = new OrdersComponent(this);
                        console.log('✅ OrdersComponent loaded');
                    } else {
                        console.warn('❌ OrdersComponent not available');
                    }
                    break;
                case 'analytics':
                    if (typeof AnalyticsComponent !== 'undefined') {
                        this.analyticsComponent = new AnalyticsComponent(this);
                        console.log('✅ AnalyticsComponent loaded');
                    } else {
                        console.warn('❌ AnalyticsComponent not available');
                    }
                    break;
                case 'settings':
                    if (typeof SettingsComponent !== 'undefined') {
                        this.settingsComponent = new SettingsComponent(this);
                        console.log('✅ SettingsComponent loaded');
                    } else {
                        console.warn('❌ SettingsComponent not available');
                    }
                    break;
                case 'modal':
                    if (typeof ModalComponent !== 'undefined') {
                        this.modal = new ModalComponent(this);
                        console.log('✅ ModalComponent loaded');
                    } else {
                        console.warn('❌ ModalComponent not available');
                    }
                    break;
            }
        } catch (error) {
            console.warn(`⚠️ Failed to load component ${name}:`, error);
        }
    }

    createFallbackComponents() {
        console.log('🔄 Creating fallback components...');
        
        // Создаем минимальные реализации компонентов
        this.ordersComponent = {
            render: (platform) => {
                console.log(`🎨 Rendering orders for platform: ${platform}`);
                const container = document.getElementById('orders-container');
                if (container) {
                    const orders = this.getPlatformOrders(platform);
                    console.log(`📦 Found ${orders.length} orders for ${platform}`);
                    
                    if (orders.length === 0) {
                        container.innerHTML = this.createEmptyOrdersState(platform);
                    } else {
                        container.innerHTML = this.createOrdersFallbackHTML(platform, orders);
                    }
                }
            },
            showOrderDetails: (platform, orderId) => {
                const order = this.getOrderById(platform, orderId);
                if (order && this.modal) {
                    this.modal.showOrderDetails(order);
                } else {
                    this.showNotification('Заказ не найден', 'error');
                }
            },
            refreshOrders: async (platform) => {
                await this.manualSync();
            }
        };

        this.analyticsComponent = {
            render: () => {
                console.log('🎨 Rendering analytics fallback');
                const container = document.getElementById('analytics-container');
                if (container) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-chart-bar"></i>
                            <h3>Аналитика временно недоступна</h3>
                            <p>Основные функции работают в обычном режиме</p>
                            <button class="btn btn-primary" onclick="app.manualSync()">
                                <i class="fas fa-sync-alt"></i> Обновить данные
                            </button>
                        </div>
                    `;
                }
            },
            updateCharts: () => {
                console.log('📊 Updating analytics charts (fallback)');
            }
        };

        this.settingsComponent = {
            render: () => {
                console.log('🎨 Rendering settings fallback');
                const container = document.getElementById('settings-container');
                if (container) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-cog"></i>
                            <h3>Настройки временно недоступны</h3>
                            <p>Используются настройки по умолчанию</p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="fas fa-redo"></i> Перезагрузить
                            </button>
                        </div>
                    `;
                }
            },
            hasUnsavedChanges: () => false,
            forceSave: () => false,
            discardChanges: () => {},
            loadSettings: () => ({})
        };

        this.modal = {
            showOrderDetails: (order) => {
                const modalId = 'order-details-modal';
                let modal = document.getElementById(modalId);
                
                if (!modal) {
                    modal = this.createBasicModal(modalId, 'Детали заказа');
                    document.getElementById('modals-container').appendChild(modal);
                }

                const content = this.createBasicOrderDetails(order);
                modal.querySelector('.modal-body').innerHTML = content;
                this.showModal(modalId);
            },
            showConfirmation: (title, message, onConfirm, onCancel) => {
                const modalId = 'confirmation-modal';
                let modal = document.getElementById(modalId);
                
                if (!modal) {
                    modal = this.createConfirmationModal(modalId);
                    document.getElementById('modals-container').appendChild(modal);
                }

                modal.querySelector('.modal-title').textContent = title;
                modal.querySelector('.modal-message').textContent = message;
                
                // Обновляем обработчики
                const confirmBtn = modal.querySelector('.confirm-btn');
                const cancelBtn = modal.querySelector('.cancel-btn');
                
                const confirmHandler = () => {
                    this.hideModal();
                    if (onConfirm) onConfirm();
                };
                
                const cancelHandler = () => {
                    this.hideModal();
                    if (onCancel) onCancel();
                };
                
                confirmBtn.onclick = confirmHandler;
                cancelBtn.onclick = cancelHandler;
                
                this.showModal(modalId);
            },
            close: () => {
                this.hideModal();
            }
        };
    }

    createBasicModal(id, title) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = id;
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="app.modal.close()"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="app.modal.close()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <!-- Content will be inserted here -->
                </div>
            </div>
        `;
        return modal;
    }

    createConfirmationModal(id) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = id;
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="app.modal.close()"></div>
            <div class="modal-dialog modal-sm">
                <div class="modal-header">
                    <h3 class="modal-title">Подтверждение</h3>
                    <button class="modal-close" onclick="app.modal.close()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="confirmation-content">
                        <i class="fas fa-exclamation-triangle confirmation-icon"></i>
                        <p class="modal-message">Вы уверены в этом действии?</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary cancel-btn">Отмена</button>
                    <button class="btn btn-primary confirm-btn">Подтвердить</button>
                </div>
            </div>
        `;
        return modal;
    }

    createBasicOrderDetails(order) {
        const statusConfig = this.getStatusConfig(order);
        
        return `
            <div class="order-details-header">
                <div class="order-main-info">
                    <div class="order-title">
                        <i class="fas fa-${order.platform === 'cdek' ? 'shipping-fast' : 'store'}"></i>
                        ${order.platform === 'cdek' ? 'Отправление CDEK' : 'Заказ Мегамаркет'}
                    </div>
                    <div class="order-tracking">${order.trackingNumber || order.orderNumber}</div>
                </div>
                <div class="order-status-badge" style="--status-color: ${statusConfig.color}">
                    ${statusConfig.text}
                </div>
            </div>

            <div class="details-grid">
                <div class="detail-section">
                    <h4 class="section-title">Основная информация</h4>
                    <div class="detail-item">
                        <span class="detail-label">Номер</span>
                        <span class="detail-value">${order.trackingNumber || order.orderNumber}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Статус</span>
                        <span class="detail-value">${statusConfig.text}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Клиент</span>
                        <span class="detail-value">${order.recipient || order.customerName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Сумма</span>
                        <span class="detail-value">${this.formatCurrency(order.cost || order.totalAmount)}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4 class="section-title">Детали доставки</h4>
                    <div class="detail-item">
                        <span class="detail-label">Дата создания</span>
                        <span class="detail-value">${this.formatDateTime(order.createdDate)}</span>
                    </div>
                    ${order.estimatedDelivery ? `
                        <div class="detail-item">
                            <span class="detail-label">Ожидаемая доставка</span>
                            <span class="detail-value">${this.formatDate(order.estimatedDelivery)}</span>
                        </div>
                    ` : ''}
                    ${order.deliveryAddress ? `
                        <div class="detail-item">
                            <span class="detail-label">Адрес</span>
                            <span class="detail-value">${order.deliveryAddress}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="app.modal.close()">Закрыть</button>
                <button class="btn btn-primary" onclick="app.printOrderDetails('${order.platform}', '${order.id}')">
                    <i class="fas fa-print"></i> Печать
                </button>
            </div>
        `;
    }

    createOrdersFallbackHTML(platform, orders) {
        return `
            <div class="orders-content">
                <!-- Заголовок и фильтры -->
                <div class="orders-toolbar">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Поиск по заказам..." id="orders-search"
                               oninput="app.handleOrdersSearch(event, '${platform}')">
                    </div>
                    
                    <div class="filter-group">
                        <select id="status-filter" class="form-control" onchange="app.handleStatusFilter(event, '${platform}')">
                            <option value="all">Все статусы</option>
                            <option value="new">Новые</option>
                            <option value="processing">В обработке</option>
                            <option value="active">Активные</option>
                            <option value="delivered">Доставленные</option>
                            <option value="problem">Проблемные</option>
                        </select>
                    </div>

                    <div class="toolbar-actions">
                        <button class="btn btn-outline" onclick="app.exportOrders('${platform}')" 
                                title="Экспорт заказов">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-primary" onclick="app.manualSync()" 
                                title="Обновить данные">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>

                <!-- Статистика -->
                <div class="platform-stats-bar">
                    <div class="stat-item">
                        <span class="stat-value">${orders.length}</span>
                        <span class="stat-label">Всего заказов</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${orders.filter(o => o.status === 'new').length}</span>
                        <span class="stat-label">Новые</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${orders.filter(o => o.status === 'problem').length}</span>
                        <span class="stat-label">Проблемные</span>
                    </div>
                </div>

                <!-- Список заказов -->
                <div class="orders-list">
                    ${orders.map(order => `
                        <div class="order-card" onclick="showOrderDetails('${order.platform}', '${order.id}')">
                            <div class="order-header">
                                <div class="order-title">
                                    <div class="order-number">
                                        <i class="fas fa-${order.platform === 'cdek' ? 'shipping-fast' : 'store'}"></i>
                                        ${order.platform === 'cdek' ? order.trackingNumber : order.orderNumber}
                                    </div>
                                    <div class="order-customer">
                                        ${order.recipient || order.customerName}
                                    </div>
                                </div>
                                <div class="order-status">
                                    <span class="status-badge status-${order.status}">
                                        ${this.getStatusConfig(order).text}
                                    </span>
                                </div>
                            </div>

                            <div class="order-details">
                                <div class="order-info">
                                    <div class="info-item">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <span>${order.platform === 'cdek' ? 
                                            `${order.fromCity} → ${order.toCity}` : 
                                            (order.deliveryAddress || 'Адрес не указан')
                                        }</span>
                                    </div>
                                    <div class="info-item">
                                        <i class="fas fa-ruble-sign"></i>
                                        <span>${this.formatCurrency(order.cost || order.totalAmount)}</span>
                                    </div>
                                </div>
                                
                                <div class="order-meta">
                                    <span class="order-date">${this.formatRelativeTime(order.createdDate)}</span>
                                    <div class="order-actions">
                                        <button class="btn-action btn-info" 
                                                onclick="event.stopPropagation(); showOrderDetails('${order.platform}', '${order.id}')"
                                                title="Подробности">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createEmptyOrdersState(platform) {
        return `
            <div class="empty-orders">
                <div class="empty-icon">
                    <i class="fas fa-${platform === 'cdek' ? 'shipping-fast' : 'store'}"></i>
                </div>
                <h3>Заказы не найдены</h3>
                <p>Нет заказов для платформы ${platform === 'cdek' ? 'CDEK' : 'Мегамаркет'}</p>
                <div class="empty-actions">
                    <button class="btn btn-primary" onclick="app.manualSync()">
                        <i class="fas fa-sync-alt"></i> Обновить данные
                    </button>
                    <button class="btn btn-outline" onclick="app.useDemoData()">
                        <i class="fas fa-magic"></i> Загрузить демо-данные
                    </button>
                </div>
            </div>
        `;
    }

    async loadInitialData() {
        try {
            console.log('📦 Loading initial data...');
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
            // Используем mock данные
            if (typeof mockDataGenerator !== 'undefined') {
                console.log('📦 Generating mock orders...');
                this.orders.cdek = mockDataGenerator.generateCDEKOrders(12);
                this.orders.megamarket = mockDataGenerator.generateMegamarketOrders(8);
            } else {
                // Fallback данные
                console.log('📦 Generating fallback orders...');
                this.orders.cdek = this.generateDemoCDEKOrders();
                this.orders.megamarket = this.generateDemoMegamarketOrders();
            }
            
            this.orders.all = [...this.orders.cdek, ...this.orders.megamarket]
                .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

            // Обновляем кэш
            this.cache.orders.cdek = [...this.orders.cdek];
            this.cache.orders.megamarket = [...this.orders.megamarket];
            this.cache.lastUpdate = new Date();

            console.log(`✅ Orders loaded: CDEK ${this.orders.cdek.length}, Megamarket ${this.orders.megamarket.length}`);

        } catch (error) {
            console.error('Error loading orders:', error);
            this.useDemoData();
        }
    }

    generateDemoCDEKOrders() {
        const statuses = ['new', 'processing', 'active', 'delivered', 'problem'];
        const cities = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Казань'];
        const names = ['Иван Иванов', 'Мария Петрова', 'Алексей Смирнов', 'Елена Козлова', 'Дмитрий Попов'];
        
        return Array.from({ length: 8 }, (_, i) => {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const fromCity = 'Москва';
            let toCity;
            do {
                toCity = cities[Math.floor(Math.random() * cities.length)];
            } while (toCity === fromCity);

            return {
                id: `cdek-demo-${i + 1}`,
                platform: 'cdek',
                trackingNumber: `CDEK${1000000000 + i}`,
                status: status,
                statusCode: status.toUpperCase(),
                fromCity: fromCity,
                toCity: toCity,
                weight: (Math.random() * 5 + 0.5).toFixed(1),
                cost: Math.floor(Math.random() * 5000) + 300,
                sender: 'ООО "ТЕХНО ЭДЕМ"',
                recipient: names[Math.floor(Math.random() * names.length)],
                createdDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                estimatedDelivery: status === 'delivered' ? null : 
                    new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                deliveredDate: status === 'delivered' ? 
                    new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString() : null
            };
        });
    }

    generateDemoMegamarketOrders() {
        const statuses = ['new', 'processing', 'shipped', 'delivered'];
        const products = [
            { name: 'Смартфон Samsung Galaxy S21', price: 15670 },
            { name: 'Наушники Sony WH-1000XM4', price: 8920 },
            { name: 'Ноутбук ASUS VivoBook 15', price: 23950 },
            { name: 'Телевизор LG 55NANO866', price: 45680 }
        ];
        const names = ['Анна Петрова', 'Сергей Кузнецов', 'Ольга Новикова', 'Михаил Семенов'];
        const addresses = [
            'г. Москва, ул. Примерная, д. 1',
            'г. Санкт-Петербург, пр. Невский, д. 25',
            'г. Екатеринбург, ул. Ленина, д. 50',
            'г. Новосибирск, ул. Кирова, д. 12'
        ];

        return Array.from({ length: 6 }, (_, i) => {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const product = products[Math.floor(Math.random() * products.length)];
            const quantity = Math.floor(Math.random() * 2) + 1;

            return {
                id: `mm-demo-${i + 1}`,
                platform: 'megamarket', 
                orderNumber: `MM${100000 + i}`,
                status: status,
                statusCode: status.toUpperCase(),
                totalAmount: product.price * quantity,
                itemsTotal: product.price * quantity,
                deliveryCost: 0,
                discount: Math.random() > 0.7 ? 500 : 0,
                customerName: names[Math.floor(Math.random() * names.length)],
                customerPhone: `+7 9${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90) + 10}`,
                deliveryAddress: addresses[Math.floor(Math.random() * addresses.length)],
                deliveryType: 'COURIER',
                createdDate: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        id: `item-${i}`,
                        name: product.name,
                        quantity: quantity,
                        price: product.price,
                        total: product.price * quantity
                    }
                ],
                payment: {
                    method: 'CARD',
                    status: 'PAID',
                    paidAt: new Date(Date.now() - Math.random() * 4 * 24 * 60 * 60 * 1000).toISOString()
                }
            };
        });
    }

    useDemoData() {
        console.log('🔄 Using demo data');
        this.orders.cdek = this.generateDemoCDEKOrders();
        this.orders.megamarket = this.generateDemoMegamarketOrders();
        this.orders.all = [...this.orders.cdek, ...this.orders.megamarket];
        
        // Обновляем кэш
        this.cache.orders.cdek = [...this.orders.cdek];
        this.cache.orders.megamarket = [...this.orders.megamarket];
        
        this.updateDashboard();
        this.updateNavigationBadges();
        
        this.showNotification('Используются демо-данные', 'warning');
    }

    applyUserSettings() {
        // Загружаем настройки пользователя
        const userSettings = JSON.parse(localStorage.getItem('texno_edem_user_settings') || '{}');
        
        if (userSettings.userName && this.user) {
            this.user.firstName = userSettings.userName;
        }
        if (userSettings.userEmail && this.user) {
            this.user.email = userSettings.userEmail;
        }
        if (userSettings.userPhone && this.user) {
            this.user.phone = userSettings.userPhone;
        }
        
        this.renderHeader();
    }

    renderBasicUI() {
        console.log('🎨 Rendering basic UI...');
        
        // Создаем минимальный UI который всегда работает
        const header = document.getElementById('header');
        if (header) {
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
                        <button class="nav-item active" data-section="dashboard">
                            <i class="fas fa-chart-line"></i>
                            <span>Дашборд</span>
                        </button>
                        <button class="nav-item" data-section="orders" data-platform="cdek">
                            <i class="fas fa-shipping-fast"></i>
                            <span>CDEK</span>
                        </button>
                        <button class="nav-item" data-section="orders" data-platform="megamarket">
                            <i class="fas fa-store"></i>
                            <span>Мегамаркет</span>
                        </button>
                        <button class="nav-item" data-section="settings">
                            <i class="fas fa-cog"></i>
                            <span>Настройки</span>
                        </button>
                    </div>
                </div>
            `;

            // ✅ ИСПРАВЛЕНИЕ: Добавляем обработчики событий для навигации
            this.attachNavigationEvents();
        }

        // Создаем контейнер для модальных окон
        if (!document.getElementById('modals-container')) {
            const modalsContainer = document.createElement('div');
            modalsContainer.id = 'modals-container';
            document.body.appendChild(modalsContainer);
        }

        // Показываем дашборд
        this.showSection('dashboard');
    }

    attachNavigationEvents() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                const platform = item.getAttribute('data-platform');
                
                console.log(`📱 Navigation: ${section}, platform: ${platform}`);
                
                if (section === 'orders' && platform) {
                    this.showSection('orders', platform);
                } else {
                    this.showSection(section);
                }
            });
        });
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
                        <div class="logo-title">${CONFIG.get('APP.NAME', 'TEXNO EDEM')}</div>
                        <div class="logo-subtitle">Business Intelligence v${CONFIG.get('APP.VERSION', '1.2.0')}</div>
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
                            <div class="user-role">${this.getUserRole()}</div>
                        </div>
                    </div>
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
                            data-section="dashboard">
                        <i class="fas fa-chart-line"></i>
                        <span>Дашборд</span>
                    </button>
                    
                    <button class="nav-item ${this.currentSection === 'orders' && this.currentPlatform === 'cdek' ? 'active' : ''}" 
                            data-section="orders" data-platform="cdek">
                        <i class="fas fa-shipping-fast"></i>
                        <span>CDEK</span>
                        ${this.getPlatformBadge('cdek')}
                    </button>
                    
                    <button class="nav-item ${this.currentSection === 'orders' && this.currentPlatform === 'megamarket' ? 'active' : ''}" 
                            data-section="orders" data-platform="megamarket">
                        <i class="fas fa-store"></i>
                        <span>Мегамаркет</span>
                        ${this.getPlatformBadge('megamarket')}
                    </button>
                    
                    <button class="nav-item ${this.currentSection === 'analytics' ? 'active' : ''}" 
                            data-section="analytics">
                        <i class="fas fa-chart-bar"></i>
                        <span>Аналитика</span>
                    </button>
                    
                    <button class="nav-item ${this.currentSection === 'settings' ? 'active' : ''}" 
                            data-section="settings">
                        <i class="fas fa-cog"></i>
                        <span>Настройки</span>
                    </button>
                </div>
            </div>
        `;

        // ✅ ИСПРАВЛЕНИЕ: Добавляем обработчики событий для навигации
        this.attachNavigationEvents();
    }

    getPlatformBadge(platform) {
        const orders = this.orders[platform] || [];
        const problemCount = orders.filter(order => order.status === 'problem').length;
        const newCount = orders.filter(order => order.status === 'new').length;
        
        if (problemCount > 0) {
            return `<span class="nav-badge badge-error">${problemCount}</span>`;
        } else if (newCount > 0) {
            return `<span class="nav-badge badge-info">${newCount}</span>`;
        }
        return '';
    }

    getSyncText() {
        if (this.isSyncing) return 'Синхронизация...';
        if (this.lastSyncTime) {
            return `Обновлено ${this.formatRelativeTime(this.lastSyncTime)}`;
        }
        return 'Не обновлено';
    }

    getUserAvatar() {
        if (this.user && this.user.firstName) {
            const initials = this.user.firstName.charAt(0) + (this.user.lastName ? this.user.lastName.charAt(0) : '');
            return `<div class="avatar-initials">${initials}</div>`;
        }
        return '<i class="fas fa-user"></i>';
    }

    getUserName() {
        if (this.user) {
            return `${this.user.firstName}${this.user.lastName ? ' ' + this.user.lastName : ''}`;
        }
        return 'Пользователь';
    }

    getUserRole() {
        if (this.user && this.user.isPremium) {
            return 'Premium';
        }
        return 'Пользователь';
    }

    showSection(section, platform = null) {
        console.log(`🎯 Showing section: ${section}, platform: ${platform}`);
        
        // Обновляем текущую секцию и платформу
        this.currentSection = section;
        if (platform) {
            this.currentPlatform = platform;
        }

        // Обновляем навигацию
        this.updateNavigation();

        // Обновляем контент
        this.updateContent();

        // Обновляем кнопку "Назад" в Telegram
        this.updateBackButton();

        // Обновляем основную кнопку в Telegram
        this.updateMainButton();
    }

    updateNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const itemSection = item.getAttribute('data-section');
            const itemPlatform = item.getAttribute('data-platform');
            
            item.classList.remove('active');
            
            if (itemSection === this.currentSection) {
                if (itemSection === 'orders') {
                    if (itemPlatform === this.currentPlatform) {
                        item.classList.add('active');
                    }
                } else {
                    item.classList.add('active');
                }
            }
        });
    }

    updateContent() {
        const content = document.getElementById('main-content');
        if (!content) return;

        try {
            switch (this.currentSection) {
                case 'dashboard':
                    this.renderDashboard();
                    break;
                case 'orders':
                    this.renderOrders();
                    break;
                case 'analytics':
                    this.renderAnalytics();
                    break;
                case 'settings':
                    this.renderSettings();
                    break;
                default:
                    this.renderDashboard();
            }
        } catch (error) {
            console.error('Error updating content:', error);
            this.renderErrorState();
        }
    }

    renderDashboard() {
        const content = document.getElementById('main-content');
        if (!content) return;

        content.innerHTML = `
            <div class="dashboard">
                <div class="dashboard-header">
                    <h1>Дашборд</h1>
                    <div class="dashboard-actions">
                        <button class="btn btn-primary" onclick="app.manualSync()">
                            <i class="fas fa-sync-alt"></i> Обновить
                        </button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-shipping-fast"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${this.orders.cdek.length}</div>
                            <div class="stat-label">Отправлений CDEK</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-store"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${this.orders.megamarket.length}</div>
                            <div class="stat-label">Заказов Мегамаркет</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${this.getProblemOrdersCount()}</div>
                            <div class="stat-label">Проблемные заказы</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${this.getPendingOrdersCount()}</div>
                            <div class="stat-label">Ожидают обработки</div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-content">
                    <div class="recent-orders">
                        <h2>Последние заказы</h2>
                        <div class="orders-list compact">
                            ${this.orders.all.slice(0, 5).map(order => `
                                <div class="order-item" onclick="showOrderDetails('${order.platform}', '${order.id}')">
                                    <div class="order-main">
                                        <div class="order-platform">
                                            <i class="fas fa-${order.platform === 'cdek' ? 'shipping-fast' : 'store'}"></i>
                                        </div>
                                        <div class="order-info">
                                            <div class="order-number">
                                                ${order.platform === 'cdek' ? order.trackingNumber : order.orderNumber}
                                            </div>
                                            <div class="order-customer">
                                                ${order.platform === 'cdek' ? order.recipient : order.customerName}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="order-status">
                                        <span class="status-badge status-${order.status}">
                                            ${this.getStatusConfig(order).text}
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="quick-actions">
                        <h2>Быстрые действия</h2>
                        <div class="actions-grid">
                            <button class="action-card" onclick="app.showSection('orders', 'cdek')">
                                <i class="fas fa-shipping-fast"></i>
                                <span>Отправления CDEK</span>
                            </button>
                            <button class="action-card" onclick="app.showSection('orders', 'megamarket')">
                                <i class="fas fa-store"></i>
                                <span>Заказы Мегамаркет</span>
                            </button>
                            <button class="action-card" onclick="app.manualSync()">
                                <i class="fas fa-sync-alt"></i>
                                <span>Синхронизировать</span>
                            </button>
                            <button class="action-card" onclick="app.showSection('analytics')">
                                <i class="fas fa-chart-bar"></i>
                                <span>Аналитика</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderOrders() {
        const content = document.getElementById('main-content');
        if (!content) return;

        content.innerHTML = `
            <div class="orders-section">
                <div class="section-header">
                    <h1>${this.currentPlatform === 'cdek' ? 'Отправления CDEK' : 'Заказы Мегамаркет'}</h1>
                    <div class="header-actions">
                        <button class="btn btn-outline" onclick="app.exportOrders('${this.currentPlatform}')">
                            <i class="fas fa-download"></i> Экспорт
                        </button>
                        <button class="btn btn-primary" onclick="app.manualSync()">
                            <i class="fas fa-sync-alt"></i> Обновить
                        </button>
                    </div>
                </div>
                <div id="orders-container">
                    <!-- Orders will be rendered by component -->
                </div>
            </div>
        `;

        // Рендерим заказы через компонент или fallback
        if (this.ordersComponent && typeof this.ordersComponent.render === 'function') {
            this.ordersComponent.render(this.currentPlatform);
        } else {
            this.renderOrdersFallback();
        }
    }

    renderOrdersFallback() {
        const container = document.getElementById('orders-container');
        if (!container) return;

        const orders = this.getPlatformOrders(this.currentPlatform);
        
        if (orders.length === 0) {
            container.innerHTML = this.createEmptyOrdersState(this.currentPlatform);
        } else {
            container.innerHTML = this.createOrdersFallbackHTML(this.currentPlatform, orders);
        }
    }

    renderAnalytics() {
        const content = document.getElementById('main-content');
        if (!content) return;

        content.innerHTML = `
            <div class="analytics-section">
                <div class="section-header">
                    <h1>Аналитика</h1>
                    <div class="header-actions">
                        <button class="btn btn-outline" onclick="app.exportAnalytics()">
                            <i class="fas fa-download"></i> Экспорт
                        </button>
                        <button class="btn btn-primary" onclick="app.manualSync()">
                            <i class="fas fa-sync-alt"></i> Обновить
                        </button>
                    </div>
                </div>
                <div id="analytics-container">
                    <!-- Analytics will be rendered by component -->
                </div>
            </div>
        `;

        // Рендерим аналитику через компонент или fallback
        if (this.analyticsComponent && typeof this.analyticsComponent.render === 'function') {
            this.analyticsComponent.render();
        } else {
            this.renderAnalyticsFallback();
        }
    }

    renderAnalyticsFallback() {
        const container = document.getElementById('analytics-container');
        if (!container) return;

        container.innerHTML = `
            <div class="analytics-fallback">
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <h3>Статистика по платформам</h3>
                        <div class="platform-stats">
                            <div class="platform-stat">
                                <span class="platform-name">CDEK</span>
                                <span class="platform-count">${this.orders.cdek.length} заказов</span>
                            </div>
                            <div class="platform-stat">
                                <span class="platform-name">Мегамаркет</span>
                                <span class="platform-count">${this.orders.megamarket.length} заказов</span>
                            </div>
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3>Статусы заказов</h3>
                        <div class="status-stats">
                            ${this.getStatusStats().map(stat => `
                                <div class="status-stat">
                                    <span class="status-name">${stat.status}</span>
                                    <span class="status-count">${stat.count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSettings() {
        const content = document.getElementById('main-content');
        if (!content) return;

        content.innerHTML = `
            <div class="settings-section">
                <div class="section-header">
                    <h1>Настройки</h1>
                    <div class="header-actions">
                        <button class="btn btn-outline" onclick="app.resetSettings()">
                            <i class="fas fa-undo"></i> Сброс
                        </button>
                        <button class="btn btn-primary" onclick="app.saveSettings()">
                            <i class="fas fa-save"></i> Сохранить
                        </button>
                    </div>
                </div>
                <div id="settings-container">
                    <!-- Settings will be rendered by component -->
                </div>
            </div>
        `;

        // Рендерим настройки через компонент или fallback
        if (this.settingsComponent && typeof this.settingsComponent.render === 'function') {
            this.settingsComponent.render();
        } else {
            this.renderSettingsFallback();
        }
    }

    renderSettingsFallback() {
        const container = document.getElementById('settings-container');
        if (!container) return;

        container.innerHTML = `
            <div class="settings-fallback">
                <div class="settings-group">
                    <h3>Профиль пользователя</h3>
                    <div class="form-group">
                        <label>Имя</label>
                        <input type="text" class="form-control" value="${this.user?.firstName || ''}" 
                               placeholder="Введите ваше имя">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" class="form-control" value="${this.user?.email || ''}" 
                               placeholder="Введите ваш email">
                    </div>
                </div>

                <div class="settings-group">
                    <h3>Настройки приложения</h3>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" checked> Автосинхронизация
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" checked> Уведомления
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    renderErrorState() {
        const content = document.getElementById('main-content');
        if (!content) return;

        content.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>Произошла ошибка</h2>
                <p>Не удалось загрузить содержимое страницы</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Перезагрузить
                    </button>
                    <button class="btn btn-outline" onclick="app.showSection('dashboard')">
                        <i class="fas fa-home"></i> На главную
                    </button>
                </div>
            </div>
        `;
    }

    updateDashboard() {
        if (this.currentSection === 'dashboard') {
            this.renderDashboard();
        }
    }

    updateNavigationBadges() {
        this.renderNavigation();
    }

    updateBackButton() {
        if (!this.tg) return;

        if (this.currentSection === 'dashboard') {
            this.tg.BackButton.hide();
        } else {
            this.tg.BackButton.show();
        }
    }

    updateMainButton() {
        if (!this.tg) return;

        if (this.currentSection === 'orders') {
            this.tg.MainButton.setText('Обновить заказы');
            this.tg.MainButton.show();
        } else if (this.currentSection === 'settings') {
            this.tg.MainButton.setText('Сохранить настройки');
            this.tg.MainButton.show();
        } else {
            this.tg.MainButton.hide();
        }
    }

    handleBackButton() {
        if (this.currentSection === 'dashboard') {
            if (this.tg) {
                this.tg.close();
            }
        } else {
            this.showSection('dashboard');
        }
    }

    async manualSync() {
        if (this.isSyncing) {
            this.showNotification('Синхронизация уже выполняется', 'info');
            return;
        }

        try {
            this.isSyncing = true;
            this.updateSyncUI();

            this.showNotification('Начинаем синхронизацию...', 'info');

            // Имитация синхронизации
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Обновляем данные
            await this.loadOrders();

            // Обновляем UI
            this.updateDashboard();
            this.updateNavigationBadges();
            this.lastSyncTime = new Date();

            this.showNotification('Данные успешно обновлены', 'success');

        } catch (error) {
            console.error('Sync error:', error);
            this.showNotification('Ошибка синхронизации', 'error');
        } finally {
            this.isSyncing = false;
            this.updateSyncUI();
        }
    }

    updateSyncUI() {
        this.renderHeader();
    }

    startAutoSync() {
        // Автосинхронизация каждые 5 минут
        this.syncInterval = setInterval(() => {
            if (!this.isSyncing) {
                this.manualSync();
            }
        }, 5 * 60 * 1000);
    }

    // Вспомогательные методы
    getPlatformOrders(platform) {
        return this.orders[platform] || [];
    }

    getOrderById(platform, orderId) {
        const orders = this.getPlatformOrders(platform);
        return orders.find(order => order.id === orderId);
    }

    getProblemOrdersCount() {
        return this.orders.all.filter(order => order.status === 'problem').length;
    }

    getPendingOrdersCount() {
        return this.orders.all.filter(order => 
            order.status === 'new' || order.status === 'processing'
        ).length;
    }

    getStatusStats() {
        const statuses = {};
        this.orders.all.forEach(order => {
            const status = order.status;
            statuses[status] = (statuses[status] || 0) + 1;
        });

        return Object.entries(statuses).map(([status, count]) => ({
            status: this.getStatusConfig({ status }).text,
            count: count
        }));
    }

    getStatusConfig(order) {
        const status = order.status;
        const platform = order.platform;

        const statusConfigs = {
            cdek: {
                new: { text: 'Новое', color: '#3498db' },
                processing: { text: 'В обработке', color: '#f39c12' },
                active: { text: 'Активное', color: '#2ecc71' },
                delivered: { text: 'Доставлено', color: '#27ae60' },
                problem: { text: 'Проблема', color: '#e74c3c' }
            },
            megamarket: {
                new: { text: 'Новый', color: '#3498db' },
                processing: { text: 'Обрабатывается', color: '#f39c12' },
                shipped: { text: 'Отправлен', color: '#2ecc71' },
                delivered: { text: 'Доставлен', color: '#27ae60' },
                problem: { text: 'Проблема', color: '#e74c3c' }
            }
        };

        const config = statusConfigs[platform]?.[status] || 
                      { text: status, color: '#95a5a6' };

        return config;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
        }).format(amount);
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }

    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин назад`;
        if (diffHours < 24) return `${diffHours} ч назад`;
        if (diffDays < 7) return `${diffDays} дн назад`;
        
        return this.formatDate(dateString);
    }

    // Методы для работы с UI
    showLoading(message = 'Загрузка...') {
        this.isLoading = true;
        
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'global-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <div class="loader-text">${message}</div>
                </div>
            `;
            document.body.appendChild(loader);
        }
        
        loader.style.display = 'flex';
    }

    hideLoading() {
        this.isLoading = false;
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = {
            id: Date.now().toString(),
            message,
            type,
            timestamp: new Date()
        };

        this.notifications.push(notification);
        this.renderNotification(notification);

        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }

        return notification.id;
    }

    renderNotification(notification) {
        let container = document.getElementById('notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }

        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification-${notification.type}`;
        notificationEl.id = `notification-${notification.id}`;
        notificationEl.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-message">${notification.message}</div>
                <button class="notification-close" onclick="app.removeNotification('${notification.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(notificationEl);

        // Анимация появления
        setTimeout(() => {
            notificationEl.classList.add('show');
        }, 10);
    }

    removeNotification(id) {
        const notificationEl = document.getElementById(`notification-${id}`);
        if (notificationEl) {
            notificationEl.classList.remove('show');
            setTimeout(() => {
                notificationEl.remove();
            }, 300);
        }

        this.notifications = this.notifications.filter(n => n.id !== id);
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

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        }
    }

    hideModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }

    // Обработчики событий
    handleOrdersSearch(event, platform) {
        const searchTerm = event.target.value.toLowerCase();
        const orders = this.getPlatformOrders(platform);
        
        const filteredOrders = orders.filter(order => {
            const searchableText = [
                order.trackingNumber || order.orderNumber,
                order.recipient || order.customerName,
                order.fromCity,
                order.toCity,
                order.deliveryAddress
            ].join(' ').toLowerCase();
            
            return searchableText.includes(searchTerm);
        });

        this.renderFilteredOrders(platform, filteredOrders);
    }

    handleStatusFilter(event, platform) {
        const status = event.target.value;
        const orders = this.getPlatformOrders(platform);
        
        let filteredOrders = orders;
        if (status !== 'all') {
            filteredOrders = orders.filter(order => order.status === status);
        }

        this.renderFilteredOrders(platform, filteredOrders);
    }

    renderFilteredOrders(platform, orders) {
        const container = document.getElementById('orders-container');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Заказы не найдены</h3>
                    <p>Попробуйте изменить параметры поиска</p>
                </div>
            `;
        } else {
            container.innerHTML = this.createOrdersFallbackHTML(platform, orders);
        }
    }

    // Экспорт данных
    exportOrders(platform) {
        const orders = this.getPlatformOrders(platform);
        const data = JSON.stringify(orders, null, 2);
        this.downloadFile(data, `orders-${platform}-${new Date().toISOString().split('T')[0]}.json`);
        this.showNotification(`Экспортировано ${orders.length} заказов`, 'success');
    }

    exportAnalytics() {
        const analytics = {
            totalOrders: this.orders.all.length,
            platformStats: {
                cdek: this.orders.cdek.length,
                megamarket: this.orders.megamarket.length
            },
            statusStats: this.getStatusStats(),
            exportTime: new Date().toISOString()
        };
        
        const data = JSON.stringify(analytics, null, 2);
        this.downloadFile(data, `analytics-${new Date().toISOString().split('T')[0]}.json`);
        this.showNotification('Аналитика экспортирована', 'success');
    }

    downloadFile(data, filename) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Настройки
    resetSettings() {
        if (this.modal && this.modal.showConfirmation) {
            this.modal.showConfirmation(
                'Сброс настроек',
                'Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?',
                () => {
                    localStorage.removeItem('texno_edem_user_settings');
                    this.applyUserSettings();
                    this.showNotification('Настройки сброшены', 'success');
                }
            );
        } else {
            // Fallback confirmation
            if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
                localStorage.removeItem('texno_edem_user_settings');
                this.applyUserSettings();
                this.showNotification('Настройки сброшены', 'success');
            }
        }
    }

    saveSettings() {
        // Сохранение настроек через компонент
        if (this.settingsComponent && this.settingsComponent.saveSettings) {
            const success = this.settingsComponent.saveSettings();
            if (success) {
                this.showNotification('Настройки сохранены', 'success');
                this.applyUserSettings();
            } else {
                this.showNotification('Ошибка сохранения настроек', 'error');
            }
        } else {
            // Fallback сохранение
            this.showNotification('Настройки сохранены (fallback)', 'success');
        }
    }

    // Аварийная инициализация
    emergencyInit() {
        console.log('🚨 Emergency initialization started');
        
        this.isInitialized = true;
        this.renderBasicUI();
        this.useDemoData();
        
        this.showNotification('Приложение запущено в безопасном режиме', 'warning', 5000);
        
        // Показываем кнопку перезагрузки
        setTimeout(() => {
            if (this.modal && this.modal.showConfirmation) {
                this.modal.showConfirmation(
                    'Проблема с инициализацией',
                    'Приложение запущено в ограниченном режиме. Перезагрузить?',
                    () => location.reload(),
                    () => console.log('User chose to continue in safe mode')
                );
            }
        }, 2000);
    }

    // Глобальные методы для использования в HTML
    showOrderDetails(platform, orderId) {
        if (this.ordersComponent && this.ordersComponent.showOrderDetails) {
            this.ordersComponent.showOrderDetails(platform, orderId);
        } else if (this.modal && this.modal.showOrderDetails) {
            const order = this.getOrderById(platform, orderId);
            if (order) {
                this.modal.showOrderDetails(order);
            } else {
                this.showNotification('Заказ не найден', 'error');
            }
        } else {
            // Fallback
            const order = this.getOrderById(platform, orderId);
            if (order) {
                alert(`Детали заказа: ${order.trackingNumber || order.orderNumber}\nСтатус: ${this.getStatusConfig(order).text}`);
            } else {
                this.showNotification('Заказ не найден', 'error');
            }
        }
    }

    printOrderDetails(platform, orderId) {
        const order = this.getOrderById(platform, orderId);
        if (order) {
            const printWindow = window.open('', '_blank');
            const content = this.createPrintContent(order);
            printWindow.document.write(content);
            printWindow.document.close();
            printWindow.print();
        } else {
            this.showNotification('Заказ не найден', 'error');
        }
    }

    createPrintContent(order) {
        const statusConfig = this.getStatusConfig(order);
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Детали заказа - ${order.platform === 'cdek' ? order.trackingNumber : order.orderNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .order-info { margin-bottom: 20px; }
                    .info-table { width: 100%; border-collapse: collapse; }
                    .info-table td { padding: 8px; border-bottom: 1px solid #ddd; }
                    .info-table .label { font-weight: bold; width: 30%; }
                    .status-badge { 
                        display: inline-block; 
                        padding: 4px 8px; 
                        border-radius: 4px; 
                        background-color: ${statusConfig.color};
                        color: white;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${order.platform === 'cdek' ? 'Отправление CDEK' : 'Заказ Мегамаркет'}</h1>
                    <p>Распечатано: ${new Date().toLocaleString('ru-RU')}</p>
                </div>
                
                <div class="order-info">
                    <table class="info-table">
                        <tr>
                            <td class="label">Номер:</td>
                            <td>${order.platform === 'cdek' ? order.trackingNumber : order.orderNumber}</td>
                        </tr>
                        <tr>
                            <td class="label">Статус:</td>
                            <td><span class="status-badge">${statusConfig.text}</span></td>
                        </tr>
                        <tr>
                            <td class="label">Клиент:</td>
                            <td>${order.recipient || order.customerName}</td>
                        </tr>
                        <tr>
                            <td class="label">Сумма:</td>
                            <td>${this.formatCurrency(order.cost || order.totalAmount)}</td>
                        </tr>
                        <tr>
                            <td class="label">Дата создания:</td>
                            <td>${this.formatDateTime(order.createdDate)}</td>
                        </tr>
                        ${order.estimatedDelivery ? `
                        <tr>
                            <td class="label">Ожидаемая доставка:</td>
                            <td>${this.formatDate(order.estimatedDelivery)}</td>
                        </tr>
                        ` : ''}
                        ${order.deliveryAddress ? `
                        <tr>
                            <td class="label">Адрес доставки:</td>
                            <td>${order.deliveryAddress}</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>
            </body>
            </html>
        `;
    }

    // Очистка ресурсов
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        if (this.initTimeout) {
            clearTimeout(this.initTimeout);
        }
        console.log('🧹 App destroyed');
    }
}

// Глобальная функция для инициализации
window.initApp = async function() {
    console.log('🌍 Initializing TEXNO EDEM App...');
    
    try {
        if (!window.app) {
            window.app = new TexnoEdemApp();
        }
        
        await window.app.init();
        
        // Глобальные обработчики ошибок
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            window.app?.showNotification('Произошла ошибка приложения', 'error');
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            window.app?.showNotification('Ошибка в асинхронной операции', 'error');
        });
        
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        
        // Создаем базовый app даже при ошибке
        if (!window.app) {
            window.app = new TexnoEdemApp();
            window.app.emergencyInit();
        }
    }
};

// Автоматическая инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initApp);
} else {
    window.initApp();
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TexnoEdemApp };
}
