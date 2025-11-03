// js/utils/error-handler.js
class ErrorHandler {
    static init() {
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }

    static handleGlobalError(event) {
        const error = {
            type: 'Global Error',
            message: event.error?.message,
            stack: event.error?.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        this.logError(error);
        this.showUserFriendlyError(error);
    }

    static handlePromiseRejection(event) {
        const error = {
            type: 'Promise Rejection',
            reason: event.reason,
            timestamp: new Date().toISOString()
        };
        
        this.logError(error);
        event.preventDefault();
    }

    static logError(error) {
        console.error('Application Error:', error);
        // Отправка в сервис мониторинга
        this.sendToMonitoring(error);
    }

    static showUserFriendlyError(error) {
        const message = this.getUserMessage(error);
        if (window.NotificationManager) {
            NotificationManager.error(message);
        }
    }

    static getUserMessage(error) {
        const messages = {
            'Network Error': 'Проблемы с подключением к интернету',
            'Failed to fetch': 'Ошибка загрузки данных',
            'QuotaExceededError': 'Недостаточно места в хранилище'
        };
        
        return messages[error.message] || 'Произошла непредвиденная ошибка';
    }
}
