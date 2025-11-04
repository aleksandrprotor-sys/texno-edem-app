// js/components/analytics.js - Компонент аналитики
class AnalyticsComponent {
    constructor(app) {
        this.app = app;
        this.currentPeriod = 'month';
        this.charts = {};
        this.analyticsData = null;
    }

    render() {
        const container = document.getElementById('analytics-container');
        if (!container) return;

        this.generateAnalyticsData();
        container.innerHTML = this.createAnalyticsHTML();
        this.renderCharts();
        this.attachEventListeners();
    }
    
update() {
  this.generateAnalyticsData();
  this.render();
}

    createAnalyticsHTML() {
        return `
            <div class="analytics-content">
                <!-- Основные метрики -->
                <div class="analytics-metrics">
                    <div class="metric-widget primary">
                        <div class="metric-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="metric-value">${formatCurrency(this.analyticsData?.totalRevenue || 0)}</div>
                        <div class="metric-label">Общая выручка</div>
                        <div class="metric-change positive">
                            <i class="fas fa-arrow-up"></i> 12.5%
                        </div>
                    </div>
                    
                    <div class="metric-widget success">
                        <div class="metric-icon">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <div class="metric-value">${this.analyticsData?.totalOrders || 0}</div>
                        <div class="metric-label">Всего заказов</div>
                        <div class="metric-change positive">
                            <i class="fas fa-arrow-up"></i> 8.3%
                        </div>
                    </div>
                    
                    <div class="metric-widget info">
                        <div class="metric-icon">
                            <i class="fas fa-ruble-sign"></i>
                        </div>
                        <div class="metric-value">${formatCurrency(this.analyticsData?.averageOrder || 0)}</div>
                        <div class="metric-label">Средний чек</div>
                        <div class="metric-change positive">
                            <i class="fas fa-arrow-up"></i> 4.1%
                        </div>
                    </div>
                    
                    <div class="metric-widget warning">
                        <div class="metric-icon">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="metric-value">${(this.analyticsData?.successRate || 0).toFixed(1)}%</div>
                        <div class="metric-label">Успешные доставки</div>
                        <div class="metric-change positive">
                            <i class="fas fa-arrow-up"></i> 2.7%
                        </div>
                    </div>
                </div>

                <!-- Графики -->
                <div class="analytics-charts">
                    <div class="chart-container large">
                        <div class="chart-header">
                            <h4>Динамика выручки</h4>
                            <div class="chart-actions">
                                <button class="btn btn-sm btn-outline" onclick="app.analyticsComponent.toggleChartType('revenue')">
                                    <i class="fas fa-chart-bar"></i> Тип графика
                                </button>
                            </div>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="revenueChart" height="300"></canvas>
                        </div>
                    </div>

                    <div class="chart-container">
                        <div class="chart-header">
                            <h4>Распределение по платформам</h4>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="platformsChart" height="250"></canvas>
                        </div>
                    </div>

                    <div class="chart-container">
                        <div class="chart-header">
                            <h4>Статусы заказов</h4>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="statusChart" height="250"></canvas>
                        </div>
                    </div>

                    <div class="chart-container large">
                        <div class="chart-header">
                            <h4>Ключевые показатели</h4>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="metricsChart" height="300"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Детальная статистика -->
                <div class="analytics-details">
                    <div class="details-section">
                        <h4>Статистика по платформам</h4>
                        <div class="platforms-comparison">
                            <div class="platform-stats">
                                <div class="platform-header cdek">
                                    <i class="fas fa-shipping-fast"></i>
                                    <span>CDEK</span>
                                </div>
                                <div class="platform-metrics">
                                    <div class="metric">
                                        <span class="label">Заказы:</span>
                                        <span class="value">${this.analyticsData?.cdekOrders || 0}</span>
                                    </div>
                                    <div class="metric">
                                        <span class="label">Выручка:</span>
                                        <span class="value">${formatCurrency(this.analyticsData?.cdekRevenue || 0)}</span>
                                    </div>
                                    <div class="metric">
                                        <span class="label">Средний чек:</span>
                                        <span class="value">${formatCurrency(this.analyticsData?.cdekAverage || 0)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="platform-stats">
                                <div class="platform-header megamarket">
                                    <i class="fas fa-store"></i>
                                    <span>Мегамаркет</span>
                                </div>
                                <div class="platform-metrics">
                                    <div class="metric">
                                        <span class="label">Заказы:</span>
                                        <span class="value">${this.analyticsData?.megamarketOrders || 0}</span>
                                    </div>
                                    <div class="metric">
                                        <span class="label">Выручка:</span>
                                        <span class="value">${formatCurrency(this.analyticsData?.megamarketRevenue || 0)}</span>
                                    </div>
                                    <div class="metric">
                                        <span class="label">Средний чек:</span>
                                        <span class="value">${formatCurrency(this.analyticsData?.megamarketAverage || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="details-section">
                        <h4>Топ товаров</h4>
                        <div class="top-products">
                            ${this.createTopProductsList()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createTopProductsList() {
        const products = this.analyticsData?.topProducts || [];
        if (products.length === 0) {
            return '<div class="empty-state">Нет данных о товарах</div>';
        }

        return products.map((product, index) => `
            <div class="product-item">
                <div class="product-rank">${index + 1}</div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-stats">
                        <span class="orders">${product.orders} заказов</span>
                        <span class="revenue">${formatCurrency(product.revenue)}</span>
                    </div>
                </div>
                <div class="product-trend ${product.trend > 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-arrow-${product.trend > 0 ? 'up' : 'down'}"></i>
                    ${Math.abs(product.trend)}%
                </div>
            </div>
        `).join('');
    }

    generateAnalyticsData() {
        const orders = this.app.orders.all;
        
        this.analyticsData = {
            totalRevenue: orders.reduce((sum, order) => sum + (order.cost || order.totalAmount || 0), 0),
            totalOrders: orders.length,
            averageOrder: orders.length > 0 ? 
                orders.reduce((sum, order) => sum + (order.cost || order.totalAmount || 0), 0) / orders.length : 0,
            successRate: 94.5,
            
            cdekOrders: this.app.orders.cdek.length,
            cdekRevenue: this.app.orders.cdek.reduce((sum, order) => sum + (order.cost || 0), 0),
            cdekAverage: this.app.orders.cdek.length > 0 ? 
                this.app.orders.cdek.reduce((sum, order) => sum + (order.cost || 0), 0) / this.app.orders.cdek.length : 0,
                
            megamarketOrders: this.app.orders.megamarket.length,
            megamarketRevenue: this.app.orders.megamarket.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
            megamarketAverage: this.app.orders.megamarket.length > 0 ? 
                this.app.orders.megamarket.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / this.app.orders.megamarket.length : 0,
                
            topProducts: [
                { name: 'Смартфон Samsung Galaxy', orders: 45, revenue: 2350000, trend: 12 },
                { name: 'Ноутбук ASUS VivoBook', orders: 32, revenue: 1890000, trend: 8 },
                { name: 'Наушники Sony WH-1000XM4', orders: 28, revenue: 1250000, trend: 15 },
                { name: 'Телевизор LG 55"', orders: 18, revenue: 980000, trend: -3 },
                { name: 'Кофемашина DeLonghi', orders: 15, revenue: 750000, trend: 5 }
            ]
        };
    }

    renderCharts() {
        this.renderRevenueChart();
        this.renderPlatformsChart();
        this.renderStatusChart();
        this.renderMetricsChart();
    }

    renderRevenueChart() {
        const ctx = document.getElementById('revenueChart')?.getContext('2d');
        if (!ctx) return;

        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        const data = this.generateRevenueData();
        
        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'CDEK',
                        data: data.cdek,
                        borderColor: '#FF6B35',
                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Мегамаркет',
                        data: data.megamarket,
                        borderColor: '#2980B9',
                        backgroundColor: 'rgba(41, 128, 185, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    renderPlatformsChart() {
        const ctx = document.getElementById('platformsChart')?.getContext('2d');
        if (!ctx) return;

        if (this.charts.platforms) {
            this.charts.platforms.destroy();
        }

        this.charts.platforms = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['CDEK', 'Мегамаркет'],
                datasets: [{
                    data: [this.analyticsData.cdekOrders, this.analyticsData.megamarketOrders],
                    backgroundColor: ['#FF6B35', '#2980B9'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                cutout: '60%'
            }
        });
    }

    renderStatusChart() {
        const ctx = document.getElementById('statusChart')?.getContext('2d');
        if (!ctx) return;

        if (this.charts.status) {
            this.charts.status.destroy();
        }

        const statusData = this.calculateStatusDistribution();
        
        this.charts.status = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(statusData),
                datasets: [{
                    label: 'Количество заказов',
                    data: Object.values(statusData),
                    backgroundColor: [
                        '#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderMetricsChart() {
        const ctx = document.getElementById('metricsChart')?.getContext('2d');
        if (!ctx) return;

        if (this.charts.metrics) {
            this.charts.metrics.destroy();
        }

        const metrics = this.calculateKeyMetrics();
        
        this.charts.metrics = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Конверсия', 'Удержание', 'Лояльность', 'Эффективность', 'Скорость'],
                datasets: [{
                    label: 'Текущий период',
                    data: metrics.current,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3B82F6',
                    pointBackgroundColor: '#3B82F6'
                }, {
                    label: 'Предыдущий период',
                    data: metrics.previous,
                    backgroundColor: 'rgba(107, 114, 128, 0.2)',
                    borderColor: '#6B7280',
                    pointBackgroundColor: '#6B7280'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    }

    generateRevenueData() {
        // Генерация демо-данных для графика выручки
        const periods = this.currentPeriod === 'week' ? 7 : 
                       this.currentPeriod === 'month' ? 30 : 
                       this.currentPeriod === 'quarter' ? 12 : 12;
        
        const labels = [];
        const cdekData = [];
        const megamarketData = [];
        
        for (let i = 0; i < periods; i++) {
            if (this.currentPeriod === 'week') {
                labels.push(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i]);
            } else if (this.currentPeriod === 'month') {
                labels.push(`${i + 1} дек`);
            } else {
                labels.push(['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'][i]);
            }
            
            cdekData.push(Math.floor(Math.random() * 50000) + 20000);
            megamarketData.push(Math.floor(Math.random() * 70000) + 30000);
        }
        
        return { labels, cdek: cdekData, megamarket: megamarketData };
    }

    calculateStatusDistribution() {
        const orders = this.app.orders.all;
        const distribution = {
            'Новые': 0,
            'В работе': 0,
            'Доставлены': 0,
            'Проблемы': 0,
            'Отменены': 0
        };
        
        orders.forEach(order => {
            if (order.status === 'new') distribution['Новые']++;
            else if (order.status === 'processing' || order.status === 'active') distribution['В работе']++;
            else if (order.status === 'delivered') distribution['Доставлены']++;
            else if (order.status === 'problem') distribution['Проблемы']++;
            else if (order.status === 'cancelled') distribution['Отменены']++;
        });
        
        return distribution;
    }

    calculateKeyMetrics() {
        return {
            current: [85, 78, 82, 88, 75],
            previous: [80, 75, 78, 85, 70]
        };
    }

    changePeriod(period) {
        this.currentPeriod = period;
        this.render();
        this.app.showNotification(`Период изменен на: ${this.getPeriodName(period)}`, 'info');
    }

    getPeriodName(period) {
        const names = {
            'week': 'неделя',
            'month': 'месяц',
            'quarter': 'квартал',
            'year': 'год'
        };
        return names[period] || period;
    }

    exportReport() {
        const csvContent = this.generateReportCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.app.showNotification('Отчет экспортирован в CSV', 'success');
    }

    generateReportCSV() {
        const headers = ['Метрика', 'Значение', 'Изменение', 'Период'];
        const rows = [
            ['Общая выручка', formatCurrency(this.analyticsData.totalRevenue), '+12.5%', this.currentPeriod],
            ['Всего заказов', this.analyticsData.totalOrders, '+8.3%', this.currentPeriod],
            ['Средний чек', formatCurrency(this.analyticsData.averageOrder), '+4.1%', this.currentPeriod],
            ['Успешные доставки', this.analyticsData.successRate + '%', '+2.7%', this.currentPeriod],
            ['Заказы CDEK', this.analyticsData.cdekOrders, '+15.2%', this.currentPeriod],
            ['Заказы Мегамаркет', this.analyticsData.megamarketOrders, '+22.8%', this.currentPeriod]
        ];

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    toggleChartType(chartId) {
        this.app.showNotification('Функция смены типа графика в разработке', 'info');
    }

    attachEventListeners() {
        // Обработчики для аналитики
        const periodSelect = document.getElementById('analytics-period');
        if (periodSelect) {
            periodSelect.value = this.currentPeriod;
        }
    }
}
