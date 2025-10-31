// Mock данные для разработки TEXNO EDEM

class MockDataGenerator {
    constructor() {
        this.cities = [
            'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань',
            'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону',
            'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 'Волгоград'
        ];

        this.names = [
            'Иван Иванов', 'Мария Петрова', 'Алексей Смирнов', 'Елена Козлова',
            'Дмитрий Попов', 'Ольга Новикова', 'Сергей Кузнецов', 'Наталья Морозова',
            'Андрей Васильев', 'Татьяна Павлова', 'Михаил Семенов', 'Анна Голубева',
            'Владимир Виноградов', 'Екатерина Богданова', 'Павел Воробьев'
        ];

        this.products = [
            { name: 'Смартфон Samsung Galaxy S21', price: 15670, category: 'Смартфоны', brand: 'Samsung' },
            { name: 'Наушники Sony WH-1000XM4', price: 8920, category: 'Аудиотехника', brand: 'Sony' },
            { name: 'Ноутбук ASUS VivoBook 15', price: 23950, category: 'Ноутбуки', brand: 'ASUS' },
            { name: 'Телевизор LG 55NANO866', price: 45680, category: 'Телевизоры', brand: 'LG' },
            { name: 'Кофемашина DeLonghi Magnifica', price: 32490, category: 'Бытовая техника', brand: 'DeLonghi' },
            { name: 'Фитнес-браслет Xiaomi Mi Band 6', price: 2890, category: 'Гаджеты', brand: 'Xiaomi' },
            { name: 'Игровая консоль PlayStation 5', price: 45990, category: 'Игровые консоли', brand: 'Sony' },
            { name: 'Фотокамера Canon EOS R6', price: 156990, category: 'Фототехника', brand: 'Canon' }
        ];
    }

    // Генерация случайного числа в диапазоне
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Генерация случайной даты
    randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    // Генерация случайного элемента из массива
    randomElement(array) {
        return array[this.randomInt(0, array.length - 1)];
    }

    // Генерация трек номера CDEK
    generateTrackingNumber() {
        const prefix = 'CDEK';
        const numbers = Array.from({ length: 10 }, () => this.randomInt(0, 9)).join('');
        return prefix + numbers;
    }

    // Генерация номера заказа Мегамаркет
    generateOrderNumber() {
        const prefix = 'MM';
        const numbers = Array.from({ length: 8 }, () => this.randomInt(0, 9)).join('');
        return prefix + numbers;
    }

    // Генерация mock заказов CDEK
    generateCDEKOrders(count = 10) {
        const orders = [];
        const statuses = ['new', 'processing', 'active', 'delivered', 'problem', 'cancelled'];
        const statusCodes = ['CREATED', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'PROBLEM', 'CANCELLED'];

        for (let i = 0; i < count; i++) {
            const statusIndex = this.randomInt(0, statuses.length - 1);
            const status = statuses[statusIndex];
            const statusCode = statusCodes[statusIndex];

            const fromCity = this.randomElement(this.cities);
            let toCity;
            do {
                toCity = this.randomElement(this.cities);
            } while (toCity === fromCity);

            const order = {
                id: `cdek-${Date.now()}-${i}`,
                platform: 'cdek',
                trackingNumber: this.generateTrackingNumber(),
                status: status,
                statusCode: statusCode,
                fromCity: fromCity,
                toCity: toCity,
                weight: this.randomInt(1, 50) / 10, // 0.1 - 5.0 кг
                cost: this.randomInt(300, 5000),
                sender: `ООО "ТЕХНО ЭДЕМ"`,
                recipient: this.randomElement(this.names),
                createdDate: this.randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()).toISOString(),
                estimatedDelivery: status === 'delivered' ? null : 
                    this.randomDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
                deliveredDate: status === 'delivered' ? 
                    this.randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()).toISOString() : null,
                packages: [
                    {
                        number: `PKG${this.randomInt(1000, 9999)}`,
                        weight: this.randomInt(100, 5000),
                        length: this.randomInt(10, 50),
                        width: this.randomInt(10, 40),
                        height: this.randomInt(5, 30)
                    }
                ],
                services: this.randomInt(0, 1) ? ['INSURANCE'] : [],
                insurance: this.randomInt(0, 1) ? this.randomInt(1000, 10000) : 0,
                payment: {
                    method: this.randomElement(['CASH', 'CARD']),
                    status: this.randomElement(['PAID', 'PENDING'])
                }
            };

            orders.push(order);
        }

        return orders;
    }

    // Генерация mock заказов Мегамаркет
    generateMegamarketOrders(count = 10) {
        const orders = [];
        const statuses = ['new', 'processing', 'shipped', 'delivered', 'cancelled'];
        const statusCodes = ['NEW', 'PACKAGING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

        for (let i = 0; i < count; i++) {
            const statusIndex = this.randomInt(0, statuses.length - 1);
            const status = statuses[statusIndex];
            const statusCode = statusCodes[statusIndex];

            const itemsCount = this.randomInt(1, 3);
            const items = [];
            let totalAmount = 0;

            for (let j = 0; j < itemsCount; j++) {
                const product = this.randomElement(this.products);
                const quantity = this.randomInt(1, 2);
                const itemTotal = product.price * quantity;
                
                items.push({
                    id: `item-${i}-${j}`,
                    sku: `SKU${this.randomInt(10000, 99999)}`,
                    name: product.name,
                    quantity: quantity,
                    price: product.price,
                    total: itemTotal,
                    weight: this.randomInt(100, 2000),
                    category: product.category,
                    brand: product.brand
                });

                totalAmount += itemTotal;
            }

            const discount = this.randomInt(0, 1) ? this.randomInt(100, 1000) : 0;
            const deliveryCost = this.randomInt(0, 1) ? 0 : this.randomInt(200, 500);

            const order = {
                id: `mm-${Date.now()}-${i}`,
                platform: 'megamarket',
                orderNumber: this.generateOrderNumber(),
                status: status,
                statusCode: statusCode,
                totalAmount: totalAmount - discount + deliveryCost,
                itemsTotal: totalAmount,
                deliveryCost: deliveryCost,
                discount: discount,
                customerName: this.randomElement(this.names),
                customerPhone: `+7 9${this.randomInt(10, 99)} ${this.randomInt(100, 999)}-${this.randomInt(10, 99)}-${this.randomInt(10, 99)}`,
                deliveryAddress: `г. ${this.randomElement(this.cities)}, ул. ${this.randomElement(['Ленина', 'Пушкина', 'Гагарина', 'Советская'])}, д. ${this.randomInt(1, 100)}`,
                deliveryType: this.randomElement(['COURIER', 'PICKUP']),
                createdDate: this.randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()).toISOString(),
                updatedDate: this.randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()).toISOString(),
                items: items,
                payment: {
                    method: this.randomElement(['CARD', 'CASH_ON_DELIVERY']),
                    status: 'PAID',
                    paidAt: this.randomDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), new Date()).toISOString()
                },
                delivery: {
                    type: this.randomElement(['COURIER', 'PICKUP']),
                    cost: deliveryCost,
                    date: status === 'delivered' ? 
                        this.randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()).toISOString().split('T')[0] : null
                }
            };

            orders.push(order);
        }

        return orders;
    }

    // Генерация аналитических данных
    generateAnalyticsData() {
        const platforms = ['cdek', 'megamarket'];
        const timeRanges = ['today', 'yesterday', 'week', 'month', 'quarter', 'year'];
        
        const analytics = {
            overview: {
                totalOrders: this.randomInt(1000, 5000),
                totalRevenue: this.randomInt(500000, 2000000),
                averageOrderValue: this.randomInt(1500, 5000),
                deliverySuccessRate: this.randomInt(85, 98),
                ordersChange: this.randomInt(-10, 20),
                revenueChange: this.randomInt(-5, 25),
                avgOrderChange: this.randomInt(-3, 8),
                successRateChange: this.randomInt(-2, 5)
            },
            platformComparison: {
                cdek: {
                    orders: this.randomInt(500, 2000),
                    revenue: this.randomInt(200000, 1000000),
                    deliveryTime: this.randomInt(2, 7),
                    successRate: this.randomInt(88, 96)
                },
                megamarket: {
                    orders: this.randomInt(500, 2000),
                    revenue: this.randomInt(300000, 1200000),
                    deliveryTime: this.randomInt(1, 3),
                    successRate: this.randomInt(92, 98)
                }
            },
            trends: {
                daily: Array.from({ length: 30 }, (_, i) => ({
                    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    cdek: this.randomInt(10, 50),
                    megamarket: this.randomInt(15, 60),
                    total: this.randomInt(25, 110)
                })),
                weekly: Array.from({ length: 12 }, (_, i) => ({
                    week: i + 1,
                    cdek: this.randomInt(80, 300),
                    megamarket: this.randomInt(100, 350),
                    total: this.randomInt(180, 650)
                }))
            }
        };

        return analytics;
    }

    // Генерация данных для графиков
    generateChartData(type = 'sales', period = 'week') {
        const data = {
            labels: [],
            datasets: []
        };

        switch (period) {
            case 'week':
                data.labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
                break;
            case 'month':
                data.labels = Array.from({ length: 30 }, (_, i) => (i + 1).toString());
                break;
            case 'quarter':
                data.labels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'];
                break;
        }

        if (type === 'sales') {
            data.datasets = [
                {
                    label: 'CDEK',
                    data: data.labels.map(() => this.randomInt(10000, 50000)),
                    borderColor: 'var(--cdek-primary)',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Мегамаркет',
                    data: data.labels.map(() => this.randomInt(15000, 60000)),
                    borderColor: 'var(--megamarket-primary)',
                    backgroundColor: 'rgba(41, 128, 185, 0.1)',
                    tension: 0.4
                }
            ];
        } else if (type === 'orders') {
            data.datasets = [
                {
                    label: 'CDEK',
                    data: data.labels.map(() => this.randomInt(10, 50)),
                    borderColor: 'var(--cdek-primary)',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Мегамаркет',
                    data: data.labels.map(() => this.randomInt(15, 60)),
                    borderColor: 'var(--megamarket-primary)',
                    backgroundColor: 'rgba(41, 128, 185, 0.1)',
                    tension: 0.4
                }
            ];
        }

        return data;
    }
}

// Создаем глобальный экземпляр генератора
const mockDataGenerator = new MockDataGenerator();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MockDataGenerator, mockDataGenerator };
}
