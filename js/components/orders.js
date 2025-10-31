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
            platform: 'all',
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
                        
                        <select id="platform-filter" onchange="app.ordersComponent.setPlatformFilter(this.value)">
                            <option value="all">Все площадки</option>
                            <option value="cdek" ${this.filters.platform === 'cdek' ? 'selected' : ''}>CDEK</option>
                            <option value="megamarket" ${this.filters.platform === 'megamarket' ? 'selected' : ''}>Мегамаркет</option>
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
        }, 500); // Увеличена задержка до 500мс
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

        return `
            <div class="order-card" onclick="app.ordersComponent.showOrderDetails('${order.platform}', '${order.id}')">
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
                
                <div class="order-content">
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
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); app.ordersComponent.quickAction('${order.platform}', '${order.id}')">
                            <i class="fas fa-bolt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Рендеринг товаров заказа (для Мегамаркет)
    renderOrderItems(items) {
        if (!items || items.length === 0) return '';
        
        const displayItems = items.slice(0, 2);
        const hiddenCount = items.length - 2;
        
        return `
            <div class="order-items">
                ${displayItems.map(item => `
                    <div class="order-item">
                        <span class="item-name">${item.name}</span>
                        <span class="item-quantity">${item.quantity} × ${formatCurrency(item.price)}</span>
                    </div>
                `).join('')}
                ${hiddenCount > 0 ? `
                    <div class="order-item-more">
                        +${hiddenCount} товар(ов)
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Пагинация
    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        if (totalPages <= 1) return '';

        return `
            <div class="pagination">
                <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                        onclick="app.ordersComponent.previousPage()" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                ${this.renderPageNumbers(totalPages)}
                
                <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                        onclick="app.ordersComponent.nextPage()" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    renderPageNumbers(totalPages) {
        const pages = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="app.ordersComponent.goToPage(${i})">
                    ${i}
                </button>
            `);
        }
        
        return pages.join('');
    }

    // Фильтрация и сортировка
    getFilteredOrders() {
        let orders = this.app.orders[this.app.currentPlatform] || [];
        
        // Применяем фильтры
        if (this.filters.status !== 'all') {
            orders = orders.filter(order => order.status === this.filters.status);
        }
        
        if (this.filters.platform !== 'all') {
            orders = orders.filter(order => order.platform === this.filters.platform);
        }
        
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            orders = orders.filter(order => 
                (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm)) ||
                (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm)) ||
                (order.customerName && order.customerName.toLowerCase().includes(searchTerm)) ||
                (order.recipient && order.recipient.toLowerCase().includes(searchTerm)) ||
                (order.fromCity && order.fromCity.toLowerCase().includes(searchTerm)) ||
                (order.toCity && order.toCity.toLowerCase().includes(searchTerm))
            );
        }
        
        // Применяем сортировку
        orders.sort((a, b) => {
            let aValue = a[this.sortField];
            let bValue = b[this.sortField];
            
            if (this.sortField === 'createdDate') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }
            
            if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        
        return orders;
    }

    getPaginatedOrders(orders) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return orders.slice(startIndex, startIndex + this.itemsPerPage);
    }

    // Управление фильтрами
    setStatusFilter(status) {
        this.filters.status = status;
        this.currentPage = 1;
        // Задержка для предотвращения мерцания
        setTimeout(() => this.render(), 50);
    }

    setPlatformFilter(platform) {
        this.filters.platform = platform;
        this.currentPage = 1;
        setTimeout(() => this.render(), 50);
    }

    setSearchFilter(searchTerm) {
        this.filters.search = searchTerm;
        this.currentPage = 1;
        setTimeout(() => this.render(), 50);
    }

    setSortField(field) {
        this.sortField = field;
        setTimeout(() => this.render(), 50);
    }

    toggleSortDirection() {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        setTimeout(() => this.render(), 50);
    }

    // Управление пагинацией
    goToPage(page) {
        this.currentPage = page;
        this.renderOrdersList();
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderOrdersList();
        }
    }

    nextPage() {
        const totalItems = this.getFilteredOrders().length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderOrdersList();
        }
    }

    // Детали заказа
    async showOrderDetails(platform, orderId) {
        try {
            this.app.showLoading();
            
            let orderDetails;
            if (platform === 'cdek') {
                orderDetails = await CDEKService.getOrderDetails(orderId);
            } else {
                orderDetails = await MegamarketService.getOrderDetails(orderId);
            }
            
            this.app.modal.showOrderDetails(orderDetails);
        } catch (error) {
            console.error('Error loading order details:', error);
            this.app.showError('Ошибка загрузки деталей заказа');
        } finally {
            this.app.hideLoading();
        }
    }

    // Быстрые действия
    quickAction(platform, orderId) {
        this.app.showNotification(`Быстрое действие для заказа ${orderId}`, 'info');
    }

    // Обновление списка заказов
    async refreshOrders() {
        if (this.app.isSyncing) {
            this.app.showNotification('Синхронизация уже выполняется', 'warning');
            return;
        }
        
        // Используем ручную синхронизацию для показа уведомления
        await this.app.manualSync();
    }

    // Экспорт заказов
    exportOrders() {
        const filteredOrders = this.getFilteredOrders();
        const exportData = {
            exportedAt: new Date().toISOString(),
            filters: this.filters,
            orders: filteredOrders
        };
        
        this.downloadJSON(exportData, `texno-edem-orders-${new Date().toISOString().split('T')[0]}.json`);
        this.app.showNotification('Заказы экспортированы', 'success');
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Вспомогательные методы
    getFallbackStatusConfig(status) {
        const fallbackConfigs = {
            'new': { text: 'Новый', color: '#3b82f6' },
            'processing': { text: 'В обработке', color: '#f59e0b' },
            'active': { text: 'Активный', color: '#8b5cf6' },
            'shipped': { text: 'Отправлен', color: '#6366f1' },
            'delivered': { text: 'Доставлен', color: '#10b981' },
            'problem': { text: 'Проблема', color: '#ef4444' },
            'cancelled': { text: 'Отменен', color: '#6b7280' }
        };
        
        return fallbackConfigs[status] || { text: status, color: '#6b7280' };
    }

    updateOrdersBadge() {
        const newOrdersCount = (this.app.orders.all || []).filter(order => 
            order.status === 'new'
        ).length;
        
        if (this.app.navigation) {
            this.app.navigation.updateOrdersBadge(newOrdersCount);
        }
    }

    // Рендеринг недавней активности (для дашборда)
    renderRecentActivity() {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        const recentOrders = (this.app.orders.all || [])
            .slice(0, 5)
            .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
        
        container.innerHTML = `
            <div class="recent-activity-card">
                <div class="card-header">
                    <h3>Недавняя активность</h3>
                    <button class="btn btn-outline btn-sm" onclick="app.showSection('orders')">
                        Все заказы
                    </button>
                </div>
                
                <div class="activity-list">
                    ${recentOrders.map(order => this.renderActivityItem(order)).join('')}
                    
                    ${recentOrders.length === 0 ? `
                        <div class="empty-activity">
                            <i class="fas fa-clock"></i>
                            <p>Нет недавней активности</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderActivityItem(order) {
        const statusConfig = CONFIG.STATUSES[order.platform.toUpperCase()]?.[order.statusCode] || 
                           this.getFallbackStatusConfig(order.status);
        
        return `
            <div class="activity-item" onclick="app.ordersComponent.showOrderDetails('${order.platform}', '${order.id}')">
                <div class="activity-icon" style="background: ${statusConfig.color}">
                    <i class="fas fa-${order.platform === 'cdek' ? 'shipping-fast' : 'store'}"></i>
                </div>
                
                <div class="activity-content">
                    <div class="activity-title">
                        ${order.platform === 'cdek' ? order.trackingNumber : `Заказ #${order.orderNumber}`}
                    </div>
                    <div class="activity-description">
                        ${order.platform === 'cdek' ? 
                            `${order.fromCity} → ${order.toCity}` : 
                            order.customerName
                        }
                    </div>
                    <div class="activity-time">
                        ${formatRelativeTime(order.createdDate)}
                    </div>
                </div>
                
                <div class="activity-status" style="color: ${statusConfig.color}">
                    ${statusConfig.text}
                </div>
            </div>
        `;
    }

    renderOrdersList() {
        const container = document.getElementById('orders-list');
        if (!container) return;

        const filteredOrders = this.getFilteredOrders();
        const paginatedOrders = this.getPaginatedOrders(filteredOrders);
        
        container.innerHTML = this.renderOrdersListContent(paginatedOrders);
        
        // Обновляем пагинацию
        const paginationContainer = container.parentElement.querySelector('.pagination');
        if (paginationContainer) {
            paginationContainer.outerHTML = this.renderPagination(filteredOrders.length);
        }
    }
}
