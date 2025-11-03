// js/components/orders.js - Полная реализация
class OrdersComponent {
    constructor(app) {
        this.app = app;
        this.currentPlatform = 'all';
        this.filteredOrders = [];
        this.searchQuery = '';
        this.statusFilter = 'all';
        this.sortBy = 'date_desc';
    }

    render(platform = 'all') {
        this.currentPlatform = platform;
        const container = document.getElementById('orders-container');
        if (!container) return;

        this.filteredOrders = this.filterOrders();
        container.innerHTML = this.createOrdersHTML();
        this.attachEventListeners();
    }

    createOrdersHTML() {
        const orders = this.filteredOrders;
        const platformTitle = this.getPlatformTitle();
        
        return `
            <div class="orders-header">
                <div class="platform-header">
                    <div class="platform-info">
                        <div class="platform-icon ${this.currentPlatform}">
                            <i class="fas ${this.getPlatformIcon()}"></i>
                        </div>
                        <div class="platform-details">
                            <h2>${platformTitle}</h2>
                            <p>Управление заказами и отправлениями</p>
                        </div>
                    </div>
                    <div class="orders-summary">
                        <div class="summary-item">
                            <span class="summary-value">${orders.length}</span>
                            <span class="summary-label">Всего</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-value">${this.getActiveOrdersCount()}</span>
                            <span class="summary-label">Активные</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-value">${this.getProblemOrdersCount()}</span>
                            <span class="summary-label">Проблемы</span>
                        </div>
                    </div>
                </div>
                
                <div class="orders-toolbar">
                    <div class="toolbar-left">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="orders-search" placeholder="Поиск по номеру или клиенту..." 
                                   value="${this.searchQuery}">
                        </div>
                        <div class="filter-group">
                            <select id="status-filter">
                                <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>Все статусы</option>
                                <option value="new" ${this.statusFilter === 'new' ? 'selected' : ''}>Новые</option>
                                <option value="processing" ${this.statusFilter === 'processing' ? 'selected' : ''}>В обработке</option>
                                <option value="active" ${this.statusFilter === 'active' ? 'selected' : ''}>Активные</option>
                                <option value="delivered" ${this.statusFilter === 'delivered' ? 'selected' : ''}>Доставленные</option>
                                <option value="problem" ${this.statusFilter === 'problem' ? 'selected' : ''}>Проблемы</option>
                            </select>
                        </div>
                    </div>
                    <div class="toolbar-right">
                        <div class="sort-group">
                            <span>Сортировка:</span>
                            <select id="orders-sort">
                                <option value="date_desc" ${this.sortBy === 'date_desc' ? 'selected' : ''}>Сначала новые</option>
                                <option value="date_asc" ${this.sortBy === 'date_asc' ? 'selected' : ''}>Сначала старые</option>
                                <option value="amount_desc" ${this.sortBy === 'amount_desc' ? 'selected' : ''}>По сумме ↓</option>
                                <option value="amount_asc" ${this.sortBy === 'amount_asc' ? 'selected' : ''}>По сумме ↑</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="orders-list">
                ${orders.length > 0 ? 
                    orders.map(order => this.createOrderCard(order)).join('') :
                    this.createEmptyState()
                }
            </div>

            ${this.createPagination()}
        `;
    }

    createOrderCard(order) {
        const statusConfig = this.app.getStatusConfig(order);
        const platformIcon = order.platform === 'cdek' ? 'shipping-fast' : 'store';
        
        return `
            <div class="order-card" onclick="app.ordersComponent.showOrderDetails('${order.platform}', '${order.id}')">
                <div class="order-header">
                    <div class="order-main-info">
                        <div class="order-id">
                            <i class="fas fa-${platformIcon}"></i>
                            ${order.platform === 'cdek' ? order.trackingNumber : order.orderNumber}
                        </div>
                        <div class="order-meta">
                            <span class="order-date">${formatDate(order.createdDate)}</span>
                            <span class="order-customer">${order.recipient || order.customerName}</span>
                            ${order.estimatedDelivery ? `
                                <span class="order-eta">
                                    <i class="fas fa-clock"></i>
                                    До ${formatDate(order.estimatedDelivery)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="order-status" style="--status-color: ${statusConfig.color}">
                        ${statusConfig.text}
                    </div>
                </div>

                <div class="order-content">
                    <div class="order-details">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Сумма</span>
                                <span class="detail-value">${formatCurrency(order.cost || order.totalAmount)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${order.platform === 'cdek' ? 'Маршрут' : 'Адрес'}</span>
                                <span class="detail-value">
                                    ${order.platform === 'cdek' ? 
                                        `${order.fromCity} → ${order.toCity}` : 
                                        truncateText(order.deliveryAddress, 30)
                                    }
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${order.platform === 'cdek' ? 'Отправитель' : 'Клиент'}</span>
                                <span class="detail-value">${order.sender || order.customerName}</span>
                            </div>
                        </div>
                    </div>

                    ${order.items && order.items.length > 0 ? this.createOrderItems(order.items) : ''}
                </div>

                <div class="order-footer">
                    <div class="order-actions">
                        ${this.createActionButtons(order)}
                    </div>
                </div>
            </div>
        `;
    }

    createOrderItems(items) {
        const visibleItems = items.slice(0, 2);
        const hiddenCount = items.length - visibleItems.length;
        
        return `
            <div class="order-items">
                <div class="items-header">
                    <div class="items-title">Товары</div>
                    <div class="items-count">${items.length} шт.</div>
                </div>
                <div class="items-list">
                    ${visibleItems.map(item => `
                        <div class="order-item">
                            <span class="item-name">${truncateText(item.name, 40)}</span>
                            <span class="item-quantity">${item.quantity} шт.</span>
                            <span class="item-price">${formatCurrency(item.total)}</span>
                        </div>
                    `).join('')}
                    ${hiddenCount > 0 ? `
                        <div class="order-item-more">
                            и ещё ${hiddenCount} товар(ов)
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createActionButtons(order) {
        const actions = CONFIG.ACTIONS[order.platform.toUpperCase()];
        const statusConfig = CONFIG.STATUSES[order.platform.toUpperCase()][order.statusCode];
        
        if (!statusConfig || !statusConfig.action) {
            return '<button class="btn btn-sm btn-outline" disabled>Действий нет</button>';
        }

        const actionConfig = actions[statusConfig.action];
        if (!actionConfig) return '';

        return `
            <button class="btn btn-sm btn-primary" 
                    onclick="event.stopPropagation(); app.ordersComponent.performOrderAction('${order.platform}', '${order.id}', '${statusConfig.action}')">
                <i class="fas ${actionConfig.icon}"></i>
                ${actionConfig.name}
            </button>
        `;
    }

    createEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3>Заказы не найдены</h3>
                <p>Попробуйте изменить параметры поиска или фильтры</p>
                <button class="btn btn-primary" onclick="app.ordersComponent.clearFilters()">
                    <i class="fas fa-times"></i>
                    Сбросить фильтры
                </button>
            </div>
        `;
    }

    createPagination() {
        return `
            <div class="pagination">
                <div class="pagination-info">
                    Показано ${this.filteredOrders.length} заказов
                </div>
                <div class="pagination-controls">
                    <button class="pagination-btn disabled">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="pagination-page">1</span>
                    <button class="pagination-btn disabled">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Методы фильтрации и поиска
    filterOrders() {
        let orders = this.app.orders[this.currentPlatform] || this.app.orders.all;
        
        // Поиск
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            orders = orders.filter(order => 
                (order.trackingNumber && order.trackingNumber.toLowerCase().includes(query)) ||
                (order.orderNumber && order.orderNumber.toLowerCase().includes(query)) ||
                (order.recipient && order.recipient.toLowerCase().includes(query)) ||
                (order.customerName && order.customerName.toLowerCase().includes(query))
            );
        }

        // Фильтр по статусу
        if (this.statusFilter !== 'all') {
            orders = orders.filter(order => order.status === this.statusFilter);
        }

        // Сортировка
        orders = this.sortOrders(orders);

        return orders;
    }

    sortOrders(orders) {
        return orders.sort((a, b) => {
            switch (this.sortBy) {
                case 'date_desc':
                    return new Date(b.createdDate) - new Date(a.createdDate);
                case 'date_asc':
                    return new Date(a.createdDate) - new Date(b.createdDate);
                case 'amount_desc':
                    return (b.cost || b.totalAmount || 0) - (a.cost || a.totalAmount || 0);
                case 'amount_asc':
                    return (a.cost || a.totalAmount || 0) - (b.cost || b.totalAmount || 0);
                default:
                    return 0;
            }
        });
    }

    // Вспомогательные методы
    getPlatformTitle() {
        const titles = {
            'all': 'Все заказы',
            'cdek': 'CDEK Logistics',
            'megamarket': 'Мегамаркет'
        };
        return titles[this.currentPlatform] || 'Заказы';
    }

    getPlatformIcon() {
        const icons = {
            'all': 'boxes',
            'cdek': 'shipping-fast',
            'megamarket': 'store'
        };
        return icons[this.currentPlatform] || 'boxes';
    }

    getActiveOrdersCount() {
        const orders = this.app.orders[this.currentPlatform] || this.app.orders.all;
        return orders.filter(order => 
            order.status === 'active' || order.status === 'processing'
        ).length;
    }

    getProblemOrdersCount() {
        const orders = this.app.orders[this.currentPlatform] || this.app.orders.all;
        return orders.filter(order => order.status === 'problem').length;
    }

    // Обработчики событий
    attachEventListeners() {
        const searchInput = document.getElementById('orders-search');
        const statusFilter = document.getElementById('status-filter');
        const sortSelect = document.getElementById('orders-sort');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.render(this.currentPlatform);
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.render(this.currentPlatform);
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.render(this.currentPlatform);
            });
        }
    }

    // Действия с заказами
    async performOrderAction(platform, orderId, action) {
        try {
            this.app.showLoading('Выполнение действия...');
            
            let result;
            if (platform === 'cdek') {
                result = await CDEKService.performAction(orderId, action);
            } else {
                result = await MegamarketService.performAction(orderId, action);
            }

            this.app.showNotification(result.message || 'Действие выполнено', 'success');
            
            // Обновляем данные
            await this.app.loadOrders();
            this.render(this.currentPlatform);
            
        } catch (error) {
            console.error('Error performing order action:', error);
            this.app.showNotification('Ошибка выполнения действия', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    showOrderDetails(platform, orderId) {
        const order = this.app.getOrderById(platform, orderId);
        if (order) {
            this.app.modal.showOrderDetails(order);
        }
    }

    clearFilters() {
        this.searchQuery = '';
        this.statusFilter = 'all';
        this.sortBy = 'date_desc';
        this.render(this.currentPlatform);
    }

    // Подтверждение заказа (специфично для Мегамаркет)
    async confirmOrder(platform, orderId) {
        if (platform !== 'megamarket') return;
        
        await this.performOrderAction(platform, orderId, 'confirm');
    }

    // Контакт с поддержкой
    contactSupport(platform, orderId) {
        const order = this.app.getOrderById(platform, orderId);
        if (!order) return;

        const supportInfo = {
            'cdek': { phone: '+7 495 666-66-66', email: 'support@cdek.ru' },
            'megamarket': { phone: '+7 800 600-00-00', email: 'merchant@megamarket.ru' }
        };

        const info = supportInfo[platform];
        if (info) {
            this.app.showNotification(
                `Свяжитесь с поддержкой ${platform}: ${info.phone} или ${info.email}`,
                'info'
            );
        }
    }
}
