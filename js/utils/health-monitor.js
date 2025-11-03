class HealthMonitor {
    constructor(app) {
        this.app = app;
        this.metrics = {
            startupTime: null,
            memoryUsage: null,
            errorCount: 0,
            syncSuccessRate: 0
        };
    }

    startMonitoring() {
        this.metrics.startupTime = Date.now();
        
        // Мониторинг памяти
        setInterval(() => this.checkMemory(), 30000);
        
        // Мониторинг производительности
        this.monitorPerformance();
    }

    checkMemory() {
        if (performance.memory) {
            this.metrics.memoryUsage = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
    }

    monitorPerformance() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.entryType === 'measure') {
                    console.log(`⏱️ ${entry.name}: ${entry.duration.toFixed(2)}ms`);
                }
            });
        });
        
        observer.observe({ entryTypes: ['measure'] });
    }

    getHealthStatus() {
        const status = {
            overall: 'healthy',
            components: {}
        };

        // Проверяем различные компоненты
        status.components.storage = this.checkStorage();
        status.components.api = this.checkAPI();
        status.components.memory = this.checkMemoryHealth();
        
        // Определяем общий статус
        if (Object.values(status.components).some(comp => comp.status === 'error')) {
            status.overall = 'error';
        } else if (Object.values(status.components).some(comp => comp.status === 'warning')) {
            status.overall = 'warning';
        }

        return status;
    }

    checkStorage() {
        try {
            localStorage.setItem('health_check', 'test');
            localStorage.removeItem('health_check');
            return { status: 'healthy', message: 'Storage is working' };
        } catch (e) {
            return { status: 'error', message: e.message };
        }
    }
}
