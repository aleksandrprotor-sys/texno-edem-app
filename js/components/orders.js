// js/components/orders.js - Полная реализация компонента заказов
class OrdersComponent {
    constructor(app) {
        this.app = app;
        this.currentPlatform = 'all';
        this.filteredOrders = [];
        this.searchQuery = '';
        this.statusFilter = 'all';
        this.sortBy = 'date_desc';
        this.currentPage = 1;
        this.itemsPerPage = this.app.config?.get('SETTINGS.ITEMS_PER_PAGE', 20) || 20;
    }

    render(platform = 'all') {
        this.currentPlatform = platform;
        const container = document.getElementById('orders-container');
        if (!container) return;

        this.filteredOrders = this.filterOrders();
        container.innerHTML = this.createOrdersHTML();
        this.attachEventListeners();
        this.updatePagination();
    }

    createOrdersHTML() {
        const orders = this.getCurrentPageOrders();
        const platformTitle = this.getPlatformTitle();
        const totalOrders = this.filteredOrders.length;
        
        return `
            <div class="orders-content">
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
                                <span class="summary-value">${totalOrders}</span>
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
                                <input type="text" id="orders-search" placeholder="Поиск по номеру, клиенту или адресу..." 
                                       value="${this.searchQuery}">
                                ${this.searchQuery ? `
                                    <button class="search-clear" onclick="app.ordersComponent.clearSearch()">
                                        <i class="fas fa-times"></i>
                                    </button>
                                ` : ''}
                            </div>
                            <div class="filter-group">
                                <select id="status-filter" class="filter-select">
                                    <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>Все статусы</option>
                                    <option value="new" ${this.statusFilter === 'new' ? 'selected' : ''}>Новые</option>
                                    <option value="processing" ${this.statusFilter === 'processing' ? 'selected' : ''}>В обработке</option>
                                    <option value="active" ${this.statusFilter === 'active' ? 'selected' : ''}>Активные</option>
                                    <option value="delivered" ${this.statusFilter === 'delivered' ? 'selected' : ''}>Доставленные</option>
                                    <option value="problem" ${this.statusFilter === 'problem' ? 'selected' : ''}>Проблемы</option>
                                    <option value="cancelled" ${this.statusFilter === 'cancelled' ? 'selected' : ''}>Отмененные</option>
                                </select>
                            </div>
                        </div>
                        <div class="toolbar-right">
                            <div class="sort-group">
                                <span class="sort-label">Сортировка:</span>
                                <select id="orders-sort" class="sort-select">
                                    <option value="date_desc" ${this.sortBy === 'date_desc' ? 'selected' : ''}>Сначала новые</option>
                                    <option value="date_asc" ${this.sortBy === 'date_asc' ? 'selected' : ''}>Сначала старые</option>
                                    <option value="amount_desc" ${this.sortBy === 'amount_desc' ? 'selected' : ''}>По сумме ↓</option>
                                    <option value="amount_asc" ${this.sortBy === 'amount_asc' ? 'selected' : ''}>По сумме ↑</option>
                                    <option value="status" ${this.sortBy === 'status' ? 'selected' : ''}>По статусу</option>
                                </select>
                            </div>
                            <button class="btn btn-outline" onclick="app.ordersComponent.exportOrders()" title="Экспорт заказов">
                                <i class="fas fa-download"></i>
                                Экспорт
                            </button>
                            <button class="btn btn-primary" onclick="app.manualSync()" title="Обновить данные">
                                <i class="fas fa-sync-alt"></i>
                                Обновить
                            </button>
                        </div>
                    </div>
                </div>

                <div class="orders-list-container">
                    ${totalOrders > 0 ? this.createOrdersList(orders) : this.createEmptyState()}
                </div>

                ${totalOrders > 0 ? this.createPagination() : ''}
            </div>
        `;
    }

    createOrdersList(orders) {
        return `
            <div class="orders-list">
                ${orders.map(order => this.createOrderCard(order)).join('')}
            </div>
        `;
    }

    createOrderCard(order) {
        const statusConfig = this.app.getStatusConfig(order);
        const platformIcon = order.platform === 'cdek' ? 'shipping-fast' : 'store';
        const isProblem = order.status === 'problem';
        const isNew = order.status === 'new';
        
        return `
            <div class="order-card ${isProblem ? 'problem' : ''} ${isNew ? 'new' : ''}" 
                 onclick="app.ordersComponent.showOrderDetails('${order.platform}', '${order.id}')">
                <div class="order-header">
                    <div class="order-main-info">
                        <div class="order-id">
                            <i class="fas fa-${platformIcon}"></i>
                            ${order.platform === 'cdek' ? order.trackingNumber : '#' + order.orderNumber}
                        </div>
                        <div class="order-meta">
                            <span class="order-date">
                                <i class="fas fa-calendar"></i>
                                ${formatDate(order.createdDate)}
                            </span>
                            <span class="order-customer">
                                <i class="fas fa-user"></i>
                                ${order.recipient || order.customerName}
                            </span>
                            ${order.estimatedDelivery ? `
                                <span class="order-eta">
                                    <i class="fas fa-clock"></i>
                                    До ${formatDate(order.estimatedDelivery)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="order-status" style="--status-color: ${statusConfig.color}">
                        <i class="fas fa-${statusConfig.icon}"></i>
                        ${statusConfig.text}
                    </div>
                </div>

                <div class="order-content">
                    <div class="order-details">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Сумма</span>
                                <span class="detail-value amount">${formatCurrency(order.cost || order.totalAmount)}</span>
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
                            ${order.weight ? `
                                <div class="detail-item">
                                    <span class="detail-label">Вес</span>
                                    <span class="detail-value">${order.weight} кг</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    ${order.items && order.items.length > 0 ? this.createOrderItems(order.items) : ''}
                </div>

                <div class="order-footer">
                    <div class="order-actions">
                        ${this.createActionButtons(order)}
                    </div>
                    <div class="order-platform">
                        <span class="platform-badge ${order.platform}">
                            <i class="fas fa-${platformIcon}"></i>
                            ${order.platform === 'cdek' ? 'CDEK' : 'Мегамаркет'}
                        </span>
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
                    <div class="items-title">
                        <i class="fas fa-boxes"></i>
                        Товары
                    </div>
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
                            <i class="fas fa-ellipsis-h"></i>
                            и ещё ${hiddenCount} товар(ов)
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createActionButtons(order) {
        const platform = order.platform.toUpperCase();
        const statusConfig = this.app.config?.get(`STATUSES.${platform}.${order.statusCode}`);
        
        if (!statusConfig || !statusConfig.action) {
            return '<button class="btn btn-sm btn-outline" disabled>Действий нет</button>';
        }

        const actionConfig = this.app.config?.get(`ACTIONS.${platform}.${statusConfig.action}`);
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
                <div class="empty-actions">
                    <button class="btn btn-primary" onclick="app.ordersComponent.clearFilters()">
                        <i class="fas fa-times"></i>
                        Сбросить фильтры
                    </button>
                    <button class="btn btn-outline" onclick="app.manualSync()">
                        <i class="fas fa-sync-alt"></i>
                        Обновить данные
                    </button>
                </div>
            </div>
        `;
    }

    createPagination() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredOrders.length);
        
        return `
            <div class="pagination">
                <div class="pagination-info">
                    Показано ${startItem}-${endItem} из ${this.filteredOrders.length} заказов
                </div>
                <div class="pagination-controls">
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
                <button class="pagination-page ${i === this.currentPage ? 'active' : ''}" 
                        onclick="app.ordersComponent.goToPage(${i})">
                    ${i}
                </button>
            `);
        }
        
        return pages.join('');
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
                (order.customerName && order.customerName.toLowerCase().includes(query)) ||
                (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(query)) ||
                (order.fromCity && order.fromCity.toLowerCase().includes(query)) ||
                (order.toCity && order.toCity.toLowerCase().includes(query))
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
                case 'status':
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });
    }

    getCurrentPageOrders() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredOrders.slice(startIndex, endIndex);
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
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.render(this.currentPlatform);
            }, 300));
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.currentPage = 1;
                this.render(this.currentPlatform);
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
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

    // Пагинация
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.render(this.currentPlatform);
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.render(this.currentPlatform);
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.render(this.currentPlatform);
    }

    updatePagination() {
        // Обновляем состояние пагинации
        const totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
        if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = totalPages;
            this.render(this.currentPlatform);
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
        this.currentPage = 1;
        this.render(this.currentPlatform);
    }

    clearSearch() {
        this.searchQuery = '';
        this.currentPage = 1;
        this.render(this.currentPlatform);
    }

    // Экспорт заказов
    async exportOrders() {
        try {
            this.app.showLoading('Подготовка данных для экспорта...');
            
            const data = this.filteredOrders.map(order => ({
                'ID заказа': order.id,
                'Платформа': order.platform === 'cdek' ? 'CDEK' : 'Мегамаркет',
                'Номер': order.platform === 'cdek' ? order.trackingNumber : order.orderNumber,
                'Статус': this.app.getStatusConfig(order).text,
                'Сумма': order.cost || order.totalAmount,
                'Клиент': order.recipient || order.customerName,
                'Дата создания': formatDateTime(order.createdDate),
                'Город отправления': order.fromCity || '',
                'Город назначения': order.toCity || '',
                'Адрес доставки': order.deliveryAddress || '',
                'Вес': order.weight || ''
            }));

            const csvContent = this.convertToCSV(data);
            this.downloadCSV(csvContent, `orders-${this.currentPlatform}-${new Date().toISOString().split('T')[0]}.csv`);
            
            this.app.showNotification('Данные успешно экспортированы', 'success');
            
        } catch (error) {
            console.error('Export error:', error);
            this.app.showNotification('Ошибка экспорта данных', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(',')
            )
        ];
        
        return csvRows.join('\n');
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            'cdek': { 
                phone: '+7 495 666-66-66', 
                email: 'support@cdek.ru',
                hours: 'круглосуточно'
            },
            'megamarket': { 
                phone: '+7 800 600-00-00', 
                email: 'merchant@megamarket.ru',
                hours: '9:00-21:00'
            }
        };

        const info = supportInfo[platform];
        if (info) {
            this.app.showNotification(
                `Свяжитесь с поддержкой ${platform}: ${info.phone} (${info.hours}) или ${info.email}`,
                'info',
                8000
            );
        }
    }
}
