class TexnoEdemApp {
    constructor() {
        this.currentPage = 'products';
        this.init();
    }

    init() {
        console.log('Telegram Mini App инициализирован');
        this.setupTelegramApp();
        this.setupEventListeners();
        this.showProducts(); // Загружаем начальную страницу
    }

    setupTelegramApp() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            // Установка цветов
            Telegram.WebApp.setHeaderColor('#2ea6ff');
            Telegram.WebApp.setBackgroundColor('#f3f4f6');
        }
    }

    setupEventListeners() {
        // Обработчики для навигации
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link')) {
                e.preventDefault();
                const page = e.target.getAttribute('href').substring(1);
                this.navigateTo(page);
            }
        });
    }

    navigateTo(page) {
        this.currentPage = page;
        
        // Скрываем все страницы
        document.querySelectorAll('.page').forEach(p => {
            p.style.display = 'none';
        });
        
        // Показываем нужную страницу
        const targetPage = document.getElementById(page);
        if (targetPage) {
            targetPage.style.display = 'block';
            
            // Загружаем контент для страницы
            switch(page) {
                case 'products':
                    this.loadProducts();
                    break;
                case 'orders':
                    this.loadOrders();
                    break;
                case 'settings':
                    this.loadSettings();
                    break;
            }
        }
    }

    loadProducts() {
        const container = document.getElementById('products-container');
        if (!container) {
            console.error('Контейнер продуктов не найден');
            return;
        }
        
        container.innerHTML = '<p>Загрузка товаров...</p>';
        // Ваша логика загрузки товаров
    }

    loadOrders() {
        const container = document.getElementById('orders-container');
        if (container) {
            container.innerHTML = '<p>Загрузка заказов...</p>';
            // Ваша логика загрузки заказов
        }
    }

    loadSettings() {
        const container = document.getElementById('settings-container');
        if (container) {
            container.innerHTML = '<p>Загрузка настроек...</p>';
            // Ваша логика загрузки настроек
        }
    }
}

// Глобальная инициализация
let app;

document.addEventListener('DOMContentLoaded', function() {
    app = new TexnoEdemApp();
    window.app = app; // Делаем глобально доступным
});

// Обработчик ошибок
window.addEventListener('error', function(e) {
    console.error('Ошибка приложения:', e.error);
});
