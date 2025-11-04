// js/utils/formatters.js - Утилиты форматирования для TEXNO EDEM

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
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин. назад`;
        if (diffHours < 24) return `${diffHours} ч. назад`;
        if (diffDays === 1) return 'вчера';
        if (diffDays < 7) return `${diffDays} дн. назад`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
        
        return formatDate(dateString);
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return '-';
    }
}

// Форматирование веса
function formatWeight(grams, unit = 'kg') {
    if (grams === null || grams === undefined || isNaN(grams)) return '-';
    
    if (unit === 'kg') {
        return `${(grams / 1000).toFixed(2)} кг`;
    }
    return `${grams} г`;
}

// Форматирование номера телефона
function formatPhone(phone) {
    if (!phone) return '-';
    
    try {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})$/);
        
        if (match) {
            return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`;
        }
        
        return phone;
    } catch (error) {
        console.error('Error formatting phone:', error);
        return phone;
    }
}

// Сокращение больших чисел
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
    return `${(num / 1000000000).toFixed(1)}B`;
}

// Форматирование процентов
function formatPercent(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    
    return `${Math.max(0, Math.min(100, value)).toFixed(decimals)}%`;
}

// Форматирование длительности
function formatDuration(minutes) {
    if (minutes === null || minutes === undefined || isNaN(minutes)) return '-';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
        return `${hours} ч ${mins} мин`;
    }
    return `${mins} мин`;
}

// Форматирование статуса заказа
function formatOrderStatus(status, platform = 'cdek') {
    const statusMap = {
        cdek: {
            'new': 'Новый',
            'processing': 'В обработке',
            'active': 'Активный',
            'delivered': 'Доставлен',
            'problem': 'Проблема',
            'cancelled': 'Отменен'
        },
        megamarket: {
            'new': 'Новый',
            'confirmed': 'Подтвержден',
            'packed': 'Упакован',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен',
            'problem': 'Проблема'
        }
    };
    
    const platformMap = statusMap[platform] || statusMap.cdek;
    return platformMap[status] || status;
}

// Форматирование платформы
function formatPlatform(platform) {
    const platformMap = {
        'cdek': 'CDEK',
        'megamarket': 'Мегамаркет'
    };
    
    return platformMap[platform] || platform;
}

// Экранирование HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Обрезание длинного текста
function truncateText(text, maxLength = 50) {
    if (!text) return '';
    
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Форматирование адреса
function formatAddress(address) {
    if (!address) return 'Не указан';
    
    // Убираем лишние пробелы и форматируем адрес
    return address.replace(/\s+/g, ' ').trim();
}

// Форматирование имени клиента
function formatCustomerName(name) {
    if (!name) return 'Не указан';
    
    // Приводим к нормальному формату: Иванов Иван Иванович
    return name.split(' ')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

// Валидация email
function isValidEmail(email) {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Валидация телефона
function isValidPhone(phone) {
    if (!phone) return false;
    
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
}

// Генерация случайного цвета на основе строки
function stringToColor(str) {
    if (!str) return '#6b7280';
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#ec4899'
    ];
    
    return colors[Math.abs(hash) % colors.length];
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Экспорт функций для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatCurrency,
        formatDate,
        formatDateTime,
        formatRelativeTime,
        formatWeight,
        formatPhone,
        formatNumber,
        formatPercent,
        formatDuration,
        formatOrderStatus,
        formatPlatform,
        escapeHtml,
        truncateText,
        formatAddress,
        formatCustomerName,
        isValidEmail,
        isValidPhone,
        stringToColor,
        formatFileSize
    };
}
