// js/app.js - Полностью доработанный и исправленный
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
            discardChanges: () => {}
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
                <button class="btn btn-primary" onclick="app.modal.printOrderDetails()">
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
                        <input type="text" placeholder="Поиск по заказам..." id="orders-search">
                    </div>
                    
                    <div class="filter-group">
                        <select id="status-filter" class="form-control">
                            <option value="all">Все статусы</option>
                            <option value="new">Новые</option>
                            <option value="processing">В обработке</option>
                            <option value="active">Активные</option>
                            <option value="delivered">Доставленные</option>
                            <option value="problem">Проблемные</option>
                        </select>
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
                            data-section="dashboard">
                        <i class="fas fa-chart-line"></i>
                        <span>Дашборд</span>
                    </button>
                    
                    <button class="nav-item ${this.currentSection === 'orders' && this.currentPlatform === 'cdek' ? 'active' : ''}" 
                            data-section="orders" data-platform="cdek">
                        <i class="fas fa-shipping-fast"></i>
                        <span>CDEK</span>
                        <span class="nav-badge" id="cdek-badge">0</span>
                    </button>
                    
                    <button class="nav-item ${this.currentSection === 'orders' && this.currentPlatform === 'megamarket' ? 'active' : ''}" 
                            data-section="orders" data-platform="megamarket">
                        <i class="fas fa-store"></i>
                        <span>Мегамаркет</span>
                        <span class="nav-badge" id="megamarket-badge">0</span>
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

        // ✅ ИСПРАВЛЕНИЕ: Добавляем обработчики событий
        this.attachNavigationEvents();
        this.updateNavigationBadges();
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

    showNotification(message, type = 'info', duration = 5000) {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        // Используем улучшенный менеджер уведомлений если доступен
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
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
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

    showSection(sectionId, platform = null) {
        console.log(`📱 Showing section: ${sectionId}, platform: ${platform}`);
        
        // ✅ ИСПРАВЛЕНИЕ: Проверяем несохраненные изменения перед навигацией
        if (this.hasUnsavedChanges() && sectionId !== this.currentSection) {
            this.showUnsavedChangesAlert(() => {
                this.performNavigation(sectionId, platform);
            });
            return;
        }

        this.performNavigation(sectionId, platform);
    }

    performNavigation(sectionId, platform) {
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
        } else {
            console.error(`❌ Section not found: ${sectionId}-section`);
            this.showNotification(`Раздел "${sectionId}" недоступен`, 'error');
        }

        // Обновляем кнопки Telegram
        this.updateTelegramButtons(sectionId);
    }

    showUnsavedChangesAlert(callback) {
        // Показываем кастомное подтверждение вместо стандартного браузерного
        if (confirm('У вас есть несохраненные изменения. Сохранить перед переходом?')) {
            this.forceSaveChanges();
            // После сохранения продолжаем навигацию
            setTimeout(() => {
                callback();
            }, 100);
        } else {
            // Отменяем изменения и продолжаем
            this.discardChanges();
            callback();
        }
    }

    discardChanges() {
        // Сбрасываем несохраненные изменения в компонентах
        if (this.settingsComponent && this.settingsComponent.discardChanges) {
            this.settingsComponent.discardChanges();
        }
    }

    updateActiveNavigation(sectionId, platform = null) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        let activeNav;
        if (sectionId === 'orders' && platform) {
            activeNav = document.querySelector(`[data-section="orders"][data-platform="${platform}"]`);
        } else {
            activeNav = document.querySelector(`[data-section="${sectionId}"]`);
        }
        
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    loadSectionData(sectionId, platform) {
        console.log(`📊 Loading data for section: ${sectionId}, platform: ${platform}`);
        
        switch (sectionId) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'orders':
                if (this.ordersComponent && this.ordersComponent.render) {
                    this.ordersComponent.render(platform);
                } else {
                    // Fallback
                    const container = document.getElementById('orders-container');
                    if (container) {
                        const orders = this.getPlatformOrders(platform);
                        if (orders.length === 0) {
                            container.innerHTML = this.createEmptyOrdersState(platform);
                        } else {
                            container.innerHTML = this.createOrdersFallbackHTML(platform, orders);
                        }
                    }
                }
                break;
            case 'analytics':
                if (this.analyticsComponent && this.analyticsComponent.render) {
                    this.analyticsComponent.render();
                }
                break;
            case 'settings':
                if (this.settingsComponent && this.settingsComponent.render) {
                    this.settingsComponent.render();
                }
                break;
        }
    }

    handleBackButton() {
        // ✅ ИСПРАВЛЕНИЕ: Проверяем несохраненные изменения перед навигацией
        if (this.hasUnsavedChanges()) {
            this.showUnsavedChangesAlert(() => {
                this.performBackNavigation();
            });
            return;
        }

        this.performBackNavigation();
    }

    performBackNavigation() {
        if (this.currentSection !== 'dashboard') {
            this.showSection('dashboard');
        } else {
            if (this.tg) {
                this.tg.close();
            }
        }
    }

    updateTelegramButtons(sectionId) {
        if (!this.tg) return;

        if (sectionId === 'dashboard') {
            this.tg.MainButton.setText('Обновить данные');
            this.tg.MainButton.onClick(() => this.manualSync());
            this.tg.MainButton.show();
            this.tg.BackButton.hide();
        } else {
            this.tg.MainButton.hide();
            this.tg.BackButton.show();
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
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
            'total-revenue': this.formatCurrency(totalRevenue),
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

    formatCurrency(amount, currency = 'RUB') {
        if (amount === null || amount === undefined || isNaN(amount)) return '-';
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('ru-RU');
        } catch (error) {
            return '-';
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleString('ru-RU');
        } catch (error) {
            return '-';
        }
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
                            ${order.recipient || order.customerName} • ${this.formatCurrency(order.cost || order.totalAmount)}
                        </div>
                        <div class="activity-meta">
                            <span class="activity-time">${this.formatRelativeTime(order.createdDate)}</span>
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

    formatRelativeTime(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffMins < 1) return 'только что';
            if (diffMins < 60) return `${diffMins} мин. назад`;
            if (diffHours < 24) return `${diffHours} ч. назад`;
            if (diffDays === 1) return 'вчера';
            if (diffDays < 7) return `${diffDays} дн. назад`;
            
            return date.toLocaleDateString('ru-RU');
        } catch (error) {
            return '-';
        }
    }

    getStatusConfig(order) {
        const platform = order.platform.toUpperCase();
        const statusConfig = CONFIG.get(`STATUSES.${platform}.${order.statusCode}`);
        
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
            'cancelled': { text: 'Отменен', color: '#6b7280' },
            'shipped': { text: 'Отправлен', color: '#6366f1' }
        };
        
        return fallbackStatuses[order.status] || { text: order.status, color: '#6b7280' };
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
        if (this.lastSyncTime) return `Обновлено ${this.formatRelativeTime(this.lastSyncTime)}`;
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

    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        const interval = CONFIG.get('SETTINGS.SYNC_INTERVAL', 300000);
        this.syncInterval = setInterval(() => {
            if (!this.isSyncing && CONFIG.get('SETTINGS.AUTO_SYNC', true)) {
                this.manualSync();
            }
        }, interval);
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

    getPlatformOrders(platform) {
        return this.orders[platform] || [];
    }

    getOrderById(platform, orderId) {
        const orders = this.getPlatformOrders(platform);
        return orders.find(order => order.id === orderId) || null;
    }

    destroy() {
        this.stopAutoSync();
        
        // ✅ ИСПРАВЛЕНИЕ: Правильно отключаем обработчики Telegram
        if (this.tg) {
            this.tg.disableClosingConfirmation();
            this.tg.offEvent('viewportChanged');
            
            if (this.tg.BackButton && this.tg.BackButton.offClick) {
                this.tg.BackButton.offClick();
            }
            
            if (this.tg.MainButton && this.tg.MainButton.offClick) {
                this.tg.MainButton.offClick();
            }
        }
    }
}

// Безопасная инициализация приложения
let app;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM Content Loaded');
    
    try {
        app = new TexnoEdemApp();
        window.app = app; // Делаем глобально доступным
        
        // Даем время на загрузку остальных скриптов
        setTimeout(() => {
            app.init().catch(error => {
                console.error('❌ App init failed:', error);
                app.emergencyInit();
            });
        }, 100);
        
    } catch (error) {
        console.error('❌ Failed to create app instance:', error);
        // Экстренная инициализация
        const emergencyApp = new TexnoEdemApp();
        emergencyApp.emergencyInit();
        window.app = emergencyApp;
    }
});

// Глобальные функции
window.showOrderDetails = (platform, orderId) => {
    if (app && app.ordersComponent && app.ordersComponent.showOrderDetails) {
        app.ordersComponent.showOrderDetails(platform, orderId);
    } else if (app && app.modal && app.modal.showOrderDetails) {
        const order = app.getOrderById(platform, orderId);
        if (order) {
            app.modal.showOrderDetails(order);
        } else {
            app.showNotification('Заказ не найден', 'error');
        }
    }
};

window.closeModal = () => {
    if (app && app.modal && app.modal.close) {
        app.modal.close();
    }
};

// Глобальные утилиты
window.formatCurrency = (amount, currency = 'RUB') => {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

window.formatRelativeTime = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин. назад`;
        if (diffHours < 24) return `${diffHours} ч. назад`;
        if (diffDays === 1) return 'вчера';
        if (diffDays < 7) return `${diffDays} дн. назад`;
        
        return date.toLocaleDateString('ru-RU');
    } catch (error) {
        return '-';
    }
};

// Обработка закрытия приложения
window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});
