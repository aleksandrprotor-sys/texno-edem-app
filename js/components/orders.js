// Компонент управления заказами
class OrdersComponent {
    constructor(app) {
        this.app = app;
        this.currentPlatform = 'all';
        this.currentFilter = 'all';
        this.currentSort = 'date-desc';
        this.init();
    }

    init() {
        console.log('✅ OrdersComponent initialized');
    }

    render(platform = null) {
        if (platform) {
            this.currentPlatform = platform;
        }
        
        const container = document.getElementById('orders-container');
        if (!container) return;
        
        container.innerHTML = this.generateOrdersHTML();
        this.attachEventListeners();
        this.renderOrdersList();
    }

    generateOrdersHTML() {
        return `
            <div class="orders-controls">
                <div class="platform-filter">
                    <button class="platform-btn ${this.currentPlatform === 'all' ? 'active' : ''}" 
                            onclick="app.components.orders.setPlatform('all')">
                        <i class="fas fa-layer-group"></i>
                        Все платформы
                        <span class="platform-count">${this.app.orders.all.length}</span>
                    </button>
                    <button class="platform-btn ${this.currentPlatform === 'cdek' ? 'active' : ''}" 
                            onclick="app.components.orders.setPlatform('cdek')">
                        <i class="fas fa-shipping-fast"></i>
                        CDEK
                        <span class="platform-count">${this.app.orders.cdek.length}</span>
                    </button>
                    <button class="platform-btn ${this.currentPlatform === 'megamarket' ? 'active' : ''}" 
                            onclick="app.components.orders.setPlatform('megamarket')">
                        <i class="fas fa-store"></i>
                        Мегамаркет
                        <span class="platform-count">${this.app.orders.megamarket.length}</span>
                    </button>
                </div>
                
                <div class="orders-filters">
                    <div class="filter-group">
                        <label>Статус:</label>
                        <select id="status-filter" onchange="app.components.orders.setFilter(this.value)">
                            <option value="all">Все статусы</option>
                            <option value="new">Новые</option>
                            <option value="processing">В обработке</option>
                            <option value="active">Активные</option>
                            <option value="delivered">Доставленные</option>
                            <option value="problem">Проблемные</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Сортировка:</label>
                        <select id="sort-orders" onchange="app.components.orders.setSort(this.value)">
                            <option value="date-desc">Сначала новые</option>
                            <option value="date-asc">Сначала старые</option>
                            <option value="amount-desc">Сумма (убыв.)</option>
                            <option value="amount-asc">Сумма (возр.)</option>
                        </select>
                    </div>
                    
                    <div class="filter-actions">
                        <button class="btn btn-outline" onclick="app.manualSync()">
                            <i class="fas fa-sync"></i>
                            Обновить
                        </button>
                        <button class="btn btn-primary" onclick="app.components.orders.exportOrders()">
                            <i class="fas fa-download"></i>
                            Экспорт
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="orders-summary">
                <div class="summary-item">
                    <div class="summary-value" id="filtered-orders-count">0</div>
                    <div class="summary-label">Найдено заказов</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value" id="filtered-orders-amount">0 ₽</div>
                    <div class="summary-label">Общая сумма</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value" id="filtered-orders-avg">0 ₽</div>
                    <div class="summary-label">Средний чек</div>
                </div>
            </div>
            
            <div class="orders-list-container">
                <div class="orders-list" id="orders-list">
                    <!-- Orders will be rendered here -->
                </div>
            </div>
            
            <div class="orders-pagination" id="orders-pagination">
                <!-- Pagination will be rendered here -->
            </div>
        `;
    }

    attachEventListeners() {
        // Устанавливаем текущие значения фильтров
        const statusFilter = document.getElementById('status-filter');
        const sortSelect = document.getElementById('sort-orders');
        
        if (statusFilter) statusFilter.value = this.currentFilter;
        if (sortSelect) sortSelect.value = this.currentSort;
    }

    setPlatform(platform) {
        this.currentPlatform = platform;
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.renderOrdersList();
    }

    setSort(sort) {
        this.currentSort = sort;
        this.renderOrdersList();
    }

    renderOrdersList() {
        const container = document.getElementById('orders-list');
        const paginationContainer = document.getElementById('orders-pagination');
        
        if (!container) return;
        
        // Фильтрация заказов
        let orders = this.getFilteredOrders();
        
        // Обновление статистики
        this.updateOrdersSummary(orders);
        
        if (orders.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }
        
        // Рендеринг списка заказов
        container.innerHTML = orders.map(order => this.generateOrderCard(order)).join('');
        
        // Рендеринг пагинации
        if (paginationContainer) {
            paginationContainer.innerHTML = this.generatePagination();
        }
    }

    getFilteredOrders() {
        let orders = [];
        
        // Выбор платформы
        switch (this.currentPlatform) {
            case 'cdek':
                orders = [...this.app.orders.cdek];
                break;
            case 'megamarket':
                orders = [...this.app.orders.megamarket];
                break;
            default:
                orders = [...this.app.orders.all];
        }
        
        // Фильтрация по статусу
        if (this.currentFilter !== 'all') {
            orders = orders.filter(order => order.status === this.currentFilter);
        }
        
        // Сортировка
        orders = this.sortOrders(orders);
        
        return orders;
    }

    sortOrders(orders) {
        switch (this.currentSort) {
            case 'date-desc':
                return orders.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
            case 'date-asc':
                return orders.sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
            case 'amount-desc':
                return orders.sort((a, b) => (b.cost || b.totalAmount || 0) - (a.cost || a.totalAmount || 0));
            case 'amount-asc':
                return orders.sort((a, b) => (a.cost || a.totalAmount || 0) - (b.cost || b.totalAmount || 0));
            default:
                return orders;
        }
    }

    generateOrderCard(order) {
        const statusConfig = this.app.getStatusConfig(order);
        const platformIcon = order.platform === 'cdek' ? 'shipping-fast' : 'store';
        const orderNumber = order.platform === 'cdek' ? order.trackingNumber : order.orderNumber;
        const amount = order.cost || order.totalAmount || 0;
        const recipient = order.recipient || order.customerName || 'Не указан';
        
        return `
            <div class="order-card" onclick="app.components.orders.showOrderDetails('${order.platform}', '${order.id}')">
                <div class="order-header">
                    <div class="order-platform platform-${order.platform}">
                        <i class="fas fa-${platformIcon}"></i>
                        ${formatPlatform(order.platform)}
                    </div>
                    <div class="order-status status-${order.status}">
                        <i class="fas fa-${statusConfig.icon}"></i>
                        ${statusConfig.text}
                    </div>
                </div>
                
                <div class="order-body">
                    <div class="order-info">
                        <div class="order-number">
                            ${formatOrderNumber(orderNumber, order.platform)}
                        </div>
                        <div class="order-date">
                            ${formatRelativeTime(order.createdDate)}
                        </div>
                    </div>
                    
                    <div class="order-details">
                        <div class="detail-item">
                            <span class="detail-label">Получатель:</span>
                            <span class="detail-value">${truncateText(recipient, 25)}</span>
                        </div>
                        
                        ${order.platform === 'cdek' ? `
                            <div class="detail-item">
                                <span class="detail-label">Маршрут:</span>
                                <span class="detail-value">${order.fromCity} → ${order.toCity}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Вес:</span>
                                <span class="detail-value">${formatWeight(order.weight)}</span>
                            </div>
                        ` : `
                            <div class="detail-item">
                                <span class="detail-label">Телефон:</span>
                                <span class="detail-value">${formatPhone(order.customerPhone)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Товаров:</span>
                                <span class="detail-value">${order.items ? order.items.length : 1}</span>
                            </div>
                        `}
                    </div>
                </div>
                
                <div class="order-footer">
                    <div class="order-amount">
                        ${formatCurrency(amount)}
                    </div>
                    <div class="order-actions">
                        <button class="btn-icon" onclick="event.stopPropagation(); app.components.orders.trackOrder('${order.platform}', '${order.id}')" title="Отследить">
                            <i class="fas fa-search"></i>
                        </button>
                        <button class="btn-icon" onclick="event.stopPropagation(); app.components.orders.copyOrderInfo('${order.platform}', '${order.id}')" title="Копировать">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3>Заказы не найдены</h3>
                <p>Попробуйте изменить параметры фильтрации или синхронизировать данные</p>
                <button class="btn btn-primary" onclick="app.manualSync()">
                    <i class="fas fa-sync"></i>
                    Обновить данные
                </button>
            </div>
        `;
    }

    updateOrdersSummary(orders) {
        const countEl = document.getElementById('filtered-orders-count');
        const amountEl = document.getElementById('filtered-orders-amount');
        const avgEl = document.getElementById('filtered-orders-avg');
        
        if (countEl) countEl.textContent = orders.length;
        
        const totalAmount = orders.reduce((sum, order) => sum + (order.cost || order.totalAmount || 0), 0);
        if (amountEl) amountEl.textContent = formatCurrency(totalAmount);
        
        const avgAmount = orders.length > 0 ? totalAmount / orders.length : 0;
        if (avgEl) avgEl.textContent = formatCurrency(avgAmount);
    }

    generatePagination() {
        // Простая пагинация - можно доработать
        return `
            <div class="pagination">
                <button class="pagination-btn" disabled>
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="pagination-info">Показаны все заказы</span>
                <button class="pagination-btn" disabled>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    showOrderDetails(platform, orderId) {
        const order = this.app.getOrderById(platform, orderId);
        if (!order) {
            this.app.showNotification('Заказ не найден', 'error');
            return;
        }
        
        // Здесь можно открыть модальное окно с деталями заказа
        this.app.showNotification(`Детали заказа: ${formatOrderNumber(order.platform === 'cdek' ? order.trackingNumber : order.orderNumber, order.platform)}`, 'info');
        
        // Временное решение - показываем alert с основной информацией
        const details = this.generateOrderDetails(order);
        alert(details);
    }

    generateOrderDetails(order) {
        const statusConfig = this.app.getStatusConfig(order);
        
        let details = `
Заказ: ${formatOrderNumber(order.platform === 'cdek' ? order.trackingNumber : order.orderNumber, order.platform)}
Платформа: ${formatPlatform(order.platform)}
Статус: ${statusConfig.text}
Сумма: ${formatCurrency(order.cost || order.totalAmount || 0)}
Дата создания: ${formatDateTime(order.createdDate)}
        `;
        
        if (order.platform === 'cdek') {
            details += `
Отправитель: ${order.sender}
Получатель: ${order.recipient}
Маршрут: ${order.fromCity} → ${order.toCity}
Вес: ${formatWeight(order.weight)}
Ориентировочная доставка: ${formatDate(order.estimatedDelivery)}
            `;
        } else {
            details += `
Клиент: ${order.customerName}
Телефон: ${formatPhone(order.customerPhone)}
Адрес: ${order.deliveryAddress}
Товары: ${order.items ? order.items.length : 1}
            `;
        }
        
        return details;
    }

    trackOrder(platform, orderId) {
        const order = this.app.getOrderById(platform, orderId);
        if (!order) return;
        
        let trackUrl = '';
        
        if (platform === 'cdek' && order.trackingNumber) {
            trackUrl = `https://cdek.ru/tracking?order_id=${order.trackingNumber}`;
        } else if (platform === 'megamarket' && order.orderNumber) {
            trackUrl = `https://megamarket.ru/seller/orders/${order.orderNumber}`;
        }
        
        if (trackUrl) {
            window.open(trackUrl, '_blank');
        } else {
            this.app.showNotification('Невозможно отследить заказ', 'warning');
        }
    }

    copyOrderInfo(platform, orderId) {
        const order = this.app.getOrderById(platform, orderId);
        if (!order) return;
        
        const info = `Заказ ${formatOrderNumber(order.platform === 'cdek' ? order.trackingNumber : order.orderNumber, order.platform)} - ${formatPlatform(order.platform)} - ${formatCurrency(order.cost || order.totalAmount || 0)}`;
        
        navigator.clipboard.writeText(info).then(() => {
            this.app.showNotification('Информация скопирована', 'success');
        }).catch(() => {
            this.app.showNotification('Не удалось скопировать', 'error');
        });
    }

    exportOrders() {
        const orders = this.getFilteredOrders();
        
        if (orders.length === 0) {
            this.app.showNotification('Нет данных для экспорта', 'warning');
            return;
        }
        
        // Создание CSV
        const headers = ['Платформа', 'Номер заказа', 'Статус', 'Сумма', 'Дата создания', 'Получатель'];
        const csvData = orders.map(order => [
            formatPlatform(order.platform),
            order.platform === 'cdek' ? order.trackingNumber : order.orderNumber,
            this.app.getStatusConfig(order).text,
            order.cost || order.totalAmount || 0,
            formatDate(order.createdDate),
            order.recipient || order.customerName || ''
        ]);
        
        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        // Создание и скачивание файла
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.app.showNotification(`Экспортировано ${orders.length} заказов`, 'success');
    }
}
