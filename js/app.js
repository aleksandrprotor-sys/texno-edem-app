// app.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
class TexnoEdemApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        console.log('TEXNO EDEM App инициализирован');
        
        // Инициализация Telegram WebApp если доступен
        if (window.Telegram && Telegram.WebApp) {
            this.initTelegram();
        }
        
        this.setupEventListeners();
        this.loadDashboardData();
    }

    initTelegram() {
        const tg = window.Telegram.WebApp;
        tg.expand();
        
        // Показываем информацию о пользователе если доступна
        this.showUserInfo();
        
        // Настраиваем обработчики событий Telegram
        tg.onEvent('backButtonClicked', () => {
            this.handleBackButton();
        });
    }

    showUserInfo() {
        const tg = window.Telegram?.WebApp;
        if (!tg) return;

        const user = tg.initDataUnsafe?.user;
        if (user) {
            console.log('Пользователь Telegram:', user);
            // Можно добавить отображение информации о пользователе
        }
    }

    handleBackButton() {
        // Логика навигации назад
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.close();
        }
    }

    setupEventListeners() {
        // Обработчики навигации
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                const section = navItem.getAttribute('onclick')?.match(/showSection\('([^']+)'/)?.[1];
                if (section) {
                    this.showSection(section);
                }
            }
        });

        // Обработчики для виджетов платформ
        document.querySelectorAll('.widget').forEach(widget => {
            widget.addEventListener('click', () => {
                const platform = widget.classList.contains('cdek-widget') ? 'cdek' : 'megamarket';
                this.showSection('orders', platform);
            });
        });
    }

    showSection(section, platform = null) {
        // Скрываем все секции
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Убираем активный класс у всех пунктов навигации
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Показываем выбранную секцию
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Активируем соответствующий пункт навигации
            const navItem = document.querySelector(`.nav-item[onclick*="showSection('${section}')"]`);
            if (navItem) {
                navItem.classList.add('active');
            }

            // Загружаем данные для секции
            this.loadSectionData(section, platform);
        }

        this.currentSection = section;
    }

    loadSectionData(section, platform = null) {
        switch(section) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'orders':
                this.loadOrdersData(platform);
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
            case 'settings':
                this.loadSettingsData();
                break;
        }
    }

    loadDashboardData() {
        console.log('Загрузка данных дашборда...');
        
        // Обновляем быструю статистику
        this.updateQuickStats({
            totalOrders: 156,
            totalRevenue: 2450000,
            successRate: 94,
            problemOrders: 8
        });

        // Обновляем виджеты платформ
        this.updatePlatformWidgets({
            cdek: { active: 23 },
            megamarket: { new: 12 }
        });

        // Загружаем последние заказы
        this.loadRecentOrders();
    }

    updateQuickStats(stats) {
        const elements = {
            'total-orders': stats.totalOrders,
            'total-revenue': this.formatCurrency(stats.totalRevenue),
            'success-rate': `${stats.successRate}%`,
            'problem-orders': stats.problemOrders
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    updatePlatformWidgets(platforms) {
        const cdekElement = document.getElementById('cdek-active');
        const megamarketElement = document.getElementById('megamarket-new');
        
        if (cdekElement) cdekElement.textContent = platforms.cdek.active;
        if (megamarketElement) megamarketElement.textContent = platforms.megamarket.new;
    }

    loadRecentOrders() {
        const container = document.getElementById('recent-orders-list');
        if (!container) return;

        // Заглушка с mock данными
        const mockOrders = [
            {
                platform: 'cdek',
                id: 'CDEK-1234',
                title: 'Доставка в Москву',
                description: 'Электроника - 3 товара',
                status: 'active',
                amount: '15 240 ₽',
                time: '2 часа назад'
            },
            {
                platform: 'megamarket',
                id: 'MEGA-5678',
                title: 'Новый заказ',
                description: 'Смартфоны - 2 шт',
                status: 'new',
                amount: '89 999 ₽',
                time: '5 минут назад'
            }
        ];

        container.innerHTML = mockOrders.map(order => `
            <div class="activity-item" onclick="app.showSection('orders')">
                <div class="activity-icon platform-${order.platform}">
                    <i class="fas ${order.platform === 'cdek' ? 'fa-shipping-fast' : 'fa-store'}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${order.title}</div>
                    <div class="activity-description">${order.description}</div>
                    <div class="activity-meta">
                        <span class="activity-time">${order.time}</span>
                        <span class="activity-platform">${order.platform.toUpperCase()}</span>
                        <span class="activity-status status-${order.status}">${this.getStatusText(order.status)}</span>
                    </div>
                </div>
                <div class="activity-amount">${order.amount}</div>
            </div>
        `).join('');

        // Добавляем пустое состояние если нет заказов
        if (mockOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-activity">
                    <i class="fas fa-inbox"></i>
                    <h3>Нет recent заказов</h3>
                    <p>Здесь будут отображаться последние заказы</p>
                </div>
            `;
        }
    }

    getStatusText(status) {
        const statusMap = {
            'new': 'Новый',
            'active': 'Активный',
            'processing': 'В обработке',
            'delivered': 'Доставлен',
            'problem': 'Проблема'
        };
        return statusMap[status] || status;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
        }).format(amount);
    }

    loadOrdersData(platform = null) {
        console.log('Загрузка заказов для платформы:', platform);
        // Здесь будет загрузка реальных данных
        this.showNotification('Загрузка заказов...', 'info');
    }

    loadAnalyticsData() {
        console.log('Загрузка аналитики...');
        this.showNotification('Загрузка аналитики...', 'info');
    }

    loadSettingsData() {
        console.log('Загрузка настроек...');
        this.showNotification('Загрузка настроек...', 'info');
    }

    manualSync() {
        this.showNotification('Синхронизация данных...', 'info');
        
        // Имитация синхронизации
        setTimeout(() => {
            this.showNotification('Данные успешно обновлены', 'success');
            this.loadDashboardData(); // Перезагружаем данные
        }, 2000);
    }

    showNotification(message, type = 'info') {
        console.log(`Уведомление [${type}]: ${message}`);
        // Можно добавить красивый toast вместо alert
        if (type === 'error') {
            alert(`Ошибка: ${message}`);
        }
    }

    toggleTheme() {
        const icon = document.getElementById('theme-icon');
        const isDark = document.body.classList.toggle('dark-theme');
        
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        this.showNotification(isDark ? 'Темная тема включена' : 'Светлая тема включена', 'success');
    }

    showNotifications() {
        this.showNotification('Уведомления: Нет новых уведомлений', 'info');
    }
}

// Глобальная инициализация приложения
let app;

document.addEventListener('DOMContentLoaded', function() {
    app = new TexnoEdemApp();
    window.app = app; // Делаем глобально доступным
    
    // Показываем дашборд по умолчанию
    app.showSection('dashboard');
});

// Глобальный обработчик ошибок
window.addEventListener('error', function(e) {
    console.error('Ошибка приложения:', e.error);
    if (app) {
        app.showNotification('Произошла ошибка приложения', 'error');
    }
});
