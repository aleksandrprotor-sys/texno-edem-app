// Утилиты валидации для TEXNO EDEM

class Validators {
    // Валидация email
    static email(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Валидация телефона
    static phone(phone) {
        const phoneRegex = /^(\+7|8)[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    // Валидация ИНН
    static inn(inn) {
        const innRegex = /^\d{10}$|^\d{12}$/;
        if (!innRegex.test(inn)) return false;

        // Проверка контрольной суммы для 10-значного ИНН
        if (inn.length === 10) {
            const coefficients = [2, 4, 10, 3, 5, 9, 4, 6, 8];
            let sum = 0;
            for (let i = 0; i < 9; i++) {
                sum += parseInt(inn[i]) * coefficients[i];
            }
            const control = (sum % 11) % 10;
            return control === parseInt(inn[9]);
        }

        // Проверка контрольной суммы для 12-значного ИНН
        if (inn.length === 12) {
            const coefficients1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
            let sum1 = 0;
            for (let i = 0; i < 10; i++) {
                sum1 += parseInt(inn[i]) * coefficients1[i];
            }
            const control1 = (sum1 % 11) % 10;

            const coefficients2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
            let sum2 = 0;
            for (let i = 0; i < 11; i++) {
                sum2 += parseInt(inn[i]) * coefficients2[i];
            }
            const control2 = (sum2 % 11) % 10;

            return control1 === parseInt(inn[10]) && control2 === parseInt(inn[11]);
        }

        return false;
    }

    // Валидация номера заказа
    static orderNumber(number) {
        const orderRegex = /^[A-Za-z0-9\-_]{4,50}$/;
        return orderRegex.test(number);
    }

    // Валидация трек номера
    static trackingNumber(tracking) {
        const trackingRegex = /^[A-Za-z0-9]{8,20}$/;
        return trackingRegex.test(tracking);
    }

    // Валидация суммы
    static amount(amount) {
        return !isNaN(amount) && amount >= 0;
    }

    // Валидация веса
    static weight(weight) {
        return !isNaN(weight) && weight > 0 && weight <= 1000; // до 1000 кг
    }

    // Валидация размеров
    static dimensions(length, width, height) {
        return [length, width, height].every(dim => 
            !isNaN(dim) && dim > 0 && dim <= 500 // до 500 см
        );
    }

    // Валидация даты
    static date(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime()) && date <= new Date();
    }

    // Валидация будущей даты
    static futureDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime()) && date > new Date();
    }

    // Валидация обязательного поля
    static required(value) {
        if (typeof value === 'string') {
            return value.trim().length > 0;
        }
        return value !== null && value !== undefined;
    }

    // Валидация минимальной длины
    static minLength(value, min) {
        if (typeof value === 'string') {
            return value.length >= min;
        }
        return false;
    }

    // Валидация максимальной длины
    static maxLength(value, max) {
        if (typeof value === 'string') {
            return value.length <= max;
        }
        return false;
    }

    // Валидация диапазона чисел
    static range(value, min, max) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    }

    // Валидация URL
    static url(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Валидация JSON
    static json(str) {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }

    // Групповая валидация
    static validate(data, rules) {
        const errors = {};

        for (const [field, fieldRules] of Object.entries(rules)) {
            const value = data[field];
            const fieldErrors = [];

            for (const rule of fieldRules) {
                let isValid = true;
                let message = '';

                if (typeof rule === 'function') {
                    isValid = rule(value);
                    message = 'Неверное значение';
                } else if (typeof rule === 'object') {
                    isValid = rule.validator(value, rule.params);
                    message = rule.message;
                } else if (typeof rule === 'string') {
                    switch (rule) {
                        case 'required':
                            isValid = this.required(value);
                            message = 'Обязательное поле';
                            break;
                        case 'email':
                            isValid = this.email(value);
                            message = 'Неверный формат email';
                            break;
                        case 'phone':
                            isValid = this.phone(value);
                            message = 'Неверный формат телефона';
                            break;
                    }
                }

                if (!isValid) {
                    fieldErrors.push(message);
                }
            }

            if (fieldErrors.length > 0) {
                errors[field] = fieldErrors;
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    // Создание правила валидации
    static rule(validator, message, params = {}) {
        return {
            validator,
            message,
            params
        };
    }

    // Валидация заказа CDEK
    static validateCDEKOrder(order) {
        const rules = {
            sender: [this.rule(this.required, 'Отправитель обязателен')],
            recipient: [this.rule(this.required, 'Получатель обязателен')],
            fromCity: [this.rule(this.required, 'Город отправления обязателен')],
            toCity: [this.rule(this.required, 'Город назначения обязателен')],
            weight: [
                this.rule(this.required, 'Вес обязателен'),
                this.rule(this.weight, 'Неверный вес')
            ],
            cost: [
                this.rule(this.required, 'Стоимость обязательна'),
                this.rule(this.amount, 'Неверная стоимость')
            ]
        };

        return this.validate(order, rules);
    }

    // Валидация заказа Мегамаркет
    static validateMegamarketOrder(order) {
        const rules = {
            customerName: [this.rule(this.required, 'Имя клиента обязательно')],
            customerPhone: [this.rule(this.phone, 'Неверный формат телефона')],
            totalAmount: [
                this.rule(this.required, 'Сумма заказа обязательна'),
                this.rule(this.amount, 'Неверная сумма заказа')
            ],
            items: [
                this.rule(this.required, 'Товары обязательны'),
                this.rule((items) => Array.isArray(items) && items.length > 0, 'Должен быть хотя бы один товар')
            ]
        };

        return this.validate(order, rules);
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
}
