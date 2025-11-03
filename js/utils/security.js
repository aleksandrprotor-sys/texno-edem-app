class SecurityManager {
    static sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    static validateOrderData(order) {
        const required = ['id', 'platform', 'status'];
        const missing = required.filter(field => !order[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        // Проверка типов данных
        if (typeof order.cost === 'number' && order.cost < 0) {
            throw new Error('Invalid cost value');
        }

        return true;
    }

    static detectXSS(input) {
        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi
        ];

        return xssPatterns.some(pattern => pattern.test(input));
    }

    static rateLimit(key, maxRequests, timeWindow) {
        const now = Date.now();
        const requests = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]');
        
        // Удаляем старые запросы
        const recentRequests = requests.filter(time => now - time < timeWindow);
        
        if (recentRequests.length >= maxRequests) {
            return false; // Лимит превышен
        }
        
        recentRequests.push(now);
        localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentRequests));
        return true;
    }
}
