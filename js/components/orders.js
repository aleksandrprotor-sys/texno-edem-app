// js/components/orders.js
class OrdersComponent {
    constructor(app) {
        this.app = app;
        this.currentPlatform = null;
        this.filters = {
            status: 'all',
            search: ''
        };
    }

    render(platform = 'cdek') {
        console.log(`🎨 Rendering orders for platform: ${platform}`);
        this.currentPlatform = platform;
        
        const container = document.getElementById('orders-container');
        if (!container) {
            console.error('❌ Orders container not found');
            return;
        }

        container.innerHTML = this.createOrdersHTML(platform);
        this.attachEventListeners();
    }

    createOrdersHTML(platform) {
        const orders = this.app.getPlatformOrders(platform);
        const filteredOrders = this.filterOrders(orders);
        
        console.log(`📊 Displaying ${filteredOrders.length} orders for ${platform}`);
        
        return `
            <div class="orders-content">
                <!-- Заголовок -->
                <div class="orders-header">
                    <h2>${platform === 'cdek' ? 'Заказы CDEK' : 'Заказы Мегамаркет'}</h2>
                    <p>Управление заказами и отправлениями</p>
                </div>

                <!-- Фильтры и поиск -->
                <div class="orders-toolbar">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" 
                               id="orders-search" 
                               placeholder="Поиск по заказам..." 
                               value="${this.filters.search}">
                    </div>
                    
                    <div class="filter-group">
                        <select id="status-filter" class="form-control">
                            <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>Все статусы</option>
                            <option value="new" ${this.filters.status === 'new' ? 'selected' : ''}>Новые</option>
                            <option value="processing" ${this.filters.status === 'processing' ? 'selected' : ''}>В обработке</option>
                            <option value="active" ${this.filters.status === 'active' ? 'selected' : ''}>Активные</option>
                            <option value="delivered" ${this.filters.status === 'delivered' ? 'selected' : ''}>Доставленные</option>
                            <option value="problem" ${this.filters.status === 'problem' ? 'selected' : ''}>Проблемные</option>
                        </select>
                    </div>

                    <div class="toolbar-actions">
                        <button class="btn btn-outline" onclick="app.ordersComponent.exportOrders()">
                            <i class="fas fa-download"></i> Экспорт
                        </button>
                        <button class="btn btn-primary" onclick="app.manualSync()">
                            <i class="fas fa-sync-alt"></i> Обновить
                        </button>
                    </div>
                </div>

                <!-- Статистика платформы -->
                <div class="platform-stats-bar">
                    <div class="stat-item">
                        <span class="stat-value">${filteredOrders.length}</span>
                        <span class="stat-label">Всего заказов</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.getOrdersByStatus(filteredOrders, 'new').length}</span>
                        <span class="stat-label">Новые</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.getOrdersByStatus(filteredOrders, 'problem').length}</span>
                        <span class="stat-label">Проблемные</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.formatCurrency(this.calculateTotalRevenue(filteredOrders))}</span>
                        <span class="stat-label">Общая сумма</span>
                    </div>
                </div>

                <!-- Список заказов -->
                <div class="orders-list">
                    ${filteredOrders.length > 0 ? 
                        this.createOrdersList(filteredOrders) : 
                        this.createEmptyState()
                    }
                </div>
            </div>
        `;
    }

    createOrdersList(orders) {
        return orders.map(order => `
            <div class="order-card" onclick="app.ordersComponent.showOrderDetails('${order.platform}', '${order.id}')">
                <div class="order-header">
                    <div class="order-title">
                        <div class="order-number">
                            ${order.platform === 'cdek' ? 
                                `<i class="fas fa-shipping-fast"></i> ${order.trackingNumber}` :
                                `<i class="fas fa-store"></i> #${order.orderNumber}`
                            }
                        </div>
                        <div class="order-customer">
                            ${order.recipient || order.customerName}
                        </div>
                    </div>
                    <div class="order-status">
                        ${this.createStatusBadge(order)}
                    </div>
                </div>

                <div class="order-details">
                    <div class="order-info">
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${order.platform === 'cdek' ? 
                                `${order.fromCity} → ${order.toCity}` : 
                                this.truncateText(order.deliveryAddress, 30)
                            }</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-weight-hanging"></i>
                            <span>${order.weight || '-'} кг</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-ruble-sign"></i>
                            <span>${this.formatCurrency(order.cost || order.totalAmount)}</span>
                        </div>
                    </div>
                    
                    <div class="order-meta">
                        <span class="order-date">${this.formatRelativeTime(order.createdDate)}</span>
                        <div class="order-actions">
                            ${this.createActionButtons(order)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    createStatusBadge(order) {
        const statusConfig = this.app.getStatusConfig(order);
        return `
            <span class="status-badge status-${order.status}" 
                  style="--status-color: ${statusConfig.color}">
                ${statusConfig.text}
            </span>
        `;
    }

    createActionButtons(order) {
        const buttons = [];
        
        if (order.status === 'new') {
            buttons.push(`
                <button class="btn-action btn-success" 
                        onclick="event.stopPropagation(); app.ordersComponent.confirmOrder('${order.platform}', '${order.id}')"
                        title="Подтвердить заказ">
                    <i class="fas fa-check"></i>
                </button>
            `);
        }
        
        if (order.status === 'problem') {
            buttons.push(`
                <button class="btn-action btn-warning" 
                        onclick="event.stopPropagation(); app.ordersComponent.contactSupport('${order.platform}', '${order.id}')"
                        title="Связаться с поддержкой">
                    <i class="fas fa-headset"></i>
                </button>
            `);
        }

        buttons.push(`
            <button class="btn-action btn-info" 
                    onclick="event.stopPropagation(); app.ordersComponent.showOrderDetails('${order.platform}', '${order.id}')"
                    title="Подробности">
                <i class="fas fa-eye"></i>
            </button>
        `);

        return buttons.join('');
    }

    createEmptyState() {
        return `
            <div class="empty-orders">
                <div class="empty-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3>Заказы не найдены</h3>
                <p>Попробуйте изменить параметры фильтра или обновить данные</p>
                <div class="empty-actions">
                    <button class="btn btn-primary" onclick="app.manualSync()">
                        <i class="fas fa-sync-alt"></i> Обновить данные
                    </button>
                    <button class="btn btn-outline" onclick="app.ordersComponent.clearFilters()">
                        <i class="fas fa-times"></i> Сбросить фильтры
                    </button>
                </div>
            </div>
        `;
    }

    filterOrders(orders) {
        let filtered = [...orders];

        // Фильтр по статусу
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(order => order.status === this.filters.status);
        }

        // Фильтр по поиску
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(order => 
                (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm)) ||
                (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm)) ||
                (order.recipient && order.recipient.toLowerCase().includes(searchTerm)) ||
                (order.customerName && order.customerName.toLowerCase().includes(searchTerm)) ||
                (order.fromCity && order.fromCity.toLowerCase().includes(searchTerm)) ||
                (order.toCity && order.toCity.toLowerCase().includes(searchTerm))
            );
        }

        return filtered;
    }

    getOrdersByStatus(orders, status) {
        return orders.filter(order => order.status === status);
    }

    calculateTotalRevenue(orders) {
        return orders.reduce((sum, order) => sum + (order.cost || order.totalAmount || 0), 0);
    }

    attachEventListeners() {
        const searchInput = document.getElementById('orders-search');
        const statusFilter = document.getElementById('status-filter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.render(this.currentPlatform);
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.render(this.currentPlatform);
            });
        }
    }

    showOrderDetails(platform, orderId) {
        const order = this.app.getOrderById(platform, orderId);
        if (order && this.app.modal) {
            this.app.modal.showOrderDetails(order);
        } else {
            this.app.showNotification('Заказ не найден', 'error');
        }
    }

    async confirmOrder(platform, orderId) {
        try {
            this.app.showLoading('Подтверждение заказа...');
            
            // Имитация API запроса
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Обновляем статус заказа локально
            const orders = this.app.orders[platform];
            const orderIndex = orders.findIndex(order => order.id === orderId);
            if (orderIndex !== -1) {
                orders[orderIndex].status = 'processing';
                orders[orderIndex].statusCode = 'PROCESSING';
            }
            
            this.app.showNotification('Заказ успешно подтвержден', 'success');
            this.render(platform);
            
        } catch (error) {
            this.app.showNotification('Ошибка при подтверждении заказа', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    contactSupport(platform, orderId) {
        const order = this.app.getOrderById(platform, orderId);
        if (order) {
            const message = `Проблема с заказом: ${order.platform === 'cdek' ? order.trackingNumber : order.orderNumber}`;
            this.app.showNotification(`Обращение в поддержку: ${message}`, 'info');
        }
    }

    clearFilters() {
        this.filters = {
            status: 'all',
            search: ''
        };
        this.render(this.currentPlatform);
    }

    exportOrders() {
        const orders = this.app.getPlatformOrders(this.currentPlatform);
        const csvContent = this.generateOrdersCSV(orders);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `orders-${this.currentPlatform}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.app.showNotification('Заказы экспортированы в CSV', 'success');
    }

    generateOrdersCSV(orders) {
        const headers = ['ID', 'Номер', 'Статус', 'Клиент', 'Сумма', 'Дата создания', 'Город'];
        const rows = orders.map(order => [
            order.id,
            order.trackingNumber || order.orderNumber,
            this.app.getStatusConfig(order).text,
            order.recipient || order.customerName,
            order.cost || order.totalAmount,
            this.formatDate(order.createdDate),
            order.toCity || order.deliveryAddress?.split(',')[0] || '-'
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
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

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}
