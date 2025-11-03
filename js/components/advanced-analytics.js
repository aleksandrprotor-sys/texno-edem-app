class AdvancedAnalytics {
    constructor(app) {
        this.app = app;
        this.metrics = new Map();
    }

    trackEvent(category, action, label, value) {
        const event = {
            category,
            action,
            label,
            value,
            timestamp: new Date().toISOString(),
            userId: this.app.user?.id,
            sessionId: this.getSessionId()
        };

        this.storeEvent(event);
        this.updateRealTimeMetrics(event);
    }

    storeEvent(event) {
        const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        events.push(event);
        
        // Храним только последние 1000 событий
        if (events.length > 1000) {
            events.splice(0, events.length - 1000);
        }
        
        localStorage.setItem('analytics_events', JSON.stringify(events));
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('analytics_session');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('analytics_session', sessionId);
        }
        return sessionId;
    }

    // Метрики в реальном времени
    updateRealTimeMetrics(event) {
        const metricKey = `${event.category}_${event.action}`;
        const current = this.metrics.get(metricKey) || { count: 0, totalValue: 0 };
        
        current.count++;
        current.totalValue += event.value || 0;
        current.lastUpdate = new Date();
        
        this.metrics.set(metricKey, current);
    }

    // Анализ поведения пользователей
    getUserBehaviorReport() {
        const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        
        return {
            sessionCount: this.getSessionCount(events),
            popularSections: this.getPopularSections(events),
            userRetention: this.calculateRetention(events),
            conversionRate: this.calculateConversionRate(events)
        };
    }

    getSessionCount(events) {
        const sessions = new Set(events.map(e => e.sessionId));
        return sessions.size;
    }
}
