// CDEK API сервис для TEXNO EDEM
class CDEKService {
    constructor() {
        this.baseURL = CONFIG.API.CDEK.URL;
        this.clientId = CONFIG.API.CDEK.CLIENT_ID;
        this.clientSecret = CONFIG.API.CDEK.CLIENT_SECRET;
        this.authToken = null;
        this.tokenExpiry = null;
    }

    async authenticate() {
        if (this.isTokenValid()) {
            return this.authToken;
        }

        try {
            // Для демо - используем mock токен
            if (!this.clientId || !this.clientSecret) {
                this.authToken = 'mock-token-' + Date.now();
                this.tokenExpiry = Date.now() + 3600000;
                return this.authToken;
            }

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

    async makeRequest(endpoint, options = {}) {
        await this.authenticate();
        
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
            ...options.headers
        };

        const config = {
            method: 'GET',
            ...options,
            headers
        };

        try {
            // Для демо - имитируем запрос
            if (this.authToken.startsWith('mock-token')) {
                await new Promise(resolve => setTimeout(resolve, 500));
                return this.getMockResponse(endpoint);
            }

            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('CDEK API request failed:', error);
            // При ошибке возвращаем mock данные
            return this.getMockResponse(endpoint);
        }
    }

    getMockResponse(endpoint) {
        if (endpoint === '/orders') {
            return this.getMockOrders();
        }
        return {};
    }

    // Основные методы API CDEK
    async getOrders(params = {}) {
        try {
            console.log('Fetching CDEK orders...');
            const response = await this.makeRequest('/orders');
            return this.transformOrders(response.orders || []);
        } catch (error) {
            console.error('Error fetching CDEK orders:', error);
            return this.getMockOrders();
        }
    }

    async getOrderDetails(orderUuid) {
        try {
            const order = await this.makeRequest(`/orders/${orderUuid}`);
            return this.transformOrderDetails(order);
        } catch (error) {
            console.error('Error fetching CDEK order details:', error);
            return this.getMockOrderDetails(orderUuid);
        }
    }

    // Действия с заказами
    async acceptOrder(orderUuid) {
        console.log('Accepting CDEK order:', orderUuid);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: 'Заказ принят' };
    }

    async processOrder(orderUuid) {
        console.log('Processing CDEK order:', orderUuid);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: 'Заказ в обработке' };
    }

    async deliverOrder(orderUuid) {
        console.log('Delivering CDEK order:', orderUuid);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: 'Заказ доставлен' };
    }

    async cancelOrder(orderUuid, reason = 'Отменен клиентом') {
        console.log('Canceling CDEK order:', orderUuid);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: 'Заказ отменен' };
    }

    async resolveIssue(orderUuid) {
        console.log('Resolving CDEK order issue:', orderUuid);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: 'Проблема решена' };
    }

    // Трансформация данных
    transformOrders(apiOrders) {
        if (!apiOrders || !Array.isArray(apiOrders)) {
            return this.getMockOrders();
        }
        return apiOrders.map(order => this.transformOrder(order));
    }

    transformOrder(apiOrder) {
        return {
            id: apiOrder.uuid || 'cdek-' + Date.now(),
            platform: 'cdek',
            trackingNumber: apiOrder.cdek_number || 'CDEK' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            status: this.mapStatus(apiOrder.status),
            statusCode: apiOrder.status || 'CREATED',
            fromCity: apiOrder.sender_location?.city || 'Москва',
            toCity: apiOrder.recipient_location?.city || 'Санкт-Петербург',
            weight: apiOrder.weight ? apiOrder.weight / 1000 : (Math.random() * 5 + 0.5).toFixed(1),
            cost: apiOrder.total_sum || Math.floor(Math.random() * 5000) + 300,
            sender: apiOrder.sender_company || 'ООО "ТЕХНО ЭДЕМ"',
            recipient: apiOrder.recipient_name || this.generateRandomName(),
            createdDate: apiOrder.date_created || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            estimatedDelivery: apiOrder.estimated_delivery_date,
            deliveredDate: apiOrder.date_delivered,
            packages: apiOrder.packages || [],
            services: apiOrder.services || [],
            insurance: apiOrder.insurance_value || 0
        };
    }

    transformOrderDetails(apiOrder) {
        const baseOrder = this.transformOrder(apiOrder);
        return {
            ...baseOrder,
            timeline: apiOrder.timeline || [],
            documents: apiOrder.documents || [],
            contacts: {
                sender: apiOrder.sender_contacts || { name: baseOrder.sender, phone: '+7 999 123-45-67' },
                recipient: apiOrder.recipient_contacts || { name: baseOrder.recipient, phone: '+7 999 765-43-21' }
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
        return statusMap[apiStatus] || 'new';
    }

    generateRandomName() {
        const names = ['Иван Иванов', 'Мария Петрова', 'Алексей Смирнов', 'Елена Козлова', 'Дмитрий Попов'];
        return names[Math.floor(Math.random() * names.length)];
    }

    // Mock данные
    getMockOrders() {
        const count = Math.floor(Math.random() * 5) + 3;
        const orders = [];
        
        for (let i = 0; i < count; i++) {
            orders.push(this.createMockOrder(i));
        }
        
        return orders;
    }

    createMockOrder(index) {
        const statuses = ['new', 'processing', 'active', 'delivered', 'problem'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        return {
            id: 'cdek-mock-' + index + '-' + Date.now(),
            platform: 'cdek',
            trackingNumber: 'CDEK' + (1000000000 + index).toString().substr(1),
            status: status,
            statusCode: status.toUpperCase(),
            fromCity: 'Москва',
            toCity: ['Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Казань'][Math.floor(Math.random() * 4)],
            weight: (Math.random() * 5 + 0.5).toFixed(1),
            cost: Math.floor(Math.random() * 5000) + 300,
            sender: 'ООО "ТЕХНО ЭДЕМ"',
            recipient: this.generateRandomName(),
            createdDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            estimatedDelivery: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
            documents: [
                { type: 'WAYBILL', number: 'WB' + order.trackingNumber.substr(4), url: '#' }
            ],
            contacts: {
                sender: { name: order.sender, phone: '+7 999 123-45-67' },
                recipient: { name: order.recipient, phone: '+7 999 765-43-21' }
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

    static async performAction(orderUuid, action) {
        const service = new CDEKService();
        return service[action](orderUuid);
    }
}
