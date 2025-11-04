// Enhanced Mock Data Generator for TEXNO EDEM

class MockDataGenerator {
    constructor() {
        this.platforms = ['cdek', 'megamarket'];
        this.statuses = {
            cdek: ['CREATED', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'PROBLEM', 'CANCELLED'],
            megamarket: ['NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PROBLEM']
        };
        
        this.cities = [
            'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань',
            'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону'
        ];
        
        this.products = [
            'Смартфон', 'Ноутбук', 'Планшет', 'Наушники', 'Умные часы',
            'Фитнес-браслет', 'Внешний аккумулятор', 'Кабель USB-C', 'Чехол', 'Защитное стекло'
        ];
    }

    generateCDEKOrders(count = 10) {
        const orders = [];
        const baseDate = new Date();
        
        for (let i = 0; i < count; i++) {
            const orderDate = new Date(baseDate);
            orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
            
            const status = this.statuses.cdek[Math.floor(Math.random() * this.statuses.cdek.length)];
            const isDelivered = status === 'DELIVERED';
            const isProblem = status === 'PROBLEM' || status === 'CANCELLED';
            
            const order = {
                id: `CDEK-${1000 + i}`,
                platform: 'cdek',
                trackingNumber: `CDEK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                status: status.toLowerCase(),
                statusCode: status,
                createdDate: orderDate.toISOString(),
                updatedDate: new Date(orderDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                cost: Math.floor(Math.random() * 5000) + 500,
                weight: Math.floor(Math.random() * 5000) + 100,
                dimensions: {
                    length: Math.floor(Math.random() * 50) + 10,
                    width: Math.floor(Math.random() * 40) + 10,
                    height: Math.floor(Math.random() * 30) + 5
                },
                sender: {
                    city: this.cities[Math.floor(Math.random() * this.cities.length)],
                    address: `ул. Примерная, д. ${Math.floor(Math.random() * 100) + 1}`
                },
                recipient: {
                    city: this.cities[Math.floor(Math.random() * this.cities.length)],
                    address: `ул. Получательная, д. ${Math.floor(Math.random() * 100) + 1}`
                },
                delivery: {
                    estimatedDays: Math.floor(Math.random() * 10) + 2,
                    actualDays: isDelivered ? Math.floor(Math.random() * 8) + 2 : null,
                    cost: Math.floor(Math.random() * 500) + 100
                },
                isProblem: isProblem,
                isUrgent: Math.random() > 0.8,
                notes: isProblem ? 'Требуется дополнительная проверка' : ''
            };
            
            orders.push(order);
        }
        
        return orders;
    }

    generateMegamarketOrders(count = 15) {
        const orders = [];
        const baseDate = new Date();
        
        for (let i = 0; i < count; i++) {
            const orderDate = new Date(baseDate);
            orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
            
            const status = this.statuses.megamarket[Math.floor(Math.random() * this.statuses.megamarket.length)];
            const isDelivered = status === 'DELIVERED';
            const isProblem = status === 'PROBLEM' || status === 'CANCELLED';
            
            const itemsCount = Math.floor(Math.random() * 3) + 1;
            const items = [];
            let totalAmount = 0;
            
            for (let j = 0; j < itemsCount; j++) {
                const product = this.products[Math.floor(Math.random() * this.products.length)];
                const price = Math.floor(Math.random() * 50000) + 1000;
                const quantity = Math.floor(Math.random() * 2) + 1;
                
                items.push({
                    product: product,
                    price: price,
                    quantity: quantity,
                    total: price * quantity
                });
                
                totalAmount += price * quantity;
            }
            
            const order = {
                id: `MEGA-${2000 + i}`,
                platform: 'megamarket',
                orderNumber: `MM${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                status: status.toLowerCase(),
                statusCode: status,
                createdDate: orderDate.toISOString(),
                updatedDate: new Date(orderDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                totalAmount: totalAmount,
                items: items,
                customer: {
                    name: `Покупатель ${i + 1}`,
                    phone: `+7${Math.random().toString().substr(2, 10)}`,
                    email: `customer${i + 1}@example.com`
                },
                shipping: {
                    method: ['courier', 'pickup'][Math.floor(Math.random() * 2)],
                    address: `г. ${this.cities[Math.floor(Math.random() * this.cities.length)]}, ул. Доставки, д. ${Math.floor(Math.random() * 100) + 1}`,
                    cost: Math.floor(Math.random() * 500) + 100
                },
                payment: {
                    method: ['card', 'cash', 'online'][Math.floor(Math.random() * 3)],
                    status: ['paid', 'pending'][Math.floor(Math.random() * 2)]
                },
                isProblem: isProblem,
                isNew: status === 'NEW',
                notes: isProblem ? 'Проблема с оплатой' : ''
            };
            
            orders.push(order);
        }
        
        return orders;
    }

    generateAnalyticsData() {
        const baseDate = new Date();
        const months = [];
        
        // Generate last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(baseDate);
            date.setMonth(date.getMonth() - i);
            months.push(date.toISOString().substr(0, 7));
        }
        
        // Platform comparison data
        const platformComparison = {
            cdek: {
                orders: Math.floor(Math.random() * 500) + 200,
                revenue: Math.floor(Math.random() * 5000000) + 1000000,
                successRate: Math.floor(Math.random() * 20) + 80,
                deliveryTime: (Math.random() * 3 + 2).toFixed(1),
                problemRate: Math.floor(Math.random() * 10) + 5
            },
            megamarket: {
                orders: Math.floor(Math.random() * 800) + 300,
                revenue: Math.floor(Math.random() * 8000000) + 2000000,
                successRate: Math.floor(Math.random() * 15) + 85,
                deliveryTime: (Math.random() * 5 + 3).toFixed(1),
                problemRate: Math.floor(Math.random() * 8) + 2
            }
        };
        
        // Monthly trends
        const monthlyTrends = months.map(month => {
            const cdekOrders = Math.floor(Math.random() * 50) + 30;
            const megamarketOrders = Math.floor(Math.random() * 80) + 40;
            
            return {
                month: month,
                cdek: {
                    orders: cdekOrders,
                    revenue: cdekOrders * (Math.random() * 1000 + 500),
                    problems: Math.floor(cdekOrders * 0.1)
                },
                megamarket: {
                    orders: megamarketOrders,
                    revenue: megamarketOrders * (Math.random() * 2000 + 1000),
                    problems: Math.floor(megamarketOrders * 0.05)
                }
            };
        });
        
        // City distribution
        const cityDistribution = this.cities.map(city => ({
            city: city,
            cdek: Math.floor(Math.random() * 100) + 20,
            megamarket: Math.floor(Math.random() * 150) + 30
        }));
        
        // Problem analysis
        const problemAnalysis = {
            cdek: {
                delivery: Math.floor(Math.random() * 40) + 10,
                packaging: Math.floor(Math.random() * 20) + 5,
                documentation: Math.floor(Math.random() * 15) + 3,
                other: Math.floor(Math.random() * 10) + 2
            },
            megamarket: {
                payment: Math.floor(Math.random() * 50) + 15,
                product: Math.floor(Math.random() * 30) + 8,
                delivery: Math.floor(Math.random() * 25) + 5,
                other: Math.floor(Math.random() * 15) + 3
            }
        };
        
        // Performance metrics
        const performanceMetrics = {
            overall: {
                successRate: Math.floor(Math.random() * 10) + 90,
                avgDeliveryTime: (Math.random() * 2 + 3).toFixed(1),
                customerSatisfaction: Math.floor(Math.random() * 10) + 85
            },
            cdek: {
                successRate: Math.floor(Math.random() * 15) + 80,
                avgDeliveryTime: (Math.random() * 1 + 2).toFixed(1),
                costEfficiency: Math.floor(Math.random() * 20) + 70
            },
            megamarket: {
                successRate: Math.floor(Math.random() * 12) + 83,
                avgDeliveryTime: (Math.random() * 2 + 4).toFixed(1),
                revenueGrowth: Math.floor(Math.random() * 30) + 15
            }
        };
        
        return {
            platformComparison,
            monthlyTrends,
            cityDistribution,
            problemAnalysis,
            performanceMetrics,
            generatedAt: new Date().toISOString()
        };
    }

    generateNotifications() {
        const types = ['info', 'warning', 'error', 'success'];
        const messages = [
            'Новые заказы требуют обработки',
            'Обнаружены проблемные отправления',
            'Синхронизация данных завершена',
            'Требуется обновление API ключей',
            'Высокая нагрузка на систему',
            'Резервное копирование выполнено'
        ];
        
        const notifications = [];
        const count = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < count; i++) {
            notifications.push({
                id: `notif-${Date.now()}-${i}`,
                type: types[Math.floor(Math.random() * types.length)],
                message: messages[Math.floor(Math.random() * messages.length)],
                timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
                read: Math.random() > 0.5
            });
        }
        
        return notifications;
    }

    // Method to update order status (for simulating real-time updates)
    updateOrderStatus(orders) {
        return orders.map(order => {
            if (order.status === 'delivered' || order.status === 'cancelled') {
                return order; // Don't change completed orders
            }
            
            const shouldUpdate = Math.random() > 0.7; // 30% chance to update
            if (!shouldUpdate) return order;
            
            const platformStatuses = this.statuses[order.platform];
            const currentIndex = platformStatuses.indexOf(order.statusCode);
            let newIndex;
            
            if (currentIndex === platformStatuses.length - 1) {
                newIndex = currentIndex;
            } else {
                newIndex = Math.min(currentIndex + 1, platformStatuses.length - 1);
            }
            
            const newStatus = platformStatuses[newIndex];
            const newStatusLower = newStatus.toLowerCase();
            
            return {
                ...order,
                status: newStatusLower,
                statusCode: newStatus,
                updatedDate: new Date().toISOString(),
                isProblem: newStatusLower === 'problem' || newStatusLower === 'cancelled'
            };
        });
    }

    // Method to generate new orders (for simulating real-time updates)
    generateNewOrders(existingOrders, count = 2) {
        const newCDEKOrders = this.generateCDEKOrders(count).map(order => ({
            ...order,
            isNew: true
        }));
        
        const newMegamarketOrders = this.generateMegamarketOrders(count).map(order => ({
            ...order,
            isNew: true
        }));
        
        return [...existingOrders, ...newCDEKOrders, ...newMegamarketOrders];
    }

    // Method to simulate API delay
    async simulateAPIDelay(min = 500, max = 2000) {
        const delay = Math.floor(Math.random() * (max - min)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Method to generate realistic timestamps for orders
    generateRealisticTimestamps(orders, daysBack = 30) {
        const baseDate = new Date();
        
        return orders.map((order, index) => {
            const orderDate = new Date(baseDate);
            orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * daysBack));
            
            const updatedDate = new Date(orderDate);
            if (order.status !== 'new') {
                updatedDate.setDate(updatedDate.getDate() + Math.floor(Math.random() * 7) + 1);
            }
            
            return {
                ...order,
                createdDate: orderDate.toISOString(),
                updatedDate: updatedDate.toISOString()
            };
        });
    }
}

// Create global instance
const mockDataGenerator = new MockDataGenerator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = mockDataGenerator;
}
