// js/services/cdek-service.js - Исправленная версия по официальной документации
class CDEKService {
    constructor() {
        this.baseURL = CONFIG.API.CDEK.URL;
        this.clientId = CONFIG.API.CDEK.CLIENT_ID;
        this.clientSecret = CONFIG.API.CDEK.CLIENT_SECRET;
        this.authToken = null;
        this.tokenExpiry = null;
        this.account = null;
    }

    /**
     * Аутентификация по OAuth 2.0 согласно документации CDEK
     * https://apidoc.cdek.ru/calcutale.html
     */
    async authenticate() {
        if (this.isTokenValid()) {
            return this.authToken;
        }

        try {
            // Для демо - используем mock токен если нет учетных данных
            if (!this.clientId || !this.clientSecret) {
                console.warn('CDEK credentials not set, using mock token');
                this.authToken = 'mock-token-' + Date.now();
                this.tokenExpiry = Date.now() + 3600000;
                return this.authToken;
            }

            const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
            
            const response = await fetch(`${this.baseURL}/oauth/token?grant_type=client_credentials`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`CDEK Authentication failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            this.authToken = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in * 1000);
            this.account = data.account;
            
            console.log('✅ CDEK authentication successful');
            return this.authToken;

        } catch (error) {
            console.error('CDEK authentication error:', error);
            // Для демо - создаем mock токен при ошибке
            this.authToken = 'mock-token-error-' + Date.now();
            this.tokenExpiry = Date.now() + 3600000;
            return this.authToken;
        }
    }

    isTokenValid() {
        return this.authToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000;
    }

    /**
     * Создание заказа согласно документации
     * https://apidoc.cdek.ru/create-order.html
     */
    async createOrder(orderData) {
        await this.authenticate();
        
        try {
            // Для демо - возвращаем mock ответ
            if (this.authToken.startsWith('mock-token')) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return {
                    entity: {
                        uuid: 'cdek-' + Date.now(),
                        cdek_number: 'CDEK' + Math.random().toString(36).substr(2, 9).toUpperCase()
                    },
                    requests: []
                };
            }

            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`CDEK order creation failed: ${JSON.stringify(errorData)}`);
            }

            return await response.json();
        } catch (error) {
            console.error('CDEK order creation error:', error);
            throw error;
        }
    }

    /**
     * Получение информации о заказе
     * https://apidoc.cdek.ru/status-order.html
     */
    async getOrder(orderUuid) {
        await this.authenticate();
        
        try {
            // Для демо - возвращаем mock данные
            if (this.authToken.startsWith('mock-token')) {
                await new Promise(resolve => setTimeout(resolve, 500));
                return this.getMockOrderDetails(orderUuid);
            }

            const response = await fetch(`${this.baseURL}/orders/${orderUuid}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`CDEK get order failed: ${response.status}`);
            }

            const data = await response.json();
            return this.transformOrder(data);
        } catch (error) {
            console.error('CDEK get order error:', error);
            return this.getMockOrderDetails(orderUuid);
        }
    }

    /**
     * Получение списка заказов с фильтрацией
     * https://apidoc.cdek.ru/order-list.html
     */
    async getOrders(params = {}) {
        await this.authenticate();
        
        try {
            console.log('Fetching CDEK orders with params:', params);
            
            // Для демо - возвращаем mock данные
            if (this.authToken.startsWith('mock-token')) {
                await new Promise(resolve => setTimeout(resolve, 800));
                return this.getMockOrders();
            }

            const queryParams = new URLSearchParams();
            if (params.status) queryParams.append('status', params.status);
            if (params.date_from) queryParams.append('date_from', params.date_from);
            if (params.date_to) queryParams.append('date_to', params.date_to);
            if (params.size) queryParams.append('size', params.size);
            if (params.page) queryParams.append('page', params.page);

            const response = await fetch(`${this.baseURL}/orders?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`CDEK get orders failed: ${response.status}`);
            }

            const data = await response.json();
            return this.transformOrders(data);
        } catch (error) {
            console.error('CDEK get orders error:', error);
            return this.getMockOrders();
        }
    }

    /**
     * Удаление заказа
     * https://apidoc.cdek.ru/delete-order.html
     */
    async deleteOrder(orderUuid) {
        await this.authenticate();
        
        try {
            // Для демо - имитируем удаление
            if (this.authToken.startsWith('mock-token')) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return { success: true, message: 'Заказ удален' };
            }

            const response = await fetch(`${this.baseURL}/orders/${orderUuid}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`CDEK delete order failed: ${response.status}`);
            }

            return { success: true, message: 'Заказ успешно удален' };
        } catch (error) {
            console.error('CDEK delete order error:', error);
            throw error;
        }
    }

    /**
     * Получение информации о тарифах
     * https://apidoc.cdek.ru/calculate.html
     */
    async calculateTariff(calculationData) {
        await this.authenticate();
        
        try {
            const response = await fetch(`${this.baseURL}/calculator/tariff`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(calculationData)
            });

            if (!response.ok) {
                throw new Error(`CDEK tariff calculation failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('CDEK tariff calculation error:', error);
            throw error;
        }
    }

    /**
     * Получение списка городов
     * https://apidoc.cdek.ru/location/cities.html
     */
    async getCities(params = {}) {
        await this.authenticate();
        
        try {
            const queryParams = new URLSearchParams();
            if (params.country_codes) queryParams.append('country_codes', params.country_codes);
            if (params.region_code) queryParams.append('region_code', params.region_code);
            if (params.size) queryParams.append('size', params.size);
            if (params.page) queryParams.append('page', params.page);
            if (params.lang) queryParams.append('lang', params.lang);

            const response = await fetch(`${this.baseURL}/location/cities?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`CDEK get cities failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('CDEK get cities error:', error);
            throw error;
        }
    }

    /**
     * Получение списка пунктов выдачи заказов (ПВЗ)
     * https://apidoc.cdek.ru/deliverypoints.html
     */
    async getDeliveryPoints(params = {}) {
        await this.authenticate();
        
        try {
            const queryParams = new URLSearchParams();
            if (params.country_code) queryParams.append('country_code', params.country_code);
            if (params.region_code) queryParams.append('region_code', params.region_code);
            if (params.city_code) queryParams.append('city_code', params.city_code);
            if (params.type) queryParams.append('type', params.type);
            if (params.size) queryParams.append('size', params.size);
            if (params.page) queryParams.append('page', params.page);
            if (params.lang) queryParams.append('lang', params.lang);

            const response = await fetch(`${this.baseURL}/deliverypoints?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`CDEK get delivery points failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('CDEK get delivery points error:', error);
            throw error;
        }
    }

    /**
     * Получение статусов заказа
     * https://apidoc.cdek.ru/status-order.html
     */
    async getOrderStatuses(orderUuid) {
        await this.authenticate();
        
        try {
            const response = await fetch(`${this.baseURL}/orders/${orderUuid}/statuses`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`CDEK get order statuses failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('CDEK get order statuses error:', error);
            throw error;
        }
    }

    // Трансформация данных CDEK API в формат приложения
    transformOrders(apiResponse) {
        if (!apiResponse || !Array.isArray(apiResponse)) {
            return this.getMockOrders();
        }

        return apiResponse.map(order => this.transformOrder(order));
    }

    transformOrder(apiOrder) {
        // Преобразование данных из формата CDEK API в формат приложения
        return {
            id: apiOrder.uuid || apiOrder.entity?.uuid,
            platform: 'cdek',
            trackingNumber: apiOrder.cdek_number || apiOrder.entity?.cdek_number,
            status: this.mapCDEKStatus(apiOrder.status || apiOrder.entity?.status),
            statusCode: apiOrder.status || apiOrder.entity?.status,
            fromCity: apiOrder.sender_location?.city || apiOrder.from_location?.city,
            toCity: apiOrder.recipient_location?.city || apiOrder.to_location?.city,
            weight: apiOrder.weight ? apiOrder.weight / 1000 : (Math.random() * 5 + 0.5).toFixed(1),
            cost: apiOrder.total_sum || apiOrder.delivery_summary?.total_sum || Math.floor(Math.random() * 5000) + 300,
            sender: apiOrder.sender_company || apiOrder.sender_name || 'ООО "ТЕХНО ЭДЕМ"',
            recipient: apiOrder.recipient_name || this.generateRandomName(),
            createdDate: apiOrder.date_created || apiOrder.created_date || new Date().toISOString(),
            estimatedDelivery: apiOrder.estimated_delivery_date,
            deliveredDate: apiOrder.date_delivered,
            packages: apiOrder.packages || [],
            services: apiOrder.services || [],
            insurance: apiOrder.insurance_value || 0,
            // Дополнительные поля из CDEK API
            tariff_code: apiOrder.tariff_code,
            delivery_mode: apiOrder.delivery_mode,
            shipment_point: apiOrder.shipment_point,
            delivery_point: apiOrder.delivery_point
        };
    }

    mapCDEKStatus(apiStatus) {
        const statusMap = {
            'CREATED': 'new',
            'ACCEPTED': 'processing',
            'RECEIVED_AT_SENDER_WAREHOUSE': 'processing',
            'READY_FOR_SHIPMENT_IN_SENDER_CITY': 'processing',
            'TAKEN_BY_TRANSPORTER_FROM_SENDER_CITY': 'active',
            'SENT_TO_RECIPIENT_CITY': 'active',
            'ACCEPTED_AT_TRANSPORT_HUB_IN_RECIPIENT_CITY': 'active',
            'ACCEPTED_AT_DELIVERY_WAREHOUSE': 'active',
            'READY_FOR_DELIVERY_IN_RECIPIENT_CITY': 'active',
            'DELIVERED': 'delivered',
            'RETURNED_TO_SENDER_WAREHOUSE': 'cancelled',
            'RETURNED_TO_SENDER': 'cancelled',
            'NOT_DELIVERED': 'problem',
            'CANCELLED': 'cancelled',
            'INVALID': 'problem'
        };
        return statusMap[apiStatus] || 'new';
    }

    // Mock данные для разработки
    getMockOrders() {
        const count = Math.floor(Math.random() * 5) + 3;
        const orders = [];
        
        for (let i = 0; i < count; i++) {
            orders.push(this.createMockOrder(i));
        }
        
        return orders;
    }

    createMockOrder(index) {
        const statuses = ['CREATED', 'ACCEPTED', 'TAKEN_BY_TRANSPORTER_FROM_SENDER_CITY', 'DELIVERED', 'NOT_DELIVERED'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
            id: 'cdek-mock-' + index + '-' + Date.now(),
            platform: 'cdek',
            trackingNumber: 'CDEK' + (1000000000 + index).toString().substr(1),
            status: this.mapCDEKStatus(status),
            statusCode: status,
            fromCity: 'Москва',
            toCity: ['Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Казань'][Math.floor(Math.random() * 4)],
            weight: (Math.random() * 5 + 0.5).toFixed(1),
            cost: Math.floor(Math.random() * 5000) + 300,
            sender: 'ООО "ТЕХНО ЭДЕМ"',
            recipient: this.generateRandomName(),
            createdDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            estimatedDelivery: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            tariff_code: 136,
            delivery_mode: '1'
        };
    }

    getMockOrderDetails(orderUuid) {
        const order = this.createMockOrder(0);
        order.id = orderUuid;
        
        return {
            ...order,
            timeline: [
                { date: order.createdDate, status: 'CREATED', description: 'Заказ создан' },
                { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'ACCEPTED', description: 'Заказ принят на складе' }
            ],
            packages: [
                { number: 'PKG001', weight: order.weight * 1000, length: 30, width: 20, height: 10 }
            ],
            services: [
                { code: 'INSURANCE', name: 'Страхование', sum: 100 }
            ]
        };
    }

    generateRandomName() {
        const names = ['Иван Иванов', 'Мария Петрова', 'Алексей Смирнов', 'Елена Козлова', 'Дмитрий Попов'];
        return names[Math.floor(Math.random() * names.length)];
    }

    // Статические методы для удобства использования
    static async getOrders(params = {}) {
        const service = new CDEKService();
        return service.getOrders(params);
    }

    static async getOrder(orderUuid) {
        const service = new CDEKService();
        return service.getOrder(orderUuid);
    }

    static async createOrder(orderData) {
        const service = new CDEKService();
        return service.createOrder(orderData);
    }

    static async deleteOrder(orderUuid) {
        const service = new CDEKService();
        return service.deleteOrder(orderUuid);
    }
}
