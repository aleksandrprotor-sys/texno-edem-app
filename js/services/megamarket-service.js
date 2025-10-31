class MegamarketService {
    constructor(apiKey, baseUrl = 'https://api.megamarket.ru') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Client-ID': 'texno-edem-app',
            'X-Client-Version': '1.0.0'
        };
        this.requestTimeout = 30000; // 30 seconds
    }

    /**
     * Выполняет запрос к API с обработкой ошибок
     */
    async makeRequest(endpoint, data = null, method = 'POST') {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

            const options = {
                method: method,
                headers: this.headers,
                signal: controller.signal
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, message: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Проверяем наличие ошибок в ответе API
            if (result.error) {
                throw new Error(`API error: ${result.error.message || 'Unknown error'}`);
            }

            return result;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout: The request took too long to complete');
            }
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * 4.3.1 Получение новых заказов (order.new)
     * Получает список новых заказов за указанный период
     */
    async getNewOrders(dateFrom, dateTo, status = 'new', page = 1, limit = 100) {
        try {
            const data = {
                date_from: dateFrom,
                date_to: dateTo,
                status: status,
                page: page,
                limit: limit,
                include_items: true,
                include_delivery_info: true
            };

            const result = await this.makeRequest('/api/v1/order/new', data);
            
            // Преобразуем ответ в единый формат
            const orders = result.orders || result.data?.orders || [];
            
            return orders.map(order => this.normalizeOrder(order));
        } catch (error) {
            console.error('Error fetching new orders:', error);
            throw new Error(`Failed to fetch new orders: ${error.message}`);
        }
    }

    /**
     * 4.3.2 Отмена заказа (order.cancel)
     * Отменяет заказ с указанием причины
     */
    async cancelOrder(orderId, reason, comment = '') {
        try {
            const data = {
                order_id: orderId,
                reason: reason,
                comment: comment,
                cancel_type: 'merchant'
            };

            const result = await this.makeRequest('/api/v1/order/cancel', data);
            
            // Проверяем успешность отмены
            if (result.success !== true && result.status !== 'success') {
                throw new Error(result.message || 'Failed to cancel order');
            }

            return {
                success: true,
                requestId: result.request_id,
                message: result.message || 'Order cancelled successfully'
            };
        } catch (error) {
            console.error('Error canceling order:', error);
            throw new Error(`Failed to cancel order: ${error.message}`);
        }
    }

    /**
     * 4.3.3 Получение результата отмены (order.cancelresult)
     * Проверяет статус запроса на отмену заказа
     */
    async getCancelResult(requestId) {
        try {
            const data = {
                request_id: requestId
            };

            const result = await this.makeRequest('/api/v1/order/cancelresult', data);
            
            return {
                status: result.status,
                message: result.message,
                cancelled: result.cancelled || false,
                error: result.error
            };
        } catch (error) {
            console.error('Error getting cancel result:', error);
            throw new Error(`Failed to get cancel result: ${error.message}`);
        }
    }

    /**
     * 4.3.4 Упаковка заказа (order.packing)
     * Подтверждает упаковку заказа с информацией о товарах
     */
    async packOrder(orderId, packages, shipmentDate = null) {
        try {
            const data = {
                order_id: orderId,
                packages: packages.map(pkg => ({
                    items: pkg.items || [{
                        item_id: pkg.item_id,
                        quantity: pkg.quantity
                    }],
                    weight: pkg.weight,
                    dimensions: pkg.dimensions ? {
                        length: pkg.dimensions.length,
                        width: pkg.dimensions.width,
                        height: pkg.dimensions.height
                    } : undefined
                })),
                shipment_date: shipmentDate || new Date().toISOString().split('T')[0]
            };

            // Удаляем undefined поля
            Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

            const result = await this.makeRequest('/api/v1/order/packing', data);
            
            if (result.success !== true && result.status !== 'success') {
                throw new Error(result.message || 'Failed to pack order');
            }

            return {
                success: true,
                packed_at: new Date().toISOString(),
                packages_count: packages.length
            };
        } catch (error) {
            console.error('Error packing order:', error);
            throw new Error(`Failed to pack order: ${error.message}`);
        }
    }

    /**
     * 4.3.5 Закрытие заказа (order.close)
     * Подтверждает отгрузку заказа
     */
    async closeOrder(orderId, shipmentDate, trackingNumber = null) {
        try {
            const data = {
                order_id: orderId,
                shipment_date: shipmentDate,
                tracking_number: trackingNumber
            };

            // Удаляем undefined поля
            Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

            const result = await this.makeRequest('/api/v1/order/close', data);
            
            if (result.success !== true && result.status !== 'success') {
                throw new Error(result.message || 'Failed to close order');
            }

            return {
                success: true,
                closed_at: new Date().toISOString(),
                shipment_date: shipmentDate
            };
        } catch (error) {
            console.error('Error closing order:', error);
            throw new Error(`Failed to close order: ${error.message}`);
        }
    }

    /**
     * 4.3.6 Отклонение заказа (order.reject)
     * Отклоняет заказ с указанием причины
     */
    async rejectOrder(orderId, reason, details = '') {
        try {
            const data = {
                order_id: orderId,
                reason: reason,
                details: details,
                reject_type: 'merchant'
            };

            const result = await this.makeRequest('/api/v1/order/reject', data);
            
            if (result.success !== true && result.status !== 'success') {
                throw new Error(result.message || 'Failed to reject order');
            }

            return {
                success: true,
                rejected_at: new Date().toISOString(),
                reason: reason
            };
        } catch (error) {
            console.error('Error rejecting order:', error);
            throw new Error(`Failed to reject order: ${error.message}`);
        }
    }

    /**
     * 4.3.7 Подтверждение заказа с изменением даты доставки (order.confirm)
     * Подтверждает заказ и устанавливает новую дату доставки
     */
    async confirmOrderWithNewDate(orderId, newDeliveryDate, reason = '') {
        try {
            const data = {
                order_id: orderId,
                new_delivery_date: newDeliveryDate,
                reason: reason || 'Standard delivery confirmation'
            };

            const result = await this.makeRequest('/api/v1/order/confirm', data);
            
            if (result.success !== true && result.status !== 'success') {
                throw new Error(result.message || 'Failed to confirm order with new date');
            }

            return {
                success: true,
                confirmed_at: new Date().toISOString(),
                new_delivery_date: newDeliveryDate
            };
        } catch (error) {
            console.error('Error confirming order with new date:', error);
            throw new Error(`Failed to confirm order with new date: ${error.message}`);
        }
    }

    /**
     * 4.3.8 Получение информации по отправлению (order.get)
     * Получает детальную информацию о конкретном заказе
     */
    async getOrderInfo(orderId, includeItems = true, includeDelivery = true) {
        try {
            const data = {
                order_id: orderId,
                include_items: includeItems,
                include_delivery_info: includeDelivery,
                include_status_history: true,
                include_financial_info: true
            };

            const result = await this.makeRequest('/api/v1/order/get', data);
            
            const order = result.order || result.data;
            if (!order) {
                throw new Error('Order not found');
            }

            return this.normalizeOrder(order);
        } catch (error) {
            console.error('Error getting order info:', error);
            throw new Error(`Failed to get order info: ${error.message}`);
        }
    }

    /**
     * 4.3.9 Поиск отправлений по критериям (order.search)
     * Ищет заказы по различным критериям
     */
    async searchOrders(criteria) {
        try {
            const defaultCriteria = {
                page: 1,
                limit: 50,
                include_items: true,
                include_delivery_info: true,
                sort_by: 'created_date',
                sort_order: 'desc'
            };

            const searchData = { ...defaultCriteria, ...criteria };
            
            const result = await this.makeRequest('/api/v1/order/search', searchData);
            
            const orders = result.orders || result.data?.orders || [];
            const pagination = result.pagination || result.data?.pagination;
            
            return {
                orders: orders.map(order => this.normalizeOrder(order)),
                pagination: {
                    page: pagination?.page || searchData.page,
                    limit: pagination?.limit || searchData.limit,
                    total: pagination?.total || orders.length,
                    pages: pagination?.pages || Math.ceil(orders.length / searchData.limit)
                }
            };
        } catch (error) {
            console.error('Error searching orders:', error);
            throw new Error(`Failed to search orders: ${error.message}`);
        }
    }

    /**
     * Дополнительный метод: Получение истории статусов заказа
     */
    async getOrderStatusHistory(orderId) {
        try {
            const data = {
                order_id: orderId
            };

            const result = await this.makeRequest('/api/v1/order/status-history', data);
            
            return result.status_history || result.data?.status_history || [];
        } catch (error) {
            console.error('Error getting order status history:', error);
            throw new Error(`Failed to get order status history: ${error.message}`);
        }
    }

    /**
     * Дополнительный метод: Получение доступных действий для заказа
     */
    async getAvailableActions(orderId) {
        try {
            const orderInfo = await this.getOrderInfo(orderId, false, false);
            return this.calculateAvailableActions(orderInfo.status);
        } catch (error) {
            console.error('Error getting available actions:', error);
            return [];
        }
    }

    /**
     * Аналитика на основе данных Megamarket
     */
    async getAnalytics(dateFrom, dateTo, groupBy = 'day') {
        try {
            const searchResult = await this.searchOrders({
                date_from: dateFrom,
                date_to: dateTo,
                limit: 1000 // Увеличиваем лимит для аналитики
            });

            const orders = searchResult.orders;
            
            const analytics = {
                totalOrders: orders.length,
                totalRevenue: 0,
                averageOrderValue: 0,
                successfulOrders: 0,
                cancelledOrders: 0,
                pendingOrders: 0,
                statusDistribution: {},
                dailySales: {},
                categoryDistribution: {},
                revenueByStatus: {},
                timelineData: {}
            };

            orders.forEach(order => {
                // Расчет выручки
                const orderAmount = order.total_amount || 0;
                if (order.status === 'delivered' || order.status === 'completed' || order.status === 'shipped') {
                    analytics.totalRevenue += orderAmount;
                    analytics.successfulOrders++;
                }
                
                if (order.status === 'cancelled' || order.status === 'rejected') {
                    analytics.cancelledOrders++;
                }

                if (order.status === 'new' || order.status === 'confirmed' || order.status === 'packed') {
                    analytics.pendingOrders++;
                }

                // Распределение по статусам
                analytics.statusDistribution[order.status] = 
                    (analytics.statusDistribution[order.status] || 0) + 1;

                // Выручка по статусам
                analytics.revenueByStatus[order.status] = 
                    (analytics.revenueByStatus[order.status] || 0) + orderAmount;

                // Ежедневные продажи
                const orderDate = order.created_date.split('T')[0];
                if (order.status === 'delivered' || order.status === 'completed') {
                    analytics.dailySales[orderDate] = 
                        (analytics.dailySales[orderDate] || 0) + orderAmount;
                }

                // Распределение по категориям
                if (order.items) {
                    order.items.forEach(item => {
                        const category = item.category || 'unknown';
                        analytics.categoryDistribution[category] = 
                            (analytics.categoryDistribution[category] || 0) + 1;
                    });
                }

                // Данные для временной шкалы
                const weekKey = this.getWeekKey(order.created_date);
                analytics.timelineData[weekKey] = analytics.timelineData[weekKey] || {
                    orders: 0,
                    revenue: 0
                };
                analytics.timelineData[weekKey].orders++;
                if (order.status === 'delivered' || order.status === 'completed') {
                    analytics.timelineData[weekKey].revenue += orderAmount;
                }
            });

            // Средний чек
            analytics.averageOrderValue = analytics.successfulOrders > 0 
                ? analytics.totalRevenue / analytics.successfulOrders 
                : 0;

            // Процент успешных заказов (из CDEK)
            analytics.successRate = await this.calculateSuccessRate(orders);

            // Дополнительные метрики
            analytics.cancellationRate = analytics.totalOrders > 0 
                ? (analytics.cancelledOrders / analytics.totalOrders) * 100 
                : 0;

            analytics.conversionRate = analytics.totalOrders > 0 
                ? (analytics.successfulOrders / analytics.totalOrders) * 100 
                : 0;

            return analytics;
        } catch (error) {
            console.error('Error generating analytics:', error);
            throw new Error(`Failed to generate analytics: ${error.message}`);
        }
    }

    /**
     * Расчет процента успешных продаж (интеграция с CDEK)
     */
    async calculateSuccessRate(orders) {
        try {
            // Здесь должна быть интеграция с CDEK для получения реальных данных о доставках
            // Временно используем эмуляцию на основе статусов Megamarket
            
            const deliveredOrders = orders.filter(order => 
                order.status === 'delivered' || order.status === 'completed'
            ).length;
            
            const totalProcessedOrders = orders.filter(order => 
                order.status !== 'new' && order.status !== 'cancelled'
            ).length;

            return totalProcessedOrders > 0 ? (deliveredOrders / totalProcessedOrders) * 100 : 0;
        } catch (error) {
            console.error('Error calculating success rate:', error);
            return 0;
        }
    }

    /**
     * Нормализация данных заказа к единому формату
     */
    normalizeOrder(order) {
        return {
            id: order.id || order.order_id,
            external_id: order.external_id,
            status: order.status,
            created_date: order.created_date || order.created_at,
            updated_date: order.updated_date || order.updated_at,
            total_amount: order.total_amount || order.amount,
            currency: order.currency || 'RUB',
            items: (order.items || []).map(item => ({
                id: item.id || item.item_id,
                sku: item.sku,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total_price: item.total_price || (item.price * item.quantity),
                category: item.category,
                vendor: item.vendor
            })),
            delivery_info: order.delivery_info || {
                address: order.delivery_address,
                recipient: order.recipient_name,
                phone: order.recipient_phone,
                delivery_date: order.delivery_date,
                delivery_type: order.delivery_type
            },
            payment_info: order.payment_info || {
                method: order.payment_method,
                status: order.payment_status
            },
            customer_info: order.customer_info || {
                name: order.customer_name,
                phone: order.customer_phone,
                email: order.customer_email
            }
        };
    }

    /**
     * Расчет доступных действий для статуса заказа
     */
    calculateAvailableActions(status) {
        const actions = {
            'new': ['confirm', 'cancel', 'reject', 'view'],
            'confirmed': ['pack', 'cancel', 'view'],
            'packed': ['ship', 'view'],
            'shipped': ['view'],
            'delivered': ['view'],
            'completed': ['view'],
            'cancelled': ['view'],
            'rejected': ['view']
        };

        return actions[status] || ['view'];
    }

    /**
     * Вспомогательный метод для группировки по неделям
     */
    getWeekKey(dateString) {
        const date = new Date(dateString);
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((days + 1) / 7);
        return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    }

    /**
     * Проверка подключения к API
     */
    async testConnection() {
        try {
            const result = await this.makeRequest('/api/v1/ping', {}, 'GET');
            return {
                connected: true,
                message: 'Connection successful',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                connected: false,
                message: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Получение лимитов API
     */
    async getApiLimits() {
        try {
            const result = await this.makeRequest('/api/v1/limits', {}, 'GET');
            return result.limits || {};
        } catch (error) {
            console.error('Error getting API limits:', error);
            return {};
        }
    }

    /**
     * Пакетная обработка заказов
     */
    async processOrdersBatch(orders, action, additionalData = {}) {
        const results = {
            successful: [],
            failed: []
        };

        for (const order of orders) {
            try {
                let result;
                
                switch (action) {
                    case 'confirm':
                        result = await this.confirmOrderWithNewDate(
                            order.id, 
                            additionalData.deliveryDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        );
                        break;
                    case 'pack':
                        const packages = order.items.map(item => ({
                            item_id: item.id,
                            quantity: item.quantity
                        }));
                        result = await this.packOrder(order.id, packages);
                        break;
                    case 'ship':
                        result = await this.closeOrder(order.id, new Date().toISOString().split('T')[0]);
                        break;
                    case 'cancel':
                        result = await this.cancelOrder(order.id, additionalData.reason || 'batch_cancellation');
                        break;
                    default:
                        throw new Error(`Unknown action: ${action}`);
                }

                results.successful.push({
                    orderId: order.id,
                    result: result
                });
            } catch (error) {
                results.failed.push({
                    orderId: order.id,
                    error: error.message
                });
            }

            // Задержка между запросами чтобы не превысить лимиты API
            await this.delay(100);
        }

        return results;
    }

    /**
     * Вспомогательная функция задержки
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MegamarketService;
}
