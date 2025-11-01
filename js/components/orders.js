// js/components/orders.js - Улучшенный компонент заказов
class OrdersComponent {
    constructor(app) {
        this.app = app;
        this.currentPlatform = null;
        this.filteredOrders = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            status: 'all',
            search: '',
            sortBy: 'date',
            sortOrder: 'desc'
        };
    }

    render(platform = null) {
        this.currentPlatform = platform;
        const container = document.getElementById('orders-container');
        if (!container) return;

        const orders = platform ? this.app.getPlatformOrders(platform) : this.app.orders.all;
        this.filteredOrders = this.applyFilters(orders);

        container.innerHTML = this.createOrdersHTML(platform);
        this.attachEventListeners();
    }

    createOrdersHTML(platform) {
        const paginatedOrders = this.getPaginatedOrders();
        const platformName = platform === 'cdek' ? 'CDEK' : 
                           platform === 'megamarket' ? 'Мегамаркет' : 'Все платформы';

        return `
            <div class="orders-header">
                <div class="platform-header ${platform}">
                    <div class="platform-info">
                        <div class="platform-icon ${platform}">
                            <i class="fas fa-${platform === 'cdek' ? 'shipping-fast' : 'store'}"></i>
                        </div>
                        <div class="platform-details">
                            <h2>${platformName}</h2>
                            <p>Управление заказами и отправлениями</p>
                        </div>
                    </div>
                    <div class="orders-summary">
                        <div class="summary-item">
                            <span class="summary-value">${this.filteredOrders.length}</span>
                            <span class="summary-label">Всего заказов</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-value">${this.getActiveOrdersCount()}</span>
                            <span class="summary-label">Активные</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-value">${this.getProblemOrdersCount()}</span>
                            <span class="summary-label">Проблемные</span>
                        </div>
                    </div>
                </div>

                <div class="orders-toolbar">
                    <div class="toolbar-left">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="orders-search" placeholder="Поиск по заказам..." 
                                   value="${this.filters.search}">
                        </div>
                        <div class="filter-group">
                            <select id="status-filter">
                                <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>Все статусы</option>
                                <option value="new" ${this.filters.status === 'new' ? 'selected' : ''}>Новые</option>
                                <option value="active" ${this.filters.status === 'active' ? 'selected' : ''}>Активные</option>
                                <option value="delivered" ${this.filters.status === 'delivered' ? 'selected' : ''}>Доставленные</option>
                                <option value="problem" ${this.filters.status === 'problem' ? 'selected' : ''}>Проблемные</option>
                            </select>
                        </div>
                    </div>
                    <div class="toolbar-right">
                        <div class="sort-group">
                            <span>Сортировка:</span>
                            <select id="sort-orders">
                                <option value="date-desc" ${this.filters.sortBy === 'date' && this.filters.sortOrder === 'desc' ? 'selected' : ''}>Дата (новые)</option>
                                <option value="date-asc" ${this.filters.sortBy === 'date' && this.filters.sortOrder === 'asc' ? 'selected' : ''}>Дата (старые)</option>
                                <option value="amount-desc" ${this.filters.sortBy === 'amount' && this.filters.sortOrder === 'desc' ? 'selected' : ''}>Сумма (убыв.)</option>
                                <option value="amount-asc" ${this.filters.sortBy === 'amount' && this.filters.sortOrder === 'asc' ? 'selected' : ''}>Сумма (возр.)</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="app.ordersComponent.exportOrders()">
                            <i class="fas fa-download"></i> Экспорт
                        </button>
                        <button class="btn btn-success" onclick="app.ordersComponent.refreshOrders()">
                            <i class="fas fa-sync-alt"></i> Обновить
                        </button>
                    </div>
                </div>
            </div>

            <div class="orders-list">
                ${paginatedOrders.length > 0 ? 
                    paginatedOrders.map(order => this.createOrderCard(order)).join('') :
                    this.createEmptyState()
                }
            </div>

            ${this.filteredOrders.length > this.itemsPerPage ? this.createPagination() : ''}
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
                            <span class="order-eta">
                                ${order.estimatedDelivery ? `Доставка: ${formatDate(order.estimatedDelivery)}` : ''}
                            </span>
                            <span class="order-amount">${formatCurrency(order.cost || order.totalAmount)}</span>
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
                                <span class="detail-label">Клиент</span>
                                <span class="detail-value">${order.recipient || order.customerName}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Адрес</span>
                                <span class="detail-value">${order.toCity || order.deliveryAddress}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Вес</span>
                                <span class="detail-value">${order.weight ? order.weight + ' кг' : 'Не указан'}</span>
                            </div>
                        </div>
                    </div>

                    ${order.items ? `
                        <div class="order-items">
                            <div class="items-header">
                                <span class="items-title">Товары</span>
                                <span class="items-count">${order.items.length} шт.</span>
                            </div>
                            <div class="items-list">
                                ${order.items.slice(0, 2).map(item => `
                                    <div class="order-item">
                                        <span class="item-name">${item.name}</span>
                                        <span class="item-quantity">${item.quantity} шт.</span>
                                    </div>
                                `).join('')}
                                ${order.items.length > 2 ? `
                                    <div class="order-item-more">
                                        и ещё ${order.items.length - 2} товаров...
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="order-footer">
                    <div class="order-actions">
                        <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); app.ordersComponent.trackOrder('${order.platform}', '${order.id}')">
                            <i class="fas fa-map-marker-alt"></i> Отследить
                        </button>
                        ${order.status === 'new' ? `
                            <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); app.ordersComponent.confirmOrder('${order.platform}', '${order.id}')">
                                <i class="fas fa-check"></i> Подтвердить
                            </button>
                        ` : ''}
                        ${order.status === 'problem' ? `
                            <button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); app.ordersComponent.contactSupport('${order.platform}', '${order.id}')">
                                <i class="fas fa-headset"></i> Поддержка
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.ordersComponent.showOrderDetails('${order.platform}', '${order.id}')">
                            <i class="fas fa-eye"></i> Детали
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3>Заказы не найдены</h3>
                <p>Попробуйте изменить параметры поиска или фильтрации</p>
                <button class="btn btn-primary" onclick="app.ordersComponent.clearFilters()">
                    Сбросить фильтры
                </button>
            </div>
        `;
    }

    createPagination() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
        
        return `
            <div class="pagination">
                <div class="pagination-info">
                    Показано ${(this.currentPage - 1) * this.itemsPerPage + 1}-${Math.min(this.currentPage * this.itemsPerPage, this.filteredOrders.length)} из ${this.filteredOrders.length}
                </div>
                <div class="pagination-controls">
                    <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                            onclick="app.ordersComponent.previousPage()" ${this.currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="pagination-current">${this.currentPage} / ${totalPages}</span>
                    <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                            onclick="app.ordersComponent.nextPage()" ${this.currentPage === totalPages ? 'disabled' : ''}>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Методы фильтрации и пагинации
    applyFilters(orders) {
        let filtered = orders;

        // Фильтр по статусу
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(order => order.status === this.filters.status);
        }

        // Поиск
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(order => 
                (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm)) ||
                (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm)) ||
                (order.recipient && order.recipient.toLowerCase().includes(searchTerm)) ||
                (order.customerName && order.customerName.toLowerCase().includes(searchTerm))
            );
        }

        // Сортировка
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            if (this.filters.sortBy === 'date') {
                aValue = new Date(a.createdDate);
                bValue = new Date(b.createdDate);
            } else if (this.filters.sortBy === 'amount') {
                aValue = a.cost || a.totalAmount || 0;
                bValue = b.cost || b.totalAmount || 0;
            }
            
            if (this.filters.sortOrder === 'desc') {
                return bValue - aValue;
            } else {
                return aValue - bValue;
            }
        });

        return filtered;
    }

    getPaginatedOrders() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredOrders.slice(startIndex, startIndex + this.itemsPerPage);
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.render(this.currentPlatform);
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.render(this.currentPlatform);
        }
    }

    getActiveOrdersCount() {
        return this.filteredOrders.filter(order => 
            order.status === 'active' || order.status === 'processing'
        ).length;
    }

    getProblemOrdersCount() {
        return this.filteredOrders.filter(order => order.status === 'problem').length;
    }

    // Методы действий
    async confirmOrder(platform, orderId) {
        try {
            this.app.showLoading('Подтверждение заказа...');
            
            // Имитация API запроса
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Обновляем статус заказа локально
            const orders = this.app.getPlatformOrders(platform);
            const orderIndex = orders.findIndex(order => order.id === orderId);
            if (orderIndex !== -1) {
                orders[orderIndex].status = 'confirmed';
                this.app.showNotification('Заказ успешно подтвержден', 'success');
                this.render(this.currentPlatform);
            }
        } catch (error) {
            this.app.showNotification('Ошибка подтверждения заказа', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async trackOrder(platform, orderId) {
        const order = this.app.getOrderById(platform, orderId);
        if (order) {
            if (platform === 'cdek' && order.trackingNumber) {
                window.open(`https://www.cdek.ru/ru/tracking?order_id=${order.trackingNumber}`, '_blank');
            } else {
                this.app.showNotification('Функция отслеживания в разработке', 'info');
            }
        }
    }

    contactSupport(platform, orderId) {
        const order = this.app.getOrderById(platform, orderId);
        this.app.showNotification(`Запрос в поддержку отправлен для заказа ${orderId}`, 'info');
    }

    exportOrders() {
        const csvContent = this.generateOrdersCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.app.showNotification('Данные экспортированы в CSV', 'success');
    }

    refreshOrders() {
        this.app.refreshData();
    }

    clearFilters() {
        this.filters = {
            status: 'all',
            search: '',
            sortBy: 'date',
            sortOrder: 'desc'
        };
        this.currentPage = 1;
        this.render(this.currentPlatform);
    }

    showOrderDetails(platform, orderId) {
        const order = this.app.getOrderById(platform, orderId);
        if (order && this.app.modal) {
            this.app.modal.showOrderDetails(order);
        }
    }

    generateOrdersCSV() {
        const headers = ['Платформа', 'Номер', 'Статус', 'Клиент', 'Сумма', 'Дата создания'];
        const rows = this.filteredOrders.map(order => [
            order.platform === 'cdek' ? 'CDEK' : 'Мегамаркет',
            order.trackingNumber || order.orderNumber,
            this.app.getStatusConfig(order).text,
            order.recipient || order.customerName,
            formatCurrency(order.cost || order.totalAmount),
            formatDate(order.createdDate)
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    attachEventListeners() {
        // Поиск
        const searchInput = document.getElementById('orders-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filters.search = searchInput.value;
                this.currentPage = 1;
                this.render(this.currentPlatform);
            }, 300));
        }

        // Фильтр статусов
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filters.status = statusFilter.value;
                this.currentPage = 1;
                this.render(this.currentPlatform);
            });
        }

        // Сортировка
        const sortSelect = document.getElementById('sort-orders');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                const [sortBy, sortOrder] = sortSelect.value.split('-');
                this.filters.sortBy = sortBy;
                this.filters.sortOrder = sortOrder;
                this.currentPage = 1;
                this.render(this.currentPlatform);
            });
        }
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
}
