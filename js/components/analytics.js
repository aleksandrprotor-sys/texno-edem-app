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
        this.renderProblemAnalysis(data.problemAnalysis);
    }

    renderPlatformComparison(comparison) {
        const container = document.getElementById('platform-comparison');
        if (!container) return;

        container.innerHTML = `
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
        `;
    }

    renderPerformanceMetrics(metrics) {
        const container = document.getElementById('performance-metrics');
        if (!container) return;

        container.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-card good">
                    <div class="kpi-value">${metrics.overall.successRate}%</div>
                    <div class="kpi-label">Общая успешность</div>
                    <div class="kpi-target">
                        <i class="fas fa-bullseye"></i> Цель: 95%
                    </div>
                </div>
                
                <div class="kpi-card warning">
                    <div class="kpi-value">${metrics.overall.avgDeliveryTime} дн</div>
                    <div class="kpi-label">Среднее время доставки</div>
                    <div class="kpi-target">
                        <i class="fas fa-bullseye"></i> Цель: 2.5 дн
                    </div>
                </div>
                
                <div class="kpi-card good">
                    <div class="kpi-value">${metrics.overall.customerSatisfaction}/5</div>
                    <div class="kpi-label">Удовлетворенность клиентов</div>
                    <div class="kpi-target">
                        <i class="fas fa-bullseye"></i> Цель: 4.8/5
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

    renderProblemAnalysis(analysis) {
        const container = document.getElementById('problem-analysis');
        if (!container) return;

        container.innerHTML = `
            <div class="analytics-grid">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">Анализ проблем CDEK</h3>
                    </div>
                    <div class="chart-wrapper">
                        <canvas id="cdekProblemsChart"></canvas>
                    </div>
                </div>
                
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">Анализ проблем Мегамаркет</h3>
                    </div>
                    <div class="chart-wrapper">
                        <canvas id="megamarketProblemsChart"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    initCharts(data) {
        this.initPlatformComparisonChart(data.platformComparison);
        this.initPerformanceChart(data.performanceMetrics);
        this.initProblemCharts(data.problemAnalysis);
        this.initTrendsChart(data.monthlyTrends);
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
                labels: ['Заказы', 'Выручка', 'Успешность'],
                datasets: [
                    {
                        label: 'CDEK',
                        data: [
                            comparison.cdek.orders,
                            comparison.cdek.revenue / 100000,
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
                            comparison.megamarket.revenue / 100000,
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
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
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
                                        }).format(context.parsed.y * 100000);
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
                labels: ['Успешность доставки', 'Скорость доставки', 'Эффективность затрат', 'Рост выручки'],
                datasets: [
                    {
                        label: 'CDEK',
                        data: [
                            metrics.cdek.successRate,
                            100 - (metrics.cdek.avgDeliveryTime * 20), // Инвертируем для лучшего отображения
                            metrics.cdek.costEfficiency,
                            75 // Заглушка
                        ],
                        backgroundColor: 'rgba(39, 174, 96, 0.2)',
                        borderColor: 'rgba(39, 174, 96, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Мегамаркет',
                        data: [
                            metrics.megamarket.successRate,
                            100 - (metrics.megamarket.avgDeliveryTime * 15), // Инвертируем
                            70, // Заглушка
                            metrics.megamarket.revenueGrowth
                        ],
                        backgroundColor: 'rgba(142, 68, 173, 0.2)',
                        borderColor: 'rgba(142, 68, 173, 1)',
                        borderWidth: 2
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
                        suggestedMax: 100
                    }
                }
            }
        });
    }

    initProblemCharts(analysis) {
        this.initProblemChart('cdekProblemsChart', analysis.cdek, 'CDEK Проблемы');
        this.initProblemChart('megamarketProblemsChart', analysis.megamarket, 'Мегамаркет Проблемы');
    }

    initProblemChart(canvasId, data, title) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data).map(key => this.formatProblemLabel(key)),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(107, 114, 128, 0.8)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },
                    legend: {
                        position: 'bottom'
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
                    title: {
                        display: true,
                        text: 'Динамика заказов по месяцам'
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

    formatProblemLabel(key) {
        const labels = {
            'delivery': 'Доставка',
            'packaging': 'Упаковка',
            'documentation': 'Документы',
            'payment': 'Оплата',
            'product': 'Товар',
            'other': 'Другие'
        };
        return labels[key] || key;
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
        return {
            title: 'Аналитический отчет TEXNO EDEM',
            period: this.getPeriodText(this.currentPeriod),
            generated: new Date().toLocaleDateString('ru-RU'),
            data: data
        };
    }

    downloadReport(reportData) {
        // В реальном приложении здесь был бы экспорт в PDF
        // Сейчас просто показываем данные в alert
        alert(`Отчет подготовлен!\n\nПериод: ${reportData.period}\nСгенерирован: ${reportData.generated}\n\nДанные доступны в консоли.`);
        console.log('Данные для отчета:', reportData);
    }

    renderErrorState() {
        const containers = [
            'platform-comparison',
            'performance-metrics',
            'problem-analysis'
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
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
        });
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
}
