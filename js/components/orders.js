// Компонент управления заказами для TEXNO EDEM
class OrdersComponent {
    constructor(app) {
        this.app = app;
        this.currentPage = 1;
        this.itemsPerPage = CONFIG.SETTINGS.ITEMS_PER_PAGE;
        this.sortField = 'createdDate';
        this.sortDirection = 'desc';
        this.filters = {
            status: 'all',
            search: ''
        };
        
        // Флаги для предотвращения мерцания
        this.isRendering = false;
        this.lastRenderTime = 0;
        this.searchTimeout = null;
    }

    // Основной метод рендеринга
    render() {
        // Защита от множественных рендеров
        if (this.isRendering) {
            console.log('Orders render already in progress, skipping...');
            return;
        }
        
        const now = Date.now();
        if (now - this.lastRenderTime < 500) {
            console.log('Orders render too frequent, skipping...');
            return;
        }
        
        this.isRendering = true;
        this.lastRenderTime = now;
        
        try {
            console.log('Rendering orders...');
            this.renderOrdersContainer();
            this.renderOrdersList();
            this.updateOrdersBadge();
        } catch (error) {
            console.error('Error rendering orders:', error);
        } finally {
            // Сбрасываем флаг с задержкой
            setTimeout(() => {
                this.isRendering = false;
            }, 100);
        }
    }

    // Рендеринг контейнера заказов
    renderOrdersContainer() {
        const container = document.getElementById('orders-container');
        if (!container) return;

        const filteredOrders = this.getFilteredOrders();
        const paginatedOrders = this.getPaginatedOrders(filteredOrders);
        
        container.innerHTML = `
            <div class="orders-toolbar">
                <div class="toolbar-left">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input 
                            type="text" 
                            id="orders-search" 
                            placeholder="Поиск по заказам..." 
                            value="${this.filters.search}"
                            oninput="app.ordersComponent.debouncedSearch(this.value)"
                        >
                    </div>
                    
                    <div class="filter-group">
                        <select id="status-filter" onchange="app.ordersComponent.setStatusFilter(this.value)">
                            <option value="all">Все статусы</option>
                            <option value="new" ${this.filters.status === 'new' ? 'selected' : ''}>Новые</option>
                            <option value="processing" ${this.filters.status === 'processing' ? 'selected' : ''}>В обработке</option>
                            <option value="active" ${this.filters.status === 'active' ? 'selected' : ''}>Активные</option>
                            <option value="shipped" ${this.filters.status === 'shipped' ? 'selected' : ''}>Отправленные</option>
                            <option value="delivered" ${this.filters.status === 'delivered' ? 'selected' : ''}>Доставленные</option>
                            <option value="problem" ${this.filters.status === 'problem' ? 'selected' : ''}>Проблемные</option>
                            <option value="cancelled" ${this.filters.status === 'cancelled' ? 'selected' : ''}>Отмененные</option>
                        </select>
                    </div>
                </div>
                
                <div class="toolbar-right">
                    <div class="sort-group">
                        <select onchange="app.ordersComponent.setSortField(this.value)">
                            <option value="createdDate" ${this.sortField === 'createdDate' ? 'selected' : ''}>По дате</option>
                            <option value="totalAmount" ${this.sortField === 'totalAmount' ? 'selected' : ''}>По сумме</option>
                            <option value="status" ${this.sortField === 'status' ? 'selected' : ''}>По статусу</option>
                        </select>
                        
                        <button class="btn btn-outline btn-sm" onclick="app.ordersComponent.toggleSortDirection()">
                            <i class="fas fa-${this.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}"></i>
                        </button>
                    </div>
                    
                    <button class="btn btn-primary btn-sm" onclick="app.ordersComponent.exportOrders()">
                        <i class="fas fa-download"></i> Экспорт
                    </button>
                    
                    <button class="btn btn-secondary btn-sm" onclick="app.ordersComponent.refreshOrders()" ${this.app.isSyncing ? 'disabled' : ''}>
                        <i class="fas fa-sync ${this.app.isSyncing ? 'fa-spin' : ''}"></i>
                    </button>
                </div>
            </div>
            
            <div class="orders-stats">
                <div class="stat-item">
                    <span class="stat-label">Всего заказов:</span>
                    <span class="stat-value">${filteredOrders.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Новых:</span>
                    <span class="stat-value">${filteredOrders.filter(o => o.status === 'new').length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Проблемных:</span>
                    <span class="stat-value">${filteredOrders.filter(o => o.status === 'problem').length}</span>
                </div>
            </div>
            
            <div class="orders-list" id="orders-list">
                ${this.renderOrdersListContent(paginatedOrders)}
            </div>
            
            ${this.renderPagination(filteredOrders.length)}
        `;
        
        // Инициализация debounced search
        this.initDebouncedSearch();
    }

    // Debounced поиск для предотвращения множественных рендеров
    initDebouncedSearch() {
        this.debouncedSearch = this.debounce((searchTerm) => {
            console.log('Searching:', searchTerm);
            this.setSearchFilter(searchTerm);
        }, 500);
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

    // Рендеринг списка заказов
    renderOrdersListContent(orders) {
        if (orders.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>Заказы не найдены</h3>
                    <p>Попробуйте изменить параметры фильтрации</p>
                </div>
            `;
        }

        return orders.map(order => this.renderOrderCard(order)).join('');
    }

    // Рендеринг карточки заказа
    renderOrderCard(order) {
        const statusConfig = CONFIG.STATUSES[order.platform.toUpperCase()]?.[order.statusCode] || 
                           this.getFallbackStatusConfig(order.status);
        
        const platformConfig = {
            cdek: { icon: 'shipping-fast', color: 'cdek', badge: 'CDEK' },
            megamarket: { icon: 'store', color: 'megamarket', badge: 'Мегамаркет' }
        }[order.platform];

        const availableActions = this.getAvailableActions(order);

        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-main-info">
                        <div class="order-id">
                            ${order.platform === 'cdek' ? 
                                `<i class="fas fa-barcode"></i> ${order.trackingNumber}` : 
                                `<i class="fas fa-hashtag"></i> Заказ #${order.orderNumber}`
                            }
                        </div>
                        <div class="order-platform-badge platform-${platformConfig.color}">
                            <i class="fas fa-${platformConfig.icon}"></i> ${platformConfig.badge}
                        </div>
                    </div>
                    <div class="order-status status-${order.status}" style="--status-color: ${statusConfig.color}">
                        ${statusConfig.text}
                    </div>
                </div>
                
                <div class="order-content" onclick="app.ordersComponent.showOrderDetails('${order.platform}', '${order.id}')">
                    <div class="order-details">
                        <div class="detail-row">
                            <div class="detail-item">
                                <span class="detail-label">${order.platform === 'cdek' ? 'Маршрут' : 'Клиент'}</span>
                                <span class="detail-value">
                                    ${order.platform === 'cdek' ? 
                                        `${order.fromCity} → ${order.toCity}` : 
                                        order.customerName
                                    }
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${order.platform === 'cdek' ? 'Вес' : 'Сумма'}</span>
                                <span class="detail-value">
                                    ${order.platform === 'cdek' ? 
                                        `${order.weight} кг` : 
                                        formatCurrency(order.totalAmount)
                                    }
                                </span>
                            </div>
                        </div>
                        
                        <div class="detail-row">
                            <div class="detail-item">
                                <span class="detail-label">Создан</span>
                                <span class="detail-value">${formatDate(order.createdDate)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">${order.platform === 'cdek' ? 'Получатель' : 'Телефон'}</span>
                                <span class="detail-value">
                                    ${order.platform === 'cdek' ? 
                                        order.recipient : 
                                        (order.customerPhone || 'Не указан')
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    ${order.platform === 'megamarket' ? this.renderOrderItems(order.items) : ''}
                </div>
                
                <div class="order-footer">
                    <div class="order-timeline">
                        <div class="timeline-item ${['delivered', 'shipped'].includes(order.status) ? 'completed' : ''}">
                            <div class="timeline-dot"></div>
                            <span class="timeline-text">Создан: ${formatDateTime(order.createdDate)}</span>
                        </div>
                        ${order.deliveredDate ? `
                        <div class="timeline-item completed">
                            <div class="timeline-dot"></div>
                            <span class="timeline-text">Доставлен: ${formatDateTime(order.deliveredDate)}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="order-actions">
                        ${availableActions.length > 0 ? `
                            <div class="action-dropdown">
                                <button class="btn btn-outline btn-sm action-toggle">
                                    <i class="fas fa-bolt"></i>
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                                <div class="action-menu">
                                    ${availableActions.map(action => `
                                        <button class="action-item" onclick="event.stopPropagation(); performOrderAction('${order.platform}', '${order.id}', '${action.method}')">
                                            <i class="fas ${action.icon}"></i>
                                            ${action.name}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); app.ordersComponent.showOrderDetails('${order.platform}', '${order.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Получение доступных действий для заказа
    getAvailableActions(order) {
        const statusConfig = CONFIG.STATUSES[order.platform.toUpperCase()]?.[order.statusCode];
        if (!statusConfig || !statusConfig.action) return [];

        const platformActions = CONFIG.ACTIONS[order.platform.toUpperCase()];
        const actionKey = statusConfig.action;
        
        if (platformActions && platformActions[actionKey]) {
            return [platformActions[actionKey]];
        }

        return [];
    }

    // Остальные методы остаются без изменений...
    // [renderOrderItems, renderPagination, renderPageNumbers, и т.д.]
    // Полный код будет в следующем сообщении...
