// js/config.js
const AppConfig = {
    version: '1.0.0',
    name: 'TEXNO EDEM Business Intelligence',
    
    api: {
        baseUrl: '',
        timeout: 10000,
        endpoints: {
            cdek: {
                orders: '/api/cdek/orders',
                status: '/api/cdek/status'
            },
            megamarket: {
                orders: '/api/megamarket/orders',
                status: '/api/megamarket/status'
            }
        }
    },
    
    platforms: {
        cdek: {
            name: 'CDEK',
            color: '#27ae60',
            icon: 'fa-shipping-fast'
        },
        megamarket: {
            name: 'Мегамаркет',
            color: '#8e44ad',
            icon: 'fa-store'
        }
    },
    
    sync: {
        enabled: true,
        interval: 300000, // 5 минут
        retryCount: 3,
        retryDelay: 5000
    },
    
    features: {
        analytics: true,
        export: true,
        notifications: true,
        themes: true
    },
    
    ui: {
        theme: 'auto',
        language: 'ru',
        animations: true
    }
};
