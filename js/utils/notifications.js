// Компонент уведомлений для TEXNO EDEM
class NotificationComponent {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.nextId = 1;
        this.init();
    }

    init() {
        this.createContainer();
        this.setupStyles();
    }

    createContainer() {
        this.container = document.getElementById('notifications-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications-container';
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        }
    }

    setupStyles() {
        if (!document.getElementById('notification-styles')) {
            const styles = `
                .notifications-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1200;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 400px;
                    pointer-events: none;
                }

                .notification {
                    background: var(--white);
                    border-radius: var(--border-radius);
                    padding: 16px;
                    box-shadow: var(--shadow-lg);
                    border-left: 4px solid var(--gray-400);
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    pointer-events: all;
                    animation: notificationSlideIn 0.3s ease-out;
                    max-width: 400px;
                    position: relative;
                    overflow: hidden;
                }

                .notification::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: currentColor;
                    opacity: 0.3;
                }

                .notification.success {
                    border-left-color: var(--success);
                    color: var(--success);
                }

                .notification.error {
                    border-left-color: var(--danger);
                    color: var(--danger);
                }

                .notification.warning {
                    border-left-color: var(--warning);
                    color: var(--warning);
                }

                .notification.info {
                    border-left-color: var(--info);
                    color: var(--info);
                }

                .notification-icon {
                    flex-shrink: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                }

                .notification-content {
                    flex: 1;
                    min-width: 0;
                }

                .notification-title {
                    font-weight: 600;
                    color: var(--gray-900);
                    margin-bottom: 4px;
                    font-size: 14px;
                }

                .notification-message {
                    color: var(--gray-700);
                    font-size: 14px;
                    line-height: 1.4;
                }

                .notification-close {
                    background: none;
                    border: none;
                    color: var(--gray-500);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    flex-shrink: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: var(--transition);
                }

                .notification-close:hover {
                    background: var(--gray-100);
                    color: var(--gray-700);
                }

                @keyframes notificationSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes notificationSlideOut {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }

                .notification.exiting {
                    animation: notificationSlideOut 0.3s ease-in forwards;
                }

                @media (max-width: 768px) {
                    .notifications-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }

                    .notification {
                        max-width: none;
                    }
                }
            `;

            const styleSheet = document.createElement('style');
            styleSheet.id = 'notification-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    }

    show(message, type = 'info', options = {}) {
        const id = this.nextId++;
        const notification = this.createNotification(id, message, type, options);
        
        this.notifications.set(id, notification);
        this.container.appendChild(notification.element);

        // Автоматическое закрытие
        if (options.duration !== 0) {
            const duration = options.duration || this.getDefaultDuration(type);
            notification.timeout = setTimeout(() => {
                this.hide(id);
            }, duration);
        }

        return id;
    }

    createNotification(id, message, type, options) {
        const element = document.createElement('div');
        element.className = `notification ${type}`;
        
        const icon = this.getIcon(type);
        const title = this.getTitle(type);

        element.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="app.notifications.hide(${id})">
                <i class="fas fa-times"></i>
            </button>
        `;

        const notification = {
            id,
            element,
            type,
            message,
            timeout: null
        };

        return notification;
    }

    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        // Останавливаем таймер
        if (notification.timeout) {
            clearTimeout(notification.timeout);
        }

        // Анимация закрытия
        notification.element.classList.add('exiting');
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    hideAll() {
        this.notifications.forEach((notification, id) => {
            this.hide(id);
        });
    }

    getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    getTitle(type) {
        const titles = {
            success: 'Успешно',
            error: 'Ошибка',
            warning: 'Внимание',
            info: 'Информация'
        };
        return titles[type] || titles.info;
    }

    getDefaultDuration(type) {
        const durations = {
            success: 5000,
            error: 8000,
            warning: 6000,
            info: 4000
        };
        return durations[type] || 4000;
    }

    // Статические методы для быстрого доступа
    static success(message, options) {
        return app.notifications.show(message, 'success', options);
    }

    static error(message, options) {
        return app.notifications.show(message, 'error', options);
    }

    static warning(message, options) {
        return app.notifications.show(message, 'warning', options);
    }

    static info(message, options) {
        return app.notifications.show(message, 'info', options);
    }
}

// Создаем глобальный экземпляр
const notificationManager = new NotificationComponent();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationComponent, notificationManager };
}
