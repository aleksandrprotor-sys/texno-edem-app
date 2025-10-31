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
    }

    // Основной метод рендеринга
    render() {
        // Защита от множественных рендеров
        if (this.isRendering) {
            return;
        }
        
        const now = Date.now();
        if (now - this.lastRenderTime < 500) {
            return;
        }
        
        this.isRendering = true;
        this.lastRenderTime = now;
        
        try {
            this.renderOrdersContainer();
            this.renderOrdersList();
            this.updateOrdersBadge();
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
            this.setSearchFilter(searchTerm);
        }, 300);
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

    // Остальные методы остаются без изменений...
    // [Здесь должен быть остальной код из оригинального orders.js]
    // renderOrdersListContent, renderOrderCard, renderOrderItems, и т.д.
}

// Остальной код компонента orders.js остается без изменений
