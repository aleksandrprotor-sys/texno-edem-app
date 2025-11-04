// js/components/notifications.js
class NotificationsComponent {
    constructor(app) {
        this.app = app;
        this.notifications = [];
        this.isPanelOpen = false;
        this.init();
    }

    init() {
        this.createNotificationsContainer();
        this.loadStoredNotifications();
        this.setupEventListeners();
        console.log('✅ NotificationsComponent инициализирован');
    }

    createNotificationsContainer() {
        // Контейнер для панели уведомлений
        let panel = document.getElementById('notifications-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'notifications-panel';
            panel.className = 'notifications-panel';
            panel.innerHTML = this.getPanelHTML();
            document.body.appendChild(panel);
        }
        this.panel = panel;

        // Контейнер для toast уведомлений
        let container = document.getElementById('notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
        this.container = container;
    }

    getPanelHTML() {
        return `
            <div class="notifications-backdrop" onclick="app.components.notifications.hideNotificationsPanel()"></div>
            <div class="notifications-content">
                <div class="notifications-header">
                    <h3>Уведомления</h3>
                    <div class="notifications-actions">
                        <button class="btn btn-sm btn-outline" onclick="app.components.notifications.markAllAsRead()">
                            <i class="fas fa-check-double"></i> Прочитать все
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="app.components.notifications.clearAll()">
                            <i class="fas fa-trash"></i> Очистить
                        </button>
                        <button class="btn btn-icon" onclick="app.components.notifications.hideNotificationsPanel()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="notifications-list" id="notifications-list">
                    <!-- Уведомления загружаются здесь -->
                </div>
                <div class="notifications-footer">
                    <div class="notifications-stats">
                        <span class="unread-count" id="unread-count">0 непрочитанных</span>
                    </div>
                </div>
            </div>
        `;
    }

    addNotification(notification) {
        const newNotification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: notification.type || 'info',
            title: notification.title || 'Уведомление',
            message: notification.message,
            timestamp: new Date().toISOString(),
            read: false,
            data: notification.data || {}
        };

        this.notifications.unshift(newNotification); // Добавляем в начало
        this.limitNotifications();
        this.saveNotifications();
        this.updateUI();
        
        // Показываем toast уведомление
        this.showToastNotification(newNotification);
        
        // Обновляем бейдж
        this.updateNotificationBadge();
        
        // Вибрация если включена
        if (this.app.config.notifications.vibration && 'vibrate' in navigator) {
            navigator.vibrate(100);
        }

        return newNotification.id;
    }

    showToastNotification(notification) {
        if (!this.app.config.notifications.enabled) return;

        const toast = document.createElement('div');
        toast.className = `notification-toast notification-${notification.type} show`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.appendChild(toast);

        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'fa-info-circle',
            'success': 'fa-check-circle',
            'warning': 'fa-exclamation-triangle',
            'error': 'fa-exclamation-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    showNotificationsPanel() {
        this.panel.classList.add('show');
        this.isPanelOpen = true;
        this.updateNotificationsList();
        document.body.style.overflow = 'hidden';
    }

    hideNotificationsPanel() {
        this.panel.classList.remove('show');
        this.isPanelOpen = false;
        document.body.style.overflow = '';
    }

    updateNotificationsList() {
        const list = document.getElementById('notifications-list');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <h4>Нет уведомлений</h4>
                    <p>Здесь будут появляться ваши уведомления</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.notifications.map(notif => `
            <div class="notification-item ${notif.read ? 'read' : 'unread'}" 
                 onclick="app.components.notifications.handleNotificationClick('${notif.id}')">
                <div class="notification-icon notification-${notif.type}">
                    <i class="fas ${this.getNotificationIcon(notif.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-meta">
                        <span class="notification-time">${this.formatTime(notif.timestamp)}</span>
                        ${notif.data.platform ? `
                            <span class="notification-platform">${notif.data.platform}</span>
                        ` : ''}
                    </div>
                </div>
                <div class="notification-actions">
                    ${!notif.read ? `
                        <button class="btn btn-icon btn-sm" onclick="event.stopPropagation(); app.components.notifications.markAsRead('${notif.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-icon btn-sm" onclick="event.stopPropagation(); app.components.notifications.removeNotification('${notif.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    handleNotificationClick(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
            this.markAsRead(notificationId);
        }

        // Обработка действий на основе типа уведомления
        this.handleNotificationAction(notification);
    }

    handleNotificationAction(notification) {
        if (!notification || !notification.data) return;

        const { action, orderId, platform } = notification.data;

        switch (action) {
            case 'show_order':
                if (orderId) {
                    this.app.showOrderDetails(orderId);
                    this.hideNotificationsPanel();
                }
                break;
            case 'show_platform':
                if (platform) {
                    this.app.showSection('orders', platform);
                    this.hideNotificationsPanel();
                }
                break;
            case 'sync_complete':
                this.app.manualSync();
                break;
        }
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.updateUI();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.saveNotifications();
        this.updateUI();
        this.app.showNotification('Все уведомления прочитаны', 'success');
    }

    removeNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.saveNotifications();
        this.updateUI();
    }

    clearAll() {
        if (this.notifications.length === 0) return;
        
        this.notifications = [];
        this.saveNotifications();
        this.updateUI();
        this.app.showNotification('Все уведомления удалены', 'info');
    }

    updateUI() {
        this.updateNotificationsList();
        this.updateUnreadCount();
        this.updateNotificationBadge();
    }

    updateUnreadCount() {
        const unreadCount = this.getUnreadCount();
        const element = document.getElementById('unread-count');
        if (element) {
            element.textContent = `${unreadCount} непрочитанных`;
        }
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        const unreadCount = this.getUnreadCount();
        
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount.toString();
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    limitNotifications() {
        // Ограничиваем количество уведомлений (последние 100)
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(0, 100);
        }
    }

    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        if (diff < 60000) { // Меньше минуты
            return 'только что';
        } else if (diff < 3600000) { // Меньше часа
            const minutes = Math.floor(diff / 60000);
            return `${minutes} мин назад`;
        } else if (diff < 86400000) { // Меньше суток
            const hours = Math.floor(diff / 3600000);
            return `${hours} ч назад`;
        } else {
            return time.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short'
            });
        }
    }

    loadStoredNotifications() {
        try {
            const stored = localStorage.getItem('texno_edem_notifications');
            if (stored) {
                this.notifications = JSON.parse(stored);
                // Удаляем старые уведомления (старше 7 дней)
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                this.notifications = this.notifications.filter(n => 
                    new Date(n.timestamp) > weekAgo
                );
                this.saveNotifications();
            }
        } catch (error) {
            console.error('Ошибка загрузки уведомлений:', error);
            this.notifications = [];
        }
    }

    saveNotifications() {
        try {
            localStorage.setItem('texno_edem_notifications', JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Ошибка сохранения уведомлений:', error);
        }
    }

    setupEventListeners() {
        // Глобальные горячие клавиши
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.showNotificationsPanel();
            }
        });

        // Обработка видимости страницы
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.getUnreadCount() > 0) {
                this.updateNotificationBadge();
            }
        });
    }

    // СИСТЕМНЫЕ УВЕДОМЛЕНИЯ
    addSystemNotification(message, type = 'info', data = {}) {
        return this.addNotification({
            type: type,
            title: 'Системное уведомление',
            message: message,
            data: data
        });
    }

    addOrderNotification(order, action, message) {
        return this.addNotification({
            type: 'info',
            title: `Заказ ${order.orderNumber}`,
            message: message,
            data: {
                action: 'show_order',
                orderId: order.id,
                platform: order.platform
            }
        });
    }

    addSyncNotification(message, type = 'info') {
        return this.addNotification({
            type: type,
            title: 'Синхронизация',
            message: message,
            data: {
                action: 'sync_complete'
            }
        });
    }

    // ОЧИСТКА
    cleanup() {
        this.hideNotificationsPanel();
        // Очищаем старые уведомления
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        this.notifications = this.notifications.filter(n => 
            new Date(n.timestamp) > monthAgo
        );
        this.saveNotifications();
        this.updateUI();
    }
}
