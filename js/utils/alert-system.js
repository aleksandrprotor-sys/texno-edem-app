class AlertSystem {
    constructor(app) {
        this.app = app;
        this.alerts = new Map();
        this.triggeredAlerts = new Set();
    }

    // Настройка алертов
    setupAlerts() {
        this.addAlert('high_problem_orders', {
            condition: () => this.getProblemOrdersCount() > 5,
            message: 'Высокое количество проблемных заказов',
            type: 'warning',
            cooldown: 30 * 60 * 1000 // 30 минут
        });

        this.addAlert('sync_failed', {
            condition: () => this.app.lastSyncFailed,
            message: 'Синхронизация не удалась',
            type: 'error',
            cooldown: 5 * 60 * 1000
        });

        this.addAlert('new_orders_available', {
            condition: () => this.getNewOrdersCount() > 0,
            message: `Доступно ${this.getNewOrdersCount()} новых заказов`,
            type: 'info',
            cooldown: 2 * 60 * 1000
        });
    }

    addAlert(id, config) {
        this.alerts.set(id, config);
    }

    checkAlerts() {
        this.alerts.forEach((config, id) => {
            if (this.shouldTriggerAlert(id, config)) {
                this.triggerAlert(id, config);
            }
        });
    }

    shouldTriggerAlert(id, config) {
        if (this.triggeredAlerts.has(id)) return false;
        if (!config.condition()) return false;
        
        this.triggeredAlerts.add(id);
        setTimeout(() => {
            this.triggeredAlerts.delete(id);
        }, config.cooldown);
        
        return true;
    }

    triggerAlert(id, config) {
        this.app.showNotification(config.message, config.type);
        
        // Вибро-отклик в Telegram
        if (this.app.tg && this.app.tg.HapticFeedback) {
            this.app.tg.HapticFeedback.impactOccurred('medium');
        }
    }
}
