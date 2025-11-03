// js/utils/notifications.js - Красивые уведомления
class NotificationManager {
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
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 400px;
                }

                .notification {
                    background: var(--white);
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                    border-left: 4px solid;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    animation: notificationSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    max-width: 400px;
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                }

                .notification::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 100%;
                    background: currentColor;
                    opacity: 0.05;
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
                    z-index: 1;
                }

                .notification-content {
                    flex: 1;
                    min-width: 0;
                    z-index: 1;
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
                    background: rgba(0, 0, 0, 0.1);
                    border: none;
                    color: currentColor;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 6px;
                    flex-shrink: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    z-index: 1;
                }

                .notification-close:hover {
                    background: rgba(0, 0, 0, 0.2);
                    transform: scale(1.1);
                }

                .notification.progress::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: currentColor;
                    animation: progressBar linear forwards;
                }

                @keyframes notificationSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }

                @keyframes notificationSlideOut {
                    from {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%) scale(0.9);
                    }
                }

                @keyframes progressBar {
                    from { width: 100%; }
                    to { width: 0%; }
                }

                .notification.exiting {
                    animation: notificationSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                /* Адаптивность */
                @media (max-width: 768px) {
                    .notifications-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }

                    .notification {
                        max-width: none;
                        margin: 0 10px;
                    }
                }

                @media (max-width: 480px) {
                    .notifications-container {
                        top: 5px;
                        right: 5px;
                        left: 5px;
                    }

                    .notification {
                        padding: 12px;
                        margin: 0 5px;
                    }

                    .notification-title {
                        font-size: 13px;
                    }

                    .notification-message {
                        font-size: 13px;
                    }
                }

                /* Темная тема */
                [data-theme="dark"] .notification {
                    background: var(--gray-800);
                    color: var(--gray-100);
                }

                [data-theme="dark"] .notification-title {
                    color: var(--gray-100);
                }

                [data-theme="dark"] .notification-message {
                    color: var(--gray-300);
                }

                [data-theme="dark"] .notification-close {
                    background: rgba(255, 255, 255, 0.1);
                }

                [data-theme="dark"] .notification-close:hover {
                    background: rgba(255, 255, 255, 0.2);
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

            // Прогресс бар
            if (options.progressBar !== false) {
                notification.element.classList.add('progress');
                notification.element.style.setProperty('--duration', `${duration}ms`);
            }
        }

        return id;
    }

    createNotification(id, message, type, options) {
        const element = document.createElement('div');
        element.className = `notification ${type}`;
        
        const icon = this.getIcon(type);
        const title = options.title || this.getTitle(type);

        element.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                ${title ? `<div class="notification-title">${title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="NotificationManager.hide(${id})">
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
            success: 4000,
            error: 6000,
            warning: 5000,
            info: 3000
        };
        return durations[type] || 4000;
    }

    // Статические методы для быстрого доступа
    static success(message, options = {}) {
        return instance.show(message, 'success', options);
    }

    static error(message, options = {}) {
        return instance.show(message, 'error', options);
    }

    static warning(message, options = {}) {
        return instance.show(message, 'warning', options);
    }

    static info(message, options = {}) {
        return instance.show(message, 'info', options);
    }

    static hide(id) {
        instance.hide(id);
    }

    static hideAll() {
        instance.hideAll();
    }
}

// Создаем глобальный экземпляр
const instance = new NotificationManager();

// Делаем доступным глобально
window.NotificationManager = NotificationManager;

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationManager };
}
