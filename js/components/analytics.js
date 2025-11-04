// Компонент аналитики
class AnalyticsComponent {
    constructor(app) {
        this.app = app;
        this.currentPeriod = 'month';
        this.init();
    }

    init() {
        console.log('✅ AnalyticsComponent initialized');
    }

    render() {
        const container = document.getElementById('analytics-container');
        if (!container) return;
        
        container.innerHTML = this.generateAnalyticsHTML();
        this.renderCharts();
    }

    generateAnalyticsHTML() {
        return `
            <div class="analytics-controls">
                <div class="period-selector">
                    <label>Период:</label>
                    <select id="analytics-period" onchange="app.components.analytics.setPeriod(this.value)">
                        <option value="week">Неделя</option>
                        <option value="month" selected>Месяц</option>
                        <option value="quarter">Квартал</option>
                        <option value="year">Год</option>
                    </select>
                </div>
                
                <div class="analytics-actions">
                    <button class="btn btn-outline" onclick="app.components.analytics.exportReport()">
                        <i class="fas fa-download"></i>
                        Экспорт отчета
                    </button>
                    <button class="btn btn-primary" onclick="app.manualSync()">
                        <i class="fas fa-sync"></i>
                        Обновить данные
                    </button>
                </div>
            </div>

            <div class="analytics-overview">
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <h3>Общая статистика</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-value">${this.app.orders.all.length}</div>
                                <div class="stat-label">Всего заказов</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${formatCurrency(this.app.analytics.revenue?.total || 0)}</div>
                                <div class="stat-label">Общая выручка</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">95%</div>
                                <div class="stat-label">Успешные доставки</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${this.app.orders.all.filter(order => order.status === 'problem').length}</div>
                                <div class="stat-label">Проблемные заказы</div>
                            </div>
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3>По платформам</h3>
                        <div class="platform-stats">
                            <div class="platform-stat cdek">
                                <div class="platform-info">
                                    <i class="fas fa-shipping-fast"></i>
                                    <span>CDEK</span>
                                </div>
                                <div class="platform-numbers">
                                    <div class="platform-orders">${this.app.orders.cdek.length} заказов</div>
                                    <div class="platform-revenue">${formatCurrency(this.app.analytics.revenue?.cdek || 0)}</div>
                                </div>
                            </div>
                            <div class="platform-stat megamarket">
                                <div class="platform-info">
                                    <i class="fas fa-store"></i>
                                    <span>Мегамаркет</span>
                                </div>
                                <div class="platform-numbers">
                                    <div class="platform-orders">${this.app.orders.megamarket.length} заказов</div>
                                    <div class="platform-revenue">${formatCurrency(this.app.analytics.revenue?.megamarket || 0)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="analytics-charts">
                    <div class="chart-card">
                        <h3>Распределение заказов по статусам</h3>
                        <div class="chart-container">
                            <div class="status-chart" id="status-chart">
                                ${this.generateStatusChart()}
                            </div>
                        </div>
                    </div>

                    <div class="chart-card">
                        <h3>Выручка по платформам</h3>
                        <div class="chart-container">
                            <div class="revenue-chart" id="revenue-chart">
                                ${this.generateRevenueChart()}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="analytics-table">
                    <h3>Детальная статистика</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Платформа</th>
                                    <th>Заказы</th>
                                    <th>Выручка</th>
                                    <th>Средний чек</th>
                                    <th>Новые</th>
                                    <th>Проблемы</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateStatsTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    generateStatusChart() {
        const statusCounts = {
            'new': this.app.orders.all.filter(o => o.status === 'new').length,
            'processing': this.app.orders.all.filter(o => o.status === 'processing').length,
            'active': this.app.orders.all.filter(o => o.status === 'active').length,
            'delivered': this.app.orders.all.filter(o => o.status === 'delivered').length,
            'problem': this.app.orders.all.filter(o => o.status === 'problem').length,
            'cancelled': this.app.orders.all.filter(o => o.status === 'cancelled').length
        };

        const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
        if (total === 0) {
            return '<div class="empty-chart">Нет данных для отображения</div>';
        }

        return `
            <div class="chart-bars">
                ${Object.entries(statusCounts).map(([status, count]) => {
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    const statusConfig = this.app.getStatusConfig({ status });
                    return `
                        <div class="chart-bar">
                            <div class="bar-label">
                                <span class="status-dot" style="background-color: ${statusConfig.color}"></span>
                                ${statusConfig.text}
                            </div>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: ${percentage}%; background-color: ${statusConfig.color}"></div>
                            </div>
                            <div class="bar-value">${count} (${percentage.toFixed(1)}%)</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    generateRevenueChart() {
        const cdekRevenue = this.app.analytics.revenue?.cdek || 0;
        const megamarketRevenue = this.app.analytics.revenue?.megamarket || 0;
        const totalRevenue = cdekRevenue + megamarketRevenue;

        if (totalRevenue === 0) {
            return '<div class="empty-chart">Нет данных для отображения</div>';
        }

        const cdekPercentage = totalRevenue > 0 ? (cdekRevenue / totalRevenue) * 100 : 0;
        const megamarketPercentage = totalRevenue > 0 ? (megamarketRevenue / totalRevenue) * 100 : 0;

        return `
            <div class="revenue-distribution">
                <div class="revenue-item cdek">
                    <div class="revenue-bar">
                        <div class="revenue-fill" style="height: ${cdekPercentage}%"></div>
                    </div>
                    <div class="revenue-info">
                        <div class="revenue-platform">CDEK</div>
                        <div class="revenue-amount">${formatCurrency(cdekRevenue)}</div>
                        <div class="revenue-percentage">${cdekPercentage.toFixed(1)}%</div>
                    </div>
                </div>
                <div class="revenue-item megamarket">
                    <div class="revenue-bar">
                        <div class="revenue-fill" style="height: ${megamarketPercentage}%"></div>
                    </div>
                    <div class="revenue-info">
                        <div class="revenue-platform">Мегамаркет</div>
                        <div class="revenue-amount">${formatCurrency(megamarketRevenue)}</div>
                        <div class="revenue-percentage">${megamarketPercentage.toFixed(1)}%</div>
                    </div>
                </div>
            </div>
        `;
    }

    generateStatsTable() {
        const cdekOrders = this.app.orders.cdek;
        const megamarketOrders = this.app.orders.megamarket;

        const cdekStats = {
            orders: cdekOrders.length,
            revenue: this.app.analytics.revenue?.cdek || 0,
            avgOrder: cdekOrders.length > 0 ? (this.app.analytics.revenue?.cdek || 0) / cdekOrders.length : 0,
            new: cdekOrders.filter(o => o.status === 'new').length,
            problems: cdekOrders.filter(o => o.status === 'problem').length
        };

        const megamarketStats = {
            orders: megamarketOrders.length,
            revenue: this.app.analytics.revenue?.megamarket || 0,
            avgOrder: megamarketOrders.length > 0 ? (this.app.analytics.revenue?.megamarket || 0) / megamarketOrders.length : 0,
            new: megamarketOrders.filter(o => o.status === 'new').length,
            problems: megamarketOrders.filter(o => o.status === 'problem').length
        };

        const totalStats = {
            orders: cdekStats.orders + megamarketStats.orders,
            revenue: cdekStats.revenue + megamarketStats.revenue,
            avgOrder: (cdekStats.orders + megamarketStats.orders) > 0 ? 
                (cdekStats.revenue + megamarketStats.revenue) / (cdekStats.orders + megamarketStats.orders) : 0,
            new: cdekStats.new + megamarketStats.new,
            problems: cdekStats.problems + megamarketStats.problems
        };

        return `
            <tr class="platform-row cdek">
                <td><i class="fas fa-shipping-fast"></i> CDEK</td>
                <td>${cdekStats.orders}</td>
                <td>${formatCurrency(cdekStats.revenue)}</td>
                <td>${formatCurrency(cdekStats.avgOrder)}</td>
                <td>${cdekStats.new}</td>
                <td>${cdekStats.problems}</td>
            </tr>
            <tr class="platform-row megamarket">
                <td><i class="fas fa-store"></i> Мегамаркет</td>
                <td>${megamarketStats.orders}</td>
                <td>${formatCurrency(megamarketStats.revenue)}</td>
                <td>${formatCurrency(megamarketStats.avgOrder)}</td>
                <td>${megamarketStats.new}</td>
                <td>${megamarketStats.problems}</td>
            </tr>
            <tr class="platform-row total">
                <td><strong>Всего</strong></td>
                <td><strong>${totalStats.orders}</strong></td>
                <td><strong>${formatCurrency(totalStats.revenue)}</strong></td>
                <td><strong>${formatCurrency(totalStats.avgOrder)}</strong></td>
                <td><strong>${totalStats.new}</strong></td>
                <td><strong>${totalStats.problems}</strong></td>
            </tr>
        `;
    }

    renderCharts() {
        // Устанавливаем текущий период
        const periodSelect = document.getElementById('analytics-period');
        if (periodSelect) {
            periodSelect.value = this.currentPeriod;
        }
    }

    setPeriod(period) {
        this.currentPeriod = period;
        this.render();
        this.app.showNotification(`Период аналитики изменен на: ${this.getPeriodName(period)}`, 'info');
    }

    getPeriodName(period) {
        const periods = {
            'week': 'неделя',
            'month': 'месяц',
            'quarter': 'квартал',
            'year': 'год'
        };
        return periods[period] || period;
    }

    exportReport() {
        const reportData = {
            period: this.currentPeriod,
            generated: new Date().toISOString(),
            statistics: {
                totalOrders: this.app.orders.all.length,
                totalRevenue: this.app.analytics.revenue?.total || 0,
                platforms: {
                    cdek: {
                        orders: this.app.orders.cdek.length,
                        revenue: this.app.analytics.revenue?.cdek || 0
                    },
                    megamarket: {
                        orders: this.app.orders.megamarket.length,
                        revenue: this.app.analytics.revenue?.megamarket || 0
                    }
                }
            }
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.app.showNotification('Отчет успешно экспортирован', 'success');
    }
}
