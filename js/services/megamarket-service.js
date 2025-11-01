// Megamarket API сервис для TEXNO EDEM
class MegamarketService extends ApiService {
    constructor() {
        super(CONFIG.API.MEGAMARKET.URL, {
            timeout: CONFIG.API.MEGAMARKET.TIMEOUT
        });
        
        this.apiKey = CONFIG.API.MEGAMARKET.API_KEY;
        this.secretKey = CONFIG.API.MEGAMARKET.SECRET_KEY;
        this.campaignId = CONFIG.API.MEGAMARKET.CAMPAIGN_ID;
    }

    async makeAuthenticatedRequest(endpoint, options = {}) {
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = this.generateSignature(endpoint, timestamp, options.body);

        const headers = {
            'X-Api-Key': this.apiKey,
            'X-Signature': signature,
            'X-Timestamp': timestamp.toString(),
            'Content-Type': 'application/json',
            ...options.headers
        };

        return this.requestWithRetry(endpoint, {
            ...options,
            headers
        });
    }

    generateSignature(endpoint, timestamp, body = '') {
        // Генерация подписи для Megamarket API
        const message = `${timestamp}${endpoint}${body || ''}`;
        return CryptoJS.HmacSHA256(message, this.secretKey).toString(CryptoJS.enc.Hex);
    }

    // Основные методы API Megamarket
    async getOrders(params = {}) {
        try {
            if (!CONFIG.API.MEGAMARKET.ENABLED) {
                return this.getMockOrders();
            }

            const response = await this.makeAuthenticatedRequest('/order/new', {
                method: 'POST',
                body: JSON.stringify({
                    campaign_id: this.campaignId,
                    status: params.status || 'ALL',
                    date_from: params.date_from,
                    date_to: params.date_to,
                    limit: params.limit || 50,
                    offset: params.offset || 0
                })
            });

            return this.transformOrders(response.orders || []);
        } catch (error) {
            console.error('Error fetching Megamarket orders:', error);
            return this.getMockOrders();
        }
    }

    async getOrderDetails(orderId) {
        try {
            if (!CONFIG.API.MEGAMARKET.ENABLED) {
                return this.getMockOrderDetails(orderId);
            }

            const response = await this.makeAuthenticatedRequest('/order/get', {
                method: 'POST',
                body: JSON.stringify({
                    campaign_id: this.campaignId,
                    order_id: orderId
                })
            });

            return this.transformOrderDetails(response.order);
        } catch (error) {
            console.error('Error fetching Megamarket order details:', error);
            return this.getMockOrderDetails(orderId);
        }
    }

    async searchOrders(params = {}) {
        try {
            const response = await this.makeAuthenticatedRequest('/order/search', {
                method: 'POST',
                body: JSON.stringify({
                    campaign_id: this.campaignId,
                    ...params
                })
            });

            return this.transformOrders(response.orders || []);
        } catch (error) {
            console.error('Error searching Megamarket orders:', error);
            throw error;
        }
    }

    // Действия с заказами
    async confirmOrder(orderId) {
        try {
            const response = await this.makeAuthenticatedRequest('/order/confirm', {
                method: 'POST',
                body: JSON.stringify({
                    campaign_id: this.campaignId,
                    order_id: orderId
                })
            });
            return response;
        } catch (error) {
            console.error('Error confirming Megamarket order:', error);
            throw error;
        }
    }

    async packOrder(orderId) {
        try {
            const response = await this.makeAuthenticatedRequest('/order/packing', {
                method: 'POST',
                body: JSON.stringify({
                    campaign_id: this.campaignId,
                    order_id: orderId
                })
            });
            return response;
        } catch (error) {
            console.error('Error packing Megamarket order:', error);
            throw error;
        }
    }

    async shipOrder(orderId) {
        try {
            const response = await this.makeAuthenticatedRequest('/order/close', {
                method: 'POST',
                body: JSON.stringify({
                    campaign_id: this.campaignId,
                    order_id: orderId
                })
            });
            return response;
        } catch (error) {
            console.error('Error shipping Megamarket order:', error);
            throw error;
        }
    }

    async deliverOrder(orderId) {
        // Для Megamarket доставка отмечается через close order
        return this.shipOrder(orderId);
    }

    async cancelOrder(orderId, reason = 'Отменен продавцом') {
        try {
            const response = await this.makeAuthenticatedRequest('/order/cancel', {
                method: 'POST',
                body: JSON.stringify({
                    campaign_id: this.campaignId,
                    order_id: orderId,
                    reason: reason
                })
            });
            return response;
        } catch (error) {
            console.error('Error cancelling Megamarket order:', error);
            throw error;
        }
    }

    async processReturn(orderId) {
        try {
            const response = await this.makeAuthenticatedRequest('/order/reject', {
                method: 'POST',
                body: JSON.stringify({
                    campaign_id: this.campaignId,
                    order_id: orderId
                })
            });
            return response;
        } catch (error) {
            console.error('Error processing Megamarket return:', error);
            throw error;
        }
    }

    async getCancelResult(orderId) {
        try {
            const response = await this.makeAuthenticatedRequest('/order/cancelresult', {
                method: 'POST',
                body: JSON.stringify({
                    campaign_id: this.campaignId,
                    order_id: orderId
                })
            });
            return response;
        } catch (error) {
            console.error('Error getting Megamarket cancel result:', error);
            throw error;
        }
    }

    // Трансформация данных
    transformOrders(apiOrders) {
        if (!Array.isArray(apiOrders)) {
            return this.getMockOrders();
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

    static async performAction(orderId, action) {
        const service = new MegamarketService();
        return service[action](orderId);
    }
}

// Регистрируем сервис в API менеджере
try {
    apiManager.registerService('megamarket', new MegamarketService());
} catch (error) {
    console.log('API Manager not available, skipping service registration');
}
