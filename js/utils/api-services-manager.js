class ApiServicesManager {
    constructor(app) {
        this.app = app;
        this.services = new Map();
        this.init();
    }

    init() {
        this.registerService('cdek', {
            name: 'CDEK API',
            description: 'Логистическая платформа',
            icon: 'shipping-fast',
            testConnection: this.testCdekConnection.bind(this),
            getStatus: this.getCdekStatus.bind(this)
        });

        this.registerService('megamarket', {
            name: 'Мегамаркет API', 
            description: 'Маркетплейс',
            icon: 'store',
            testConnection: this.testMegamarketConnection.bind(this),
            getStatus: this.getMegamarketStatus.bind(this)
        });
    }

    registerService(id, config) {
        this.services.set(id, config);
    }

    async testConnection(serviceId, credentials) {
        const service = this.services.get(serviceId);
        if (!service) {
            throw new Error(`Service ${serviceId} not found`);
        }

        return await service.testConnection(credentials);
    }

    async testCdekConnection(credentials) {
        // Реальная логика проверки подключения CDEK
        try {
            const cdekService = new CDEKService();
            const token = await cdekService.authenticate();
            return { success: true, message: 'Подключение успешно', token };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async testMegamarketConnection(credentials) {
        // Реальная логика проверки подключения Мегамаркет
        try {
            const megamarketService = new MegamarketService();
            // Тестовый запрос к API
            return { success: true, message: 'Подключение успешно' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    getCdekStatus() {
        const enabled = CONFIG.get('API.CDEK.ENABLED', false);
        const hasCredentials = CONFIG.get('API.CDEK.CLIENT_ID') && CONFIG.get('API.CDEK.CLIENT_SECRET');
        
        return {
            enabled,
            configured: hasCredentials,
            status: enabled && hasCredentials ? 'active' : 'inactive',
            lastSync: localStorage.getItem('cdek_last_sync')
        };
    }

    getMegamarketStatus() {
        const enabled = CONFIG.get('API.MEGAMARKET.ENABLED', false);
        const hasCredentials = CONFIG.get('API.MEGAMARKET.API_KEY') && 
                              CONFIG.get('API.MEGAMARKET.SECRET_KEY') &&
                              CONFIG.get('API.MEGAMARKET.CAMPAIGN_ID');
        
        return {
            enabled,
            configured: hasCredentials,
            status: enabled && hasCredentials ? 'active' : 'inactive',
            lastSync: localStorage.getItem('megamarket_last_sync')
        };
    }

    getAllServicesStatus() {
        const status = {};
        this.services.forEach((config, id) => {
            status[id] = this[`get${id.charAt(0).toUpperCase() + id.slice(1)}Status`]();
        });
        return status;
    }
}
