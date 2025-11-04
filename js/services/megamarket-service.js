// js/services/megamarket-service.js - Исправленная версия по официальной документации
class MegamarketService extends ApiService {
    constructor() {
        super(CONFIG.API.MEGAMARKET.URL, {
            timeout: CONFIG.API.MEGAMARKET.TIMEOUT
        });
        
        this.apiKey = CONFIG.API.MEGAMARKET.API_KEY;
        this.secretKey = CONFIG.API.MEGAMARKET.SECRET_KEY;
        this.campaignId = CONFIG.API.MEGAMARKET.CAMPAIGN_ID;
    }

    /**
     * Генерация подписи для Megamarket API согласно документации
     */
    generateSignature(endpoint, timestamp, body = '') {
        // Создаем строку для подписи: timestamp + endpoint + body
        const message = `${timestamp}${endpoint}${JSON.stringify(body)}`;
        
        // Используем CryptoJS для HMAC-SHA256
        if (typeof CryptoJS !== 'undefined') {
            return CryptoJS.HmacSHA256(message, this.secretKey).toString(CryptoJS.enc.Hex);
        } else {
            // Fallback для случаев когда CryptoJS не доступен
            console.warn('CryptoJS not available, using mock signature');
            return 'mock-signature-' + Date.now();
        }
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

    /**
     * Получение новых заказов (order-new)
     * https://partner-wiki.megamarket.ru/merchant-api/4-opisanie-api-dbs/4-1-dbs-s-tsentral-nogo-sklada/4-1-1-opisanie-metodov/4-3-1-order-new
     */
    async getNewOrders(params = {}) {
        try {
            if (!CONFIG.API.MEGAMARKET.ENABLED) {
                console.log('Megamarket API disabled, returning mock data');
                return this.getMockOrders('NEW');
            }

            const requestBody = {
                campaign_id: this.campaignId,
                status: 'NEW',
                date_from: params.date_from || this.getDefaultDateFrom(),
                date_to: params.date_to || new Date().toISOString().split('T')[0],
                limit: params.limit || 50,
                offset: params.offset || 0
            };

            const response = await this.makeAuthenticatedRequest('/order/new', {
                method: 'POST',
                body: requestBody
            });

            return this.transformOrders(response.orders || []);

        } catch (error) {
            console.error('Error fetching Megamarket new orders:', error);
            return this.getMockOrders('NEW');
        }
    }

    /**
     * Отмена заказа (order-cancel)
     * https://partner-wiki.megamarket.ru/merchant-api/4-opisanie-api-dbs/4-1-dbs-s-tsentral-nogo-sklada/4-1-1-opisanie-metodov/4-3-2-order-cancel-otmena-zakaza
     */
    async cancelOrder(orderId, reason = 'Отменен продавцом') {
        try {
            const requestBody = {
                campaign_id: this.campaignId,
                order_id: orderId,
                reason: reason
            };

            const response = await this.makeAuthenticatedRequest('/order/cancel', {
                method: 'POST',
                body: requestBody
            });

            return {
                success: true,
                message: 'Заказ успешно отменен',
                data: response
            };

        } catch (error) {
            console.error('Error cancelling Megamarket order:', error);
            throw error;
        }
    }

    /**
     * Получение результата отмены заказа (order-cancelresult)
     * https://partner-wiki.megamarket.ru/merchant-api/4-opisanie-api-dbs/4-1-dbs-s-tsentral-nogo-sklada/4-1-1-opisanie-metodov/4-3-3-order-cancelresult
     */
    async getCancelResult(orderId) {
        try {
            const requestBody = {
                campaign_id: this.campaignId,
                order_id: orderId
            };

            const response = await this.makeAuthenticatedRequest('/order/cancelresult', {
                method: 'POST',
                body: requestBody
            });

            return response;

        } catch (error) {
            console.error('Error getting Megamarket cancel result:', error);
            throw error;
        }
    }

    /**
     * Упаковка заказа (order-packing)
     * https://partner-wiki.megamarket.ru/merchant-api/4-opisanie-api-dbs/4-1-dbs-s-tsentral-nogo-sklada/4-1-1-opisanie-metodov/4-3-4-order-packing
     */
    async packOrder(orderId) {
        try {
            const requestBody = {
                campaign_id: this.campaignId,
                order_id: orderId
            };

            const response = await this.makeAuthenticatedRequest('/order/packing', {
                method: 'POST',
                body: requestBody
            });

            return {
                success: true,
                message: 'Заказ упакован',
                data: response
            };

        } catch (error) {
            console.error('Error packing Megamarket order:', error);
            throw error;
        }
    }

    /**
     * Закрытие заказа (отправка) (order-close)
     * https://partner-wiki.megamarket.ru/merchant-api/4-opisanie-api-dbs/4-1-dbs-s-tsentral-nogo-sklada/4-1-1-opisanie-metodov/4-3-5-order-close
     */
    async closeOrder(orderId) {
        try {
            const requestBody = {
                campaign_id: this.campaignId,
                order_id: orderId
            };

            const response = await this.makeAuthenticatedRequest('/order/close', {
                method: 'POST',
                body: requestBody
            });

            return {
                success: true,
                message: 'Заказ отправлен',
                data: response
            };

        } catch (error) {
            console.error('Error closing Megamarket order:', error);
            throw error;
        }
    }

    /**
     * Отклонение заказа (возврат) (order-reject)
     * https://partner-wiki.megamarket.ru/merchant-api/4-opisanie-api-dbs/4-1-dbs-s-tsentral-nogo-sklada/4-1-1-opisanie-metodov/4-3-6-order-reject
     */
    async rejectOrder(orderId, reason = 'Товар отсутствует') {
        try {
            const requestBody = {
                campaign_id: this.campaignId,
                order_id: orderId,
                reason: reason
            };

            const response = await this.makeAuthenticatedRequest('/order/reject', {
                method: 'POST',
                body: requestBody
            });

            return {
                success: true,
                message: 'Заказ отклонен',
                data: response
            };

        } catch (error) {
            console.error('Error rejecting Megamarket order:', error);
            throw error;
        }
    }

    /**
     * Подтверждение заказа и перенос даты доставки (order-confirm)
     * https://partner-wiki.megamarket.ru/merchant-api/4-opisanie-api-dbs/4-1-dbs-s-tsentral-nogo-sklada/4-1-1-opisanie-metodov/4-3-7-order-confirm-perenesti-datu-dostavki-dsm
     */
    async confirmOrder(orderId, deliveryDate = null) {
        try {
            const requestBody = {
                campaign_id: this.campaignId,
                order_id: orderId
            };

            // Если указана дата доставки, добавляем ее
            if (deliveryDate) {
                requestBody.delivery_date = deliveryDate;
            }

            const response = await this.makeAuthenticatedRequest('/order/confirm', {
                method: 'POST',
                body: requestBody
            });

            return {
                success: true,
                message: 'Заказ подтвержден',
                data: response
            };

        } catch (error) {
            console.error('Error confirming Megamarket order:', error);
            throw error;
        }
    }

    /**
     * Получение информации по заказу (order-get)
     * https://partner-wiki.megamarket.ru/merchant-api/4-opisanie-api-dbs/4-1-dbs-s-tsentral-nogo-sklada/4-1-1-opisanie-metodov/4-3-8-order-get-poluchit-informatsiyu-po-otpravleniyu-dsm
     */
    async getOrder(orderId) {
        try {
            if (!CONFIG.API.MEGAMARKET.ENABLED) {
                return this.getMockOrderDetails(orderId);
            }

            const requestBody = {
                campaign_id: this.campaignId,
                order_id: orderId
            };

            const response = await this.makeAuthenticatedRequest('/order/get', {
                method: 'POST',
                body: requestBody
            });

            return this.transformOrderDetails(response.order);

        } catch (error) {
            console.error('Error fetching Megamarket order details:', error);
            return this.getMockOrderDetails(orderId);
        }
    }

    /**
     * Поиск заказов по критериям (order-search)
     * https://partner-wiki.megamarket.ru/merchant-api/4-opisanie-api-dbs/4-1-dbs-s-tsentral-nogo-sklada/4-1-1-opisanie-metodov/4-3-9-order-search-poluchit-otpravleniya-po-kriteriyam-dsm
     */
    async searchOrders(params = {}) {
        try {
            const requestBody = {
                campaign_id: this.campaignId,
                ...params
            };

            const response = await this.makeAuthenticatedRequest('/order/search', {
                method: 'POST',
                body: requestBody
            });

            return this.transformOrders(response.orders || []);

        } catch (error) {
            console.error('Error searching Megamarket orders:', error);
            throw error;
        }
    }

    /**
     * Получение всех заказов с различными статусами
     */
    async getOrders(params = {}) {
        try {
            // Получаем заказы с разными статусами
            const statuses = ['NEW', 'CONFIRMED', 'PACKAGING', 'READY_FOR_SHIPMENT', 'SHIPPED'];
            let allOrders = [];

            for (const status of statuses) {
                try {
                    const orders = await this.getOrdersByStatus(status, params);
                    allOrders = [...allOrders, ...orders];
                } catch (error) {
                    console.warn(`Failed to fetch orders with status ${status}:`, error);
                }
            }

            return allOrders;

        } catch (error) {
            console.error('Error fetching Megamarket orders:', error);
            return this.getMockOrders();
        }
    }

    async getOrdersByStatus(status, params = {}) {
        try {
            if (!CONFIG.API.MEGAMARKET.ENABLED) {
                return this.getMockOrders(status);
            }

            const requestBody = {
                campaign_id: this.campaignId,
                status: status,
                date_from: params.date_from || this.getDefaultDateFrom(),
                date_to: params.date_to || new Date().toISOString().split('T')[0],
                limit: params.limit || 50,
                offset: params.offset || 0
            };

            const response = await this.makeAuthenticatedRequest('/order/new', {
                method: 'POST',
                body: requestBody
            });

            return this.transformOrders(response.orders || []);

        } catch (error) {
            console.error(`Error fetching Megamarket orders with status ${status}:`, error);
            return this.getMockOrders(status);
        }
    }

    // Вспомогательные методы
    getDefaultDateFrom() {
        const date = new Date();
        date.setDate(date.getDate() - 30); // За последние 30 дней
        return date.toISOString().split('T')[0];
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
            status: this.mapMegamarketStatus(apiOrder.status),
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
            returns: apiOrder.returns || [],
            status_history: apiOrder.status_history || []
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
            image: item.image,
            vat: item.vat
        }));
    }

    mapMegamarketStatus(apiStatus) {
        const statusMap = {
            'NEW': 'new',
            'CONFIRMED': 'processing',
            'PACKAGING': 'processing',
            'READY_FOR_SHIPMENT': 'processing',
            'SHIPPED': 'shipped',
            'DELIVERED': 'delivered',
            'CANCELLED': 'cancelled',
            'RETURNED': 'returned',
            'REJECTED': 'cancelled'
        };
        
        return statusMap[apiStatus] || 'unknown';
    }

    // Mock данные для разработки
    getMockOrders(status = 'NEW') {
        const statusMap = {
            'NEW': { count: 3, status: 'NEW' },
            'CONFIRMED': { count: 2, status: 'CONFIRMED' },
            'PACKAGING': { count: 2, status: 'PACKAGING' },
            'SHIPPED': { count: 1, status: 'SHIPPED' },
            'DELIVERED': { count: 1, status: 'DELIVERED' }
        };

        const config = statusMap[status] || statusMap.NEW;
        const orders = [];

        for (let i = 0; i < config.count; i++) {
            orders.push(this.createMockOrder(i, config.status));
        }

        return orders;
    }

    createMockOrder(index, status) {
        const customers = [
            { name: 'Анна Петрова', phone: '+7 912 345-67-89', email: 'anna@example.com' },
            { name: 'Иван Сидоров', phone: '+7 923 456-78-90', email: 'ivan@example.com' },
            { name: 'Мария Козлова', phone: '+7 934 567-89-01', email: 'maria@example.com' }
        ];

        const customer = customers[index % customers.length];

        return {
            id: `mm-mock-${status.toLowerCase()}-${index}-${Date.now()}`,
            platform: 'megamarket',
            orderNumber: `MM${(100000 + index).toString().substr(1)}`,
            status: this.mapMegamarketStatus(status),
            statusCode: status,
            totalAmount: Math.floor(Math.random() * 20000) + 3000,
            itemsTotal: Math.floor(Math.random() * 18000) + 2000,
            deliveryCost: 0,
            discount: 500,
            customerName: customer.name,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            deliveryAddress: 'г. Москва, ул. Примерная, д. ' + (index + 1),
            deliveryType: 'COURIER',
            createdDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            items: [
                { 
                    id: 'item-' + index, 
                    sku: 'PROD-' + (1000 + index), 
                    name: 'Товар пример ' + (index + 1), 
                    quantity: 1, 
                    price: Math.floor(Math.random() * 15000) + 2000, 
                    total: Math.floor(Math.random() * 15000) + 2000,
                    weight: 0.5,
                    category: 'Электроника',
                    brand: 'Example Brand'
                }
            ],
            payment: {
                method: 'CARD',
                status: 'PAID',
                paidAt: new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000).toISOString()
            },
            delivery: {
                type: 'COURIER',
                cost: 0,
                date: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        };
    }

    getMockOrderDetails(orderId) {
        const order = this.createMockOrder(0, 'NEW');
        order.id = orderId;

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
                date: order.delivery.date
            },
            payment: order.payment,
            promotions: [
                { type: 'DISCOUNT', value: 500, description: 'Скидка на заказ' }
            ],
            status_history: [
                { status: 'NEW', date: order.createdDate, comment: 'Заказ создан' },
                { status: 'CONFIRMED', date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), comment: 'Заказ подтвержден' }
            ]
        };
    }

    // Статические методы
    static async getOrders(params = {}) {
        const service = new MegamarketService();
        return service.getOrders(params);
    }

    static async getOrder(orderId) {
        const service = new MegamarketService();
        return service.getOrder(orderId);
    }

    static async confirmOrder(orderId, deliveryDate = null) {
        const service = new MegamarketService();
        return service.confirmOrder(orderId, deliveryDate);
    }

    static async cancelOrder(orderId, reason = 'Отменен продавцом') {
        const service = new MegamarketService();
        return service.cancelOrder(orderId, reason);
    }

    static async packOrder(orderId) {
        const service = new MegamarketService();
        return service.packOrder(orderId);
    }

    static async closeOrder(orderId) {
        const service = new MegamarketService();
        return service.closeOrder(orderId);
    }

    static async rejectOrder(orderId, reason = 'Товар отсутствует') {
        const service = new MegamarketService();
        return service.rejectOrder(orderId, reason);
    }
}

// Регистрируем сервис в API менеджере
try {
    if (typeof apiManager !== 'undefined') {
        apiManager.registerService('megamarket', new MegamarketService());
    }
} catch (error) {
    console.log('API Manager not available, skipping service registration');
}
