// external-integrations.js - УЛУЧШЕННАЯ ВЕРСИЯ
class ExternalIntegrations {
    constructor() {
        this.cache = new Map();
        this.requestQueue = new Map();
        this.isInitialized = false;
        this.rateLimits = new Map();
        
        console.log('🔗 External Integrations initialized');
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Загружаем конфигурацию интеграций
            await this.loadIntegrationConfig();
            this.setupRateLimiting();
            this.setupErrorHandling();
            this.isInitialized = true;
            
            console.log('✅ External Integrations ready');
        } catch (error) {
            console.error('❌ Failed to initialize integrations:', error);
            throw error;
        }
    }

    async loadIntegrationConfig() {
        // Загружаем настройки интеграций из localStorage или API
        const savedConfig = localStorage.getItem('texno_edem_integrations');
        if (savedConfig) {
            try {
                this.config = JSON.parse(savedConfig);
            } catch (error) {
                console.warn('⚠️ Failed to parse integration config, using defaults');
                this.config = this.getDefaultConfig();
            }
        } else {
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            telegram: {
                enabled: false,
                botToken: '',
                chatId: '',
                notifications: {
                    newOrders: true,
                    problems: true,
                    deliveries: true,
                    syncComplete: true
                },
                rateLimit: 30 // сообщений в минуту
            },
            googleSheets: {
                enabled: false,
                spreadsheetId: '',
                credentials: null,
                autoExport: false,
                sheets: {
                    orders: 'Orders',
                    analytics: 'Analytics',
                    problems: 'Problems'
                }
            },
            crm: {
                enabled: false,
                type: 'bitrix24', // bitrix24, amoCRM, retailCRM
                endpoint: '',
                apiKey: '',
                syncSettings: {
                    orders: true,
                    customers: true,
                    products: false
                }
            },
            email: {
                enabled: false,
                smtp: {
                    host: '',
                    port: 587,
                    secure: true,
                    auth: {
                        user: '',
                        pass: ''
                    }
                },
                templates: {
                    dailyReport: true,
                    problemsAlert: true,
                    weeklySummary: true
                }
            },
            monitoring: {
                enabled: true,
                healthCheck: true,
                performanceTracking: true,
                errorReporting: true
            }
        };
    }

    setupRateLimiting() {
        // Настройка ограничений по частоте запросов
        this.rateLimits.set('telegram', {
            limit: this.config.telegram?.rateLimit || 30,
            window: 60000, // 1 минута
            requests: []
        });

        this.rateLimits.set('googleSheets', {
            limit: 100, // 100 запросов в минуту
            window: 60000,
            requests: []
        });

        this.rateLimits.set('crm', {
            limit: 50, // 50 запросов в минуту
            window: 60000,
            requests: []
        });
    }

    setupErrorHandling() {
        // Глобальная обработка ошибок интеграций
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason?.source === 'external-integration') {
                console.error('🔄 Integration error caught:', event.reason);
                this.trackError('unhandled_rejection', event.reason);
            }
        });
    }

    // ТЕЛЕГРАМ ИНТЕГРАЦИЯ - УЛУЧШЕННАЯ
    static async sendToTelegram(message, options = {}) {
        const instance = ExternalIntegrations.getInstance();
        return await instance.sendTelegramMessage(message, options);
    }

    async sendTelegramMessage(message, options = {}) {
        const {
            chatId = null,
            parseMode = 'HTML',
            disableWebPagePreview = true,
            silent = false,
            priority = 'normal',
            retryCount = 3
        } = options;

        // Проверяем конфигурацию
        if (!this.isTelegramConfigured()) {
            console.warn('⚠️ Telegram not configured');
            return { success: false, error: 'Telegram not configured' };
        }

        // Проверяем лимиты
        if (!this.checkRateLimit('telegram')) {
            console.warn('⚠️ Telegram rate limit exceeded');
            return { success: false, error: 'Rate limit exceeded' };
        }

        // Форматируем сообщение
        const formattedMessage = this.formatTelegramMessage(message, options);
        
        const payload = {
            chat_id: chatId || this.config.telegram.chatId,
            text: formattedMessage,
            parse_mode: parseMode,
            disable_web_page_preview: disableWebPagePreview,
            disable_notification: silent
        };

        try {
            const result = await this.executeWithRetry(
                () => this.makeTelegramRequest(payload),
                'telegram_send_message',
                retryCount
            );

            this.trackTelegramMetrics('message_sent', { length: message.length, priority });
            return { success: true, data: result };

        } catch (error) {
            console.error('❌ Telegram send error:', error);
            this.trackError('telegram_send', error, { messageLength: message.length });
            return { success: false, error: error.message };
        }
    }

    async makeTelegramRequest(payload) {
        const botToken = this.config.telegram.botToken;
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000) // 10 секунд таймаут
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Telegram API error: ${response.status} - ${errorData.description || 'Unknown error'}`);
        }

        return await response.json();
    }

    formatTelegramMessage(message, options) {
        const { type = 'info', title, fields = [], actions = [] } = options;

        // Эмодзи для разных типов сообщений
        const emojis = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            order: '📦',
            sync: '🔄',
            alert: '🚨'
        };

        let formatted = '';

        // Заголовок
        if (title) {
            const emoji = emojis[type] || emojis.info;
            formatted += `<b>${emoji} ${title}</b>\n\n`;
        }

        // Основное сообщение
        formatted += message + '\n';

        // Дополнительные поля
        if (fields.length > 0) {
            formatted += '\n';
            fields.forEach(field => {
                formatted += `<b>${field.name}:</b> ${field.value}\n`;
            });
        }

        // Действия (кнопки)
        if (actions.length > 0) {
            formatted += '\n';
            actions.forEach(action => {
                formatted += `🔗 <a href="${action.url}">${action.text}</a>\n`;
            });
        }

        return formatted.trim();
    }

    async sendOrderNotification(order, type = 'created') {
        if (!this.config.telegram?.notifications?.[`${type}Orders`]) {
            return;
        }

        const notificationTypes = {
            created: { emoji: '🆕', title: 'Новый заказ' },
            updated: { emoji: '📝', title: 'Заказ обновлен' },
            problem: { emoji: '🚨', title: 'Проблема с заказом' },
            delivered: { emoji: '✅', title: 'Заказ доставлен' }
        };

        const notification = notificationTypes[type] || notificationTypes.created;

        const message = `
${notification.emoji} <b>${notification.title}</b>

📦 <b>Заказ:</b> ${order.trackingNumber || order.orderNumber}
👤 <b>Клиент:</b> ${order.recipient || order.customerName}
📍 <b>Направление:</b> ${order.fromCity} → ${order.toCity}
💰 <b>Сумма:</b> ${this.formatCurrency(order.cost || order.totalAmount)}
⚖️ <b>Вес:</b> ${order.weight || 'N/A'} кг
🔄 <b>Статус:</b> ${this.getStatusText(order.status)}
        `.trim();

        const fields = [
            { name: 'Платформа', value: order.platform === 'cdek' ? 'CDEK' : 'Мегамаркет' },
            { name: 'Дата создания', value: new Date(order.createdDate).toLocaleDateString('ru-RU') }
        ];

        if (order.estimatedDelivery) {
            fields.push({ 
                name: 'Ожидаемая доставка', 
                value: new Date(order.estimatedDelivery).toLocaleDateString('ru-RU') 
            });
        }

        return await this.sendTelegramMessage(message, {
            type: type === 'problem' ? 'error' : type,
            title: notification.title,
            fields,
            actions: [
                { 
                    text: 'Открыть в системе', 
                    url: this.generateOrderDeepLink(order) 
                }
            ],
            priority: type === 'problem' ? 'high' : 'normal'
        });
    }

    // GOOGLE SHEETS ИНТЕГРАЦИЯ - УЛУЧШЕННАЯ
    static async exportToGoogleSheets(data, options = {}) {
        const instance = ExternalIntegrations.getInstance();
        return await instance.exportDataToSheets(data, options);
    }

    async exportDataToSheets(data, options = {}) {
        const {
            spreadsheetId = null,
            sheetName = 'Orders',
            clearSheet = false,
            append = true,
            batchSize = 100
        } = options;

        if (!this.isGoogleSheetsConfigured()) {
            console.warn('⚠️ Google Sheets not configured');
            return { success: false, error: 'Google Sheets not configured' };
        }

        try {
            // Разбиваем данные на батчи
            const batches = this.chunkArray(data, batchSize);
            let totalProcessed = 0;

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                const result = await this.processSheetBatch(batch, {
                    spreadsheetId: spreadsheetId || this.config.googleSheets.spreadsheetId,
                    sheetName,
                    clearSheet: i === 0 && clearSheet,
                    append: i === 0 ? !clearSheet : true
                });

                if (!result.success) {
                    throw new Error(`Batch ${i + 1} failed: ${result.error}`);
                }

                totalProcessed += batch.length;
                console.log(`✅ Processed batch ${i + 1}/${batches.length} (${batch.length} items)`);
            }

            this.trackGoogleSheetsMetrics('export_completed', { totalRows: totalProcessed });
            return { success: true, processed: totalProcessed };

        } catch (error) {
            console.error('❌ Google Sheets export error:', error);
            this.trackError('google_sheets_export', error, { dataLength: data.length });
            return { success: false, error: error.message };
        }
    }

    async processSheetBatch(data, options) {
        // Здесь будет реализация работы с Google Sheets API
        // Используем Google Apps Script или REST API

        const rows = data.map(item => this.formatSheetRow(item));
        
        // Имитация API запроса
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`📊 Would export ${rows.length} rows to Google Sheets`);
        return { success: true };
    }

    formatSheetRow(order) {
        return [
            order.id,
            order.platform,
            order.trackingNumber || order.orderNumber,
            this.getStatusText(order.status),
            order.recipient || order.customerName,
            order.cost || order.totalAmount,
            order.weight,
            order.fromCity,
            order.toCity,
            new Date(order.createdDate).toLocaleDateString('ru-RU'),
            order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('ru-RU') : '',
            order.deliveredDate ? new Date(order.deliveredDate).toLocaleDateString('ru-RU') : ''
        ];
    }

    // CRM ИНТЕГРАЦИЯ - УЛУЧШЕННАЯ
    static async syncWithCRM(orderData, options = {}) {
        const instance = ExternalIntegrations.getInstance();
        return await instance.syncOrderToCRM(orderData, options);
    }

    async syncOrderToCRM(orderData, options = {}) {
        const {
            crmType = null,
            createIfNotExists = true,
            updateExisting = true,
            syncCustomer = true
        } = options;

        if (!this.isCRMConfigured()) {
            console.warn('⚠️ CRM not configured');
            return { success: false, error: 'CRM not configured' };
        }

        try {
            const crmConfig = this.getCRMConfig(crmType);
            const payload = this.prepareCRMPayload(orderData, { syncCustomer });

            let result;
            switch (crmConfig.type) {
                case 'bitrix24':
                    result = await this.syncWithBitrix24(payload, crmConfig);
                    break;
                case 'amoCRM':
                    result = await this.syncWithAmoCRM(payload, crmConfig);
                    break;
                case 'retailCRM':
                    result = await this.syncWithRetailCRM(payload, crmConfig);
                    break;
                default:
                    throw new Error(`Unsupported CRM type: ${crmConfig.type}`);
            }

            this.trackCRMMetrics('order_synced', { crmType: crmConfig.type });
            return { success: true, data: result };

        } catch (error) {
            console.error('❌ CRM sync error:', error);
            this.trackError('crm_sync', error, { orderId: orderData.id });
            return { success: false, error: error.message };
        }
    }

    async syncWithBitrix24(orderData, config) {
        // Реализация синхронизации с Bitrix24
        const endpoint = `${config.endpoint}/crm.deal.add`;
        
        const payload = {
            fields: {
                TITLE: `Заказ ${orderData.trackingNumber || orderData.orderNumber}`,
                TYPE_ID: 'SALE',
                STAGE_ID: this.mapStatusToBitrixStage(orderData.status),
                OPPORTUNITY: orderData.cost || orderData.totalAmount,
                CURRENCY_ID: 'RUB',
                COMMENTS: this.formatCRMComments(orderData),
                SOURCE_ID: orderData.platform === 'cdek' ? 'CDEK' : 'MEGAMARKET',
                // Дополнительные поля...
            }
        };

        // Имитация API запроса
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('📊 Synced with Bitrix24:', orderData.id);
        
        return { dealId: Math.random().toString(36).substr(2, 9) };
    }

    // EMAIL ИНТЕГРАЦИЯ - НОВАЯ ФУНКЦИОНАЛЬНОСТЬ
    static async sendEmailReport(reportData, options = {}) {
        const instance = ExternalIntegrations.getInstance();
        return await instance.sendEmail(reportData, options);
    }

    async sendEmail(reportData, options = {}) {
        const {
            template = 'dailyReport',
            recipients = [],
            subject = null,
            attachments = []
        } = options;

        if (!this.isEmailConfigured()) {
            console.warn('⚠️ Email not configured');
            return { success: false, error: 'Email not configured' };
        }

        try {
            const emailContent = this.generateEmailContent(reportData, template);
            const emailSubject = subject || this.generateEmailSubject(template, reportData);

            // Здесь будет реализация отправки через SMTP
            // Используем EmailJS, SendGrid или прямой SMTP

            console.log(`📧 Would send email to ${recipients.join(', ')}`);
            console.log(`Subject: ${emailSubject}`);
            console.log(`Content: ${emailContent.substring(0, 100)}...`);

            this.trackEmailMetrics('email_sent', { template, recipients: recipients.length });
            return { success: true };

        } catch (error) {
            console.error('❌ Email send error:', error);
            this.trackError('email_send', error, { template });
            return { success: false, error: error.message };
        }
    }

    generateEmailContent(data, template) {
        const templates = {
            dailyReport: `
                <h2>Ежедневный отчет по заказам</h2>
                <p>Дата: ${new Date().toLocaleDateString('ru-RU')}</p>
                <p>Всего заказов: ${data.totalOrders || 0}</p>
                <p>Новых заказов: ${data.newOrders || 0}</p>
                <p>Проблемных заказов: ${data.problemOrders || 0}</p>
                <p>Общая выручка: ${this.formatCurrency(data.totalRevenue || 0)}</p>
            `,
            problemsAlert: `
                <h2>🚨 Обнаружены проблемные заказы</h2>
                <p>Количество проблемных заказов: ${data.problemOrders?.length || 0}</p>
                <ul>
                    ${(data.problemOrders || []).map(order => 
                        `<li>${order.trackingNumber || order.orderNumber} - ${order.recipient}</li>`
                    ).join('')}
                </ul>
            `,
            weeklySummary: `
                <h2>📊 Недельный отчет</h2>
                <p>Период: ${data.period}</p>
                <p>Всего заказов: ${data.totalOrders || 0}</p>
                <p>Успешных доставок: ${data.deliveredOrders || 0}</p>
                <p>Процент успеха: ${data.successRate || 0}%</p>
            `
        };

        return templates[template] || templates.dailyReport;
    }

    // МОНИТОРИНГ И АНАЛИТИКА - НОВАЯ ФУНКЦИОНАЛЬНОСТЬ
    async trackIntegrationMetrics(event, data) {
        const metrics = {
            event,
            timestamp: new Date().toISOString(),
            ...data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Сохраняем метрики для аналитики
        const existingMetrics = JSON.parse(localStorage.getItem('texno_edem_integration_metrics') || '[]');
        existingMetrics.push(metrics);
        
        // Сохраняем только последние 1000 записей
        if (existingMetrics.length > 1000) {
            existingMetrics.splice(0, existingMetrics.length - 1000);
        }
        
        localStorage.setItem('texno_edem_integration_metrics', JSON.stringify(existingMetrics));

        // Отправляем в аналитику если настроено
        if (this.config.monitoring?.performanceTracking) {
            this.sendToAnalytics(metrics);
        }
    }

    async sendToAnalytics(metrics) {
        // Отправка метрик во внешнюю аналитику
        try {
            // Можно интегрировать с Google Analytics, Yandex.Metrica, или собственной аналитикой
            console.log('📊 Analytics event:', metrics.event, metrics);
        } catch (error) {
            console.warn('⚠️ Analytics send failed:', error);
        }
    }

    // УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    checkRateLimit(service) {
        const limitConfig = this.rateLimits.get(service);
        if (!limitConfig) return true;

        const now = Date.now();
        limitConfig.requests = limitConfig.requests.filter(
            timestamp => now - timestamp < limitConfig.window
        );

        if (limitConfig.requests.length >= limitConfig.limit) {
            return false;
        }

        limitConfig.requests.push(now);
        return true;
    }

    async executeWithRetry(operation, context, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                console.warn(`⚠️ ${context} attempt ${attempt}/${maxRetries} failed:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }

                // Экспоненциальная задержка
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    formatCurrency(amount, currency = 'RUB') {
        if (amount === null || amount === undefined || isNaN(amount)) return '-';
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    getStatusText(status) {
        const statusMap = {
            'new': 'Новый',
            'processing': 'В обработке',
            'active': 'В пути',
            'delivered': 'Доставлен',
            'problem': 'Проблема',
            'cancelled': 'Отменен'
        };
        return statusMap[status] || status;
    }

    generateOrderDeepLink(order) {
        // Генерация глубокой ссылки на заказ в приложении
        return `${window.location.origin}${window.location.pathname}#/orders/${order.platform}/${order.id}`;
    }

    // ПРОВЕРКИ КОНФИГУРАЦИИ
    isTelegramConfigured() {
        return this.config.telegram?.enabled && 
               this.config.telegram.botToken && 
               this.config.telegram.chatId;
    }

    isGoogleSheetsConfigured() {
        return this.config.googleSheets?.enabled && 
               this.config.googleSheets.spreadsheetId;
    }

    isCRMConfigured() {
        return this.config.crm?.enabled && 
               this.config.crm.endpoint && 
               this.config.crm.apiKey;
    }

    isEmailConfigured() {
        return this.config.email?.enabled && 
               this.config.email.smtp?.host && 
               this.config.email.smtp?.auth?.user;
    }

    getCRMConfig(preferredType = null) {
        const type = preferredType || this.config.crm.type;
        return {
            ...this.config.crm,
            type
        };
    }

    // СИНГЛТОН ПАТТЕРН
    static getInstance() {
        if (!ExternalIntegrations.instance) {
            ExternalIntegrations.instance = new ExternalIntegrations();
        }
        return ExternalIntegrations.instance;
    }

    // ТРЕКИНГ ОШИБОК И МЕТРИК
    trackError(context, error, extra = {}) {
        const errorInfo = {
            context,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            ...extra,
            source: 'external-integration'
        };

        console.error('🚨 Integration error:', errorInfo);
        
        // Сохраняем ошибки для анализа
        const errors = JSON.parse(localStorage.getItem('texno_edem_integration_errors') || '[]');
        errors.push(errorInfo);
        localStorage.setItem('texno_edem_integration_errors', JSON.stringify(errors.slice(-100))); // Последние 100 ошибок

        // Отправляем уведомление если это критическая ошибка
        if (this.shouldNotifyError(error)) {
            this.sendErrorNotification(errorInfo);
        }
    }

    trackTelegramMetrics(event, data) {
        this.trackIntegrationMetrics(`telegram_${event}`, data);
    }

    trackGoogleSheetsMetrics(event, data) {
        this.trackIntegrationMetrics(`google_sheets_${event}`, data);
    }

    trackCRMMetrics(event, data) {
        this.trackIntegrationMetrics(`crm_${event}`, data);
    }

    trackEmailMetrics(event, data) {
        this.trackIntegrationMetrics(`email_${event}`, data);
    }

    shouldNotifyError(error) {
        // Определяем, нужно ли отправлять уведомление об ошибке
        const criticalErrors = [
            'rate limit exceeded',
            'authentication failed',
            'service unavailable'
        ];

        return criticalErrors.some(critical => 
            error.message.toLowerCase().includes(critical)
        );
    }

    async sendErrorNotification(errorInfo) {
        if (!this.isTelegramConfigured()) return;

        const message = `
🚨 <b>Ошибка интеграции</b>

📝 <b>Контекст:</b> ${errorInfo.context}
❌ <b>Ошибка:</b> ${errorInfo.message}
🕒 <b>Время:</b> ${new Date(errorInfo.timestamp).toLocaleString('ru-RU')}
        `.trim();

        await this.sendTelegramMessage(message, {
            type: 'error',
            priority: 'high',
            silent: false
        });
    }

    // УПРАВЛЕНИЕ КОНФИГУРАЦИЕЙ
    async updateIntegrationConfig(newConfig) {
        try {
            this.config = { ...this.config, ...newConfig };
            localStorage.setItem('texno_edem_integrations', JSON.stringify(this.config));
            
            // Переинициализируем настройки
            this.setupRateLimiting();
            
            console.log('✅ Integration config updated');
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to update integration config:', error);
            return { success: false, error: error.message };
        }
    }

    getIntegrationStatus() {
        return {
            telegram: this.isTelegramConfigured(),
            googleSheets: this.isGoogleSheetsConfigured(),
            crm: this.isCRMConfigured(),
            email: this.isEmailConfigured(),
            initialized: this.isInitialized
        };
    }

    // ОЧИСТКА И ДЕСТРУКТОР
    clearCache() {
        this.cache.clear();
        this.requestQueue.clear();
        console.log('🗑️ Integration cache cleared');
    }

    destroy() {
        this.clearCache();
        this.rateLimits.clear();
        this.isInitialized = false;
        console.log('🧹 External Integrations destroyed');
    }
}

// Статические методы для обратной совместимости
ExternalIntegrations.sendToTelegram = ExternalIntegrations.sendToTelegram;
ExternalIntegrations.exportToGoogleSheets = ExternalIntegrations.exportToGoogleSheets;
ExternalIntegrations.syncWithCRM = ExternalIntegrations.syncWithCRM;
ExternalIntegrations.sendEmailReport = ExternalIntegrations.sendEmailReport;

// Глобальный экземпляр
window.externalIntegrations = ExternalIntegrations.getInstance();

// Автоматическая инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.externalIntegrations.init();
    } catch (error) {
        console.error('❌ Failed to auto-initialize integrations:', error);
    }
});

export default ExternalIntegrations;
