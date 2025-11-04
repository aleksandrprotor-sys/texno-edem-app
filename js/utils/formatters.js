// Утилиты форматирования для TEXNO EDEM

// Форматирование валюты
function formatCurrency(amount, currency = 'RUB') {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';
    
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Форматирование даты
function formatDate(dateString, options = {}) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        const formatOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            ...options
        };
        
        return date.toLocaleDateString('ru-RU', formatOptions);
    } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
    }
}

// Форматирование даты и времени
function formatDateTime(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting datetime:', error);
        return '-';
    }
}

// Относительное время
function formatRelativeTime(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин назад`;
        if (diffHours < 24) return `${diffHours} ч назад`;
        if (diffDays === 1) return 'вчера';
        if (diffDays < 7) return `${diffDays} дн назад`;
        
        return formatDate(dateString);
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return '-';
    }
}

// Форматирование веса
function formatWeight(weight, unit = 'kg') {
    if (weight === null || weight === undefined || isNaN(weight)) return '-';
    
    if (unit === 'kg') {
        return `${parseFloat(weight).toFixed(1)} кг`;
    } else if (unit === 'g') {
        return `${Math.round(weight)} г`;
    }
    
    return `${weight} ${unit}`;
}

// Форматирование телефона
function formatPhone(phone) {
    if (!phone) return '-';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11 && cleaned.startsWith('7')) {
        return `+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9)}`;
    } else if (cleaned.length === 10) {
        return `+7 (${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8)}`;
    }
    
    return phone;
}

// Форматирование статуса заказа
function formatOrderStatus(status, platform = '') {
    const statusMap = {
        'new': { text: 'Новый', color: '#3498db', icon: 'clock' },
        'processing': { text: 'В обработке', color: '#f39c12', icon: 'sync' },
        'active': { text: 'Активный', color: '#9b59b6', icon: 'shipping-fast' },
        'delivered': { text: 'Доставлен', color: '#27ae60', icon: 'check' },
        'problem': { text: 'Проблема', color: '#e74c3c', icon: 'exclamation-triangle' },
        'cancelled': { text: 'Отменен', color: '#95a5a6', icon: 'times' }
    };
    
    const config = statusMap[status] || statusMap.new;
    
    if (platform === 'cdek') {
        const cdekStatusMap = {
            'active': { text: 'В пути', color: '#9b59b6' },
            'delivered': { text: 'Доставлен', color: '#27ae60' }
        };
        Object.assign(config, cdekStatusMap[status] || {});
    }
    
    return config;
}

// Форматирование платформы
function formatPlatform(platform) {
    const platformMap = {
        'cdek': 'CDEK',
        'megamarket': 'Мегамаркет',
        'all': 'Все платформы'
    };
    
    return platformMap[platform] || platform;
}

// Обрезание длинного текста
function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Форматирование процентов
function formatPercent(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) return '-';
    return `${parseFloat(value).toFixed(decimals)}%`;
}

// Форматирование номера заказа
function formatOrderNumber(number, platform = '') {
    if (!number) return '-';
    
    if (platform === 'cdek' && number.startsWith('CDEK')) {
        return number;
    } else if (platform === 'megamarket' && number.startsWith('MM')) {
        return number;
    }
    
    return `#${number}`;
}

// Экспорт функций для использования в других модулях
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.formatRelativeTime = formatRelativeTime;
window.formatWeight = formatWeight;
window.formatPhone = formatPhone;
window.formatOrderStatus = formatOrderStatus;
window.formatPlatform = formatPlatform;
window.truncateText = truncateText;
window.formatPercent = formatPercent;
window.formatOrderNumber = formatOrderNumber;
