// js/services/api.js
class ApiService {
    constructor() {
        this.baseURL = '';
        this.timeout = 10000;
        this.retryCount = 3;
        this.retryDelay = 1000;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: this.timeout,
            ...options
        };

        // Добавляем тело запроса если нужно
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        let lastError;
        
        for (let attempt = 1; attempt <= this.retryCount; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                config.signal = controller.signal;

                const response = await fetch(url, config);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return data;

            } catch (error) {
                lastError = error;
                
                if (attempt < this.retryCount) {
                    console.warn(`Попытка ${attempt} не удалась, повтор через ${this.retryDelay}ms`);
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }

        throw lastError;
    }

    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url);
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setAuthToken(token) {
        this.authToken = token;
    }

    setBaseURL(url) {
        this.baseURL = url;
    }
}

// Сервис для работы с CDEK API
class CDEKService extends ApiService {
    constructor(apiKey) {
        super();
        this.apiKey = apiKey;
        this.baseURL = 'https://api.cdek.ru/v2';
    }

    async getOrders(params = {}) {
        try {
            const orders = await this.get('/orders', params);
            return this.normalizeOrders(orders);
        } catch (error) {
            console.error('Ошибка получения заказов CDEK:', error);
            throw error;
        }
    }

    async getOrderDetails(orderId) {
        try {
            const order = await this.get(`/orders/${orderId}`);
            return this.normalizeOrder(order);
        } catch (error) {
            console.error('Ошибка получения деталей заказа CDEK:', error);
            throw error;
        }
    }

    async createOrder(orderData) {
        try {
            const result = await this.post('/orders', orderData);
            return result;
        } catch (error) {
            console.error('Ошибка создания заказа CDEK:', error);
            throw error;
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            const result = await this.put(`/orders/${orderId}/status`, { status });
            return result;
        } catch (error) {
            console.error('Ошибка обновления статуса заказа CDEK:', error);
            throw error;
        }
    }

    normalizeOrders(orders) {
        return orders.map(order => this.normalizeOrder(order));
    }

    normalizeOrder(order) {
        return {
            id: order.uuid,
            platform: 'cdek',
            orderNumber: order.number,
            status: this.mapStatus(order.status),
            createdDate: order.date,
            amount: order.total_amount,
            weight: order.weight,
            dimensions: order.dimensions,
            sender: order.sender,
            recipient: order.recipient,
            delivery: order.delivery,
            items: order.packages?.flatMap(pkg => pkg.items) || []
        };
    }

    mapStatus(status) {
        const statusMap = {
            'CREATED': 'new',
            'ACCEPTED': 'processing',
            'IN_PROGRESS': 'active',
            'DELIVERED': 'delivered',
            'PROBLEM': 'problem',
            'CANCELLED': 'cancelled'
        };
        return statusMap[status] || status.toLowerCase();
    }

    async testConnection() {
        try {
            await this.get('/version');
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Сервис для работы с Мегамаркет API
class MegamarketService extends ApiService {
    constructor(apiKey) {
        super();
        this.apiKey = apiKey;
        this.baseURL = 'https://api.megamarket.ru/v1';
    }

    async getOrders(params = {}) {
        try {
            const response = await this.get('/orders', {
                ...params,
                apiKey: this.apiKey
            });
            return this.normalizeOrders(response.orders);
        } catch (error) {
            console.error('Ошибка получения заказов Мегамаркет:', error);
            throw error;
        }
    }

    async getOrderDetails(orderId) {
        try {
            const response = await this.get(`/orders/${orderId}`, {
                apiKey: this.apiKey
            });
            return this.normalizeOrder(response.order);
        } catch (error) {
            console.error('Ошибка получения деталей заказа Мегамаркет:', error);
            throw error;
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            const result = await this.post(`/orders/${orderId}/status`, {
                status: status,
                apiKey: this.apiKey
            });
            return result;
        } catch (error) {
            console.error('Ошибка обновления статуса заказа Мегамаркет:', error);
            throw error;
        }
    }

    normalizeOrders(orders) {
        return orders.map(order => this.normalizeOrder(order));
    }

    normalizeOrder(order) {
        return {
            id: order.id,
            platform: 'megamarket',
            orderNumber: order.number,
            status: this.mapStatus(order.status),
            createdDate: order.created_at,
            totalAmount: order.total_amount,
            items: order.items,
            customer: order.customer,
            shipping: order.shipping,
            payment: order.payment
        };
    }

    mapStatus(status) {
        const statusMap = {
            'NEW': 'new',
            'PROCESSING': 'processing',
            'SHIPPED': 'shipped',
            'DELIVERED': 'delivered',
            'CANCELLED': 'cancelled',
            'PROBLEM': 'problem'
        };
        return statusMap[status] || status.toLowerCase();
    }

    async testConnection() {
        try {
            await this.get('/ping', { apiKey: this.apiKey });
            return true;
        } catch (error) {
            return false;
        }
    }
}
