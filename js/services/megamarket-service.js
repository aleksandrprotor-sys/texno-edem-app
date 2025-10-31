// Megamarket API сервис для TEXNO EDEM
class MegamarketService extends ApiService {
    constructor() {
        super(CONFIG.API.MEGAMARKET.URL, {
            timeout: CONFIG.API.MEGAMARKET.TIMEOUT
        });
        
        this.apiKey = CONFIG.API.MEGAMARKET.API_KEY;
    }

    async makeAuthenticatedRequest(endpoint, options = {}) {
        const headers = {
            'X-API-Key': this.apiKey,
            ...options.headers
        };

        return this.requestWithRetry(endpoint, {
            ...options,
            headers
        });
    }

    // Основные методы API
    async getOrders(params = {}) {
        try {
            const response = await this.makeAuthenticatedRequest('/orders', {
                method: 'GET'
            });

            return this.transformOrders(response.orders || []);
        } catch (error) {
            console.error('Error fetching Megamarket orders:', error);
            
            // Возвращаем mock данные в случае ошибки
            if (CONFIG.API.MEGAMARKET.ENABLED) {
                return this.getMockOrders();
            }
            
            throw error;
        }
    }

    async getOrderDetails(orderId) {
        try {
            const order = await this.makeAuthenticatedRequest(`/orders/${orderId}`);
            return this.transformOrderDetails(order);
        } catch (error) {
            console.error('Error fetching Megamarket order details:', error);
            return this.getMockOrderDetails(orderId);
        }
    }

    async updateOrderStatus(orderId, status, reason = '') {
        return this.makeAuthenticatedRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, reason })
        });
    }

    async getProducts(params = {}) {
        return this.makeAuthenticatedRequest('/products', {
            method: 'GET'
        });
    }

    async getStock(params = {}) {
        return this.makeAuthenticatedRequest('/stock', {
            method: 'GET'
        });
    }

    async getAnalytics(params = {}) {
        return this.makeAuthenticatedRequest('/analytics', {
            method: 'GET'
        });
    }

    // Трансформация данных
    transformOrders(apiOrders) {
        if (!Array.isArray(apiOrders)) {
            return [];
        }

        return apiOrders.map(order => this.transformOrder(order));
    }

    transformOrder(apiOrder) {
        return {
            id: apiOrder.id || apiOrder.order_id,
            platform: 'megamarket',
            orderNumber: apiOrder.order_number || apiOrder.id,
            status: this.mapStatus(apiOrder.status),
            statusCode: apiOrder.status,
            totalAmount: apiOrder.total_amount || 0,
            itemsTotal: apiOrder.items_total || 0,
            deliveryCost: apiOrder.delivery_cost || 0,
            discount: apiOrder.discount || 0,
            customerName: apiOrder.customer?.name || 'Не указан',
            customerPhone: apiOrder.customer?.phone || 'Не указан',
            customerEmail: apiOrder.customer?.email,
            deliveryAddress: apiOrder.delivery?.address || 'Не указан',
            deliveryType: apiOrder.delivery?.type,
            createdDate: apiOrder.created_at || new Date().toISOString(),
            updatedDate: apiOrder.updated_at,
            items: this.transformItems(apiOrder.items || []),
            payment: {
                method: apiOrder.payment_method,
                status: apiOrder.payment_status,
                paidAt: apiOrder.paid_at
            },
            delivery: {
                type: apiOrder.delivery_type,
                cost: apiOrder.delivery_cost,
                date: apiOrder.delivery_date,
                timeSlot: apiOrder.delivery_time_slot
            }
        };
    }

    transformOrderDetails(apiOrder) {
        const baseOrder = this.transformOrder(apiOrder);
        
        return {
            ...baseOrder,
            customer: apiOrder.customer || {},
            delivery: apiOrder.delivery || {},
            payment: apiOrder.payment || {},
            promotions: apiOrder.promotions || [],
            cancellations: apiOrder.cancellations || [],
            returns: apiOrder.returns || []
        };
    }

    transformItems(apiItems) {
        return apiItems.map(item => ({
            id: item.id,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            weight: item.weight,
            dimensions: item.dimensions,
            category: item.category,
            brand: item.brand,
            image: item.image
        }));
    }

    mapStatus(apiStatus) {
        const statusMap = {
            'NEW': 'new',
            'CONFIRMED': 'processing',
            'PACKAGING': 'processing',
            'READY_FOR_SHIPMENT': 'processing',
            'SHIPPED': 'shipped',
            'DELIVERED': 'delivered',
            'CANCELLED': 'cancelled',
            'RETURNED': 'returned'
        };
        
        return statusMap[apiStatus] || 'unknown';
    }

    // Mock данные для разработки
    getMockOrders() {
        return [
            {
                id: 'mm-mock-1',
                platform: 'megamarket',
                orderNumber: 'MM00123456',
                status: 'new',
                statusCode: 'NEW',
                totalAmount: 15670,
                itemsTotal: 15670,
                deliveryCost: 0,
                discount: 0,
                customerName: 'Анна Петрова',
                customerPhone: '+7 912 345-67-89',
                customerEmail: 'anna@example.com',
                deliveryAddress: 'г. Москва, ул. Примерная, д. 1, кв. 1',
                deliveryType: 'COURIER',
                createdDate: '2024-01-15T11:20:00',
                items: [
                    { 
                        id: 'item-1', 
                        sku: 'SM-SAMSUNG-S21', 
                        name: 'Смартфон Samsung Galaxy S21', 
                        quantity: 1, 
                        price: 15670, 
                        total: 15670,
                        weight: 0.3,
                        category: 'Смартфоны',
                        brand: 'Samsung'
                    }
                ],
                payment: {
                    method: 'CARD',
                    status: 'PAID',
                    paidAt: '2024-01-15T11:25:00'
                },
                delivery: {
                    type: 'COURIER',
                    cost: 0,
                    date: '2024-01-16'
                }
            },
            {
                id: 'mm-mock-2',
                platform: 'megamarket',
                orderNumber: 'MM00123457',
                status: 'processing',
                statusCode: 'PACKAGING',
                totalAmount: 8920,
                itemsTotal: 8920,
                deliveryCost: 0,
                discount: 0,
                customerName: 'Дмитрий Смирнов',
                customerPhone: '+7 912 345-67-90',
                deliveryAddress: 'г. Санкт-Петербург, ул. Тестовая, д. 2',
                deliveryType: 'PICKUP',
                createdDate: '2024-01-14T16:45:00',
                items: [
                    { 
                        id: 'item-2', 
                        sku: 'HP-SONY-WH1000', 
                        name: 'Наушники Sony WH-1000XM4', 
                        quantity: 1, 
                        price: 8920, 
                        total: 8920,
                        weight: 0.25,
                        category: 'Аудиотехника',
                        brand: 'Sony'
                    }
                ],
                payment: {
                    method: 'CARD',
                    status: 'PAID'
                }
            },
            {
                id: 'mm-mock-3',
                platform: 'megamarket',
                orderNumber: 'MM00123458',
                status: 'shipped',
                statusCode: 'SHIPPED',
                totalAmount: 23450,
                itemsTotal: 23450,
                deliveryCost: 0,
                discount: 500,
                customerName: 'Елена Ковалева',
                customerPhone: '+7 912 345-67-91',
                deliveryAddress: 'г. Екатеринбург, пр. Ленина, д. 3',
                deliveryType: 'COURIER',
                createdDate: '2024-01-13T08:30:00',
                items: [
                    { 
                        id: 'item-3', 
                        sku: 'LT-ASUS-VIVOBOOK', 
                        name: 'Ноутбук ASUS VivoBook 15', 
                        quantity: 1, 
                        price: 23950, 
                        total: 23450,
                        weight: 1.7,
                        category: 'Ноутбуки',
                        brand: 'ASUS'
                    }
                ],
                payment: {
                    method: 'CARD',
                    status: 'PAID'
                }
            }
        ];
    }

    getMockOrderDetails(orderId) {
        const order = this.getMockOrders().find(o => o.id === orderId);
        if (!order) return null;

        return {
            ...order,
            customer: {
                name: order.customerName,
                phone: order.customerPhone,
                email: order.customerEmail
            },
            delivery: {
                address: order.deliveryAddress,
                type: order.deliveryType,
                cost: order.deliveryCost,
                date: order.delivery?.date
            },
            payment: order.payment,
            promotions: [
                { type: 'DISCOUNT', value: 500, description: 'Скидка на ноутбуки' }
            ]
        };
    }

    // Статические методы
    static async getOrders(params = {}) {
        const service = new MegamarketService();
        return service.getOrders(params);
    }

    static async getOrderDetails(orderId) {
        const service = new MegamarketService();
        return service.getOrderDetails(orderId);
    }
}

// Регистрируем сервис в API менеджере
apiManager.registerService('megamarket', new MegamarketService());

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MegamarketService;
}
