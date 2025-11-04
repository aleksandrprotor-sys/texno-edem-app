// js/components/orders.js
class OrdersComponent {
    constructor() {
        this.currentPlatform = 'all';
        this.currentFilter = 'all';
        this.orders = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadOrders();
    }

    bindEvents() {
        // Обработчики для фильтров и поиска
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('search-input')) {
                this.handleSearch(e.target.value);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('status-filter')) {
                this.currentFilter = e.target.value;
                this.renderOrders();
            }
            
            if (e.target.classList.contains('platform-filter')) {
                this.currentPlatform = e.target.value;
                this.renderOrders();
            }
        });

        // Обработчики для действий с заказами
        document.addEventListener('click', (e) => {
            if (e.target.closest('.order-card')) {
                this.handleOrderClick(e.target.closest('.order-card'));
            }
            
            if (e.target.closest('.btn-track')) {
                this.trackOrder(e.target.closest('.btn-track').dataset.orderId);
            }
            
            if (e.target.closest('.btn-cancel')) {
                this.cancelOrder(e.target.closest('.btn-cancel').dataset.orderId);
            }
            
            if (e.target.closest('.btn-details')) {
                this.showOrderDetails(e.target.closest('.btn-details').dataset.orderId);
            }
        });
    }

    handleOrderClick(orderElement) {
        const orderId = orderElement.dataset.orderId;
        this.showOrderDetails(orderId);
    }

    async trackOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order && order.trackingUrl) {
            window.open(order.trackingUrl, '_blank');
        } else {
            app.notifications.show('Трек-номер недоступен', 'warning');
        }
    }

    async cancelOrder(orderId) {
        const confirmed = await app.modal.confirm(
            'Отмена заказа',
            'Вы уверены, что хотите отменить этот заказ?',
            'Отменить',
            'danger'
        );
        
        if (confirmed) {
            try {
                app.loading.show('Отмена заказа...');
                // API call to cancel order
                await app.api.cancelOrder(orderId);
                app.notifications.show('Заказ успешно отменен', 'success');
                this.loadOrders();
            } catch (error) {
                app.notifications.show('Ошибка при отмене заказа', 'error');
            } finally {
                app.loading.hide();
            }
        }
    }

    showOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            app.modal.showOrderDetails(order);
        }
    }

    handleSearch(query) {
        const filteredOrders = this.orders.filter(order => 
            order.id.toLowerCase().includes(query.toLowerCase()) ||
            order.customerName.toLowerCase().includes(query.toLowerCase()) ||
            order.items.some(item => item.name.toLowerCase().includes(query.toLowerCase()))
        );
        this.renderOrders(filteredOrders);
    }

    async loadOrders() {
        try {
            app.loading.show('Загрузка заказов...');
            this.orders = await app.api.getOrders();
            this.renderOrders();
            app.header.updateBadge('orders', this.orders.length);
        } catch (error) {
            app.notifications.show('Ошибка загрузки заказов', 'error');
        } finally {
            app.loading.hide();
        }
    }

    renderOrders(ordersToRender = this.orders) {
        const container = document.getElementById('orders-container');
        const filteredOrders = this.applyFilters(ordersToRender);
        
        if (filteredOrders.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = filteredOrders.map(order => this.createOrderCard(order)).join('');
    }

    applyFilters(orders) {
        return orders.filter(order => {
            const platformMatch = this.currentPlatform === 'all' || order.platform === this.currentPlatform;
            const statusMatch = this.currentFilter === 'all' || order.status === this.currentFilter;
            return platformMatch && statusMatch;
        });
    }

    createOrderCard(order) {
        return `
            <div class="order-card tg-card tg-tap-effect" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-main-info">
                        <div class="order-id">
                            <span>${order.id}</span>
                            <i class="fas fa-${order.platform === 'cdek' ? 'shipping-fast' : 'store'}"></i>
                        </div>
                        <div class="order-meta">
                            <span class="order-date">${app.formatters.formatDate(order.date)}</span>
                            <span class="order-eta">${order.eta ? `До ${app.formatters.formatDate(order.eta)}` : ''}</span>
                            <span class="order-amount">${app.formatters.formatCurrency(order.amount)}</span>
                        </div>
                    </div>
                    <div class="order-status" style="--status-color: ${this.getStatusColor(order.status)}">
                        ${this.getStatusText(order.status)}
                    </div>
                </div>
                
                <div class="order-content">
                    <div class="order-details">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Клиент</span>
                                <span class="detail-value">${order.customerName}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Телефон</span>
                                <span class="detail-value">${order.customerPhone}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Адрес</span>
                                <span class="detail-value">${order.shippingAddress}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-items">
                        <div class="items-header">
                            <span class="items-title">Товары</span>
                            <span class="items-count">${order.items.length} шт.</span>
                        </div>
                        <div class="items-list">
                            ${order.items.slice(0, 3).map(item => `
                                <div class="order-item">
                                    <span class="item-name">${item.name}</span>
                                    <span class="item-quantity">${item.quantity} × ${app.formatters.formatCurrency(item.price)}</span>
                                </div>
                            `).join('')}
                            ${order.items.length > 3 ? `
                                <div class="order-item-more">
                                    и еще ${order.items.length - 3} товаров...
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="order-footer">
                    <div class="order-actions">
                        ${order.trackingNumber ? `
                            <button class="btn btn-sm btn-outline btn-track tg-tap-effect" data-order-id="${order.id}">
                                <i class="fas fa-truck"></i> Трекинг
                            </button>
                        ` : ''}
                        
                        ${order.status === 'new' || order.status === 'processing' ? `
                            <button class="btn btn-sm btn-danger btn-cancel tg-tap-effect" data-order-id="${order.id}">
                                <i class="fas fa-times"></i> Отменить
                            </button>
                        ` : ''}
                        
                        <button class="btn btn-sm btn-primary btn-details tg-tap-effect" data-order-id="${order.id}">
                            <i class="fas fa-eye"></i> Подробнее
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusColor(status) {
        const colors = {
            'new': 'var(--info)',
            'processing': 'var(--warning)',
            'shipped': 'var(--primary)',
            'delivered': 'var(--success)',
            'cancelled': 'var(--danger)',
            'problem': 'var(--danger)'
        };
        return colors[status] || 'var(--gray-500)';
    }

    getStatusText(status) {
        const texts = {
            'new': 'Новый',
            'processing': 'В обработке',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен',
            'problem': 'Проблема'
        };
        return texts[status] || status;
    }

    getEmptyState() {
        return `
            <div class="empty-state tg-card">
                <div class="empty-icon">
                    <i class="fas fa-box-open"></i>
                </div>
                <h3>Заказы не найдены</h3>
                <p>Нет заказов, соответствующих выбранным фильтрам</p>
                <button class="btn btn-primary tg-main-button tg-tap-effect" onclick="this.loadOrders()">
                    <i class="fas fa-sync"></i> Обновить
                </button>
            </div>
        `;
    }
}
