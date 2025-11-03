// js/core/error-handler.js
class ErrorHandler {
    static init() {
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }

    static handleGlobalError(event) {
        console.error('🌐 Global error:', event.error);
        this.showUserFriendlyError(event.error);
    }

    static handlePromiseRejection(event) {
        console.error('⏰ Unhandled promise rejection:', event.reason);
        this.showUserFriendlyError(event.reason);
        event.preventDefault();
    }

    static showUserFriendlyError(error) {
        const message = this.getUserFriendlyMessage(error);
        
        // Показать уведомление пользователю
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    static getUserFriendlyMessage(error) {
        if (error instanceof TypeError && error.message.includes('CONFIG')) {
            return 'Ошибка загрузки настроек. Попробуйте обновить страницу.';
        }
        
        if (error instanceof NetworkError) {
            return 'Проблемы с подключением к интернету. Проверьте соединение.';
        }
        
        return 'Произошла непредвиденная ошибка. Мы уже работаем над исправлением.';
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    ErrorHandler.init();
});
