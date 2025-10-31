class OrdersComponent {
    constructor(megamarketService) {
        this.megamarketService = megamarketService;
        this.orders = [];
        this.filteredOrders = [];
        this.currentPage = 1;
        this.ordersPerPage = 10;
        this.currentFilters = {};
        this.isLoading = false;
    }

    async init() {
        await this.loadOrders();
        this.renderOrdersTable();
        this.setupEventListeners();
        this.setupFilters();
    }

    async loadOrders() {
        this.setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            this.orders = await this.megamarketService.getNewOrders(weekAgo, today);
            this.filteredOrders = [...this.orders];
            this.renderOrdersTable();
            this.updateOrdersCounter();
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showNotification('Ошибка загрузки заказов', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        const container = document.getElementById('ordersContainer');
        if (container) {
            if (loading) {
                container.classList.add('orders-loading');
            } else {
                container.classList.remove('orders-loading');
            }
        }
    }

    renderOrdersTable() {
        const container = document.getElementById('ordersContainer');
        if (!container) return;

        if (this.filteredOrders.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        const startIndex = (this.currentPage - 1) * this.ordersPerPage;
        const paginatedOrders = this.filteredOrders.slice(startIndex, startIndex + this.ordersPerPage);

        container.innerHTML = `
            <div class="orders-header">
                <div class="orders-title">
                    <h3>Заказы Megamarket</h3>
                    <span class="orders-counter">${this.filteredOrders.length} заказов</span>
                </div>
                <div class="orders-controls">
                    <button class="btn btn-primary" onclick="ordersComponent.refreshOrders()" ${this.isLoading ? 'disabled' : ''}>
                        <span class="btn-icon">🔄</span>
                        Обновить
                    </button>
                    <button class="btn btn-secondary" onclick="ordersComponent.showSearchModal()" ${this.isLoading ? 'disabled' : ''}>
                        <span class="btn-icon">🔍</span>
                        Поиск
                    </button>
                    <button class="btn btn-outline" onclick="ordersComponent.toggleFilters()">
                        <span class="btn-icon">⚙️</span>
                        Фильтры
                    </button>
                </div>
            </div>

            <div class="orders-filters" id="ordersFilters" style="display: none;">
                <div class="filters-grid">
                    <div class="filter-group">
                        <label for="filterStatus">Статус:</label>
                        <select id="filterStatus" class="form-control" onchange="ordersComponent.applyFilters()">
                            <option value="">Все статусы</option>
                            <option value="new">Новые</option>
                            <option value="confirmed">Подтвержденные</option>
                            <option value="packed">Упакованные</option>
                            <option value="shipped">Отгруженные</option>
                            <option value="delivered">Доставленные</option>
                            <option value="cancelled">Отмененные</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="filterDateFrom">Дата с:</label>
                        <input type="date" id="filterDateFrom" class="form-control" onchange="ordersComponent.applyFilters()">
                    </div>
                    <div class="filter-group">
                        <label for="filterDateTo">Дата по:</label>
                        <input type="date" id="filterDateTo" class="form-control" onchange="ordersComponent.applyFilters()">
                    </div>
                    <div class="filter-actions">
                        <button class="btn btn-outline" onclick="ordersComponent.clearFilters()">
                            Сбросить
                        </button>
                    </div>
                </div>
            </div>

            <div class="table-responsive">
                <table class="orders-table">
                    <thead>
                        <tr>
                            <th data-sort="id" onclick="ordersComponent.sortOrders('id')">
                                ID заказа
                                <span class="sort-indicator"></span>
                            </th>
                            <th data-sort="date" onclick="ordersComponent.sortOrders('date')">
                                Дата
                                <span class="sort-indicator"></span>
                            </th>
                            <th data-sort="status" onclick="ordersComponent.sortOrders('status')">
                                Статус
                                <span class="sort-indicator"></span>
                            </th>
                            <th data-sort="amount" onclick="ordersComponent.sortOrders('amount')">
                                Сумма
                                <span class="sort-indicator"></span>
                            </th>
                            <th>Товары</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paginatedOrders.map(order => this.renderOrderRow(order)).join('')}
                    </tbody>
                </table>
            </div>
            ${this.renderPagination()}
        `;

        this.updateSortIndicators();
    }

    renderOrderRow(order) {
        const orderDate = new Date(order.created_date);
        const formattedDate = orderDate.toLocaleDateString('ru-RU');
        const formattedTime = orderDate.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        return `
            <tr data-order-id="${order.id}" class="order-row">
                <td>
                    <div class="order-id">#${order.id}</div>
                    <small class="order-subtext">Megamarket</small>
                </td>
                <td>
                    <div class="order-date">${formattedDate}</div>
                    <small class="order-subtext">${formattedTime}</small>
                </td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${this.getStatusText(order.status)}
                    </span>
                </td>
                <td>
                    <div class="order-amount">${order.total_amount ? `${order.total_amount.toLocaleString()} ₽` : '—'}</div>
                    ${order.items ? `<small class="order-subtext">${order.items.length} товар(ов)</small>` : ''}
                </td>
                <td>
                    ${order.items ? this.renderOrderItemsPreview(order.items) : '—'}
                </td>
                <td class="actions">
                    <button class="btn btn-sm btn-info" onclick="ordersComponent.viewOrderDetails('${order.id}')" title="Просмотр деталей">
                        <span class="btn-icon">👁️</span>
                        Просмотр
                    </button>
                    ${this.renderOrderActions(order)}
                </td>
            </tr>
        `;
    }

    renderOrderItemsPreview(items) {
        if (!items || items.length === 0) return '—';
        
        const previewItems = items.slice(0, 2);
        const remaining = items.length - 2;
        
        return `
            <div class="items-preview">
                ${previewItems.map(item => `
                    <div class="item-preview" title="${item.name}">
                        ${item.name.substring(0, 20)}${item.name.length > 20 ? '...' : ''}
                    </div>
                `).join('')}
                ${remaining > 0 ? `<div class="items-more">+${remaining} еще</div>` : ''}
            </div>
        `;
    }

    renderOrderActions(order) {
        const actions = [];
        
        switch (order.status) {
            case 'new':
                actions.push(`
                    <button class="btn btn-sm btn-success" onclick="ordersComponent.confirmOrder('${order.id}')" title="Подтвердить заказ">
                        <span class="btn-icon">✅</span>
                        Подтвердить
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="ordersComponent.showCancelModal('${order.id}')" title="Отменить заказ">
                        <span class="btn-icon">❌</span>
                        Отменить
                    </button>
                `);
                break;
                
            case 'confirmed':
                actions.push(`
                    <button class="btn btn-sm btn-primary" onclick="ordersComponent.packOrder('${order.id}')" title="Упаковать заказ">
                        <span class="btn-icon">📦</span>
                        Упаковать
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="ordersComponent.showCancelModal('${order.id}')" title="Отменить заказ">
                        <span class="btn-icon">❌</span>
                        Отменить
                    </button>
                `);
                break;
                
            case 'packed':
                actions.push(`
                    <button class="btn btn-sm btn-success" onclick="ordersComponent.shipOrder('${order.id}')" title="Отгрузить заказ">
                        <span class="btn-icon">🚚</span>
                        Отгрузить
                    </button>
                `);
                break;
                
            case 'shipped':
                actions.push(`
                    <span class="action-info">Ожидает доставки</span>
                `);
                break;
                
            case 'delivered':
                actions.push(`
                    <span class="action-success">Доставлен</span>
                `);
                break;
                
            case 'cancelled':
                actions.push(`
                    <span class="action-cancelled">Отменен</span>
                `);
                break;
        }

        return actions.join('');
    }

    renderEmptyState() {
        return `
            <div class="orders-empty">
                <div class="orders-empty-icon">📦</div>
                <h4>Заказы не найдены</h4>
                <p>Нет заказов, соответствующих выбранным фильтрам</p>
                <button class="btn btn-primary" onclick="ordersComponent.clearFilters()">
                    Сбросить фильтры
                </button>
            </div>
        `;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.ordersPerPage);
        if (totalPages <= 1) return '';

        const startOrder = (this.currentPage - 1) * this.ordersPerPage + 1;
        const endOrder = Math.min(this.currentPage * this.ordersPerPage, this.filteredOrders.length);

        return `
            <div class="pagination">
                <div class="pagination-info">
                    Показано ${startOrder}-${endOrder} из ${this.filteredOrders.length}
                </div>
                <div class="pagination-controls">
                    <button class="btn btn-sm ${this.currentPage === 1 ? 'btn-disabled' : 'btn-secondary'}" 
                            ${this.currentPage === 1 ? 'disabled' : ''} 
                            onclick="ordersComponent.previousPage()">
                        <span class="btn-icon">←</span>
                        Назад
                    </button>
                    
                    <div class="page-numbers">
                        ${this.renderPageNumbers(totalPages)}
                    </div>
                    
                    <button class="btn btn-sm ${this.currentPage === totalPages ? 'btn-disabled' : 'btn-secondary'}" 
                            ${this.currentPage === totalPages ? 'disabled' : ''} 
                            onclick="ordersComponent.nextPage()">
                        Вперед
                        <span class="btn-icon">→</span>
                    </button>
                </div>
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
        
        // Первая страница
        if (startPage > 1) {
            pages.push(`<button class="btn btn-sm btn-secondary" onclick="ordersComponent.goToPage(1)">1</button>`);
            if (startPage > 2) {
                pages.push('<span class="page-ellipsis">...</span>');
            }
        }
        
        // Основные страницы
        for (let i = startPage; i <= endPage; i++) {
            if (i === this.currentPage) {
                pages.push(`<button class="btn btn-sm btn-primary" disabled>${i}</button>`);
            } else {
                pages.push(`<button class="btn btn-sm btn-secondary" onclick="ordersComponent.goToPage(${i})">${i}</button>`);
            }
        }
        
        // Последняя страница
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push('<span class="page-ellipsis">...</span>');
            }
            pages.push(`<button class="btn btn-sm btn-secondary" onclick="ordersComponent.goToPage(${totalPages})">${totalPages}</button>`);
        }
        
        return pages.join('');
    }

    // Методы работы с заказами
    async confirmOrder(orderId) {
        try {
            const newDeliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            await this.megamarketService.confirmOrderWithNewDate(orderId, newDeliveryDate);
            this.showNotification('Заказ подтвержден', 'success');
            await this.loadOrders();
        } catch (error) {
            console.error('Error confirming order:', error);
            this.showNotification('Ошибка подтверждения заказа', 'error');
        }
    }

    async packOrder(orderId) {
        try {
            const orderInfo = await this.megamarketService.getOrderInfo(orderId);
            const packages = orderInfo.items.map(item => ({
                item_id: item.id,
                quantity: item.quantity
            }));
            
            await this.megamarketService.packOrder(orderId, packages);
            this.showNotification('Заказ упакован', 'success');
            await this.loadOrders();
        } catch (error) {
            console.error('Error packing order:', error);
            this.showNotification('Ошибка упаковки заказа', 'error');
        }
    }

    async shipOrder(orderId) {
        try {
            await this.megamarketService.closeOrder(orderId, new Date().toISOString().split('T')[0]);
            this.showNotification('Заказ отгружен', 'success');
            await this.loadOrders();
        } catch (error) {
            console.error('Error shipping order:', error);
            this.showNotification('Ошибка отгрузки заказа', 'error');
        }
    }

    showCancelModal(orderId) {
        ModalComponent.show({
            title: 'Отмена заказа',
            content: `
                <div class="cancel-form">
                    <p>Вы уверены, что хотите отменить заказ <strong>#${orderId}</strong>?</p>
                    <div class="form-group">
                        <label for="cancelReason">Причина отмены:</label>
                        <select id="cancelReason" class="form-control">
                            <option value="out_of_stock">Нет в наличии</option>
                            <option value="customer_request">По просьбе покупателя</option>
                            <option value="price_error">Ошибка в цене</option>
                            <option value="delivery_issues">Проблемы с доставкой</option>
                            <option value="other">Другая причина</option>
                        </select>
                    </div>
                    <div id="otherReasonContainer" style="display: none; margin-top: 10px;">
                        <label for="otherReason">Укажите причину:</label>
                        <input type="text" id="otherReason" class="form-control" placeholder="Введите причину отмены">
                    </div>
                </div>
            `,
            onConfirm: () => this.cancelOrder(orderId),
            confirmText: 'Отменить заказ',
            confirmClass: 'btn-danger',
            showCancel: true,
            cancelText: 'Назад'
        });

        document.getElementById('cancelReason').addEventListener('change', (e) => {
            const otherContainer = document.getElementById('otherReasonContainer');
            otherContainer.style.display = e.target.value === 'other' ? 'block' : 'none';
        });
    }

    async cancelOrder(orderId) {
        try {
            const reason = document.getElementById('cancelReason').value;
            let cancelReason = reason;
            
            if (reason === 'other') {
                cancelReason = document.getElementById('otherReason').value;
                if (!cancelReason.trim()) {
                    this.showNotification('Укажите причину отмены', 'warning');
                    return;
                }
            }

            await this.megamarketService.cancelOrder(orderId, cancelReason);
            this.showNotification('Заказ отменен', 'success');
            ModalComponent.hide();
            await this.loadOrders();
        } catch (error) {
            console.error('Error canceling order:', error);
            this.showNotification('Ошибка отмены заказа', 'error');
        }
    }

    async viewOrderDetails(orderId) {
        try {
            const orderInfo = await this.megamarketService.getOrderInfo(orderId);
            this.showOrderDetailsModal(orderInfo);
        } catch (error) {
            console.error('Error fetching order details:', error);
            this.showNotification('Ошибка загрузки деталей заказа', 'error');
        }
    }

    showOrderDetailsModal(order) {
        ModalComponent.show({
            title: `Детали заказа #${order.id}`,
            content: `
                <div class="order-details">
                    <div class="detail-section">
                        <h4>Основная информация</h4>
                        <div class="detail-row">
                            <strong>Статус:</strong>
                            <span class="status-badge status-${order.status}">${this.getStatusText(order.status)}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Дата создания:</strong>
                            <span>${new Date(order.created_date).toLocaleString('ru-RU')}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Сумма заказа:</strong>
                            <span class="order-amount-large">${order.total_amount ? `${order.total_amount.toLocaleString()} ₽` : '—'}</span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>Товары в заказе</h4>
                        <div class="order-items">
                            ${order.items ? order.items.map(item => `
                                <div class="order-item">
                                    <div class="item-info">
                                        <div class="item-name">${item.name}</div>
                                        <div class="item-sku">Артикул: ${item.sku || '—'}</div>
                                    </div>
                                    <div class="item-details">
                                        <div class="item-quantity">${item.quantity} шт.</div>
                                        <div class="item-price">${item.price ? `${item.price.toLocaleString()} ₽` : '—'}</div>
                                    </div>
                                </div>
                            `).join('') : '<p>Нет информации о товарах</p>'}
                        </div>
                    </div>

                    ${order.delivery_info ? `
                    <div class="detail-section">
                        <h4>Информация о доставке</h4>
                        <div class="detail-row">
                            <strong>Адрес:</strong>
                            <span>${order.delivery_info.address || '—'}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Получатель:</strong>
                            <span>${order.delivery_info.recipient || '—'}</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `,
            showConfirm: false,
            cancelText: 'Закрыть',
            size: 'large'
        });
    }

    // Поиск и фильтрация
    showSearchModal() {
        ModalComponent.show({
            title: 'Расширенный поиск заказов',
            content: `
                <div class="search-form">
                    <div class="form-group">
                        <label for="searchOrderId">ID заказа:</label>
                        <input type="text" id="searchOrderId" class="form-control" placeholder="Введите ID заказа">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="searchDateFrom">Дата с:</label>
                            <input type="date" id="searchDateFrom" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="searchDateTo">Дата по:</label>
                            <input type="date" id="searchDateTo" class="form-control">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="searchStatus">Статус:</label>
                        <select id="searchStatus" class="form-control">
                            <option value="">Все статусы</option>
                            <option value="new">Новые</option>
                            <option value="confirmed">Подтвержденные</option>
                            <option value="packed">Упакованные</option>
                            <option value="shipped">Отгруженные</option>
                            <option value="delivered">Доставленные</option>
                            <option value="cancelled">Отмененные</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="searchMinAmount">Минимальная сумма:</label>
                        <input type="number" id="searchMinAmount" class="form-control" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label for="searchMaxAmount">Максимальная сумма:</label>
                        <input type="number" id="searchMaxAmount" class="form-control" placeholder="100000">
                    </div>
                </div>
            `,
            onConfirm: () => this.performSearch(),
            confirmText: 'Найти',
            showCancel: true,
            cancelText: 'Отмена'
        });
    }

    async performSearch() {
        try {
            const orderId = document.getElementById('searchOrderId').value;
            const dateFrom = document.getElementById('searchDateFrom').value;
            const dateTo = document.getElementById('searchDateTo').value;
            const status = document.getElementById('searchStatus').value;
            const minAmount = document.getElementById('searchMinAmount').value;
            const maxAmount = document.getElementById('searchMaxAmount').value;

            const criteria = {};
            if (orderId) criteria.order_id = orderId;
            if (dateFrom) criteria.date_from = dateFrom;
            if (dateTo) criteria.date_to = dateTo;
            if (status) criteria.status = status;
            if (minAmount) criteria.min_amount = parseFloat(minAmount);
            if (maxAmount) criteria.max_amount = parseFloat(maxAmount);

            this.orders = await this.megamarketService.searchOrders(criteria);
            this.filteredOrders = [...this.orders];
            this.currentPage = 1;
            this.renderOrdersTable();
            ModalComponent.hide();
            this.showNotification(`Найдено ${this.orders.length} заказов`, 'success');
        } catch (error) {
            console.error('Error searching orders:', error);
            this.showNotification('Ошибка поиска заказов', 'error');
        }
    }

    applyFilters() {
        const statusFilter = document.getElementById('filterStatus').value;
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;

        this.currentFilters = {
            status: statusFilter,
            dateFrom: dateFrom,
            dateTo: dateTo
        };

        this.filteredOrders = this.orders.filter(order => {
            let matches = true;

            // Фильтр по статусу
            if (statusFilter && order.status !== statusFilter) {
                matches = false;
            }

            // Фильтр по дате
            if (dateFrom) {
                const orderDate = new Date(order.created_date).toISOString().split('T')[0];
                if (orderDate < dateFrom) matches = false;
            }

            if (dateTo) {
                const orderDate = new Date(order.created_date).toISOString().split('T')[0];
                if (orderDate > dateTo) matches = false;
            }

            return matches;
        });

        this.currentPage = 1;
        this.renderOrdersTable();
    }

    clearFilters() {
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        
        this.currentFilters = {};
        this.filteredOrders = [...this.orders];
        this.currentPage = 1;
        this.renderOrdersTable();
        this.showNotification('Фильтры сброшены', 'success');
    }

    toggleFilters() {
        const filtersElement = document.getElementById('ordersFilters');
        if (filtersElement) {
            const isVisible = filtersElement.style.display !== 'none';
            filtersElement.style.display = isVisible ? 'none' : 'block';
        }
    }

    // Сортировка
    sortOrders(field) {
        this.filteredOrders.sort((a, b) => {
            switch (field) {
                case 'id':
                    return a.id.localeCompare(b.id);
                case 'date':
                    return new Date(a.created_date) - new Date(b.created_date);
                case 'status':
                    return a.status.localeCompare(b.status);
                case 'amount':
                    return (a.total_amount || 0) - (b.total_amount || 0);
                default:
                    return 0;
            }
        });

        this.currentSortField = field;
        this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
        
        if (this.currentSortDirection === 'desc') {
            this.filteredOrders.reverse();
        }

        this.renderOrdersTable();
    }

    updateSortIndicators() {
        if (!this.currentSortField) return;

        const headers = document.querySelectorAll('.orders-table th[data-sort]');
        headers.forEach(header => {
            const indicator = header.querySelector('.sort-indicator');
            if (header.dataset.sort === this.currentSortField) {
                indicator.textContent = this.currentSortDirection === 'asc' ? ' ↑' : ' ↓';
            } else {
                indicator.textContent = '';
            }
        });
    }

    // Пагинация
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderOrdersTable();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.ordersPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderOrdersTable();
        }
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredOrders.length / this.ordersPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderOrdersTable();
        }
    }

    // Вспомогательные методы
    async refreshOrders() {
        await this.loadOrders();
        this.showNotification('Заказы обновлены', 'success');
    }

    updateOrdersCounter() {
        const counter = document.querySelector('.orders-counter');
        if (counter) {
            counter.textContent = `${this.filteredOrders.length} заказов`;
        }
    }

    getStatusText(status) {
        const statusMap = {
            'new': 'Новый',
            'confirmed': 'Подтвержден',
            'packed': 'Упакован',
            'shipped': 'Отгружен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statusMap[status] || status;
    }

    showNotification(message, type = 'info') {
        // Используем существующую систему уведомлений
        if (window.Notifications) {
            Notifications.show(message, type);
        } else {
            // Fallback уведомление
            console.log(`${type}: ${message}`);
        }
    }

    setupEventListeners() {
        // Глобальные обработчики событий
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const filtersElement = document.getElementById('ordersFilters');
                if (filtersElement && filtersElement.style.display !== 'none') {
                    this.toggleFilters();
                }
            }
        });
    }

    setupFilters() {
        // Устанавливаем даты по умолчанию для фильтров
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        setTimeout(() => {
            const dateFrom = document.getElementById('filterDateFrom');
            const dateTo = document.getElementById('filterDateTo');
            
            if (dateFrom && !dateFrom.value) dateFrom.value = weekAgo;
            if (dateTo && !dateTo.value) dateTo.value = today;
        }, 100);
    }
}

// Глобальный экземпляр для обработчиков событий
window.ordersComponent = null;
