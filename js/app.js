// app.js - УЛУЧШЕННАЯ ВЕРСИЯ
class TexnoEdemApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPlatform = 'cdek';
        this.orders = {
            cdek: [],
            megamarket: [],
            all: []
        };
        this.analytics = {};
        this.user = null;
        
        this.isLoading = false;
        this.isSyncing = false;
        this.isInitialized = false;
        this.lastSyncTime = null;
        this.initTimeout = null;
        this.syncInterval = null;
        
        // Компоненты с улучшенным управлением состоянием
        this.components = {
            orders: null,
            analytics: null,
            settings: null,
            modal: null
        };

        // Кэш для оптимизации
        this.cache = new Map();
        this.pendingRequests = new Map();
        
        console.log('🚀 TEXNO EDEM App constructor called');
    }

    async init() {
        if (this.isInitialized) {
            console.log('⚠️ Already initialized');
            return;
        }

        try {
            console.log('🔧 Starting initialization...');
            this.showLoading('Инициализация TEXNO EDEM...');

            // Таймаут на инициализацию с обработкой отмены
            this.initTimeout = setTimeout(() => {
                if (!this.isInitialized) {
                    console.error('❌ Init timeout reached');
                    this.emergencyInit();
                }
            }, 10000);

            // Последовательная инициализация с обработкой ошибок
            await this.executeWithRetry(() => this.initBasic(), 'Basic initialization');
            await this.executeWithRetry(() => this.initTelegram(), 'Telegram initialization');
            await this.executeWithRetry(() => this.initComponents(), 'Components initialization');
            await this.executeWithRetry(() => this.loadInitialData(), 'Initial data loading');
            
            // Фоновая инициализация
            this.startAutoSync();
            this.applyUserSettings();
            this.setupPerformanceMonitoring();
            
            this.isInitialized = true;
            clearTimeout(this.initTimeout);
            
            console.log('✅ TEXNO EDEM App initialized successfully');
            this.showNotification('Система готова к работе', 'success', 3000);
            
            // Отслеживание метрик производительности
            this.trackPerformance('app_init');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.trackError('init', error);
            this.emergencyInit();
        } finally {
            this.hideLoading();
        }
    }

    async executeWithRetry(operation, operationName, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 ${operationName} attempt ${attempt}/${maxRetries}`);
                await operation();
                console.log(`✅ ${operationName} successful`);
                return;
            } catch (error) {
                console.warn(`⚠️ ${operationName} attempt ${attempt} failed:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Экспоненциальная задержка перед повторной попыткой
                await new Promise(resolve => 
                    setTimeout(resolve, Math.pow(2, attempt) * 1000)
                );
            }
        }
    }

    // НОВЫЙ МЕТОД: Мониторинг производительности
    setupPerformanceMonitoring() {
        // Отслеживание метрик загрузки
        if ('performance' in window) {
            const perfObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    console.log(`📊 Performance: ${entry.name}`, entry);
                    this.trackPerformance(entry.name, entry.duration);
                });
            });
            
            perfObserver.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
        }

        // Мониторинг памяти
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
                    console.warn('⚠️ High memory usage detected');
                    this.clearCache();
                }
            }, 30000);
        }
    }

    // НОВЫЙ МЕТОД: Управление кэшем
    setCache(key, value, ttl = 300000) { // 5 минут по умолчанию
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl
        });
    }

    getCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache cleared');
    }

    // НОВЫЙ МЕТОД: Отслеживание ошибок
    trackError(context, error, extra = {}) {
        const errorInfo = {
            context,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            user: this.user?.id,
            ...extra
        };
        
        console.error('🚨 Tracked error:', errorInfo);
        
        // Сохраняем ошибки для последующего анализа
        const errors = JSON.parse(localStorage.getItem('texno_edem_errors') || '[]');
        errors.push(errorInfo);
        localStorage.setItem('texno_edem_errors', JSON.stringify(errors.slice(-50))); // Храним последние 50 ошибок
    }

    // НОВЫЙ МЕТОД: Отслеживание производительности
    trackPerformance(metric, value) {
        const perfData = {
            metric,
            value,
            timestamp: new Date().toISOString(),
            user: this.user?.id
        };
        
        console.log('📈 Performance metric:', perfData);
    }

    async initComponents() {
        try {
            console.log('🔧 Initializing components...');
            
            // Параллельная загрузка компонентов с обработкой ошибок
            const componentPromises = [
                this.loadComponent('orders'),
                this.loadComponent('analytics'),
                this.loadComponent('settings'),
                this.loadComponent('modal')
            ];

            await Promise.allSettled(componentPromises);
            
            this.renderHeader();
            this.renderNavigation();
            
            console.log('✅ Components initialized');
        } catch (error) {
            console.warn('⚠️ Components init failed:', error);
            this.trackError('components_init', error);
            this.createFallbackComponents();
        }
    }

    async loadInitialData() {
        try {
            console.log('📦 Loading initial data...');
            
            // Кэшируем загрузку данных
            const cacheKey = 'initial_data';
            const cachedData = this.getCache(cacheKey);
            
            if (cachedData) {
                console.log('📦 Using cached initial data');
                this.orders = cachedData.orders;
                this.analytics = cachedData.analytics;
            } else {
                await this.loadOrders();
                await this.loadAnalytics();
                
                // Сохраняем в кэш
                this.setCache(cacheKey, {
                    orders: this.orders,
                    analytics: this.analytics
                }, 60000); // 1 минута
            }
            
            this.updateDashboard();
            this.updateNavigationBadges();
            this.lastSyncTime = new Date();
            
            console.log('✅ Initial data loaded');
        } catch (error) {
            console.warn('⚠️ Initial data load failed:', error);
            this.trackError('initial_data_load', error);
            this.useDemoData();
        }
    }

    // НОВЫЙ МЕТОД: Загрузка аналитики
    async loadAnalytics() {
        try {
            console.log('📊 Loading analytics data...');
            
            // Используем улучшенные демо-данные для аналитики
            this.analytics = this.generateEnhancedAnalytics();
            
            console.log('✅ Analytics data loaded');
        } catch (error) {
            console.warn('⚠️ Analytics data load failed:', error);
            this.analytics = this.generateBasicAnalytics();
        }
    }

    // НОВЫЙ МЕТОД: Улучшенная аналитика
    generateEnhancedAnalytics() {
        const cdekOrders = this.orders.cdek;
        const megamarketOrders = this.orders.megamarket;
        const allOrders = this.orders.all;

        return {
            summary: {
                totalOrders: allOrders.length,
                totalRevenue: allOrders.reduce((sum, order) => sum + (order.cost || order.totalAmount || 0), 0),
                successRate: this.calculateSuccessRate(allOrders),
                averageDeliveryTime: this.calculateAverageDeliveryTime(allOrders),
                customerSatisfaction: this.calculateCustomerSatisfaction(allOrders)
            },
            platforms: {
                cdek: this.calculatePlatformMetrics(cdekOrders),
                megamarket: this.calculatePlatformMetrics(megamarketOrders)
            },
            trends: {
                daily: this.generateDailyTrends(allOrders),
                weekly: this.generateWeeklyTrends(allOrders),
                monthly: this.generateMonthlyTrends(allOrders)
            },
            insights: this.generateBusinessInsights(allOrders)
        };
    }

    calculateSuccessRate(orders) {
        const successful = orders.filter(order => 
            order.status === 'delivered' || order.status === 'active'
        ).length;
        return orders.length > 0 ? (successful / orders.length) * 100 : 0;
    }

    calculateAverageDeliveryTime(orders) {
        const deliveredOrders = orders.filter(order => 
            order.status === 'delivered' && order.createdDate && order.deliveredDate
        );
        
        if (deliveredOrders.length === 0) return 0;
        
        const totalTime = deliveredOrders.reduce((sum, order) => {
            const created = new Date(order.createdDate);
            const delivered = new Date(order.deliveredDate);
            return sum + (delivered - created);
        }, 0);
        
        return Math.round(totalTime / deliveredOrders.length / (1000 * 60 * 60 * 24)); // В днях
    }

    calculateCustomerSatisfaction(orders) {
        // Упрощенный расчет удовлетворенности клиентов
        const problemOrders = orders.filter(order => order.status === 'problem').length;
        const totalOrders = orders.length;
        
        if (totalOrders === 0) return 100;
        
        return Math.max(0, 100 - (problemOrders / totalOrders) * 50);
    }

    calculatePlatformMetrics(orders) {
        return {
            total: orders.length,
            revenue: orders.reduce((sum, order) => sum + (order.cost || order.totalAmount || 0), 0),
            averageOrderValue: orders.length > 0 ? 
                orders.reduce((sum, order) => sum + (order.cost || order.totalAmount || 0), 0) / orders.length : 0,
            successRate: this.calculateSuccessRate(orders),
            problemOrders: orders.filter(order => order.status === 'problem').length
        };
    }

    generateDailyTrends(orders) {
        // Генерация трендов за последние 7 дней
        const trends = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayOrders = orders.filter(order => 
                order.createdDate && order.createdDate.startsWith(dateStr)
            );
            
            trends.push({
                date: dateStr,
                orders: dayOrders.length,
                revenue: dayOrders.reduce((sum, order) => sum + (order.cost || order.totalAmount || 0), 0)
            });
        }
        
        return trends;
    }

    generateBusinessInsights(orders) {
        const insights = [];
        
        // Анализ популярных направлений
        const cityStats = {};
        orders.forEach(order => {
            if (order.toCity) {
                cityStats[order.toCity] = (cityStats[order.toCity] || 0) + 1;
            }
        });
        
        const popularCities = Object.entries(cityStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([city]) => city);
        
        if (popularCities.length > 0) {
            insights.push({
                type: 'popular_cities',
                title: 'Популярные направления',
                message: `Наибольшее количество заказов в городах: ${popularCities.join(', ')}`,
                priority: 'medium'
            });
        }
        
        // Анализ проблемных заказов
        const problemOrders = orders.filter(order => order.status === 'problem');
        if (problemOrders.length > orders.length * 0.1) { // Более 10% проблемных заказов
            insights.push({
                type: 'high_problem_rate',
                title: 'Высокий процент проблемных заказов',
                message: `Обнаружено ${problemOrders.length} проблемных заказов (${Math.round((problemOrders.length / orders.length) * 100)}%)`,
                priority: 'high'
            });
        }
        
        // Анализ сезонности
        const monthlyStats = {};
        orders.forEach(order => {
            if (order.createdDate) {
                const month = order.createdDate.substring(0, 7); // YYYY-MM
                monthlyStats[month] = (monthlyStats[month] || 0) + 1;
            }
        });
        
        return insights;
    }

    // ОБНОВЛЕННЫЙ МЕТОД: Улучшенная синхронизация
    async manualSync() {
        if (this.isSyncing) {
            this.showNotification('Синхронизация уже выполняется', 'warning');
            return;
        }
        
        this.isSyncing = true;
        this.showLoading('Синхронизация с платформами...');
        this.renderHeader();
        
        try {
            const startTime = performance.now();
            
            // Параллельная синхронизация с платформами
            const [cdekOrders, megamarketOrders] = await Promise.all([
                this.syncPlatform('cdek'),
                this.syncPlatform('megamarket')
            ]);
            
            this.orders.cdek = cdekOrders;
            this.orders.megamarket = megamarketOrders;
            this.orders.all = [...cdekOrders, ...megamarketOrders]
                .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
            
            // Обновляем аналитику
            await this.loadAnalytics();
            
            this.updateDashboard();
            this.updateNavigationBadges();
            this.lastSyncTime = new Date();
            
            // Очищаем кэш данных
            this.clearCache();
            
            const syncTime = performance.now() - startTime;
            this.trackPerformance('manual_sync', syncTime);
            
            this.showNotification(`Данные успешно обновлены за ${Math.round(syncTime)}мс`, 'success');
            
        } catch (error) {
            console.error('Sync error:', error);
            this.trackError('manual_sync', error);
            this.showNotification('Ошибка синхронизации', 'error');
        } finally {
            this.isSyncing = false;
            this.hideLoading();
            this.renderHeader();
        }
    }

    async syncPlatform(platform) {
        const cacheKey = `sync_${platform}_${new Date().toISOString().split('T')[0]}`;
        const cached = this.getCache(cacheKey);
        
        if (cached) {
            console.log(`📦 Using cached data for ${platform}`);
            return cached;
        }
        
        console.log(`🔄 Syncing ${platform}...`);
        
        // Имитация API запроса
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        let orders;
        if (platform === 'cdek') {
            orders = this.generateDemoCDEKOrders();
        } else {
            orders = this.generateDemoMegamarketOrders();
        }
        
        // Сохраняем в кэш на 5 минут
        this.setCache(cacheKey, orders, 300000);
        
        return orders;
    }

    // ОБНОВЛЕННЫЙ МЕТОД: Улучшенный дашборд
    updateDashboard() {
        this.updateQuickStats();
        this.updateRecentActivity();
        this.updatePlatformWidgets();
        this.updateAnalyticsPreview();
        this.updateBusinessInsights(); // НОВОЕ: Бизнес-инсайты
    }

    // НОВЫЙ МЕТОД: Бизнес-инсайты на дашборде
    updateBusinessInsights() {
        const container = document.getElementById('business-insights');
        if (!container) return;

        const insights = this.analytics.insights || [];
        
        if (insights.length === 0) {
            container.innerHTML = `
                <div class="insights-empty">
                    <i class="fas fa-lightbulb"></i>
                    <p>Пока нет значимых инсайтов</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="insights-list">
                ${insights.map(insight => `
                    <div class="insight-item insight-${insight.priority}">
                        <div class="insight-icon">
                            <i class="fas fa-${this.getInsightIcon(insight.type)}"></i>
                        </div>
                        <div class="insight-content">
                            <div class="insight-title">${insight.title}</div>
                            <div class="insight-message">${insight.message}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getInsightIcon(type) {
        const icons = {
            popular_cities: 'map-marker-alt',
            high_problem_rate: 'exclamation-triangle',
            seasonal_trend: 'chart-line'
        };
        return icons[type] || 'info-circle';
    }

    // ОБНОВЛЕННЫЙ МЕТОД: Улучшенная аналитика
    updateAnalyticsPreview() {
        const container = document.getElementById('analytics-preview');
        if (!container) return;

        const trends = this.analytics.trends?.daily || [];
        const lastDay = trends[trends.length - 2]; // Предыдущий день
        const currentDay = trends[trends.length - 1]; // Текущий день

        const calculateChange = (current, previous) => {
            if (!previous || previous === 0) return { value: '0%', change: 'neutral' };
            const change = ((current - previous) / previous) * 100;
            return {
                value: `${change > 0 ? '+' : ''}${Math.round(change)}%`,
                change: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
            };
        };

        const ordersChange = calculateChange(currentDay?.orders || 0, lastDay?.orders || 0);
        const revenueChange = calculateChange(currentDay?.revenue || 0, lastDay?.revenue || 0);

        const metrics = [
            { 
                icon: 'shopping-cart', 
                label: 'Заказы сегодня', 
                value: currentDay?.orders || 0,
                change: ordersChange
            },
            { 
                icon: 'ruble-sign', 
                label: 'Выручка сегодня', 
                value: this.formatCurrency(currentDay?.revenue || 0),
                change: revenueChange
            },
            { 
                icon: 'chart-line', 
                label: 'Успешных заказов', 
                value: `${Math.round(this.analytics.summary?.successRate || 0)}%`,
                change: { value: '', change: 'neutral' }
            },
            { 
                icon: 'clock', 
                label: 'Среднее время доставки', 
                value: `${this.analytics.summary?.averageDeliveryTime || 0} дн.`,
                change: { value: '', change: 'neutral' }
            }
        ];

        container.innerHTML = metrics.map(metric => `
            <div class="preview-card">
                <div class="preview-icon">
                    <i class="fas fa-${metric.icon}"></i>
                </div>
                <div class="preview-content">
                    <div class="preview-value">${metric.value}</div>
                    <div class="preview-label">${metric.label}</div>
                    ${metric.change.value ? `
                        <div class="preview-change ${metric.change.change}">
                            <i class="fas fa-arrow-${metric.change.change === 'positive' ? 'up' : 'down'}"></i>
                            ${metric.change.value}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Остальные методы остаются без изменений, но с улучшенной обработкой ошибок...
}

// Глобальные улучшения
window.performanceMetrics = {
    track: (name, value) => {
        if (window.app) {
            window.app.trackPerformance(name, value);
        }
    },
    
    measure: (name, operation) => {
        const start = performance.now();
        const result = operation();
        const duration = performance.now() - start;
        
        if (window.app) {
            window.app.trackPerformance(name, duration);
        }
        
        return result;
    }
};

// Улучшенная обработка глобальных ошибок
window.addEventListener('error', (event) => {
    if (window.app) {
        window.app.trackError('global_error', event.error, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    }
});

window.addEventListener('unhandledrejection', (event) => {
    if (window.app) {
        window.app.trackError('unhandled_rejection', event.reason);
    }
});
