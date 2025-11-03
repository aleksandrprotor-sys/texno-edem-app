// js/app.js - Полностью исправленная версия
class TexnoEdemApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPlatform = 'cdek';
        this.orders = {
            cdek: [],
            megamarket: [],
            all: []
        };
        this.user = null;
        this.isLoading = false;
        this.isSyncing = false;
        
        console.log('🚀 TEXNO EDEM App initialized');
    }

    async init() {
        try {
            console.log('🔧 Starting app initialization...');
            this.showLoading('Загрузка TEXNO EDEM...');

            // Инициализация базового UI
            this.renderBasicUI();
            
            // Загрузка данных
            await this.loadInitialData();
            
            // Показываем дашборд
            this.showSection('dashboard');
            
            console.log('✅ App initialized successfully');
            this.showNotification('Система готова к работе', 'success');
            
        } catch (error) {
            console.error('❌ App init failed:', error);
            this.emergencyInit();
        } finally {
            this.hideLoading();
        }
    }

    renderBasicUI() {
        console.log('🎨 Rendering basic UI...');
        
        // Header
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
                        <div class="user-info">
                            <div class="user-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="user-details">
                                <div class="user-name">${this.getUserName()}</div>
                                <div class="user-role">Менеджер</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Navigation
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
                            <span class="nav-badge" id="cdek-badge">0</span>
                        </button>
                        <button class="nav-item" data-section="orders" data-platform="megamarket">
                            <i class="fas fa-store"></i>
                            <span>Мегамаркет</span>
                            <span class="nav-badge" id="megamarket-badge">0</span>
                        </button>
                        <button class="nav-item" data-section="analytics">
                            <i class="fas fa-chart-bar"></i>
                            <span>Аналитика</span>
                        </button>
                        <button class="nav-item" data-section="settings">
                            <i class="fas fa-cog"></i>
                            <span>Настройки</span>
                        </button>
                    </div>
                </div>
            `;

            // Добавляем обработчики навигации
            this.attachNavigationEvents();
        }

        // Main content area
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div id="dashboard-section" class="section active">
                    <div class="dashboard">
                        <div class="dashboard-header">
                            <h1>Дашборд</h1>
                            <button class="btn btn-primary" onclick="app.manualSync()">
                                <i class="fas fa-sync-alt"></i> Обновить
                            </button>
                        </div>
                        <div class="stats-grid" id="stats-grid"></div>
                        <div class="dashboard-content">
                            <div class="recent-orders">
                                <h2>Последние заказы</h2>
                                <div id="recent-orders-list" class="orders-list compact"></div>
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
                </div>

                <div id="orders-section" class="section">
                    <div class="orders-section">
                        <div class="section-header">
                            <h1 id="orders-title">Заказы</h1>
                            <div class="header-actions">
                                <button class="btn btn-outline" onclick="app.exportOrders()">
                                    <i class="fas fa-download"></i> Экспорт
                                </button>
                                <button class="btn btn-primary" onclick="app.manualSync()">
                                    <i class="fas fa-sync-alt"></i> Обновить
                                </button>
                            </div>
                        </div>
                        <div id="orders-container" class="orders-container"></div>
                    </div>
                </div>

                <div id="analytics-section" class="section">
                    <div class="analytics-section">
                        <div class="section-header">
                            <h1>Аналитика</h1>
                            <button class="btn btn-primary" onclick="app.manualSync()">
                                <i class="fas fa-sync-alt"></i> Обновить
                            </button>
                        </div>
                        <div id="analytics-container" class="analytics-container">
                            <div class="analytics-grid">
                                <div class="analytics-card">
                                    <h3>Статистика по платформам</h3>
                                    <div class="platform-stats">
                                        <div class="platform-stat">
                                            <span class="platform-name">CDEK</span>
                                            <span class="platform-count" id="cdek-stats">0 заказов</span>
                                        </div>
                                        <div class="platform-stat">
                                            <span class="platform-name">Мегамаркет</span>
                                            <span class="platform-count" id="megamarket-stats">0 заказов</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="analytics-card">
                                    <h3>Статусы заказов</h3>
                                    <div id="status-stats" class="status-stats"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="settings-section" class="section">
                    <div class="settings-section">
                        <div class="section-header">
                            <h1>Настройки</h1>
                            <button class="btn btn-primary" onclick="app.saveSettings()">
                                <i class="fas fa-save"></i> Сохранить
                            </button>
                        </div>
                        <div id="settings-container" class="settings-container">
                            <div class="settings-group">
                                <h3>Профиль пользователя</h3>
                                <div class="form-group">
                                    <label>Имя пользователя</label>
                                    <input type="text" class="form-control" id="user-name" value="${this.getUserName()}">
                                </div>
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" class="form-control" id="user-email" value="${this.user?.email || 'demo@texno-edem.ru'}">
                                </div>
                            </div>
                            <div class="settings-group">
                                <h3>Настройки приложения</h3>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="auto-sync" checked> Автосинхронизация
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="notifications" checked> Уведомления
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    attachNavigationEvents() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                const platform = item.getAttribute('data-platform');
                
                if (section === 'orders' && platform) {
                    this.showSection('orders', platform);
                } else {
                    this.showSection(section);
                }
            });
        });
    }

    showSection(section, platform = null) {
        console.log(`📱 Showing section: ${section}, platform: ${platform}`);
        
        // Обновляем текущую секцию
        this.currentSection = section;
        if (platform) {
            this.currentPlatform = platform;
        }

        // Скрываем все секции
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Показываем активную секцию
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Обновляем навигацию
        this.updateNavigation();

        // Загружаем данные для секции
        this.loadSectionData(section, platform);
    }

    updateNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            
            const itemSection = item.getAttribute('data-section');
            const itemPlatform = item.getAttribute('data-platform');
            
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

    loadSectionData(section, platform) {
        switch (section) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'orders':
                this.renderOrders(platform);
                break;
            case 'analytics':
                this.updateAnalytics();
                break;
            case 'settings':
                // Настройки уже зарендерены
                break;
        }
    }

    async loadInitialData() {
        console.log('📦 Loading initial data...');
        
        // Генерируем демо-данные
        this.generateDemoData();
        
        // Обновляем UI
        this.updateDashboard();
        this.updateNavigationBadges();
        
        console.log('✅ Initial data loaded');
    }

    generateDemoData() {
        console.log('🎲 Generating demo data...');
        
        // CDEK заказы
        this.orders.cdek = this.generateDemoCDEKOrders();
        
        // Мегамаркет заказы
        this.orders.megamarket = this.generateDemoMegamarketOrders();
        
        // Все заказы
        this.orders.all = [...this.orders.cdek, ...this.orders.megamarket]
            .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    }

    generateDemoCDEKOrders() {
        const statuses = ['new', 'processing', 'active', 'delivered', 'problem'];
        const cities = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Казань'];
        const names = ['Иван Иванов', 'Мария Петрова', 'Алексей Смирнов', 'Елена Козлова', 'Дмитрий Попов'];
        
        return Array.from({ length: 12 }, (_, i) => {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const fromCity = 'Москва';
            let toCity;
            do {
                toCity = cities[Math.floor(Math.random() * cities.length)];
            } while (toCity === fromCity);

            return {
                id: `cdek-${i + 1}`,
                platform: 'cdek',
                trackingNumber: `CDEK${1000000000 + i}`,
                status: status,
                fromCity: fromCity,
                toCity: toCity,
                weight: (Math.random() * 5 + 0.5).toFixed(1),
                cost: Math.floor(Math.random() * 5000) + 300,
                sender: 'ООО "ТЕХНО ЭДЕМ"',
                recipient: names[Math.floor(Math.random() * names.length)],
                createdDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                estimatedDelivery: status === 'delivered' ? null : 
                    new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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

        return Array.from({ length: 8 }, (_, i) => {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const product = products[Math.floor(Math.random() * products.length)];
            const quantity = Math.floor(Math.random() * 2) + 1;

            return {
                id: `mm-${i + 1}`,
                platform: 'megamarket', 
                orderNumber: `MM${100000 + i}`,
                status: status,
                totalAmount: product.price * quantity,
                customerName: names[Math.floor(Math.random() * names.length)],
                customerPhone: `+7 9${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90) + 10}`,
                deliveryAddress: addresses[Math.floor(Math.random() * addresses.length)],
                createdDate: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        name: product.name,
                        quantity: quantity,
                        price: product.price
                    }
                ]
            };
        });
    }

    updateDashboard() {
        this.updateStatsGrid();
        this.updateRecentOrders();
    }

    updateStatsGrid() {
        const container = document.getElementById('stats-grid');
        if (!container) return;

        const totalOrders = this.orders.all.length;
        const totalRevenue = this.orders.all.reduce((sum, order) => sum + (order.cost || order.totalAmount || 0), 0);
        const problemOrders = this.orders.all.filter(order => order.status === 'problem').length;
        const successRate = totalOrders > 0 ? Math.round((totalOrders - problemOrders) / totalOrders * 100) : 0;

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="background: #3b82f6;">
                    <i class="fas fa-box"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${totalOrders}</div>
                    <div class="stat-label">Всего заказов</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: #10b981;">
                    <i class="fas fa-ruble-sign"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${this.formatCurrency(totalRevenue)}</div>
                    <div class="stat-label">Общая выручка</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: #f59e0b;">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${successRate}%</div>
                    <div class="stat-label">Успешных заказов</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: #ef4444;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${problemOrders}</div>
                    <div class="stat-label">Проблемные заказы</div>
                </div>
            </div>
        `;
    }

    updateRecentOrders() {
        const container = document.getElementById('recent-orders-list');
        if (!container) return;

        const recentOrders = this.orders.all.slice(0, 5);
        
        if (recentOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
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
                <div class="order-item" onclick="app.showOrderDetails('${order.platform}', '${order.id}')">
                    <div class="order-main">
                        <div class="order-platform platform-${order.platform}">
                            <i class="fas fa-${platformIcon}"></i>
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
                            ${statusConfig.text}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderOrders(platform) {
        const container = document.getElementById('orders-container');
        const title = document.getElementById('orders-title');
        
        if (!container || !title) return;

        // Обновляем заголовок
        title.textContent = platform === 'cdek' ? 'Отправления CDEK' : 'Заказы Мегамаркет';

        const orders = this.getPlatformOrders(platform);
        
        if (orders.length === 0) {
            container.innerHTML = this.createEmptyOrdersState(platform);
        } else {
            container.innerHTML = this.createOrdersHTML(platform, orders);
        }
    }

    createOrdersHTML(platform, orders) {
        return `
            <div class="orders-content">
                <div class="orders-toolbar">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Поиск по заказам..." 
                               oninput="app.handleOrdersSearch(event, '${platform}')">
                    </div>
                    
                    <div class="filter-group">
                        <select class="form-control" onchange="app.handleStatusFilter(event, '${platform}')">
                            <option value="all">Все статусы</option>
                            <option value="new">Новые</option>
                            <option value="processing">В обработке</option>
                            <option value="active">Активные</option>
                            <option value="delivered">Доставленные</option>
                            <option value="problem">Проблемные</option>
                        </select>
                    </div>
                </div>

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

                <div class="orders-list">
                    ${orders.map(order => `
                        <div class="order-card" onclick="app.showOrderDetails('${order.platform}', '${order.id}')">
                            <div class="order-header">
                                <div class="order-title">
                                    <div class="order-number">
                                        <i class="fas fa-${order.platform === 'cdek' ? 'shipping-fast' : 'store'}"></i>
                                        ${order.platform === 'cdek' ? order.trackingNumber : order.orderNumber}
                                    </div>
                                    <div class="order-customer">
                                        ${order.platform === 'cdek' ? order.recipient : order.customerName}
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
                                                onclick="event.stopPropagation(); app.showOrderDetails('${order.platform}', '${order.id}')"
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
                </div>
            </div>
        `;
    }

    updateAnalytics() {
        this.updatePlatformStats();
        this.updateStatusStats();
    }

    updatePlatformStats() {
        const cdekElement = document.getElementById('cdek-stats');
        const megamarketElement = document.getElementById('megamarket-stats');
        
        if (cdekElement) cdekElement.textContent = `${this.orders.cdek.length} заказов`;
        if (megamarketElement) megamarketElement.textContent = `${this.orders.megamarket.length} заказов`;
    }

    updateStatusStats() {
        const container = document.getElementById('status-stats');
        if (!container) return;

        const statusCounts = {};
        this.orders.all.forEach(order => {
            statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        });

        container.innerHTML = Object.entries(statusCounts).map(([status, count]) => {
            const config = this.getStatusConfig({ status });
            return `
                <div class="status-stat">
                    <span class="status-name">${config.text}</span>
                    <span class="status-count">${count}</span>
                </div>
            `;
        }).join('');
    }

    updateNavigationBadges() {
        const cdekBadge = document.getElementById('cdek-badge');
        const megamarketBadge = document.getElementById('megamarket-badge');
        
        if (cdekBadge) {
            const cdekNew = this.orders.cdek.filter(order => order.status === 'new').length;
            cdekBadge.textContent = cdekNew;
            cdekBadge.style.display = cdekNew > 0 ? 'flex' : 'none';
        }
        
        if (megamarketBadge) {
            const megamarketNew = this.orders.megamarket.filter(order => order.status === 'new').length;
            megamarketBadge.textContent = megamarketNew;
            megamarketBadge.style.display = megamarketNew > 0 ? 'flex' : 'none';
        }
    }

    // Вспомогательные методы
    getPlatformOrders(platform) {
        return this.orders[platform] || [];
    }

    getOrderById(platform, orderId) {
        const orders = this.getPlatformOrders(platform);
        return orders.find(order => order.id === orderId);
    }

    getStatusConfig(order) {
        const statusConfigs = {
            new: { text: 'Новый', color: '#3498db' },
            processing: { text: 'В обработке', color: '#f39c12' },
            active: { text: 'Активный', color: '#2ecc71' },
            shipped: { text: 'Отправлен', color: '#2ecc71' },
            delivered: { text: 'Доставлен', color: '#27ae60' },
            problem: { text: 'Проблема', color: '#e74c3c' }
        };

        return statusConfigs[order.status] || { text: order.status, color: '#95a5a6' };
    }

    formatCurrency(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) return '-';
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatRelativeTime(dateString) {
        if (!dateString) return '-';
        try {
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
        } catch (error) {
            return '-';
        }
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU');
        } catch (error) {
            return '-';
        }
    }

    getUserName() {
        if (this.user && this.user.firstName) {
            return `${this.user.firstName}${this.user.lastName ? ' ' + this.user.lastName : ''}`;
        }
        return 'Демо Пользователь';
    }

    // UI методы
    showLoading(message = 'Загрузка...') {
        this.isLoading = true;
        let loader = document.getElementById('loading-overlay');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loading-overlay';
            loader.className = 'loading-overlay';
            loader.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">${message}</div>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.classList.add('active');
    }

    hideLoading() {
        this.isLoading = false;
        const loader = document.getElementById('loading-overlay');
        if (loader) {
            loader.classList.remove('active');
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        // Создаем простое уведомление
        const notification = document.createElement('div');
        notification.className = `simple-notification simple-notification-${type}`;
        notification.innerHTML = `
            <div class="simple-notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Показываем
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Убираем через duration
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
            container.innerHTML = this.createOrdersHTML(platform, orders);
        }
    }

    showOrderDetails(platform, orderId) {
        const order = this.getOrderById(platform, orderId);
        if (order) {
            this.showOrderModal(order);
        } else {
            this.showNotification('Заказ не найден', 'error');
        }
    }

    showOrderModal(order) {
        const statusConfig = this.getStatusConfig(order);
        
        const modalHTML = `
            <div class="modal-backdrop" onclick="app.hideModal()"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">Детали заказа</h3>
                    <button class="modal-close" onclick="app.hideModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
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
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="app.hideModal()">Закрыть</button>
                </div>
            </div>
        `;

        // Создаем модальное окно
        let modal = document.getElementById('order-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'order-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = modalHTML;
        this.showModal(modal);
    }

    showModal(modalElement) {
        modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    // Действия
    async manualSync() {
        if (this.isSyncing) {
            this.showNotification('Синхронизация уже выполняется', 'info');
            return;
        }

        try {
            this.isSyncing = true;
            this.showNotification('Синхронизация данных...', 'info');

            // Имитация синхронизации
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Обновляем данные
            this.generateDemoData();
            
            // Обновляем UI
            this.updateDashboard();
            this.updateNavigationBadges();
            
            if (this.currentSection === 'orders') {
                this.renderOrders(this.currentPlatform);
            }
            if (this.currentSection === 'analytics') {
                this.updateAnalytics();
            }

            this.showNotification('Данные успешно обновлены', 'success');

        } catch (error) {
            console.error('Sync error:', error);
            this.showNotification('Ошибка синхронизации', 'error');
        } finally {
            this.isSyncing = false;
        }
    }

    exportOrders() {
        const orders = this.getPlatformOrders(this.currentPlatform);
        const data = JSON.stringify(orders, null, 2);
        this.downloadFile(data, `orders-${this.currentPlatform}-${new Date().toISOString().split('T')[0]}.json`);
        this.showNotification(`Экспортировано ${orders.length} заказов`, 'success');
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

    saveSettings() {
        this.showNotification('Настройки сохранены', 'success');
    }

    emergencyInit() {
        console.log('🚨 Emergency initialization');
        this.renderBasicUI();
        this.generateDemoData();
        this.showNotification('Приложение запущено в безопасном режиме', 'warning');
    }
}

// Глобальная инициализация - ТОЛЬКО ОДИН РАЗ
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM Content Loaded - Starting app...');
    
    try {
        // Создаем экземпляр приложения только если его нет
        if (!window.app) {
            window.app = new TexnoEdemApp();
        }
        
        // Даем время на загрузку всех скриптов
        setTimeout(() => {
            window.app.init().catch(error => {
                console.error('❌ App init failed:', error);
                window.app.emergencyInit();
            });
        }, 200);
        
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        // Аварийная инициализация
        if (!window.app) {
            window.app = new TexnoEdemApp();
        }
        window.app.emergencyInit();
    }
});

// Глобальные функции
window.showOrderDetails = (platform, orderId) => {
    if (window.app) {
        window.app.showOrderDetails(platform, orderId);
    }
};

window.closeModal = () => {
    if (window.app) {
        window.app.hideModal();
    }
};
