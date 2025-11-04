// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;

// Основной класс приложения
class TexnoEdemApp {
    constructor() {
        this.init();
        this.loadProducts();
    }

    init() {
        // Инициализируем Telegram WebApp
        tg.expand();
        tg.enableClosingConfirmation();
        tg.BackButton.hide();
        
        // Показываем информацию о пользователе если доступна
        this.showUserInfo();
        
        // Настраиваем обработчики событий
        this.setupEventHandlers();
        
        console.log('Telegram Mini App инициализирован');
    }

    showUserInfo() {
        const userInfoEl = document.getElementById('userInfo');
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
            const userName = user.first_name || user.username || 'Пользователь';
            userInfoEl.innerHTML = `
                <div>👋 Добро пожаловать, <strong>${userName}</strong>!</div>
                <div style="font-size: 0.8em; margin-top: 5px;">Рады видеть вас в нашем магазине!</div>
            `;
            userInfoEl.style.display = 'block';
        }
    }

    setupEventHandlers() {
        // Обработчик для кнопки назад в Telegram
        tg.onEvent('backButtonClicked', () => {
            this.handleBackButton();
        });
    }

    handleBackButton() {
        // Здесь можно добавить логику навигации назад
        tg.close();
    }

    loadProducts() {
        const productsGrid = document.getElementById('productsGrid');
        
        // Пример данных товаров
        const products = [
            {
                id: 1,
                name: 'iPhone 15 Pro',
                price: '99 999 ₽',
                category: 'smartphones',
                icon: '📱'
            },
            {
                id: 2,
                name: 'Samsung Galaxy S24',
                price: '79 999 ₽',
                category: 'smartphones',
                icon: '📱'
            },
            {
                id: 3,
                name: 'MacBook Air M2',
                price: '129 999 ₽',
                category: 'laptops',
                icon: '💻'
            },
            {
                id: 4,
                name: 'iPad Pro',
                price: '89 999 ₽',
                category: 'tablets',
                icon: '📟'
            },
            {
                id: 5,
                name: 'AirPods Pro',
                price: '24 999 ₽',
                category: 'accessories',
                icon: '🎧'
            },
            {
                id: 6,
                name: 'Samsung Tablet',
                price: '45 999 ₽',
                category: 'tablets',
                icon: '📟'
            }
        ];

        // Очищаем сетку товаров
        productsGrid.innerHTML = '';

        // Добавляем товары в сетку
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    ${product.icon}
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price}</div>
            `;
            
            productCard.addEventListener('click', () => {
                this.showProductDetails(product);
            });
            
            productsGrid.appendChild(productCard);
        });
    }

    showProductDetails(product) {
        // Показываем детали товара
        tg.showPopup({
            title: product.name,
            message: `Цена: ${product.price}\n\nХарактеристики:\n• Высокое качество\n• Гарантия 1 год\n• Быстрая доставка`,
            buttons: [
                {id: 'buy', type: 'default', text: '🛒 Купить'},
                {id: 'cancel', type: 'cancel', text: 'Отмена'}
            ]
        }, (buttonId) => {
            if (buttonId === 'buy') {
                this.buyProduct(product);
            }
        });
    }

    buyProduct(product) {
        // Здесь можно интегрировать с платежной системой Telegram
        tg.showAlert(`Вы выбрали: ${product.name}\nЦена: ${product.price}\n\nДля завершения покупки свяжитесь с нашим менеджером.`);
        
        // Можно отправить данные в бота
        if (tg.sendData) {
            const orderData = {
                product: product.name,
                price: product.price,
                userId: tg.initDataUnsafe?.user?.id
            };
            tg.sendData(JSON.stringify(orderData));
        }
    }

    showCategory(category) {
        const categoryNames = {
            'smartphones': 'Смартфоны',
            'laptops': 'Ноутбуки',
            'tablets': 'Планшеты',
            'accessories': 'Аксессуары'
        };

        tg.showAlert(`Раздел "${categoryNames[category]}"\n\nВ этом разделе представлены все товары категории "${categoryNames[category]}". Функциональность находится в разработке.`);
    }
}

// Инициализация приложения когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    new TexnoEdemApp();
});

// Обработка ошибок
window.addEventListener('error', (event) => {
    console.error('Ошибка приложения:', event.error);
});

// Экспорт для глобального доступа
window.TexnoEdemApp = TexnoEdemApp;
