class MegamarketService {
    constructor(apiKey, baseUrl = 'https://api.megamarket.ru') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };
    }

    // 4.3.1 Получение новых заказов
    async getNewOrders(dateFrom, dateTo, status = 'new') {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/orders`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    date_from: dateFrom,
                    date_to: dateTo,
                    status: status
                })
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            return data.orders || [];
        } catch (error) {
            console.error('Error fetching new orders:', error);
            throw error;
        }
    }

    // 4.3.2 Отмена заказа
    async cancelOrder(orderId, reason) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/order/cancel`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    order_id: orderId,
                    reason: reason
                })
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('Error canceling order:', error);
            throw error;
        }
    }

    // 4.3.3 Получение результата отмены
    async getCancelResult(requestId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/order/cancelresult`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    request_id: requestId
                })
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('Error getting cancel result:', error);
            throw error;
        }
    }

    // 4.3.4 Упаковка заказа
    async packOrder(orderId, packages) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/order/packing`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    order_id: orderId,
                    packages: packages
                })
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('Error packing order:', error);
            throw error;
        }
    }

    // 4.3.5 Закрытие заказа (отгрузка)
    async closeOrder(orderId, shipmentDate) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/order/close`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    order_id: orderId,
                    shipment_date: shipmentDate
                })
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('Error closing order:', error);
            throw error;
        }
    }

    // 4.3.6 Отклонение заказа
    async rejectOrder(orderId, reason) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/order/reject`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    order_id: orderId,
                    reason: reason
                })
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('Error rejecting order:', error);
            throw error;
        }
    }

    // 4.3.7 Подтверждение заказа с изменением даты доставки
    async confirmOrderWithNewDate(orderId, newDeliveryDate) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/order/confirm`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    order_id: orderId,
                    new_delivery_date: newDeliveryDate
                })
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('Error confirming order with new date:', error);
            throw error;
        }
    }

    // 4.3.8 Получение информации по отправлению
    async getOrderInfo(orderId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/order/get`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    order_id: orderId
                })
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            return data.order || null;
        } catch (error) {
            console.error('Error getting order info:', error);
            throw error;
        }
    }

    // 4.3.9 Поиск отправлений по критериям
    async searchOrders(criteria) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/order/search`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(criteria)
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            return data.orders || [];
        } catch (error) {
            console.error('Error searching orders:', error);
            throw error;
        }
    }

    // Аналитика на основе данных Megamarket
    async getAnalytics(dateFrom, dateTo) {
        try {
            const orders = await this.searchOrders({
                date_from: dateFrom,
                date_to: dateTo
            });

            const analytics = {
                totalOrders: orders.length,
                totalRevenue: 0,
                averageOrderValue: 0,
                successfulOrders: 0,
                cancelledOrders: 0,
                statusDistribution: {},
                dailySales: {}
            };

            orders.forEach(order => {
                // Расчет выручки
                if (order.status === 'delivered' || order.status === 'completed') {
                    analytics.totalRevenue += order.total_amount || 0;
                    analytics.successfulOrders++;
                }
                
                if (order.status === 'cancelled') {
                    analytics.cancelledOrders++;
                }

                // Распределение по статусам
                analytics.statusDistribution[order.status] = 
                    (analytics.statusDistribution[order.status] || 0) + 1;

                // Ежедневные продажи
                const orderDate = order.created_date.split('T')[0];
                analytics.dailySales[orderDate] = 
                    (analytics.dailySales[orderDate] || 0) + (order.total_amount || 0);
            });

            // Средний чек
            analytics.averageOrderValue = analytics.successfulOrders > 0 
                ? analytics.totalRevenue / analytics.successfulOrders 
                : 0;

            return analytics;
        } catch (error) {
            console.error('Error generating analytics:', error);
            throw error;
        }
    }
}
