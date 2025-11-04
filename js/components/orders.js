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
        this.filteredOrders = this.orders.filter(order => {
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

        this.renderOrders();
        this.updateOrdersSummary();
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

        if (this.filteredOrders.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = this.filteredOrders.map(order => this.createOrderCard(order)).join('');
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

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-main-info">
                        <div class="order-id">
                            <i class="fas ${order.platform === 'cdek' ? 'fa-shipping-fast' : 'fa-store'}"></i>
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
                                <span class="detail-value platform-${order.platform}">${order.platform.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
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
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-box-open"></i>
                </div>
                <h3>Заказы не найдены</h3>
                <p>Попробуйте изменить параметры фильтрации</p>
                <button class="btn btn-primary" onclick="app.components.orders.clearFilters()">
                    <i class="fas fa-times"></i> Сбросить фильтры
                </button>
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
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        return csv;
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
    }
}
