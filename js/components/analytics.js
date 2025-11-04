// js/components/analytics.js
class AnalyticsComponent {
    constructor(app) {
        this.app = app;
        this.charts = {};
        this.currentPeriod = 'month';
        this.init();
    }

    init() {
        console.log('✅ AnalyticsComponent инициализирован');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Обработчики для переключения периодов
        document.addEventListener('change', (e) => {
            if (e.target.id === 'analytics-period') {
                this.changePeriod(e.target.value);
            }
        });

        // Обработчики для экспорта отчетов
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-export')) {
                this.exportReport();
            }
        });
    }

    async load() {
        try {
            this.app.showLoading('Загрузка аналитики...');
            
            // Получаем данные аналитики из основного приложения
            const analyticsData = this.app.getAnalyticsData();
            
            if (!analyticsData) {
                throw new Error('Данные аналитики не загружены');
            }

            await this.app.delay(800);
            
            this.renderAnalytics(analyticsData);
            this.initCharts(analyticsData);
            
        } catch (error) {
            console.error('Ошибка загрузки аналитики:', error);
            this.app.showNotification('Ошибка загрузки аналитики', 'error');
            this.renderErrorState();
        } finally {
            this.app.hideLoading();
        }
    }

    renderAnalytics(data) {
        this.renderPlatformComparison(data.platformComparison);
        this.renderPerformanceMetrics(data.performanceMetrics);
        this.renderTrends(data.monthlyTrends);
        this.renderKPI(data.performanceMetrics);
    }

    renderPlatformComparison(comparison) {
        const container = document.getElementById('analytics-container');
        if (!container) return;

        container.innerHTML = `
            <div class="analytics-section">
                <div class="section-header">
                    <h2 class="section-title">Сравнение платформ</h2>
                    <div class="section-actions">
                        <select id="analytics-period" class="time-filter">
                            <option value="week">Неделя</option>
                            <option value="month" selected>Месяц</option>
                            <option value="quarter">Квартал</option>
                            <option value="year">Год</option>
                        </select>
                        <button class="btn btn-primary btn-export">
                            <i class="fas fa-download"></i> Экспорт отчета
                        </button>
                    </div>
                </div>

                <div class="analytics-grid">
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3 class="chart-title">Сравнение платформ</h3>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="platformComparisonChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="metrics-grid-detailed">
                        <div class="detailed-metric platform-cdek">
                            <div class="metric-comparison">
                                <div class="metric-main-value">${comparison.cdek.orders}</div>
                                <div class="metric-comparison-value">
                                    <div class="comparison-value">${this.app.formatCurrency(comparison.cdek.revenue)}</div>
                                    <div class="comparison-label">Выручка</div>
                                </div>
                            </div>
                            <div class="metric-label">Заказы CDEK</div>
                            <div class="metric-progress">
                                <div class="progress-info">
                                    <span class="progress-label">Успешные доставки</span>
                                    <span class="progress-value">${comparison.cdek.successRate}%</span>
                                </div>
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill" style="width: ${comparison.cdek.successRate}%"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detailed-metric platform-megamarket">
                            <div class="metric-comparison">
                                <div class="metric-main-value">${comparison.megamarket.orders}</div>
                                <div class="metric-comparison-value">
                                    <div class="comparison-value">${this.app.formatCurrency(comparison.megamarket.revenue)}</div>
                                    <div class="comparison-label">Выручка</div>
                                </div>
                            </div>
                            <div class="metric-label">Заказы Мегамаркет</div>
                            <div class="metric-progress">
                                <div class="progress-info">
                                    <span class="progress-label">Успешные доставки</span>
                                    <span class="progress-value">${comparison.megamarket.successRate}%</span>
                                </div>
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill" style="width: ${comparison.megamarket.successRate}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="analytics-section" id="performance-section">
                <!-- Performance metrics will be rendered here -->
            </div>

            <div class="analytics-section" id="trends-section">
                <!-- Trends will be rendered here -->
            </div>

            <div class="analytics-section" id="kpi-section">
                <!-- KPI will be rendered here -->
            </div>
        `;
    }

    renderPerformanceMetrics(metrics) {
        const container = document.getElementById('performance-section');
        if (!container) return;

        container.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">Ключевые показатели эффективности</h2>
            </div>
            
            <div class="kpi-grid">
                <div class="kpi-card good">
                    <div class="kpi-value">${metrics.overall.successRate}%</div>
                    <div class="kpi-label">Общая успешность</div>
                    <div class="kpi-target">
                        <i class="fas fa-bullseye"></i> Цель: 95%
                    </div>
                </div>
                
                <div class="kpi-card ${metrics.overall.avgDeliveryTime <= 3 ? 'good' : 'warning'}">
                    <div class="kpi-value">${metrics.overall.avgDeliveryTime} дн</div>
                    <div class="kpi-label">Среднее время доставки</div>
                    <div class="kpi-target">
                        <i class="fas fa-bullseye"></i> Цель: 2.5 дн
                    </div>
                </div>
                
                <div class="kpi-card ${metrics.overall.customerSatisfaction >= 4.5 ? 'good' : 'warning'}">
                    <div class="kpi-value">${metrics.overall.customerSatisfaction}/5</div>
                    <div class="kpi-label">Удовлетворенность клиентов</div>
                    <div class="kpi-target">
                        <i class="fas fa-bullseye"></i> Цель: 4.8/5
                    </div>
                </div>

                <div class="kpi-card good">
                    <div class="kpi-value">${metrics.cdek.successRate}%</div>
                    <div class="kpi-label">Успешность CDEK</div>
                    <div class="kpi-target">
                        <i class="fas fa-bullseye"></i> Цель: 90%
                    </div>
                </div>

                <div class="kpi-card ${metrics.megamarket.successRate >= 85 ? 'good' : 'warning'}">
                    <div class="kpi-value">${metrics.megamarket.successRate}%</div>
                    <div class="kpi-label">Успешность Мегамаркет</div>
                    <div class="kpi-target">
                        <i class="fas fa-bullseye"></i> Цель: 85%
                    </div>
                </div>

                <div class="kpi-card good">
                    <div class="kpi-value">${metrics.megamarket.revenueGrowth}%</div>
                    <div class="kpi-label">Рост выручки</div>
                    <div class="kpi-target">
                        <i class="fas fa-bullseye"></i> Цель: 20%
                    </div>
                </div>
            </div>
            
            <div class="chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">Эффективность по платформам</h3>
                </div>
                <div class="chart-wrapper">
                    <canvas id="performanceChart"></canvas>
                </div>
            </div>
        `;
    }

    renderTrends(trends) {
        const container = document.getElementById('trends-section');
        if (!container) return;

        container.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">Динамика заказов</h2>
            </div>
            
            <div class="chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">Тренды заказов по месяцам</h3>
                </div>
                <div class="chart-wrapper">
                    <canvas id="trendsChart"></canvas>
                </div>
                <div class="chart-legend">
                    <div class="legend-item">
                        <div class="legend-color cdek"></div>
                        <span>CDEK</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color megamarket"></div>
                        <span>Мегамаркет</span>
                    </div>
                </div>
            </div>

            <div class="analytics-grid">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">Распределение по статусам</h3>
                    </div>
                    <div class="chart-wrapper">
                        <canvas id="statusDistributionChart"></canvas>
                    </div>
                </div>
                
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">География заказов</h3>
                    </div>
                    <div class="chart-wrapper">
                        <canvas id="geographyChart"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    renderKPI(metrics) {
        const container = document.getElementById('kpi-section');
        if (!container) return;

        container.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">Детальные метрики</h2>
            </div>
            
            <div class="metrics-detailed-grid">
                <div class="detailed-metric-card">
                    <div class="metric-header">
                        <h4>CDEK Performance</h4>
                        <span class="metric-trend positive">
                            <i class="fas fa-arrow-up"></i> 5.2%
                        </span>
                    </div>
                    <div class="metric-values">
                        <div class="metric-row">
                            <span class="metric-label">Успешные доставки</span>
                            <span class="metric-value">${metrics.cdek.successRate}%</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Среднее время</span>
                            <span class="metric-value">${metrics.cdek.avgDeliveryTime} дн</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Эффективность затрат</span>
                            <span class="metric-value">${metrics.cdek.costEfficiency}%</span>
                        </div>
                    </div>
                </div>

                <div class="detailed-metric-card">
                    <div class="metric-header">
                        <h4>Мегамаркет Performance</h4>
                        <span class="metric-trend positive">
                            <i class="fas fa-arrow-up"></i> 8.7%
                        </span>
                    </div>
                    <div class="metric-values">
                        <div class="metric-row">
                            <span class="metric-label">Успешные доставки</span>
                            <span class="metric-value">${metrics.megamarket.successRate}%</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Среднее время</span>
                            <span class="metric-value">${metrics.megamarket.avgDeliveryTime} дн</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Рост выручки</span>
                            <span class="metric-value">${metrics.megamarket.revenueGrowth}%</span>
                        </div>
                    </div>
                </div>

                <div class="detailed-metric-card">
                    <div class="metric-header">
                        <h4>Общие показатели</h4>
                        <span class="metric-trend positive">
                            <i class="fas fa-arrow-up"></i> 3.1%
                        </span>
                    </div>
                    <div class="metric-values">
                        <div class="metric-row">
                            <span class="metric-label">Общая успешность</span>
                            <span class="metric-value">${metrics.overall.successRate}%</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Среднее время доставки</span>
                            <span class="metric-value">${metrics.overall.avgDeliveryTime} дн</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Удовлетворенность</span>
                            <span class="metric-value">${metrics.overall.customerSatisfaction}/5</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initCharts(data) {
        this.initPlatformComparisonChart(data.platformComparison);
        this.initPerformanceChart(data.performanceMetrics);
        this.initTrendsChart(data.monthlyTrends);
        this.initStatusDistributionChart();
        this.initGeographyChart();
    }

    initPlatformComparisonChart(comparison) {
        const ctx = document.getElementById('platformComparisonChart');
        if (!ctx) return;

        if (this.charts.platformComparison) {
            this.charts.platformComparison.destroy();
        }

        this.charts.platformComparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Заказы', 'Выручка (тыс. ₽)', 'Успешность (%)'],
                datasets: [
                    {
                        label: 'CDEK',
                        data: [
                            comparison.cdek.orders,
                            comparison.cdek.revenue / 1000,
                            comparison.cdek.successRate
                        ],
                        backgroundColor: 'rgba(39, 174, 96, 0.8)',
                        borderColor: 'rgba(39, 174, 96, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Мегамаркет',
                        data: [
                            comparison.megamarket.orders,
                            comparison.megamarket.revenue / 1000,
                            comparison.megamarket.successRate
                        ],
                        backgroundColor: 'rgba(142, 68, 173, 0.8)',
                        borderColor: 'rgba(142, 68, 173, 1)',
                        borderWidth: 1
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
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    if (context.dataIndex === 1) {
                                        label += new Intl.NumberFormat('ru-RU', {
                                            style: 'currency',
                                            currency: 'RUB'
                                        }).format(context.parsed.y * 1000);
                                    } else if (context.dataIndex === 2) {
                                        label += context.parsed.y + '%';
                                    } else {
                                        label += context.parsed.y;
                                    }
                                }
                                return label;
                            }
                        }
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

    initPerformanceChart(metrics) {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        if (this.charts.performance) {
            this.charts.performance.destroy();
        }

        this.charts.performance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Успешность доставки', 'Скорость доставки', 'Эффективность затрат', 'Рост выручки', 'Удовлетворенность'],
                datasets: [
                    {
                        label: 'CDEK',
                        data: [
                            metrics.cdek.successRate,
                            100 - (metrics.cdek.avgDeliveryTime * 20),
                            metrics.cdek.costEfficiency,
                            75,
                            metrics.overall.customerSatisfaction * 20
                        ],
                        backgroundColor: 'rgba(39, 174, 96, 0.2)',
                        borderColor: 'rgba(39, 174, 96, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(39, 174, 96, 1)'
                    },
                    {
                        label: 'Мегамаркет',
                        data: [
                            metrics.megamarket.successRate,
                            100 - (metrics.megamarket.avgDeliveryTime * 15),
                            70,
                            metrics.megamarket.revenueGrowth,
                            metrics.overall.customerSatisfaction * 20
                        ],
                        backgroundColor: 'rgba(142, 68, 173, 0.2)',
                        borderColor: 'rgba(142, 68, 173, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(142, 68, 173, 1)'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }

    initTrendsChart(trends) {
        const ctx = document.getElementById('trendsChart');
        if (!ctx) return;

        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        const labels = trends.map(t => {
            const date = new Date(t.month + '-01');
            return date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
        });

        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'CDEK',
                        data: trends.map(t => t.cdek),
                        borderColor: 'rgba(39, 174, 96, 1)',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Мегамаркет',
                        data: trends.map(t => t.megamarket),
                        borderColor: 'rgba(142, 68, 173, 1)',
                        backgroundColor: 'rgba(142, 68, 173, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
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
                            text: 'Месяц'
                        }
                    }
                }
            }
        });
    }

    initStatusDistributionChart() {
        const ctx = document.getElementById('statusDistributionChart');
        if (!ctx) return;

        // Получаем данные о статусах из заказов
        const orders = this.app.getOrders();
        const statusCount = {};
        
        orders.forEach(order => {
            statusCount[order.status] = (statusCount[order.status] || 0) + 1;
        });

        const statusLabels = {
            'new': 'Новые',
            'processing': 'В обработке',
            'active': 'Активные',
            'shipped': 'Отправленные',
            'delivered': 'Доставленные',
            'problem': 'Проблемные',
            'cancelled': 'Отмененные'
        };

        const backgroundColors = [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(39, 174, 96, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(201, 203, 207, 0.8)'
        ];

        this.charts.statusDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCount).map(status => statusLabels[status] || status),
                datasets: [{
                    data: Object.values(statusCount),
                    backgroundColor: backgroundColors.slice(0, Object.keys(statusCount).length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    initGeographyChart() {
        const ctx = document.getElementById('geographyChart');
        if (!ctx) return;

        // Mock данные для географии
        const cityData = {
            'Москва': 45,
            'Санкт-Петербург': 32,
            'Новосибирск': 18,
            'Екатеринбург': 15,
            'Казань': 12,
            'Другие': 28
        };

        this.charts.geography = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(cityData),
                datasets: [{
                    data: Object.values(cityData),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(201, 203, 207, 0.8)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    changePeriod(period) {
        this.currentPeriod = period;
        this.app.showNotification(`Период изменен на: ${this.getPeriodText(period)}`, 'info');
        
        // Здесь можно перезагрузить данные для выбранного периода
        this.load();
    }

    getPeriodText(period) {
        const periods = {
            'week': 'неделя',
            'month': 'месяц',
            'quarter': 'квартал',
            'year': 'год'
        };
        return periods[period] || period;
    }

    async exportReport() {
        try {
            this.app.showLoading('Подготовка отчета...');
            
            await this.app.delay(1000);
            
            // Создаем PDF отчет (заглушка)
            const analyticsData = this.app.getAnalyticsData();
            const reportData = this.prepareReportData(analyticsData);
            
            // В реальном приложении здесь был бы экспорт в PDF
            this.downloadReport(reportData);
            
            this.app.showNotification('Отчет успешно экспортирован', 'success');
            
        } catch (error) {
            console.error('Ошибка экспорта отчета:', error);
            this.app.showNotification('Ошибка экспорта отчета', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    prepareReportData(data) {
        const orders = this.app.getOrders();
        
        return {
            title: 'Аналитический отчет TEXNO EDEM',
            period: this.getPeriodText(this.currentPeriod),
            generated: new Date().toLocaleDateString('ru-RU'),
            summary: {
                totalOrders: orders.length,
                totalRevenue: orders.reduce((sum, order) => sum + order.amount, 0),
                successRate: data.performanceMetrics.overall.successRate
            },
            platformComparison: data.platformComparison,
            performanceMetrics: data.performanceMetrics,
            trends: data.monthlyTrends
        };
    }

    downloadReport(reportData) {
        // Создаем текстовый отчет
        const reportText = this.generateReportText(reportData);
        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.txt`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    generateReportText(reportData) {
        return `
АНАЛИТИЧЕСКИЙ ОТЧЕТ TEXNO EDEM
================================

Период: ${reportData.period}
Сгенерирован: ${reportData.generated}

ОБЩАЯ СТАТИСТИКА:
------------------
Всего заказов: ${reportData.summary.totalOrders}
Общая выручка: ${this.app.formatCurrency(reportData.summary.totalRevenue)}
Успешность доставки: ${reportData.summary.successRate}%

СРАВНЕНИЕ ПЛАТФОРМ:
-------------------
CDEK:
  - Заказы: ${reportData.platformComparison.cdek.orders}
  - Выручка: ${this.app.formatCurrency(reportData.platformComparison.cdek.revenue)}
  - Успешность: ${reportData.platformComparison.cdek.successRate}%

Мегамаркет:
  - Заказы: ${reportData.platformComparison.megamarket.orders}
  - Выручка: ${this.app.formatCurrency(reportData.platformComparison.megamarket.revenue)}
  - Успешность: ${reportData.platformComparison.megamarket.successRate}%

КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ:
--------------------
Общая успешность: ${reportData.performanceMetrics.overall.successRate}%
Среднее время доставки: ${reportData.performanceMetrics.overall.avgDeliveryTime} дн
Удовлетворенность клиентов: ${reportData.performanceMetrics.overall.customerSatisfaction}/5

Данные отчета также доступны в веб-интерфейсе.
        `.trim();
    }

    renderErrorState() {
        const container = document.getElementById('analytics-container');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <h3>Данные аналитики недоступны</h3>
                    <p>Попробуйте обновить страницу или проверить соединение</p>
                    <button class="btn btn-primary" onclick="app.components.analytics.load()">
                        <i class="fas fa-redo"></i> Повторить загрузку
                    </button>
                </div>
            `;
        }
    }

    // Метод для обновления данных в реальном времени
    updateRealTimeData(newData) {
        if (this.charts.platformComparison) {
            // Обновляем данные графиков
            Object.keys(this.charts).forEach(chartName => {
                if (this.charts[chartName] && this.charts[chartName].data) {
                    this.charts[chartName].update();
                }
            });
        }
    }

    // Метод для очистки графиков при уничтожении компонента
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}
