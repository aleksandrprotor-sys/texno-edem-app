// js/utils/error-handler.js
class ErrorHandler {
    constructor(app) {
        this.app = app;
        this.setupGlobalHandlers();
        console.log('✅ ErrorHandler инициализирован');
    }

    setupGlobalHandlers() {
        // Глобальный обработчик ошибок
        window.addEventListener('error', (event) => {
            this.handleError(event.error, 'Global Error', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Обработчик unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'Unhandled Promise Rejection');
        });

        // Обработчик ошибок загрузки ресурсов
        window.addEventListener('error', (event) => {
            if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                this.handleResourceError(event);
            }
        }, true);

        // Обработчик ошибок XHR/Fetch
        this.interceptFetchErrors();
    }

    handleError(error, context = 'Unknown', extraInfo = {}) {
        console.error(`[${context}]`, error, extraInfo);

        const errorInfo = {
            message: error?.message || 'Unknown error',
            stack: error?.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            extra: extraInfo
        };

        // Сохраняем ошибку для последующего анализа
        this.logError(errorInfo);

        // Показываем пользователю понятное сообщение
        this.showUserFriendlyError(error, context);

        // Отправляем в аналитику если настроено
        this.sendToAnalytics(errorInfo);
    }

    showUserFriendlyError(error, context) {
        let userMessage = 'Произошла непредвиденная ошибка';
        let type = 'error';

        if (!error) {
            userMessage = 'Неизвестная ошибка';
        } else if (error.message.includes('network') || error.message.includes('Network')) {
            userMessage = 'Проблемы с интернет-соединением. Проверьте подключение.';
            type = 'warning';
        } else if (error.message.includes('timeout')) {
            userMessage = 'Превышено время ожидания ответа от сервера.';
            type = 'warning';
        } else if (error.message.includes('API') || error.message.includes('api')) {
            userMessage = 'Ошибка соединения с сервером. Попробуйте позже.';
            type = 'warning';
        } else if (error.message.includes('quota') || error.message.includes('storage')) {
            userMessage = 'Недостаточно места для хранения данных.';
            type = 'warning';
        } else if (error.message.includes('syntax') || error.message.includes('parse')) {
            userMessage = 'Ошибка обработки данных.';
            type = 'error';
        }

        if (this.app && this.app.showNotification) {
            this.app.showNotification(userMessage, type);
        }
    }

    handleResourceError(event) {
        const resourceType = event.target.tagName.toLowerCase();
        const resourceUrl = event.target.src || event.target.href;
        
        this.handleError(
            new Error(`Failed to load ${resourceType}: ${resourceUrl}`),
            'Resource Error',
            { resourceType, resourceUrl }
        );
    }

    interceptFetchErrors() {
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            return originalFetch.apply(this, args)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response;
                })
                .catch(error => {
                    this.handleError(error, 'Fetch Error', {
                        url: args[0],
                        options: args[1]
                    });
                    throw error;
                });
        };
    }

    logError(errorInfo) {
        try {
            const existingLogs = JSON.parse(localStorage.getItem('texno_edem_error_logs') || '[]');
            existingLogs.push(errorInfo);
            
            // Сохраняем только последние 100 ошибок
            if (existingLogs.length > 100) {
                existingLogs.splice(0, existingLogs.length - 100);
            }
            
            localStorage.setItem('texno_edem_error_logs', JSON.stringify(existingLogs));
        } catch (e) {
            console.warn('Не удалось сохранить ошибку в лог:', e);
        }
    }

    sendToAnalytics(errorInfo) {
        // Здесь можно интегрировать с сервисами аналитики
        // Например: Google Analytics, Sentry, etc.
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: errorInfo.message,
                fatal: false
            });
        }
    }

    getErrorLogs() {
        try {
            return JSON.parse(localStorage.getItem('texno_edem_error_logs') || '[]');
        } catch (e) {
            return [];
        }
    }

    clearErrorLogs() {
        try {
            localStorage.removeItem('texno_edem_error_logs');
            return true;
        } catch (e) {
            console.error('Ошибка очистки логов:', e);
            return false;
        }
    }

    getErrorStats() {
        const logs = this.getErrorLogs();
        const stats = {
            total: logs.length,
            byContext: {},
            byDay: {},
            recent: logs.slice(-10)
        };

        logs.forEach(log => {
            // Группировка по контексту
            stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
            
            // Группировка по дням
            const day = log.timestamp.split('T')[0];
            stats.byDay[day] = (stats.byDay[day] || 0) + 1;
        });

        return stats;
    }

    // ВАЛИДАЦИЯ ДАННЫХ
    validateOrderData(order) {
        const requiredFields = ['id', 'platform', 'orderNumber', 'status', 'amount'];
        const errors = [];

        for (const field of requiredFields) {
            if (!order[field]) {
                errors.push(`Отсутствует обязательное поле: ${field}`);
            }
        }

        if (!['cdek', 'megamarket'].includes(order.platform)) {
            errors.push(`Неизвестная платформа: ${order.platform}`);
        }

        if (typeof order.amount !== 'number' || order.amount < 0) {
            errors.push(`Некорректная сумма: ${order.amount}`);
        }

        if (errors.length > 0) {
            this.handleError(
                new Error(`Invalid order data: ${errors.join(', ')}`),
                'Data Validation',
                { order, errors }
            );
            return false;
        }

        return true;
    }

    validateSettings(settings) {
        const errors = [];

        if (settings.api) {
            if (settings.api.cdek && !this.isValidApiKey(settings.api.cdek.apiKey)) {
                errors.push('Некорректный API ключ CDEK');
            }
            if (settings.api.megamarket && !this.isValidApiKey(settings.api.megamarket.apiKey)) {
                errors.push('Некорректный API ключ Мегамаркет');
            }
        }

        if (errors.length > 0) {
            this.handleError(
                new Error(`Invalid settings: ${errors.join(', ')}`),
                'Settings Validation',
                { settings, errors }
            );
            return false;
        }

        return true;
    }

    isValidApiKey(key) {
        if (!key) return true; // Пустой ключ допустим (не настроен)
        return typeof key === 'string' && key.length > 0;
    }

    // ВОССТАНОВЛЕНИЕ ПРИ СБОЯХ
    recoverFromStorageError() {
        try {
            // Пытаемся восстановить критичные данные
            const criticalData = ['texno_edem_config', 'texno_edem_settings'];
            
            criticalData.forEach(key => {
                try {
                    localStorage.getItem(key);
                } catch (e) {
                    console.warn(`Ошибка доступа к ${key}, очищаем...`);
                    localStorage.removeItem(key);
                }
            });

            return true;
        } catch (error) {
            console.error('Критическая ошибка восстановления:', error);
            return false;
        }
    }

    // МОНИТОРИНГ ПРОИЗВОДИТЕЛЬНОСТИ
    startPerformanceMonitoring() {
        if ('performance' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 1000) { // Дольше 1 секунды
                        this.handleError(
                            new Error(`Performance issue: ${entry.name} took ${entry.duration}ms`),
                            'Performance',
                            { entry: entry.toJSON() }
                        );
                    }
                });
            });

            try {
                observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
            } catch (e) {
                console.warn('PerformanceObserver не поддерживается');
            }
        }
    }
}
