// js/components/orders.js
class OrdersComponent {
    constructor(app) {
        this.app = app;
        this.orders = [];
        this.filteredOrders = [];
        this.currentFilters = {
            platform: 'all',
            status: 'all',
            search: ''
        };
        this.sortField = 'createdDate';
        this.sortDirection = 'desc';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    init() {
        console.log('✅ OrdersComponent инициализирован');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Обработчик поиска
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Обработчики для действий с заказами
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-process')) {
                this.processOrder(e.target.closest('.btn-process').dataset.orderId);
            }
            if (e.target.closest('.btn-cancel')) {
                this.cancelOrder(e.target.closest('.btn-cancel').dataset.orderId);
            }
            if (e.target.closest('.btn-details')) {
                this.showOrderDetails(e.target.closest('.btn-details').dataset.orderId);
            }
            if (e.target.closest('.btn-export')) {
                this.exportOrders();
            }
            if (e.target.closest('.pagination-btn')) {
                this.handlePagination(e.target.closest('.pagination-btn').dataset.page);
            }
        });

        // Обработчики сортировки
        document.addEventListener('click', (e) => {
            if (e.target.closest('.sort-header')) {
                this.handleSort(e.target.closest('.sort-header').dataset.field);
            }
        });
    }

    async load(platform = null) {
        try {
            this.app.showLoading('Загрузка заказов...');
            
            // Если платформа указана, фильтруем заказы
            if (platform && platform !== 'all') {
                this.currentFilters.platform = platform;
                this.updateFiltersUI();
            }

            // Получаем заказы из основного приложения
            this.orders = this.app.getOrders();
            this.applyFilters();
            
            await this.app.delay(500); // Имитация загрузки
            
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            this.app.showNotification('Ошибка загрузки заказов', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    applyFilters() {
        let filtered = this.orders.filter(order => {
            // Фильтр по платформе
            if (this.currentFilters.platform !== 'all' && order.platform !== this.currentFilters.platform) {
                return false;
            }
            
            // Фильтр по статусу
            if (this.currentFilters.status !== 'all' && order.status !== this.currentFilters.status) {
                return false;
            }
            
            // Фильтр по поиску
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                return (
                    order.id.toLowerCase().includes(searchTerm) ||
                    order.orderNumber.toLowerCase().includes(searchTerm) ||
                    order.customer.toLowerCase().includes(searchTerm) ||
                    order.deliveryCity.toLowerCase().includes(searchTerm)
                );
            }
            
            return true;
        });

        // Сортировка
        filtered = this.sortOrders(filtered);
        
        this.filteredOrders = filtered;
        this.currentPage = 1; // Сбрасываем на первую страницу при изменении фильтров
        this.renderOrders();
        this.updateOrdersSummary();
        this.renderPagination();
    }

    sortOrders(orders) {
        return orders.sort((a, b) => {
            let aValue = a[this.sortField];
            let bValue = b[this.sortField];
            
            // Для дат преобразуем в timestamp
            if (this.sortField === 'createdDate') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }
            
            // Для числовых значений
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return this.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }
            
            // Для строк
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return this.sortDirection === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            
            return 0;
        });
    }

    handleSort(field) {
        if (this.sortField === field) {
            // Меняем направление сортировки
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // Новая сортировка
            this.sortField = field;
            this.sortDirection = 'desc';
        }
        
        this.applyFilters();
        this.updateSortHeaders();
    }

    updateSortHeaders() {
        // Обновляем UI заголовков таблицы для отображения сортировки
        document.querySelectorAll('.sort-header').forEach(header => {
            const field = header.dataset.field;
            const icon = header.querySelector('.sort-icon');
            
            if (icon) {
                if (field === this.sortField) {
                    icon.className = `sort-icon fas fa-arrow-${this.sortDirection === 'asc' ? 'up' : 'down'}`;
                    header.classList.add('active');
                } else {
                    icon.className = 'sort-icon fas fa-sort';
                    header.classList.remove('active');
                }
            }
        });
    }

    filterByPlatform(platform) {
        this.currentFilters.platform = platform;
        this.applyFilters();
    }

    filterByStatus(status) {
        this.currentFilters.status = status;
        this.applyFilters();
    }

    updateFiltersUI() {
        const platformFilter = document.getElementById('platform-filter');
        const statusFilter = document.getElementById('status-filter');
        
        if (platformFilter) {
            platformFilter.value = this.currentFilters.platform;
        }
        if (statusFilter) {
            statusFilter.value = this.currentFilters.status;
        }
    }

    renderOrders() {
        const container = document.getElementById('orders-container');
        if (!container) return;

        // Пагинация
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedOrders = this.filteredOrders.slice(startIndex, endIndex);

        if (paginatedOrders.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = paginatedOrders.map(order => this.createOrderCard(order)).join('');
    }

    createOrderCard(order) {
        const statusColors = {
            'new': 'var(--primary)',
            'processing': 'var(--warning)',
            'active': 'var(--info)',
            'shipped': 'var(--primary-light)',
            'delivered': 'var(--success)',
            'problem': 'var(--danger)',
            'cancelled': 'var(--gray-500)'
        };

        const statusIcons = {
            'new': 'fa-clock',
            'processing': 'fa-cog',
            'active': 'fa-truck',
            'shipped': 'fa-shipping-fast',
            'delivered': 'fa-check-circle',
            'problem': 'fa-exclamation-triangle',
            'cancelled': 'fa-times-circle'
        };

        const platformIcons = {
            'cdek': 'fa-shipping-fast',
            'megamarket': 'fa-store'
        };

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-main-info">
                        <div class="order-id">
                            <i class="fas ${platformIcons[order.platform]}"></i>
                            ${order.id}
                            <span class="order-number">${order.orderNumber}</span>
                        </div>
                        <div class="order-meta">
                            <span class="order-date">${this.app.formatDateTime(order.createdDate)}</span>
                            <span class="order-customer">${order.customer}</span>
                            <span class="order-city">${order.deliveryCity}</span>
                        </div>
                    </div>
                    <div class="order-status" style="--status-color: ${statusColors[order.status] || 'var(--gray-500)'}">
                        <i class="fas ${statusIcons[order.status] || 'fa-circle'}"></i>
                        ${this.app.getStatusText(order.status)}
                    </div>
                </div>
                
                <div class="order-content">
                    <div class="order-details">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Сумма</span>
                                <span class="detail-value">${this.app.formatCurrency(order.amount)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Товары</span>
                                <span class="detail-value">${order.items} шт</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Платформа</span>
                                <span class="detail-value platform-${order.platform}">
                                    <i class="fas ${platformIcons[order.platform]}"></i>
                                    ${order.platform.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    ${order.notes ? `
                        <div class="order-notes">
                            <i class="fas fa-exclamation-circle"></i>
                            <span>${order.notes}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="order-footer">
                    <div class="order-actions">
                        ${order.status === 'new' ? `
                            <button class="btn btn-primary btn-sm btn-process" data-order-id="${order.id}">
                                <i class="fas fa-play"></i> Обработать
                            </button>
                        ` : ''}
                        
                        ${order.status === 'problem' ? `
                            <button class="btn btn-warning btn-sm" onclick="app.components.orders.resolveProblem('${order.id}')">
                                <i class="fas fa-wrench"></i> Решить
                            </button>
                        ` : ''}
                        
                        <button class="btn btn-outline btn-sm btn-details" data-order-id="${order.id}">
                            <i class="fas fa-eye"></i> Детали
                        </button>
                        
                        ${!['delivered', 'cancelled'].includes(order.status) ? `
                            <button class="btn btn-danger btn-sm btn-cancel" data-order-id="${order.id}">
                                <i class="fas fa-times"></i> Отменить
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getEmptyState() {
        const hasFilters = this.currentFilters.platform !== 'all' || 
                          this.currentFilters.status !== 'all' || 
                          this.currentFilters.search !== '';

        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-${hasFilters ? 'search' : 'box-open'}"></i>
                </div>
                <h3>${hasFilters ? 'Заказы не найдены' : 'Нет заказов'}</h3>
                <p>${hasFilters ? 'Попробуйте изменить параметры фильтрации' : 'Здесь будут отображаться ваши заказы'}</p>
                ${hasFilters ? `
                    <button class="btn btn-primary" onclick="app.components.orders.clearFilters()">
                        <i class="fas fa-times"></i> Сбросить фильтры
                    </button>
                ` : ''}
            </div>
        `;
    }

    updateOrdersSummary() {
        const summary = {
            total: this.filteredOrders.length,
            new: this.filteredOrders.filter(o => o.status === 'new').length,
            problems: this.filteredOrders.filter(o => o.status === 'problem').length,
            delivered: this.filteredOrders.filter(o => o.status === 'delivered').length
        };

        // Обновляем summary элементы если они есть
        const summaryElements = {
            'total-orders': summary.total,
            'new-orders': summary.new,
            'problem-orders': summary.problems,
            'delivered-orders': summary.delivered
        };

        Object.entries(summaryElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            this.hidePagination();
            return;
        }

        const paginationContainer = document.querySelector('.pagination');
        if (!paginationContainer) return;

        paginationContainer.innerHTML = `
            <div class="pagination-info">
                Показано ${((this.currentPage - 1) * this.itemsPerPage) + 1}-${Math.min(this.currentPage * this.itemsPerPage, this.filteredOrders.length)} из ${this.filteredOrders.length}
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                        data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                ${this.generatePageNumbers(totalPages)}
                
                <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                        data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        paginationContainer.style.display = 'flex';
    }

    generatePageNumbers(totalPages) {
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
                        data-page="${i}">
                    ${i}
                </button>
            `);
        }
        
        return pages.join('');
    }

    hidePagination() {
        const paginationContainer = document.querySelector('.pagination');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
    }

    handlePagination(page) {
        const pageNum = parseInt(page);
        if (pageNum && pageNum !== this.currentPage) {
            this.currentPage = pageNum;
            this.renderOrders();
            this.renderPagination();
            
            // Прокрутка к верху контейнера
            const container = document.getElementById('orders-container');
            if (container) {
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    async processOrder(orderId) {
        try {
            this.app.showLoading('Обработка заказа...');
            
            // Имитация обработки заказа
            await this.app.delay(1000);
            
            // Обновляем статус заказа
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                order.status = 'processing';
                order.updatedDate = new Date().toISOString();
                
                this.applyFilters();
                this.app.showNotification(`Заказ ${orderId} передан в обработку`, 'success');
                
                // Добавляем уведомление
                if (this.app.components.notifications) {
                    this.app.components.notifications.addNotification({
                        type: 'success',
                        title: 'Заказ обработан',
                        message: `Заказ ${orderId} успешно передан в обработку`
                    });
                }
            }
            
        } catch (error) {
            console.error('Ошибка обработки заказа:', error);
            this.app.showNotification('Ошибка обработки заказа', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async cancelOrder(orderId) {
        const confirmed = confirm('Вы уверены, что хотите отменить этот заказ?');
        if (!confirmed) return;

        try {
            this.app.showLoading('Отмена заказа...');
            
            await this.app.delay(800);
            
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                order.status = 'cancelled';
                order.updatedDate = new Date().toISOString();
                
                this.applyFilters();
                this.app.showNotification(`Заказ ${orderId} отменен`, 'success');
            }
            
        } catch (error) {
            console.error('Ошибка отмены заказа:', error);
            this.app.showNotification('Ошибка отмены заказа', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async resolveProblem(orderId) {
        try {
            this.app.showLoading('Решение проблемы...');
            
            await this.app.delay(1500);
            
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                order.status = 'processing';
                order.updatedDate = new Date().toISOString();
                order.notes = 'Проблема решена';
                
                this.applyFilters();
                this.app.showNotification(`Проблема с заказом ${orderId} решена`, 'success');
            }
            
        } catch (error) {
            console.error('Ошибка решения проблемы:', error);
            this.app.showNotification('Ошибка решения проблемы', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    showOrderDetails(orderId) {
        this.app.showOrderDetails(orderId);
    }

    clearFilters() {
        this.currentFilters = {
            platform: 'all',
            status: 'all',
            search: ''
        };
        
        this.updateFiltersUI();
        this.applyFilters();
        
        // Очищаем поле поиска
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.value = '';
        }
    }

    exportOrders() {
        const data = this.filteredOrders.map(order => ({
            'ID заказа': order.id,
            'Номер': order.orderNumber,
            'Платформа': order.platform.toUpperCase(),
            'Статус': this.app.getStatusText(order.status),
            'Сумма': order.amount,
            'Клиент': order.customer,
            'Город': order.deliveryCity,
            'Товары': order.items,
            'Дата создания': this.app.formatDateTime(order.createdDate)
        }));

        // Создаем CSV
        const csv = this.convertToCSV(data);
        this.downloadCSV(csv, `orders_${new Date().toISOString().split('T')[0]}.csv`);
        
        this.app.showNotification('Экспорт заказов завершен', 'success');
    }

    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header] || '';
                // Экранируем кавычки и добавляем кавычки если есть запятые
                const escaped = String(value).replace(/"/g, '""');
                return escaped.includes(',') ? `"${escaped}"` : escaped;
            }).join(','))
        ].join('\n');
        
        return '\uFEFF' + csv; // BOM для корректного отображения кириллицы в Excel
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    // Метод для массовых операций
    async bulkAction(orderIds, action) {
        try {
            this.app.showLoading(`Выполнение операции над ${orderIds.length} заказами...`);
            
            await this.app.delay(2000);
            
            let updatedCount = 0;
            orderIds.forEach(orderId => {
                const order = this.orders.find(o => o.id === orderId);
                if (order) {
                    switch (action) {
                        case 'process':
                            if (order.status === 'new') {
                                order.status = 'processing';
                                updatedCount++;
                            }
                            break;
                        case 'cancel':
                            if (!['delivered', 'cancelled'].includes(order.status)) {
                                order.status = 'cancelled';
                                updatedCount++;
                            }
                            break;
                    }
                    order.updatedDate = new Date().toISOString();
                }
            });
            
            this.applyFilters();
            this.app.showNotification(`Операция выполнена для ${updatedCount} заказов`, 'success');
            
        } catch (error) {
            console.error('Ошибка массовой операции:', error);
            this.app.showNotification('Ошибка выполнения операции', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    // Метод для обновления заказов извне
    updateOrders(newOrders) {
        this.orders = newOrders;
        this.applyFilters();
    }
}
