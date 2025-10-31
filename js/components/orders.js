// Компонент управления заказами для TEXNO EDEM
class OrdersComponent {
    constructor(app) {
        this.app = app;
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.sortField = 'createdDate';
        this.sortDirection = 'desc';
        this.filters = {
            status: 'all',
            search: ''
        };
        
        this.isRendering = false;
        this.lastRenderTime = 0;
        this.searchTimeout = null;
        
        this.init();
    }

    init() {
        this.debouncedSearch = this.debounce((searchTerm) => {
            this.setSearchFilter(searchTerm);
        }, 500);
    }

    render(platform = null) {
        if (this.isRendering) return;
        
        const now = Date.now();
        if (now - this.lastRenderTime < 300) return;
        
        this.isRendering = true;
        this.lastRenderTime = now;
        
        try {
            const targetPlatform = platform || this.app.currentPlatform;
            if (!targetPlatform) return;
            
            this.renderOrdersContainer(targetPlatform);
            this.renderOrdersList(targetPlatform);
            
        } catch (error) {
            console.error('Error rendering orders:', error);
        } finally {
            setTimeout(() => {
                this.isRendering = false;
            }, 100);
        }
    }

    renderOrdersContainer(platform) {
        const container = document.getElementById('orders-container');
        if (!container) return;

        const platformConfig = this.getPlatformConfig(platform);
        const orders = this.app.getPlatformOrders(platform);
        const filteredOrders = this.getFilteredOrders(orders);
        const paginatedOrders = this.getPaginatedOrders(filteredOrders);
        
        container.innerHTML = `
            <div class="orders-header">
                <div class="platform-header">
                    <div class="platform-info">
                        <div class="platform-icon ${platform}">
                            <i class="fas fa-${platformConfig.icon}"></i>
                        </div>
                        <div class="platform-details">
                            <h2>${platformConfig.name}</h2>
                            <p>${platformConfig.description}</p>
                        </div>
                    </div>
                    <div class="orders-summary">
                        <div class="summary-item">
                            <span class="summary-value">${filteredOrders.length}</span>
                            <span class="summary-label">Всего</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-value">${filteredOrders.filter(o => o.status === 'new').length}</span>
                            <span class="summary-label">Новых</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-value">${filteredOrders.filter(o => o.status === 'problem').length}</span>
                            <span class="summary-label">Проблемы</span>
                        </div>
                    </div>
                </div>
                
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
                                ${this.getStatusOptions(platform).join('')}
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
                        
                        <button class="btn btn-primary btn-sm" onclick="app.ordersComponent.exportOrders('${platform}')">
                            <i class="fas fa-download"></i> Экспорт
                        </button>
                        
                        <button class="btn btn-secondary btn-sm" onclick="app.manualSync()" ${this.app.isSyncing ? 'disabled' : ''}>
                            <i class="fas fa-sync ${this.app.isSyncing ? 'fa-spin' : ''}"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="orders-list" id="orders-list">
                ${this.renderOrdersListContent(paginatedOrders, platform)}
            </div>
            
            ${this.renderPagination(filteredOrders.length)}
        `;

        // Обновляем заголовок секции
        this.updateSectionTitle(platform);
    }

    getPlatformConfig(platform) {
        const configs = {
            cdek: {
                name: 'CDEK Logistics',
                description: 'Управление отправлениями и доставкой',
                icon: 'shipping-fast',
                statuses: ['new', 'active', 'delivered', 'problem', 'cancelled']
            },
            megamarket: {
                name: 'Мегамаркет',
                description: 'Обработка заказов и управление продажами',
                icon: 'store',
                statuses: ['new', 'processing', 'shipped', 'delivered', 'cancelled']
            }
        };
        return configs[platform] || configs.cdek;
    }

    getStatusOptions(platform) {
        const statusMap = {
            cdek: {
                'all': 'Все статусы',
                'new': 'Новые',
                'active': 'В пути',
                'delivered': 'Доставленные',
                'problem': 'Проблемные',
                'cancelled': 'Отмененные'
            },
            megamarket: {
                'all': 'Все статусы',
                'new': 'Новые',
                'processing': 'В обработке',
                'shipped': 'Отправленные',
                'delivered': 'Доставленные',
                'cancelled': 'Отмененные'
            }
        };

        const platformStatuses = statusMap[platform] || statusMap.cdek;
        return Object.entries(platformStatuses).map(([value, label]) => 
            `<option value="${value}" ${this.filters.status === value ? 'selected' : ''}>${label}</option>`
        );
    }

    updateSectionTitle(platform) {
        const title = document.getElementById('orders-title');
        const subtitle = document.getElementById('orders-subtitle');
        
        if (title && subtitle) {
            const config = this.getPlatformConfig(platform);
            title.textContent = config.name;
            subtitle.textContent = config.description;
        }
    }

    renderOrdersListContent(orders, platform) {
        if (orders.length === 0) {
            return this.renderEmptyState(platform);
        }

        return orders.map(order => this.renderOrderCard(order, platform)).join('');
    }

    renderEmptyState(platform) {
        const config = this.getPlatformConfig(platform);
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-${config.icon}"></i>
                </div>
                <h3>Заказы не найдены</h3>
                <p>Попробуйте изменить параметры фильтрации или обновить данные</p>
                <button class="btn btn-primary" onclick="app.manualSync()">
                    <i class="fas fa-sync"></i> Обновить данные
                </button>
            </div>
        `;
    }

    renderOrderCard(order, platform) {
        const statusConfig = CONFIG.STATUSES[platform.toUpperCase()]?.[order.statusCode] || 
                           this.getFallbackStatusConfig(order.status);
        
        return `
            <div class="order-card" onclick="app.ordersComponent.showOrderDetails('${platform}', '${order.id}')">
                <div class="order-header">
                    <div class="order-main-info">
                        <div class="order-id">
                            <i class="fas fa-${platform === 'cdek' ? 'barcode' : 'hashtag'}"></i>
                            ${platform === 'cdek' ? order.trackingNumber : `Заказ #${order.orderNumber}`}
                        </div>
                        <div class="order-meta">
                            <span class="order-date">${formatDate(order.createdDate)}</span>
                            ${order.estimatedDelivery ? `
                                <span class="order-eta">• Доставка: ${formatDate(order.estimatedDelivery)}</span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="order-status status-${order.status}" style="--status-color: ${statusConfig.color}">
                        ${statusConfig.text}
                    </div>
                </div>
                
                <div class="order-content">
                    ${this.renderOrderDetails(order, platform)}
                    ${platform === 'megamarket' ? this.renderOrderItems(order.items) : ''}
                </div>
                
                <div class="order-footer">
                    <div class="order-actions">
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); app.ordersComponent.quickAction('${platform}', '${order.id}')">
                            <i class="fas fa-bolt"></i> Действие
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); app.ordersComponent.showOrderDetails('${platform}', '${order.id}')">
                            <i class="fas fa-eye"></i> Подробнее
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderOrderDetails(order, platform) {
        if (platform === 'cdek') {
            return `
                <div class="order-details">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Маршрут</span>
                            <span class="detail-value">${order.fromCity} → ${order.toCity}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Вес</span>
                            <span class="detail-value">${order.weight} кг</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Стоимость</span>
                            <span class="detail-value">${formatCurrency(order.cost)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Получатель</span>
                            <span class="detail-value">${order.recipient}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="order-details">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Клиент</span>
                            <span class="detail-value">${order.customerName}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Телефон</span>
                            <span class="detail-value">${order.customerPhone || 'Не указан'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Сумма</span>
                            <span class="detail-value">${formatCurrency(order.totalAmount)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Адрес</span>
                            <span class="detail-value">${order.deliveryAddress}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderOrderItems(items) {
        if (!items || items.length === 0) return '';
        
        const displayItems = items.slice(0, 3);
        const hiddenCount = items.length - 3;
        
        return `
            <div class="order-items">
                <div class="items-header">
                    <span class="items-title">Товары</span>
                    <span class="items-count">${items.length} шт.</span>
                </div>
                <div class="items-list">
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
            </div>
        `;
    }

    // Фильтрация и сортировка
    getFilteredOrders(orders) {
        let filtered = [...orders];
        
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(order => order.status === this.filters.status);
        }
        
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(order => 
                (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm)) ||
                (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm)) ||
                (order.customerName && order.customerName.toLowerCase().includes(searchTerm)) ||
                (order.recipient && order.recipient.toLowerCase().includes(searchTerm)) ||
                (order.fromCity && order.fromCity.toLowerCase().includes(searchTerm)) ||
                (order.toCity && order.toCity.toLowerCase().includes(searchTerm))
            );
        }
        
        // Сортировка
        filtered.sort((a, b) => {
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
        
        return filtered;
    }

    getPaginatedOrders(orders) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return orders.slice(startIndex, startIndex + this.itemsPerPage);
    }

    // Управление фильтрами
    setStatusFilter(status) {
        this.filters.status = status;
        this.currentPage = 1;
        this.render();
    }

    setSearchFilter(searchTerm) {
        this.filters.search = searchTerm;
        this.currentPage = 1;
        this.render();
    }

    setSortField(field) {
        this.sortField = field;
        this.render();
    }

    toggleSortDirection() {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.render();
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
                
                <div class="pagination-info">
                    Страница ${this.currentPage} из ${totalPages}
                </div>
                
                <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                        onclick="app.ordersComponent.nextPage()" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

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
        const totalItems = this.getFilteredOrders(this.app.getPlatformOrders(this.app.currentPlatform)).length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderOrdersList();
        }
    }

    renderOrdersList() {
        const container = document.getElementById('orders-list');
        if (!container) return;

        const orders = this.app.getPlatformOrders(this.app.currentPlatform);
        const filteredOrders = this.getFilteredOrders(orders);
        const paginatedOrders = this.getPaginatedOrders(filteredOrders);
        
        container.innerHTML = this.renderOrdersListContent(paginatedOrders, this.app.currentPlatform);
        
        const paginationContainer = container.parentElement.querySelector('.pagination');
        if (paginationContainer) {
            paginationContainer.outerHTML = this.renderPagination(filteredOrders.length);
        }
    }

    // Детали заказа
    async showOrderDetails(platform, orderId) {
        try {
            this.app.showLoading('Загрузка деталей заказа...');
            
            let orderDetails;
            if (platform === 'cdek') {
                orderDetails = await CDEKService.getOrderDetails(orderId);
            } else {
                orderDetails = await MegamarketService.getOrderDetails(orderId);
            }
            
            this.app.modal.showOrderDetails(orderDetails, platform);
        } catch (error) {
            console.error('Error loading order details:', error);
            this.app.showError('Ошибка загрузки деталей заказа');
        } finally {
            this.app.hideLoading();
        }
    }

    // Быстрые действия
    quickAction(platform, orderId) {
        const order = this.app.getOrderById(platform, orderId);
        if (!order) return;

        const actions = {
            cdek: {
                'new': 'Принять в обработку',
                'active': 'Отследить отправление',
                'problem': 'Решить проблему'
            },
            megamarket: {
                'new': 'Подтвердить заказ',
                'processing': 'Упаковать заказ',
                'shipped': 'Отметить доставленным'
            }
        };

        const action = actions[platform]?.[order.status];
        if (action) {
            this.app.showNotification(`${action}: ${orderId}`, 'info');
        }
    }

    // Экспорт заказов
    exportOrders(platform) {
        const orders = this.app.getPlatformOrders(platform);
        const filteredOrders = this.getFilteredOrders(orders);
        
        const exportData = {
            platform: platform,
            exportedAt: new Date().toISOString(),
            filters: this.filters,
            totalOrders: filteredOrders.length,
            orders: filteredOrders
        };
        
        this.downloadJSON(exportData, `texno-edem-${platform}-${new Date().toISOString().split('T')[0]}.json`);
        this.app.showNotification(`Экспортировано ${filteredOrders.length} заказов`, 'success');
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    // Недавняя активность для дашборда
    renderRecentActivity() {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        const recentOrders = this.app.orders.all
            .slice(0, 6)
            .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
        
        container.innerHTML = `
            <div class="recent-activity-card">
                <div class="card-header">
                    <h3>Недавняя активность</h3>
                    <div class="card-actions">
                        <button class="btn btn-outline btn-sm" onclick="app.showSection('orders', 'cdek')">
                            CDEK
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="app.showSection('orders', 'megamarket')">
                            Мегамаркет
                        </button>
                    </div>
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
        const platformConfig = this.getPlatformConfig(order.platform);
        const statusConfig = CONFIG.STATUSES[order.platform.toUpperCase()]?.[order.statusCode] || 
                           this.getFallbackStatusConfig(order.status);
        
        return `
            <div class="activity-item" onclick="app.ordersComponent.showOrderDetails('${order.platform}', '${order.id}')">
                <div class="activity-icon platform-${order.platform}" style="background: ${statusConfig.color}">
                    <i class="fas fa-${platformConfig.icon}"></i>
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
                    <div class="activity-meta">
                        <span class="activity-time">${formatRelativeTime(order.createdDate)}</span>
                        <span class="activity-platform">${platformConfig.name}</span>
                    </div>
                </div>
                
                <div class="activity-status" style="color: ${statusConfig.color}">
                    ${statusConfig.text}
                </div>
            </div>
        `;
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
