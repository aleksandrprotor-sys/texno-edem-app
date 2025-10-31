class AnalyticsComponent {
    constructor(megamarketService, cdekService = null) {
        this.megamarketService = megamarketService;
        this.cdekService = cdekService;
        this.analyticsData = null;
        this.charts = {};
        this.currentPeriod = 'week';
        this.dateRange = {
            from: null,
            to: null
        };
    }

    async init() {
        await this.loadAnalytics();
        this.renderAnalyticsDashboard();
        this.setupEventListeners();
        this.setupDatePickers();
    }

    async loadAnalytics() {
        try {
            this.showLoadingState();
            
            const { from, to } = this.getDateRange(this.currentPeriod);
            this.dateRange = { from, to };
            
            // Загружаем данные аналитики из Megamarket
            this.analyticsData = await this.megamarketService.getAnalytics(from, to);
            
            // Загружаем данные об успешных доставках из CDEK
            if (this.cdekService) {
                await this.loadCdekSuccessRate();
            }
            
            this.renderAnalyticsDashboard();
            this.renderCharts();
            
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showErrorState('Ошибка загрузки аналитики');
        }
    }

    async loadCdekSuccessRate() {
        try {
            // Получаем данные о доставках из CDEK за тот же период
            const deliveries = await this.cdekService.getDeliveriesStats(
                this.dateRange.from,
                this.dateRange.to
            );
            
            // Расчет процента успешных доставок на основе реальных данных CDEK
            const successfulDeliveries = deliveries.filter(d => d.status === 'delivered').length;
            const totalDeliveries = deliveries.filter(d => 
                d.status === 'delivered' || d.status === 'cancelled' || d.status === 'returned'
            ).length;
            
            if (totalDeliveries > 0) {
                this.analyticsData.successRate = (successfulDeliveries / totalDeliveries) * 100;
            }
            
        } catch (error) {
            console.warn('Failed to load CDEK success rate:', error);
            // Используем расчет на основе статусов Megamarket как fallback
            this.calculateFallbackSuccessRate();
        }
    }

    calculateFallbackSuccessRate() {
        const successfulOrders = this.analyticsData.orders.filter(order => 
            order.status === 'delivered' || order.status === 'completed'
        ).length;
        
        const totalProcessedOrders = this.analyticsData.orders.filter(order => 
            order.status !== 'new' && order.status !== 'cancelled'
        ).length;

        this.analyticsData.successRate = totalProcessedOrders > 0 ? 
            (successfulOrders / totalProcessedOrders) * 100 : 0;
    }

    renderAnalyticsDashboard() {
        const container = document.getElementById('analyticsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="analytics-header">
                <div class="analytics-title">
                    <h2>📊 Аналитика продаж</h2>
                    <p class="analytics-subtitle">Данные по заказам Megamarket</p>
                </div>
                <div class="analytics-controls">
                    <div class="period-selector">
                        <label>Период:</label>
                        <select id="analyticsPeriod" class="form-control">
                            <option value="week">Неделя</option>
                            <option value="month">Месяц</option>
                            <option value="quarter">Квартал</option>
                            <option value="year">Год</option>
                            <option value="custom">Произвольный</option>
                        </select>
                    </div>
                    <div class="date-range-selector" id="dateRangeSelector" style="display: none;">
                        <input type="date" id="analyticsDateFrom" class="form-control">
                        <span>по</span>
                        <input type="date" id="analyticsDateTo" class="form-control">
                    </div>
                    <button class="btn btn-primary" onclick="analyticsComponent.updateAnalytics()">
                        <span class="btn-icon">🔄</span>
                        Обновить
                    </button>
                    <button class="btn btn-secondary" onclick="analyticsComponent.exportAnalytics()">
                        <span class="btn-icon">📤</span>
                        Экспорт
                    </button>
                </div>
            </div>

            <div class="metrics-grid">
                <div class="metric-card metric-primary">
                    <div class="metric-icon">📦</div>
                    <div class="metric-content">
                        <div class="metric-value">${this.formatNumber(this.analyticsData?.totalOrders || 0)}</div>
                        <div class="metric-label">Всего заказов</div>
                        <div class="metric-trend ${this.getTrendClass(this.analyticsData?.ordersTrend)}">
                            ${this.getTrendIcon(this.analyticsData?.ordersTrend)} ${this.formatPercent(this.analyticsData?.ordersTrend)}
                        </div>
                    </div>
                </div>

                <div class="metric-card metric-success">
                    <div class="metric-icon">💰</div>
                    <div class="metric-content">
                        <div class="metric-value">${this.formatCurrency(this.analyticsData?.totalRevenue || 0)}</div>
                        <div class="metric-label">Общая выручка</div>
                        <div class="metric-trend ${this.getTrendClass(this.analyticsData?.revenueTrend)}">
                            ${this.getTrendIcon(this.analyticsData?.revenueTrend)} ${this.formatPercent(this.analyticsData?.revenueTrend)}
                        </div>
                    </div>
                </div>

                <div class="metric-card metric-info">
                    <div class="metric-icon">📊</div>
                    <div class="metric-content">
                        <div class="metric-value">${this.formatCurrency(this.analyticsData?.averageOrderValue || 0)}</div>
                        <div class="metric-label">Средний чек</div>
                        <div class="metric-trend ${this.getTrendClass(this.analyticsData?.avgOrderTrend)}">
                            ${this.getTrendIcon(this.analyticsData?.avgOrderTrend)} ${this.formatPercent(this.analyticsData?.avgOrderTrend)}
                        </div>
                    </div>
                </div>

                <div class="metric-card metric-warning">
                    <div class="metric-icon">✅</div>
                    <div class="metric-content">
                        <div class="metric-value">${this.formatPercent(this.analyticsData?.successRate || 0)}</div>
                        <div class="metric-label">Успешные доставки</div>
                        <div class="metric-source">данные CDEK</div>
                    </div>
                </div>

                <div class="metric-card metric-danger">
                    <div class="metric-icon">❌</div>
                    <div class="metric-content">
                        <div class="metric-value">${this.formatPercent(this.analyticsData?.cancellationRate || 0)}</div>
                        <div class="metric-label">Отмена заказов</div>
                        <div class="metric-trend ${this.getTrendClass(this.analyticsData?.cancellationTrend)}">
                            ${this.getTrendIcon(this.analyticsData?.cancellationTrend)} ${this.formatPercent(this.analyticsData?.cancellationTrend)}
                        </div>
                    </div>
                </div>

                <div class="metric-card metric-secondary">
                    <div class="metric-icon">🔄</div>
                    <div class="metric-content">
                        <div class="metric-value">${this.formatPercent(this.analyticsData?.conversionRate || 0)}</div>
                        <div class="metric-label">Конверсия</div>
                        <div class="metric-trend ${this.getTrendClass(this.analyticsData?.conversionTrend)}">
                            ${this.getTrendIcon(this.analyticsData?.conversionTrend)} ${this.formatPercent(this.analyticsData?.conversionTrend)}
                        </div>
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-container">
                    <div class="chart-header">
                        <h4>📈 Динамика продаж</h4>
                        <div class="chart-legend">
                            <span class="legend-item">
                                <span class="legend-color revenue"></span>
                                Выручка
                            </span>
                            <span class="legend-item">
                                <span class="legend-color orders"></span>
                                Заказы
                            </span>
                        </div>
                    </div>
                    <canvas id="salesChart" height="300"></canvas>
                </div>

                <div class="chart-container">
                    <div class="chart-header">
                        <h4>🎯 Статусы заказов</h4>
                    </div>
                    <canvas id="statusChart" height="300"></canvas>
                </div>

                <div class="chart-container">
                    <div class="chart-header">
                        <h4>📦 Распределение по категориям</h4>
                    </div>
                    <canvas id="categoryChart" height="300"></canvas>
                </div>

                <div class="chart-container">
                    <div class="chart-header">
                        <h4>📊 Ключевые метрики</h4>
                    </div>
                    <div id="metricsChart">
                        <canvas id="metricsRadarChart" height="300"></canvas>
                    </div>
                </div>
            </div>

            <div class="analytics-details">
                <div class="details-section">
                    <h4>📋 Детальная статистика</h4>
                    <div class="details-grid">
                        <div class="detail-item">
                            <span class="detail-label">Успешные заказы:</span>
                            <span class="detail-value">${this.analyticsData?.successfulOrders || 0}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Отмененные заказы:</span>
                            <span class="detail-value">${this.analyticsData?.cancelledOrders || 0}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Ожидающие обработки:</span>
                            <span class="detail-value">${this.analyticsData?.pendingOrders || 0}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Период анализа:</span>
                            <span class="detail-value">${this.formatDateRange(this.dateRange.from, this.dateRange.to)}</span>
                        </div>
                    </div>
                </div>

                <div class="details-section">
                    <h4>🚀 Эффективность</h4>
                    <div class="efficiency-metrics">
                        <div class="efficiency-item">
                            <div class="efficiency-label">Общая эффективность</div>
                            <div class="efficiency-bar">
                                <div class="efficiency-fill" style="width: ${this.analyticsData?.successRate || 0}%"></div>
                            </div>
                            <div class="efficiency-value">${this.formatPercent(this.analyticsData?.successRate || 0)}</div>
                        </div>
                        <div class="efficiency-item">
                            <div class="efficiency-label">Скорость обработки</div>
                            <div class="efficiency-bar">
                                <div class="efficiency-fill" style="width: ${this.calculateProcessingEfficiency()}%"></div>
                            </div>
                            <div class="efficiency-value">${this.formatPercent(this.calculateProcessingEfficiency())}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.updatePeriodSelector();
    }

    renderCharts() {
        this.renderSalesChart();
        this.renderStatusChart();
        this.renderCategoryChart();
        this.renderMetricsRadarChart();
    }

    renderSalesChart() {
        const ctx = document.getElementById('salesChart')?.getContext('2d');
        if (!ctx || !this.analyticsData) return;

        if (this.charts.salesChart) {
            this.charts.salesChart.destroy();
        }

        const timelineData = this.analyticsData.timelineData || {};
        const dates = Object.keys(timelineData).sort();
        
        const revenueData = dates.map(date => timelineData[date]?.revenue || 0);
        const ordersData = dates.map(date => timelineData[date]?.orders || 0);

        this.charts.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(date => this.formatChartDate(date)),
                datasets: [
                    {
                        label: 'Выручка (₽)',
                        data: revenueData,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Количество заказов',
                        data: ordersData,
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Выручка (₽)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Заказы'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                if (label.includes('Выручка')) {
                                    return `${label}: ${this.formatCurrency(value)}`;
                                }
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderStatusChart() {
        const ctx = document.getElementById('statusChart')?.getContext('2d');
        if (!ctx || !this.analyticsData) return;

        if (this.charts.statusChart) {
            this.charts.statusChart.destroy();
        }

        const statusData = this.analyticsData.statusDistribution || {};
        const labels = Object.keys(statusData).map(key => this.getStatusText(key));
        const data = Object.values(statusData);
        const backgroundColors = this.generateStatusColors(Object.keys(statusData));

        this.charts.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label;
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    renderCategoryChart() {
        const ctx = document.getElementById('categoryChart')?.getContext('2d');
        if (!ctx || !this.analyticsData) return;

        if (this.charts.categoryChart) {
            this.charts.categoryChart.destroy();
        }

        const categoryData = this.analyticsData.categoryDistribution || {};
        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);

        // Сортируем по убыванию и берем топ-10
        const sortedIndices = data.map((_, index) => index)
            .sort((a, b) => data[b] - data[a])
            .slice(0, 10);

        const topLabels = sortedIndices.map(i => labels[i]);
        const topData = sortedIndices.map(i => data[i]);

        this.charts.categoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topLabels,
                datasets: [{
                    label: 'Количество заказов',
                    data: topData,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
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
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Количество заказов'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Категории'
                        }
                    }
                }
            }
        });
    }

    renderMetricsRadarChart() {
        const ctx = document.getElementById('metricsRadarChart')?.getContext('2d');
        if (!ctx || !this.analyticsData) return;

        if (this.charts.metricsRadarChart) {
            this.charts.metricsRadarChart.destroy();
        }

        const metrics = {
            'Конверсия': this.analyticsData.conversionRate || 0,
            'Успешные доставки': this.analyticsData.successRate || 0,
            'Средний чек': Math.min((this.analyticsData.averageOrderValue || 0) / 1000, 100), // Нормализуем для графика
            'Оборачиваемость': this.calculateTurnoverRate(),
            'Лояльность': this.calculateLoyaltyMetric()
        };

        this.charts.metricsRadarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: Object.keys(metrics),
                datasets: [{
                    label: 'Эффективность',
                    data: Object.values(metrics),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)'
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

    // Вспомогательные методы
    getDateRange(period) {
        const now = new Date();
        const from = new Date();

        switch (period) {
            case 'week':
                from.setDate(now.getDate() - 7);
                break;
            case 'month':
                from.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                from.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                from.setFullYear(now.getFullYear() - 1);
                break;
            case 'custom':
                // Используем установленные даты
                return this.dateRange;
            default:
                from.setDate(now.getDate() - 7);
        }

        return {
            from: from.toISOString().split('T')[0],
            to: now.toISOString().split('T')[0]
        };
    }

    async updateAnalytics() {
        const period = document.getElementById('analyticsPeriod').value;
        this.currentPeriod = period;

        if (period === 'custom') {
            const dateFrom = document.getElementById('analyticsDateFrom').value;
            const dateTo = document.getElementById('analyticsDateTo').value;
            
            if (!dateFrom || !dateTo) {
                this.showNotification('Выберите период для анализа', 'warning');
                return;
            }
            
            this.dateRange = { from: dateFrom, to: dateTo };
        }

        await this.loadAnalytics();
        this.showNotification('Аналитика обновлена', 'success');
    }

    exportAnalytics() {
        // Создаем CSV с данными аналитики
        const csvContent = this.generateAnalyticsCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Данные экспортированы в CSV', 'success');
    }

    generateAnalyticsCSV() {
        const headers = ['Метрика', 'Значение', 'Период'];
        const rows = [
            ['Всего заказов', this.analyticsData.totalOrders, this.currentPeriod],
            ['Общая выручка', this.analyticsData.totalRevenue, this.currentPeriod],
            ['Средний чек', this.analyticsData.averageOrderValue, this.currentPeriod],
            ['Успешные доставки', `${this.analyticsData.successRate}%`, this.currentPeriod],
            ['Отмена заказов', `${this.analyticsData.cancellationRate}%`, this.currentPeriod],
            ['Конверсия', `${this.analyticsData.conversionRate}%`, this.currentPeriod]
        ];

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    setupEventListeners() {
        // Обработчик изменения периода
        document.addEventListener('change', (e) => {
            if (e.target.id === 'analyticsPeriod') {
                const isCustom = e.target.value === 'custom';
                const dateRangeSelector = document.getElementById('dateRangeSelector');
                if (dateRangeSelector) {
                    dateRangeSelector.style.display = isCustom ? 'flex' : 'none';
                }
            }
        });
    }

    setupDatePickers() {
        // Устанавливаем даты по умолчанию для произвольного периода
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        setTimeout(() => {
            const dateFrom = document.getElementById('analyticsDateFrom');
            const dateTo = document.getElementById('analyticsDateTo');
            
            if (dateFrom) dateFrom.value = weekAgo;
            if (dateTo) dateTo.value = today;
        }, 100);
    }

    updatePeriodSelector() {
        const periodSelect = document.getElementById('analyticsPeriod');
        if (periodSelect) {
            periodSelect.value = this.currentPeriod;
        }
    }

    // Форматирование и утилиты
    formatNumber(num) {
        return new Intl.NumberFormat('ru-RU').format(num);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatPercent(value) {
        return `${value.toFixed(1)}%`;
    }

    formatDateRange(from, to) {
        const fromDate = new Date(from).toLocaleDateString('ru-RU');
        const toDate = new Date(to).toLocaleDateString('ru-RU');
        return `${fromDate} - ${toDate}`;
    }

    formatChartDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
    }

    getStatusText(status) {
        const statusMap = {
            'new': 'Новые',
            'confirmed': 'Подтвержденные',
            'packed': 'Упакованные',
            'shipped': 'Отгруженные',
            'delivered': 'Доставленные',
            'cancelled': 'Отмененные',
            'completed': 'Завершенные'
        };
        return statusMap[status] || status;
    }

    generateStatusColors(statuses) {
        const colorMap = {
            'new': '#2196F3',
            'confirmed': '#FF9800',
            'packed': '#4CAF50',
            'shipped': '#9C27B0',
            'delivered': '#388E3C',
            'cancelled': '#F44336',
            'completed': '#607D8B'
        };
        
        return statuses.map(status => colorMap[status] || '#999999');
    }

    getTrendClass(trend) {
        if (!trend) return '';
        return trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : '';
    }

    getTrendIcon(trend) {
        if (!trend) return '➡️';
        return trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
    }

    calculateProcessingEfficiency() {
        // Расчет эффективности обработки заказов
        const pending = this.analyticsData?.pendingOrders || 0;
        const total = this.analyticsData?.totalOrders || 0;
        const processed = total - pending;
        
        return total > 0 ? (processed / total) * 100 : 0;
    }

    calculateTurnoverRate() {
        // Расчет оборачиваемости (примерная метрика)
        const revenue = this.analyticsData?.totalRevenue || 0;
        const orders = this.analyticsData?.totalOrders || 0;
        
        return orders > 0 ? Math.min((revenue / orders) / 100, 100) : 0;
    }

    calculateLoyaltyMetric() {
        // Метрика лояльности (примерная)
        const successRate = this.analyticsData?.successRate || 0;
        const cancellationRate = this.analyticsData?.cancellationRate || 0;
        
        return Math.max(0, successRate - cancellationRate);
    }

    showLoadingState() {
        const container = document.getElementById('analyticsContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Загрузка аналитики...</p>
                </div>
            `;
        }
    }

    showErrorState(message) {
        const container = document.getElementById('analyticsContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Ошибка загрузки</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="analyticsComponent.loadAnalytics()">
                        Попробовать снова
                    </button>
                </div>
            `;
        }
    }

    showNotification(message, type = 'info') {
        if (window.Notifications) {
            Notifications.show(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }
}

// Глобальный экземпляр для обработчиков событий
window.analyticsComponent = null;
