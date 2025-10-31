// CDEK API сервис для TEXNO EDEM
class CDEKService extends ApiService {
    constructor() {
        super(CONFIG.API.CDEK.URL, {
            timeout: CONFIG.API.CDEK.TIMEOUT
        });
        
        this.clientId = CONFIG.API.CDEK.CLIENT_ID;
        this.clientSecret = CONFIG.API.CDEK.CLIENT_SECRET;
        this.tokenExpiry = null;
    }

    async authenticate() {
        if (this.isTokenValid()) {
            return this.authToken;
        }

        try {
            const formData = new URLSearchParams();
            formData.append('grant_type', 'client_credentials');
            formData.append('client_id', this.clientId);
            formData.append('client_secret', this.clientSecret);

            const response = await fetch(CONFIG.API.CDEK.AUTH_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.status}`);
            }

            const data = await response.json();
            this.authToken = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in * 1000);
            
            this.setAuthToken(this.authToken);
            return this.authToken;
        } catch (error) {
            console.error('CDEK authentication error:', error);
            throw new Error('Ошибка аутентификации CDEK');
        }
    }

    isTokenValid() {
        return this.authToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
    }

    async makeAuthenticatedRequest(endpoint, options = {}) {
        await this.authenticate();
        return this.requestWithRetry(endpoint, options);
    }

    // Основные методы API
    async getOrders(params = {}) {
        try {
            const orders = await this.makeAuthenticatedRequest('/orders', {
                method: 'GET'
            });

            return this.transformOrders(orders);
        } catch (error) {
            console.error('Error fetching CDEK orders:', error);
            
            // Возвращаем mock данные в случае ошибки
            if (CONFIG.API.CDEK.ENABLED) {
                return this.getMockOrders();
            }
            
            throw error;
        }
    }

    async getOrderDetails(orderUuid) {
        try {
            const order = await this.makeAuthenticatedRequest(`/orders/${orderUuid}`);
            return this.transformOrderDetails(order);
        } catch (error) {
            console.error('Error fetching CDEK order details:', error);
            return this.getMockOrderDetails(orderUuid);
        }
    }

    async createOrder(orderData) {
        return this.makeAuthenticatedRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async updateOrder(orderUuid, updateData) {
        return this.makeAuthenticatedRequest(`/orders/${orderUuid}`, {
            method: 'PATCH',
            body: JSON.stringify(updateData)
        });
    }

    async deleteOrder(orderUuid) {
        return this.makeAuthenticatedRequest(`/orders/${orderUuid}`, {
            method: 'DELETE'
        });
    }

    async getDeliveryPoints(params = {}) {
        return this.makeAuthenticatedRequest('/deliverypoints', {
            method: 'GET'
        });
    }

    async calculateTariff(calculationData) {
        return this.makeAuthenticatedRequest('/calculator/tariff', {
            method: 'POST',
            body: JSON.stringify(calculationData)
        });
    }

    // Трансформация данных
    transformOrders(apiOrders) {
        if (!apiOrders || !Array.isArray(apiOrders)) {
            return [];
        }

        return apiOrders.map(order => this.transformOrder(order));
    }

    transformOrder(apiOrder) {
        return {
            id: apiOrder.uuid,
            platform: 'cdek',
            trackingNumber: apiOrder.cdek_number || apiOrder.uuid,
            status: this.mapStatus(apiOrder.status),
            statusCode: apiOrder.status,
            fromCity: apiOrder.sender_location?.city || 'Не указан',
            toCity: apiOrder.recipient_location?.city || 'Не указан',
            weight: apiOrder.weight ? apiOrder.weight / 1000 : 0, // граммы в кг
            cost: apiOrder.total_sum || 0,
            sender: apiOrder.sender_company || 'Не указан',
            recipient: apiOrder.recipient_name || 'Не указан',
            createdDate: apiOrder.date_created || new Date().toISOString(),
            estimatedDelivery: apiOrder.estimated_delivery_date,
            deliveredDate: apiOrder.date_delivered,
            packages: apiOrder.packages || [],
            services: apiOrder.services || [],
            insurance: apiOrder.insurance_value || 0,
            payment: {
                method: apiOrder.payment_method,
                status: apiOrder.payment_status
            },
            additional: {
                tariff: apiOrder.tariff,
                deliveryMode: apiOrder.delivery_mode,
                courierCall: apiOrder.courier_call
            }
        };
    }

    transformOrderDetails(apiOrder) {
        const baseOrder = this.transformOrder(apiOrder);
        
        return {
            ...baseOrder,
            timeline: apiOrder.timeline || [],
            documents: apiOrder.documents || [],
            contacts: {
                sender: apiOrder.sender_contacts,
                recipient: apiOrder.recipient_contacts
            },
            addresses: {
                sender: apiOrder.sender_address,
                recipient: apiOrder.recipient_address
            }
        };
    }

    mapStatus(apiStatus) {
        const statusMap = {
            'CREATED': 'new',
            'ACCEPTED': 'processing',
            'IN_PROGRESS': 'active',
            'DELIVERED': 'delivered',
            'PROBLEM': 'problem',
            'CANCELLED': 'cancelled'
        };
        
        return statusMap[apiStatus] || 'unknown';
    }

    // Mock данные для разработки
    getMockOrders() {
        return [
            {
                id: 'cdek-mock-1',
                platform: 'cdek',
                trackingNumber: 'CDEK001234567',
                status: 'active',
                statusCode: 'IN_PROGRESS',
                fromCity: 'Москва',
                toCity: 'Санкт-Петербург',
                weight: 2.5,
                cost: 850,
                sender: 'ООО "ТЕХНО ЭДЕМ"',
                recipient: 'Иван Иванов',
                createdDate: '2024-01-15T10:30:00',
                estimatedDelivery: '2024-01-18',
                packages: [
                    { number: 'PKG001', weight: 2500, length: 30, width: 20, height: 15 }
                ],
                services: ['INSURANCE', 'SMS'],
                insurance: 5000,
                payment: {
                    method: 'CASH',
                    status: 'PAID'
                }
            },
            {
                id: 'cdek-mock-2',
                platform: 'cdek',
                trackingNumber: 'CDEK001234568',
                status: 'delivered',
                statusCode: 'DELIVERED',
                fromCity: 'Екатеринбург',
                toCity: 'Новосибирск',
                weight: 5.1,
                cost: 1200,
                sender: 'ИП Петров',
                recipient: 'Мария Сидорова',
                createdDate: '2024-01-10T14:20:00',
                deliveredDate: '2024-01-14T16:45:00',
                packages: [
                    { number: 'PKG002', weight: 5100, length: 40, width: 30, height: 25 }
                ],
                services: ['INSURANCE'],
                insurance: 10000
            },
            {
                id: 'cdek-mock-3',
                platform: 'cdek',
                trackingNumber: 'CDEK001234569',
                status: 'problem',
                statusCode: 'PROBLEM',
                fromCity: 'Казань',
                toCity: 'Ростов-на-Дону',
                weight: 1.8,
                cost: 650,
                sender: 'ООО "Товары"',
                recipient: 'Алексей Козлов',
                createdDate: '2024-01-12T09:15:00',
                estimatedDelivery: '2024-01-16',
                packages: [
                    { number: 'PKG003', weight: 1800, length: 25, width: 15, height: 10 }
                ]
            }
        ];
    }

    getMockOrderDetails(orderUuid) {
        const order = this.getMockOrders().find(o => o.id === orderUuid);
        if (!order) return null;

        return {
            ...order,
            timeline: [
                { date: order.createdDate, status: 'CREATED', description: 'Заказ создан' },
                { date: '2024-01-15T12:00:00', status: 'ACCEPTED', description: 'Заказ принят на складе' },
                { date: '2024-01-16T08:30:00', status: 'IN_PROGRESS', description: 'Заказ в пути' }
            ],
            documents: [
                { type: 'WAYBILL', number: 'WB001', url: '#' },
                { type: 'INVOICE', number: 'INV001', url: '#' }
            ],
            contacts: {
                sender: { name: order.sender, phone: '+7 999 123-45-67' },
                recipient: { name: order.recipient, phone: '+7 999 765-43-21' }
            },
            addresses: {
                sender: 'г. Москва, ул. Ленина, д. 1',
                recipient: 'г. Санкт-Петербург, Невский пр., д. 100'
            }
        };
    }

    // Статические методы
    static async getOrders(params = {}) {
        const service = new CDEKService();
        return service.getOrders(params);
    }

    static async getOrderDetails(orderUuid) {
        const service = new CDEKService();
        return service.getOrderDetails(orderUuid);
    }
}

// Регистрируем сервис в API менеджере
apiManager.registerService('cdek', new CDEKService());

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CDEKService;
}
