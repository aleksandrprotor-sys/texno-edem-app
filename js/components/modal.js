// js/utils/formatters.js - Полные утилиты форматирования для TEXNO EDEM

// Форматирование валюты
function formatCurrency(amount, currency = 'RUB') {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';
    
    const formatter = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    return formatter.format(amount);
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
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        
        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин. назад`;
        if (diffHours < 24) return `${diffHours} ч. назад`;
        if (diffDays === 1) return 'вчера';
        if (diffDays < 7) return `${diffDays} дн. назад`;
        if (diffWeeks < 4) return `${diffWeeks} нед. назад`;
        if (diffMonths < 12) return `${diffMonths} мес. назад`;
        
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
    } else if (unit === 'g') {
        return `${grams} г`;
    }
    return `${grams} ${unit}`;
}

// Форматирование номера телефона
function formatPhone(phone) {
    if (!phone) return '-';
    
    try {
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 11 && cleaned.startsWith('7')) {
            // Российский номер: +7 (XXX) XXX-XX-XX
            return `+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9, 11)}`;
        } else if (cleaned.length === 10) {
            // Российский номер без +7: (XXX) XXX-XX-XX
            return `+7 (${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8, 10)}`;
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
    
    const normalizedValue = Math.max(0, Math.min(100, value));
    return `${normalizedValue.toFixed(decimals)}%`;
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

// Форматирование длительности в днях/часах
function formatDurationDetailed(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '-';
    
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days} д`);
    if (hours > 0) parts.push(`${hours} ч`);
    if (minutes > 0) parts.push(`${minutes} мин`);
    
    return parts.length > 0 ? parts.join(' ') : 'менее минуты';
}

// Форматирование статуса заказа
function formatOrderStatus(status, platform = 'cdek') {
    const statusMap = {
        cdek: {
            'new': 'Новый',
            'processing': 'В обработке',
            'active': 'В пути',
            'delivered': 'Доставлен',
            'problem': 'Проблема',
            'cancelled': 'Отменен',
            'created': 'Создан',
            'accepted': 'Принят',
            'in_progress': 'В пути'
        },
        megamarket: {
            'new': 'Новый',
            'confirmed': 'Подтвержден',
            'packed': 'Упакован',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен',
            'problem': 'Проблема',
            'returned': 'Возврат',
            'packaging': 'Упаковка',
            'ready_for_shipment': 'Готов к отправке'
        }
    };
    
    const platformMap = statusMap[platform] || statusMap.cdek;
    return platformMap[status] || status;
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
function truncateText(text, maxLength = 50, suffix = '...') {
    if (!text) return '';
    
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}

// Форматирование адреса
function formatAddress(address) {
    if (!address) return 'Не указан';
    
    // Убираем лишние пробелы и форматируем адрес
    return address
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/(г\.|ул\.|пр\.|д\.|кв\.)/g, '$1 ')
        .replace(/\s+/g, ' ');
}

// Форматирование имени клиента
function formatCustomerName(name) {
    if (!name) return 'Не указан';
    
    // Приводим к нормальному формату: Иванов Иван Иванович
    return name
        .split(' ')
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
        '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#ec4899',
        '#14b8a6', '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16'
    ];
    
    return colors[Math.abs(hash) % colors.length];
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Форматирование рейтинга
function formatRating(rating, max = 5) {
    if (rating === null || rating === undefined || isNaN(rating)) return '-';
    
    const normalized = Math.max(0, Math.min(max, rating));
    return `${normalized.toFixed(1)}/${max}`;
}

// Форматирование срока доставки
function formatDeliveryTime(days) {
    if (days === null || days === undefined || isNaN(days)) return '-';
    
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Завтра';
    if (days < 7) return `Через ${days} ${getRussianDays(days)}`;
    if (days < 30) {
        const weeks = Math.ceil(days / 7);
        return `Через ${weeks} ${getRussianWeeks(weeks)}`;
    }
    
    const months = Math.ceil(days / 30);
    return `Через ${months} ${getRussianMonths(months)}`;
}

function getRussianDays(days) {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
}

function getRussianWeeks(weeks) {
    if (weeks === 1) return 'неделю';
    if (weeks >= 2 && weeks <= 4) return 'недели';
    return 'недель';
}

function getRussianMonths(months) {
    if (months === 1) return 'месяц';
    if (months >= 2 && months <= 4) return 'месяца';
    return 'месяцев';
}

// Форматирование цены за единицу
function formatUnitPrice(price, unit = 'шт') {
    if (price === null || price === undefined || isNaN(price)) return '-';
    
    return `${formatCurrency(price)}/${unit}`;
}

// Форматирование диапазона дат
function formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return '-';
    
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-';
        
        if (start.toDateString() === end.toDateString()) {
            return formatDate(startDate);
        }
        
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } catch (error) {
        console.error('Error formatting date range:', error);
        return '-';
    }
}

// Форматирование времени из минут
function formatTimeFromMinutes(totalMinutes) {
    if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes)) return '-';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes} мин`;
}

// Форматирование номера документа
function formatDocumentNumber(number, type = 'default') {
    if (!number) return '-';
    
    const formats = {
        'invoice': /^(\d{4})(\d{2})(\d{4})$/,
        'order': /^(\w{2})(\d{6})$/,
        'tracking': /^(\w{4})(\d{8})$/,
        'default': /^(.{4})(.{4})(.{4})(.{4})$/
    };
    
    const format = formats[type] || formats.default;
    const match = number.replace(/\s/g, '').match(format);
    
    if (match) {
        return match.slice(1).join(' ');
    }
    
    return number;
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
        formatDurationDetailed,
        formatOrderStatus,
        formatPlatform,
        escapeHtml,
        truncateText,
        formatAddress,
        formatCustomerName,
        isValidEmail,
        isValidPhone,
        stringToColor,
        formatFileSize,
        formatRating,
        formatDeliveryTime,
        formatUnitPrice,
        formatDateRange,
        formatTimeFromMinutes,
        formatDocumentNumber
    };
}
