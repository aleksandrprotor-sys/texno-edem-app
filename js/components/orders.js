// js/components/orders.js
class OrdersComponent {
    constructor(app) {
        this.app = app;
        this.currentPlatform = 'all';
        this.filters = {
            status: 'all',
            search: '',
            dateRange: 'all'
        };
        this.orders = [];
    }

    render(platform = 'all') {
        console.log(`🎨 Rendering orders for platform: ${platform}`);
        this.currentPlatform = platform;
        
        const container = document.getElementById('orders-container');
        if (!container) {
            console.error('❌ Orders container not found');
            return;
        }

        // Загружаем заказы
        this.loadOrders();
        
        container.innerHTML = this.createOrdersHTML();
        this.attachEventListeners();
        this.updateStats();
    }

    async loadOrders() {
        try {
            console.log('📥 Loading orders...');
            this.orders = await this.getOrdersFromStorage();
            console.log(`✅ Loaded ${this.orders.length} orders`);
        } catch (error) {
            console.error('❌ Error loading orders:', error);
            this.orders = [];
            this.app.showNotification('Ошибка загрузки заказов', 'error');
        }
    }

    async getOrdersFromStorage() {
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    const orders = JSON.parse(localStorage.getItem('texno_edem_orders') || '[]');
                    
                    // Если нет данных, создаем демо-данные
                    if (orders.length === 0) {
                        const demoOrders = this.createDemoOrders();
                        localStorage.setItem('texno_edem_orders', JSON.stringify(demoOrders));
                        resolve(demoOrders);
                    } else {
                        resolve(orders);
                    }
                } catch (error) {
                    console.error('Error parsing orders:', error);
                    resolve(this.createDemoOrders());
                }
            }, 300);
        });
    }

    createDemoOrders() {
        const platforms = ['cdek', 'megamarket'];
        const statuses = ['new', 'processing', 'active', 'delivered', 'problem'];
        const cities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань'];
        
        const orders = [];
        
        for (let i = 0; i < 15; i++) {
            const platform = platforms[Math.floor(Math.random() * platforms.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            const order = {
                id: `${platform.toUpperCase()}-${Date.now()}-${i}`,
                platform: platform,
                status: status,
                statusCode: status.toUpperCase(),
                trackingNumber: platform === 'cdek' ? `CDEK${100000 + i}` : null,
                orderNumber: platform === 'megamarket' ? `MEGA${200000 + i}` : null,
                recipient: `Клиент ${i + 1}`,
                customerName: `Иванов Иван ${i + 1}`,
                fromCity: 'Москва',
                toCity: cities[Math.floor(Math.random() * cities.length)],
                cost: Math.floor(Math.random() * 5000) + 1000,
                totalAmount: Math.floor(Math.random() * 5000) + 1000,
                weight: (Math.random() * 5 + 0.5).toFixed(1),
                createdDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                deliveryAddress: `${cities[Math.floor(Math.random() * cities.length)]}, ул. Примерная, д. ${i + 1}`
            };
            
            orders.push(order);
        }
        
        return orders;
    }

    createOrdersHTML() {
        const filteredOrders = this.filterOrders(this.orders);
        
        console.log(`📊 Displaying ${filteredOrders.length} filtered orders`);
        
        return `
            <div class="orders-content">
                <!-- Заголовок -->
                <div class="orders-header">
                    <h2>Управление заказами</h2>
                    <p>Все заказы с платформ CDEK и Мегамаркет</p>
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
                        <select id="platform-filter" class="form-control">
                            <option value="all" ${this.currentPlatform === 'all' ? 'selected' : ''}>Все платформы</option>
                            <option value="cdek" ${this.currentPlatform === 'cdek' ? 'selected' : ''}>CDEK</option>
                            <option value="megamarket" ${this.currentPlatform === 'megamarket' ? 'selected' : ''}>Мегамаркет</option>
                        </select>
                        
                        <select id="status-filter" class="form-control">
                            <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>Все статусы</option>
                            <option value="new" ${this.filters.status === 'new' ? 'selected' : ''}>Новые</option>
                            <option value="processing" ${this.filters.status === 'processing' ? 'selected' : ''}>В обработке</option>
                            <option value="active" ${this.filters.status === 'active' ? 'selected' : ''}>Активные</option>
                            <option value="delivered" ${this.filters.status === 'delivered' ? 'selected' : ''}>Доставленные</option>
                            <option value="problem" ${this.filters.status === 'problem' ? 'selected' : ''}>Проблемные</option>
                        </select>

                        <select id="date-filter" class="form-control">
                            <option value="all" ${this.filters.dateRange === 'all' ? 'selected' : ''}>Все даты</option>
                            <option value="today" ${this.filters.dateRange === 'today' ? 'selected' : ''}>Сегодня</option>
                            <option value="week" ${this.filters.dateRange === 'week' ? 'selected' : ''}>За неделю</option>
                            <option value="month" ${this.filters.dateRange === 'month' ? 'selected' : ''}>За месяц</option>
                        </select>
                    </div>

                    <div class="toolbar-actions">
                        <button class="btn btn-outline" onclick="app.components.orders.exportOrders()">
                            <i class="fas fa-download"></i> Экспорт
                        </button>
                        <button class="btn btn-primary" onclick="app.syncData()">
                            <i class="fas fa-sync-alt"></i> Синхронизировать
                        </button>
                    </div>
                </div>

                <!-- Статистика -->
                <div class="platform-stats-bar">
                    <div class="stat-item">
                        <span class="stat-value">${this.orders.length}</span>
                        <span class="stat-label">Всего заказов</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.getOrdersByStatus(this.orders, 'new').length}</span>
                        <span class="stat-label">Новые</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.getOrdersByStatus(this.orders, 'problem').length}</span>
                        <span class="stat-label">Проблемные</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.formatCurrency(this.calculateTotalRevenue(this.orders))}</span>
                        <span class="stat-label">Общая сумма</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.getOrdersByPlatform('cdek').length}</span>
                        <span class="stat-label">CDEK</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.getOrdersByPlatform('megamarket').length}</span>
                        <span class="stat-label">Мегамаркет</span>
                    </div>
                </div>

                <!-- Список заказов -->
                <div class="orders-list-container">
                    <div class="orders-list-header">
                        <span>Список заказов (${filteredOrders.length})</span>
                        <div class="sort-options">
                            <select id="sort-orders" class="form-control-sm">
                                <option value="newest">Сначала новые</option>
                                <option value="oldest">Сначала старые</option>
                                <option value="amount">По сумме</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="orders-list" id="orders-list">
                        ${filteredOrders.length > 0 ? 
                            this.createOrdersList(filteredOrders) : 
                            this.createEmptyState()
                        }
                    </div>
                </div>
            </div>
        `;
    }

    createOrdersList(orders) {
        const sortedOrders = this.sortOrders(orders);
        
        return sortedOrders.map(order => `
            <div class="order-card" data-order-id="${order.id}" data-platform="${order.platform}">
                <div class="order-header">
                    <div class="order-title">
                        <div class="order-number">
                            ${order.platform === 'cdek' ? 
                                `<i class="fas fa-shipping-fast"></i> ${order.trackingNumber || 'CDEK-' + order.id}` :
                                `<i class="fas fa-store"></i> #${order.orderNumber || 'MEGA-' + order.id}`
                            }
                        </div>
                        <div class="order-customer">
                            <i class="fas fa-user"></i>
                            ${order.recipient || order.customerName || 'Клиент'}
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
                                `${order.fromCity || 'Москва'} → ${order.toCity || 'Город'}` : 
                                this.truncateText(order.deliveryAddress, 30) || 'Адрес не указан'
                            }</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-weight-hanging"></i>
                            <span>${order.weight || '0'} кг</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-ruble-sign"></i>
                            <span>${this.formatCurrency(order.cost || order.totalAmount || 0)}</span>
                        </div>
                    </div>
                    
                    <div class="order-meta">
                        <span class="order-date">
                            <i class="far fa-clock"></i>
                            ${this.formatRelativeTime(order.createdDate)}
                        </span>
                        <div class="order-actions">
                            ${this.createActionButtons(order)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    createStatusBadge(order) {
        const statusConfig = this.getStatusConfig(order);
        return `
            <span class="status-badge status-${order.status}" 
                  style="background-color: ${statusConfig.color}; color: white">
                <i class="${statusConfig.icon}"></i>
                ${statusConfig.text}
            </span>
        `;
    }

    getStatusConfig(order) {
        const statusConfigs = {
            'new': { text: 'Новый', color: '#3B82F6', icon: 'fas fa-plus-circle' },
            'processing': { text: 'Обработка', color: '#F59E0B', icon: 'fas fa-cog' },
            'active': { text: 'В пути', color: '#8B5CF6', icon: 'fas fa-shipping-fast' },
            'delivered': { text: 'Доставлен', color: '#10B981', icon: 'fas fa-check-circle' },
            'problem': { text: 'Проблема', color: '#EF4444', icon: 'fas fa-exclamation-triangle' }
        };
        
        return statusConfigs[order.status] || { text: 'Неизвестно', color: '#6B7280', icon: 'fas fa-question' };
    }

    createActionButtons(order) {
        const buttons = [];
        
        if (order.status === 'new') {
            buttons.push(`
                <button class="btn-action btn-success" 
                        onclick="app.components.orders.confirmOrder('${order.id}')"
                        title="Подтвердить заказ">
                    <i class="fas fa-check"></i>
                </button>
            `);
        }
        
        if (order.status === 'problem') {
            buttons.push(`
                <button class="btn-action btn-warning" 
                        onclick="app.components.orders.contactSupport('${order.id}')"
                        title="Связаться с поддержкой">
                    <i class="fas fa-headset"></i>
                </button>
            `);
        }

        buttons.push(`
            <button class="btn-action btn-info" 
                    onclick="app.components.orders.showOrderDetails('${order.id}')"
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
                <p>Попробуйте изменить параметры фильтра или синхронизировать данные</p>
                <div class="empty-actions">
                    <button class="btn btn-primary" onclick="app.syncData()">
                        <i class="fas fa-sync-alt"></i> Синхронизировать данные
                    </button>
                    <button class="btn btn-outline" onclick="app.components.orders.clearFilters()">
                        <i class="fas fa-times"></i> Сбросить фильтры
                    </button>
                </div>
            </div>
        `;
    }

    filterOrders(orders) {
        let filtered = [...orders];

        // Фильтр по платформе
        if (this.currentPlatform !== 'all') {
            filtered = filtered.filter(order => order.platform === this.currentPlatform);
        }

        // Фильтр по статусу
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(order => order.status === this.filters.status);
        }

        // Фильтр по дате
        if (this.filters.dateRange !== 'all') {
            const now = new Date();
            let startDate;
            
            switch (this.filters.dateRange) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    break;
            }
            
            if (startDate) {
                filtered = filtered.filter(order => {
                    const orderDate = new Date(order.createdDate);
                    return orderDate >= startDate;
                });
            }
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
                (order.toCity && order.toCity.toLowerCase().includes(searchTerm)) ||
                (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(searchTerm))
            );
        }

        return filtered;
    }

    sortOrders(orders) {
        const sortBy = document.getElementById('sort-orders')?.value || 'newest';
        
        return [...orders].sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdDate) - new Date(a.createdDate);
                case 'oldest':
                    return new Date(a.createdDate) - new Date(b.createdDate);
                case 'amount':
                    return (b.cost || b.totalAmount || 0) - (a.cost || a.totalAmount || 0);
                default:
                    return 0;
            }
        });
    }

    getOrdersByStatus(orders, status) {
        return orders.filter(order => order.status === status);
    }

    getOrdersByPlatform(platform) {
        return this.orders.filter(order => order.platform === platform);
    }

    calculateTotalRevenue(orders) {
        return orders.reduce((sum, order) => sum + (order.cost || order.totalAmount || 0), 0);
    }

    attachEventListeners() {
        // Поиск
        const searchInput = document.getElementById('orders-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.filters.search = e.target.value;
                this.render();
            }, 300));
        }

        // Фильтры
        const platformFilter = document.getElementById('platform-filter');
        const statusFilter = document.getElementById('status-filter');
        const dateFilter = document.getElementById('date-filter');
        const sortSelect = document.getElementById('sort-orders');

        [platformFilter, statusFilter, dateFilter, sortSelect].forEach(element => {
            if (element) {
                element.addEventListener('change', () => {
                    if (platformFilter) this.currentPlatform = platformFilter.value;
                    if (statusFilter) this.filters.status = statusFilter.value;
                    if (dateFilter) this.filters.dateRange = dateFilter.value;
                    this.render();
                });
            }
        });

        // Клик по карточке заказа
        document.addEventListener('click', (e) => {
            const orderCard = e.target.closest('.order-card');
            if (orderCard && !e.target.closest('.btn-action')) {
                const orderId = orderCard.dataset.orderId;
                this.showOrderDetails(orderId);
            }
        });
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

    showOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            this.app.showNotification(`Детали заказа: ${order.trackingNumber || order.orderNumber}`, 'info');
            // Здесь можно открыть модальное окно с деталями
            console.log('Order details:', order);
        }
    }

    async confirmOrder(orderId) {
        try {
            this.app.showNotification('Подтверждение заказа...', 'info');
            
            // Имитация API запроса
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Обновляем статус заказа локально
            const orderIndex = this.orders.findIndex(order => order.id === orderId);
            if (orderIndex !== -1) {
                this.orders[orderIndex].status = 'processing';
                this.orders[orderIndex].statusCode = 'PROCESSING';
                
                // Сохраняем изменения
                localStorage.setItem('texno_edem_orders', JSON.stringify(this.orders));
            }
            
            this.app.showNotification('Заказ успешно подтвержден', 'success');
            this.render();
            
        } catch (error) {
            this.app.showNotification('Ошибка при подтверждении заказа', 'error');
        }
    }

    contactSupport(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const message = `Проблема с заказом: ${order.platform === 'cdek' ? order.trackingNumber : order.orderNumber}`;
            this.app.showNotification(`Обращение в поддержку: ${message}`, 'info');
        }
    }

    clearFilters() {
        this.currentPlatform = 'all';
        this.filters = {
            status: 'all',
            search: '',
            dateRange: 'all'
        };
        this.render();
    }

    exportOrders() {
        const filteredOrders = this.filterOrders(this.orders);
        const csvContent = this.generateOrdersCSV(filteredOrders);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.app.showNotification(`Экспортировано ${filteredOrders.length} заказов в CSV`, 'success');
    }

    generateOrdersCSV(orders) {
        const headers = ['ID', 'Платформа', 'Номер', 'Статус', 'Клиент', 'Сумма', 'Вес', 'Город назначения', 'Дата создания'];
        const rows = orders.map(order => [
            order.id,
            order.platform,
            order.trackingNumber || order.orderNumber,
            this.getStatusConfig(order).text,
            order.recipient || order.customerName,
            order.cost || order.totalAmount,
            order.weight,
            order.toCity || order.deliveryAddress?.split(',')[0] || '-',
            this.formatDate(order.createdDate)
        ]);

        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    updateStats() {
        // Обновляем статистику на дашборде если нужно
        console.log('📈 Orders stats updated');
    }

    // Вспомогательные методы
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

    // Метод для обновления заказов после синхронизации
    updateOrders(newOrders) {
        this.orders = newOrders;
        this.render();
    }
}
