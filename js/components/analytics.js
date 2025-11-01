// Компонент аналитики для TEXNO EDEM
class AnalyticsComponent {
    constructor(app) {
        this.app = app;
        this.charts = new Map();
        this.currentTimeRange = 'week';
        this.currentMetrics = ['orders_count', 'revenue'];
    }

    // Основной метод рендеринга
    render() {
        this.renderOverview();
        this.renderPlatformComparison();
        this.renderCharts();
        this.renderMetrics();
    }

    // Обзор аналитики
    renderOverview() {
        const container = document.getElementById('analytics-overview');
        if (!container) return;

        const analytics = this.calculateOverviewMetrics();
        
        container.innerHTML = `
            <div class="analytics-header">
                <h2>Обзор эффективности</h2>
                <div class="time-range-selector">
                    <select onchange="app.analyticsComponent.setTimeRange(this.value)">
                        ${CONFIG.ANALYTICS.TIME_RANGES.map(range => 
                            `<option value="${range.value}" ${range.value === this.currentTimeRange ? 'selected' : ''}>
                                ${range.label}
                            </option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-header">
                        <div class="metric-title">Всего заказов</div>
                        <div class="metric-icon revenue">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                    </div>
                    <div class="metric-value">${analytics.totalOrders}</div>
                    <div class="metric-change ${analytics.ordersChange >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${analytics.ordersChange >= 0 ? 'up' : 'down'}"></i>
                        ${Math.abs(analytics.ordersChange)}%
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-header">
                        <div class="metric-title">Общая выручка</div>
                        <div class="metric-icon orders">
                            <i class="fas fa-ruble-sign"></i>
                        </div>
                    </div>
                    <div class="metric-value">${formatCurrency(analytics.totalRevenue)}</div>
                    <div class="metric-change ${analytics.revenueChange >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${analytics.revenueChange >= 0 ? 'up' : 'down'}"></i>
                        ${Math.abs(analytics.revenueChange)}%
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-header">
                        <div class="metric-title">Средний чек</div>
                        <div class="metric-icon avg-order">
                            <i class="fas fa-receipt"></i>
                        </div>
                    </div>
                    <div class="metric-value">${formatCurrency(analytics.averageOrderValue)}</div>
                    <div class="metric-change ${analytics.avgOrderChange >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${analytics.avgOrderChange >= 0 ? 'up' : 'down'}"></i>
                        ${Math.abs(analytics.avgOrderChange)}%
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-header">
                        <div class="metric-title">Успешные доставки</div>
                        <div class="metric-icon success-rate">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                    <div class="metric-value">${analytics.deliverySuccessRate}%</div>
                    <div class="metric-change ${analytics.successRateChange >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${analytics.successRateChange >= 0 ? 'up' : 'down'}"></i>
                        ${Math.abs(analytics.successRateChange)}%
                    </div>
                </div>
            </div>
        `;
    }

    // Сравнение платформ
    renderPlatformComparison() {
        const container = document.getElementById('platform-comparison');
        if (!container) return;

        const comparison = this.calculatePlatformComparison();
        
        container.innerHTML = `
            <div class="comparison-header">
                <h3>Сравнение платформ</h3>
                <div class="metric-selector">
                    <select onchange="app.analyticsComponent.setComparisonMetric(this.value)">
                        ${CONFIG.ANALYTICS.COMPARISON_METRICS.map(metric => 
                            `<option value="${metric}">${this.getMetricLabel(metric)}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            
            <div class="comparison-grid">
                ${this.app.settings.cdekEnabled ? `
                <div class="platform-stats cdek">
                    <div class="platform-header">
                        <div class="platform-logo">
                            <i class="fas fa-shipping-fast"></i>
                            <span>CDEK</span>
                        </div>
                        <div class="platform-value">${this.formatComparisonValue(comparison.cdek)}</div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${comparison.cdek.percentage}%"></div>
                    </div>
                    <div class="platform-change ${comparison.cdek.change >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${comparison.cdek.change >= 0 ? 'up' : 'down'}"></i>
                        ${Math.abs(comparison.cdek.change)}%
                    </div>
                </div>
                ` : ''}
                
                ${this.app.settings.megamarketEnabled ? `
                <div class="platform-stats megamarket">
                    <div class="platform-header">
                        <div class="platform-logo">
                            <i class="fas fa-store"></i>
                            <span>Мегамаркет</span>
                        </div>
                        <div class="platform-value">${this.formatComparisonValue(comparison.megamarket)}</div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${comparison.megamarket.percentage}%"></div>
                    </div>
                    <div class="platform-change ${comparison.megamarket.change >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${comparison.megamarket.change >= 0 ? 'up' : 'down'}"></i>
                        ${Math.abs(comparison.megamarket.change)}%
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div class="comparison-chart">
                <canvas id="platform-comparison-chart"></canvas>
            </div>
        `;

        this.renderComparisonChart();
    }

    // Графики аналитики
    renderCharts() {
        this.renderSalesChart();
        this.renderOrdersChart();
        this.renderPerformanceChart();
    }

    renderSalesChart() {
        const canvas = document.getElementById('sales-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.getSalesChartData();
        
        if (this.charts.has('sales')) {
            this.charts.get('sales').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'CDEK',
                        data: data.cdek,
                        borderColor: 'var(--cdek-primary)',
                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                        tension: 0.4,
                        hidden: !this.app.settings.cdekEnabled
                    },
                    {
                        label: 'Мегамаркет',
                        data: data.megamarket,
                        borderColor: 'var(--megamarket-primary)',
                        backgroundColor: 'rgba(41, 128, 185, 0.1)',
                        tension: 0.4,
                        hidden: !this.app.settings.megamarketEnabled
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Динамика продаж по платформам'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        this.charts.set('sales', chart);
    }

    // Расчет метрик
    calculateOverviewMetrics() {
        const allOrders = [
            ...(this.app.settings.cdekEnabled ? this.app.orders.cdek : []),
            ...(this.app.settings.megamarketEnabled ? this.app.orders.megamarket : [])
        ];
        
        const previousPeriodOrders = this.getPreviousPeriodOrders();
        
        const currentMetrics = this.calculateMetrics(allOrders);
        const previousMetrics = this.calculateMetrics(previousPeriodOrders);
        
        return {
            totalOrders: currentMetrics.totalOrders,
            totalRevenue: currentMetrics.totalRevenue,
            averageOrderValue: currentMetrics.averageOrderValue,
            deliverySuccessRate: currentMetrics.deliverySuccessRate,
            
            ordersChange: this.calculateChange(currentMetrics.totalOrders, previousMetrics.totalOrders),
            revenueChange: this.calculateChange(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
            avgOrderChange: this.calculateChange(currentMetrics.averageOrderValue, previousMetrics.averageOrderValue),
            successRateChange: this.calculateChange(currentMetrics.deliverySuccessRate, previousMetrics.deliverySuccessRate)
        };
    }

    calculatePlatformComparison() {
        const currentMetric = this.currentComparisonMetric || 'orders_count';
        
        const cdekValue = this.app.settings.cdekEnabled ? 
            this.calculateMetricValue(this.app.orders.cdek, currentMetric) : 0;
        
        const megamarketValue = this.app.settings.megamarketEnabled ? 
            this.calculateMetricValue(this.app.orders.megamarket, currentMetric) : 0;
        
        const total = cdekValue + megamarketValue;
        
        return {
            cdek: {
                value: cdekValue,
                percentage: total > 0 ? (cdekValue / total) * 100 : 50,
                change: 12.5
            },
            megamarket: {
                value: megamarketValue,
                percentage: total > 0 ? (megamarketValue / total) * 100 : 50,
                change: 8.3
            }
        };
    }

    calculateMetrics(orders) {
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || order.cost || 0), 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        const successfulDeliveries = orders.filter(order => 
            order.status === 'delivered' || order.status === 'shipped'
        ).length;
        
        const deliverySuccessRate = totalOrders > 0 ? (successfulDeliveries / totalOrders) * 100 : 0;
        
        return {
            totalOrders,
            totalRevenue,
            averageOrderValue,
            deliverySuccessRate: Math.round(deliverySuccessRate)
        };
    }

    calculateMetricValue(orders, metric) {
        switch (metric) {
            case 'orders_count':
                return orders.length;
            case 'revenue':
                return orders.reduce((sum, order) => sum + (order.totalAmount || order.cost || 0), 0);
            case 'delivery_time':
                return orders.length * 2.5;
            case 'success_rate':
                const successful = orders.filter(o => o.status === 'delivered').length;
                return orders.length > 0 ? (successful / orders.length) * 100 : 0;
            default:
                return orders.length;
        }
    }

    calculateChange(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    }

    // Вспомогательные методы
    getPreviousPeriodOrders() {
        return [];
    }

    getSalesChartData() {
        return {
            labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
            cdek: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
            megamarket: [8000, 12000, 10000, 18000, 15000, 22000, 20000]
        };
    }

    getMetricLabel(metric) {
        const labels = {
            'orders_count': 'Количество заказов',
            'revenue': 'Выручка',
            'delivery_time': 'Время доставки',
            'success_rate': 'Успешность доставки',
            'customer_satisfaction': 'Удовлетворенность клиентов'
        };
        return labels[metric] || metric;
    }

    formatComparisonValue(data) {
        if (this.currentComparisonMetric === 'revenue') {
            return formatCurrency(data.value);
        } else if (this.currentComparisonMetric === 'success_rate') {
            return `${Math.round(data.value)}%`;
        }
        return data.value.toLocaleString();
    }

    // Установка параметров
    setTimeRange(range) {
        this.currentTimeRange = range;
        this.render();
    }

    setComparisonMetric(metric) {
        this.currentComparisonMetric = metric;
        this.renderPlatformComparison();
    }

    // Экспорт данных
    exportData(type) {
        const analytics = this.calculateOverviewMetrics();
        const comparison = this.calculatePlatformComparison();
        
        let data;
        let filename;
        
        switch (type) {
            case 'overview':
                data = analytics;
                filename = `texno-edem-overview-${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'comparison':
                data = comparison;
                filename = `texno-edem-comparison-${new Date().toISOString().split('T')[0]}.json`;
                break;
            default:
                data = { analytics, comparison };
                filename = `texno-edem-analytics-${new Date().toISOString().split('T')[0]}.json`;
        }
        
        this.downloadJSON(data, filename);
        this.app.showNotification('Данные экспортированы', 'success');
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Статические методы
    static calculateAnalytics(orders) {
        const component = new AnalyticsComponent({ orders });
        return {
            overview: component.calculateOverviewMetrics(),
            comparison: component.calculatePlatformComparison()
        };
    }

    // Дополнительные методы для графиков
    renderComparisonChart() {
        const canvas = document.getElementById('platform-comparison-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const comparison = this.calculatePlatformComparison();
        
        if (this.charts.has('comparison')) {
            this.charts.get('comparison').destroy();
        }

        const datasets = [];
        
        if (this.app.settings.cdekEnabled) {
            datasets.push({
                label: 'CDEK',
                data: [comparison.cdek.value],
                backgroundColor: 'var(--cdek-primary)',
                borderColor: 'var(--cdek-primary)',
                borderWidth: 1
            });
        }
        
        if (this.app.settings.megamarketEnabled) {
            datasets.push({
                label: 'Мегамаркет',
                data: [comparison.megamarket.value],
                backgroundColor: 'var(--megamarket-primary)',
                borderColor: 'var(--megamarket-primary)',
                borderWidth: 1
            });
        }

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [this.getMetricLabel(this.currentComparisonMetric)],
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Сравнение платформ'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        this.charts.set('comparison', chart);
    }

    renderOrdersChart() {
        // Implementation for orders chart
    }

    renderPerformanceChart() {
        // Implementation for performance chart
    }

    renderMetrics() {
        // Implementation for additional metrics
    }
}
