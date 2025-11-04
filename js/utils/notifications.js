// js/utils/notifications.js
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notifications-container');
        this.init();
    }

    init() {
        // Автоматическое скрытие старых уведомлений
        setInterval(() => {
            this.cleanup();
        }, 5000);
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} tg-notification tg-slide-in`;
        
        const icon = this.getIcon(type);
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close tg-tap-effect" onclick="this.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.appendChild(notification);

        // Автоматическое скрытие
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.add('tg-slide-out');
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }

        return notification;
    }

    getIcon(type) {
        const icons = {
            'success': '<i class="fas fa-check-circle"></i>',
            'error': '<i class="fas fa-exclamation-circle"></i>',
            'warning': '<i class="fas fa-exclamation-triangle"></i>',
            'info': '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    cleanup() {
        const notifications = this.container.querySelectorAll('.notification');
        if (notifications.length > 5) {
            notifications[0].remove();
        }
    }
}

// Инициализация менеджера уведомлений
const notifications = new NotificationManager();
