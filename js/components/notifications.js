// js/components/notifications.js
class NotificationsComponent {
    constructor(app) {
        this.app = app;
        this.notifications = [];
        this.unreadCount = 0;
        this.init();
    }

    init() {
        console.log('✅ NotificationsComponent инициализирован');
        this.loadNotifications();
        this.setupEventListeners();
        this.startRealTimeUpdates();
    }

    setupEventListeners() {
        // Обработчик для кнопки уведомлений в хедере
        document.addEventListener('click', (e) => {
            if (e.target.closest('#notification-badge') || e.target.closest('[onclick*="showNotifications"]')) {
                this.showNotificationsPanel();
            }
        });

        // Закрытие панели уведомлений
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('notifications-backdrop')) {
                this.hideNotificationsPanel();
            }
        });

        // Обработчики для действий с уведомлениями
        document.addEventListener('click', (e) => {
            if (e.target.closest('.notification-mark-read')) {
                this.markAsRead(e.target.closest('.notification-mark-read').dataset.notificationId);
            }
            if (e.target.closest('.notification-delete')) {
                this.deleteNotification(e.target.closest('.notification-delete').dataset.notificationId);
            }
            if (e.target.closest('.notification-action')) {
                this.handleNotificationAction(e.target.closest('.notification-action').dataset.action);
            }
        });
    }

    async loadNotifications() {
        try {
            // Загрузка уведомлений из localStorage
            const savedNotifications = localStorage.getItem('texno_edem_notifications');
            this.notifications = savedNotifications ? JSON.parse(savedNotifications) : [];
            
            // Если уведомлений нет, создаем демо-данные
            if (this.notifications.length === 0) {
                this.notifications = this.generateDemoNotifications();
                this.saveNotifications();
            }

            this.updateUnreadCount();
            this.updateBadge();
            
        } catch (error) {
            console.error('Ошибка загрузки уведомлений:', error);
            this.notifications = this.generateDemoNotifications();
        }
    }

    generateDemoNotifications() {
        return [
            {
                id: 'notif-1',
                type: 'info',
                title: 'Новые заказы',
                message: 'Поступило 5 новых заказов с Мегамаркет',
                timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 минут назад
                read: false,
                action: {
                    type: 'navigate',
                    target: 'orders',
                    params: { platform: 'megamarket' }
                }
            },
            {
                id: 'notif-2',
                type: 'warning',
                title: 'Проблемы с доставкой',
                message: '3 заказа CDEK имеют проблемы с доставкой',
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 минут назад
                read: false,
                action: {
                    type: 'navigate',
                    target: 'orders',
                    params: { status: 'problem' }
                }
            },
            {
                id: 'notif-3',
                type: 'success',
                title: 'Синхронизация завершена',
                message: 'Все данные успешно синхронизированы',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 часа назад
                read: true
            },
            {
                id: 'notif-4',
                type: 'error',
                title: 'Ошибка API',
                message: 'Не удалось подключиться к API CDEK',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 часа назад
                read: true,
                action: {
                    type: 'settings',
                    target: 'api'
                }
            }
        ];
    }

    showNotificationsPanel() {
        const panelHTML = this.createNotificationsPanel();
        const panel = document.createElement('div');
        panel.className = 'notifications-panel active';
        panel.innerHTML = panelHTML;

        document.body.appendChild(panel);

        // Анимация появления
        setTimeout(() => {
            panel.classList.add('show');
        }, 10);
    }

    createNotificationsPanel() {
        return `
            <div class="notifications-backdrop"></div>
            <div class="notifications-content">
                <div class="notifications-header">
                    <h3>Уведомления</h3>
                    <div class="notifications-actions">
                        <button class="btn btn-sm btn-outline mark-all-read">
                            <i class="fas fa-check-double"></i> Прочитать все
                        </button>
                        <button class="btn btn-sm btn-outline clear-all">
                            <i class="fas fa-trash"></i> Очистить
                        </button>
                        <button class="btn btn-sm btn-icon close-notifications">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="notifications-list">
                    ${this.notifications.length > 0 ? 
                        this.notifications.map(notification => this.createNotificationItem(notification)).join('') :
                        this.getEmptyNotificationsState()
                    }
                </div>
                
                <div class="notifications-footer">
                    <div class="notifications-stats">
                        ${this.unreadCount > 0 ? 
                            `<span class="unread-count">${this.unreadCount} непрочитанных</span>` :
                            '<span>Все уведомления прочитаны</span>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    createNotificationItem(notification) {
        const timeAgo = this.getTimeAgo(notification.timestamp);
        
        return `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-notification-id="${notification.id}">
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-meta">
                        <span class="notification-time">${timeAgo}</span>
                        ${notification.action ? `
                            <button class="notification-action btn-link" data-action="${notification.action.type}">
                                ${this.getActionText(notification.action.type)}
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="notification-actions">
                    ${!notification.read ? `
                        <button class="notification-mark-read btn btn-sm btn-icon" data-notification-id="${notification.id}" 
                                title="Отметить как прочитанное">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="notification-delete btn btn-sm btn-icon" data-notification-id="${notification.id}" 
                            title="Удалить уведомление">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'fa-info-circle',
            'success': 'fa-check-circle',
            'warning': 'fa-exclamation-triangle',
            'error': 'fa-exclamation-circle'
        };
        return icons[type] || 'fa-bell';
    }

    getActionText(actionType) {
        const actions = {
            'navigate': 'Перейти',
            'settings': 'Настройки',
            'retry': 'Повторить'
        };
        return actions[actionType] || 'Действие';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);
        
        if (diffInSeconds < 60) {
            return 'только что';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} ${this.pluralize(minutes, 'минуту', 'минуты', 'минут')} назад`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ${this.pluralize(hours, 'час', 'часа', 'часов')} назад`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} ${this.pluralize(days, 'день', 'дня', 'дней')} назад`;
        }
    }

    pluralize(number, one, two, five) {
        let n = Math.abs(number);
        n %= 100;
        if (n >= 5 && n <= 20) {
            return five;
        }
        n %= 10;
        if (n === 1) {
            return one;
        }
        if (n >= 2 && n <= 4) {
            return two;
        }
        return five;
    }

    getEmptyNotificationsState() {
        return `
            <div class="empty-notifications">
                <i class="fas fa-bell-slash"></i>
                <h4>Нет уведомлений</h4>
                <p>Здесь будут появляться важные уведомления</p>
            </div>
        `;
    }

    hideNotificationsPanel() {
        const panel = document.querySelector('.notifications-panel');
        if (panel) {
            panel.classList.remove('show');
            setTimeout(() => {
                panel.remove();
            }, 300);
        }
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
            notification.read = true;
            this.saveNotifications();
            this.updateUnreadCount();
            this.updateBadge();
            this.refreshNotificationsPanel();
            
            this.app.showNotification('Уведомление отмечено как прочитанное', 'success');
        }
    }

    markAllAsRead() {
        let updated = false;
        this.notifications.forEach(notification => {
            if (!notification.read) {
                notification.read = true;
                updated = true;
            }
        });

        if (updated) {
            this.saveNotifications();
            this.updateUnreadCount();
            this.updateBadge();
            this.refreshNotificationsPanel();
            this.app.showNotification('Все уведомления прочитаны', 'success');
        }
    }

    deleteNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.saveNotifications();
        this.updateUnreadCount();
        this.updateBadge();
        this.refreshNotificationsPanel();
        this.app.showNotification('Уведомление удалено', 'success');
    }

    clearAllNotifications() {
        if (this.notifications.length === 0) return;
        
        this.notifications = [];
        this.saveNotifications();
        this.updateUnreadCount();
        this.updateBadge();
        this.refreshNotificationsPanel();
        this.app.showNotification('Все уведомления удалены', 'success');
    }

    handleNotificationAction(actionType) {
        switch (actionType) {
            case 'navigate':
                this.app.showSection('orders');
                break;
            case 'settings':
                this.app.showSection('settings');
                break;
            case 'retry':
                this.app.manualSync();
                break;
        }
        this.hideNotificationsPanel();
    }

    refreshNotificationsPanel() {
        const panel = document.querySelector('.notifications-panel');
        if (panel) {
            this.hideNotificationsPanel();
            this.showNotificationsPanel();
        }
    }

    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
    }

    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount.toString();
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    }

    saveNotifications() {
        try {
            localStorage.setItem('texno_edem_notifications', JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Ошибка сохранения уведомлений:', error);
        }
    }

    addNotification(notification) {
        const newNotification = {
            id: 'notif-' + Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };

        this.notifications.unshift(newNotification);
        
        // Ограничиваем количество уведомлений
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }

        this.saveNotifications();
        this.updateUnreadCount();
        this.updateBadge();

        // Показываем toast уведомление
        this.showToastNotification(newNotification);

        return newNotification.id;
    }

    showToastNotification(notification) {
        const toast = document.createElement('div');
        toast.className = `notification-toast notification-${notification.type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(toast);

        // Анимация появления
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Автоматическое скрытие
        const autoHide = setTimeout(() => {
            this.hideToast(toast);
        }, 5000);

        // Обработчики событий
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(autoHide);
            this.hideToast(toast);
        });

        toast.addEventListener('click', (e) => {
            if (!e.target.closest('.toast-close')) {
                this.hideToast(toast);
                if (notification.action) {
                    this.handleNotificationAction(notification.action.type);
                }
            }
        });
    }

    hideToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    startRealTimeUpdates() {
        // Имитация реальных уведомлений для демонстрации
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance
                this.generateRandomNotification();
            }
        }, 60000); // Каждую минуту
    }

    generateRandomNotification() {
        const types = ['info', 'warning', 'success'];
        const messages = [
            {
                type: 'info',
                title: 'Новый заказ',
                message: 'Поступил новый заказ с CDEK'
            },
            {
                type: 'warning',
                title: 'Проблема с доставкой',
                message: 'Задержка доставки по заказу CDEK-1234'
            },
            {
                type: 'success',
                title: 'Доставка завершена',
                message: 'Заказ MEGA-5678 успешно доставлен'
            }
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.addNotification(randomMessage);
    }
}
