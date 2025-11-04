// js/components/modal.js
class ModalComponent {
    constructor(app) {
        this.app = app;
        this.currentModal = null;
        this.init();
    }

    init() {
        console.log('✅ ModalComponent инициализирован');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Закрытие модального окна по клику на backdrop
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.hide();
            }
        });

        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.hide();
            }
        });

        // Обработчики для кнопок закрытия
        document.addEventListener('click', (e) => {
            if (e.target.closest('.modal-close') || e.target.closest('.btn-cancel')) {
                this.hide();
            }
        });
    }

    showOrderDetails(order) {
        const modalHTML = this.createOrderDetailsModal(order);
        this.showModal('order-details', 'Детали заказа', modalHTML);
    }

    createOrderDetailsModal(order) {
        const statusColors = {
            'new': 'var(--primary)',
            'processing': 'var(--warning)',
            'active': 'var(--info)',
            'shipped': 'var(--primary-light)',
            'delivered': 'var(--success)',
            'problem': 'var(--danger)',
            'cancelled': 'var(--gray-500)'
        };

        return `
            <div class="order-details-header">
                <div class="order-main-info">
                    <div class="order-title">
                        <i class="fas ${order.platform === 'cdek' ? 'fa-shipping-fast' : 'fa-store'}"></i>
                        ${order.id}
                        <span class="order-number">${order.orderNumber}</span>
                    </div>
                    <div class="order-tracking">Трек-номер: ${order.orderNumber}</div>
                </div>
                <div class="order-status-badge" style="--status-color: ${statusColors[order.status]}">
                    ${this.app.getStatusText(order.status)}
                </div>
            </div>

            <div class="details-grid">
                <div class="detail-section">
                    <div class="section-title">Основная информация</div>
                    <div class="detail-item">
                        <span class="detail-label">Платформа</span>
                        <span class="detail-value platform-${order.platform}">${order.platform.toUpperCase()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Статус</span>
                        <span class="detail-value">${this.app.getStatusText(order.status)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Сумма</span>
                        <span class="detail-value">${this.app.formatCurrency(order.amount)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Клиент</span>
                        <span class="detail-value">${order.customer}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="section-title">Доставка</div>
                    <div class="detail-item">
                        <span class="detail-label">Город</span>
                        <span class="detail-value">${order.deliveryCity}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Дата создания</span>
                        <span class="detail-value">${this.app.formatDateTime(order.createdDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Последнее обновление</span>
                        <span class="detail-value">${this.app.formatDateTime(order.updatedDate || order.createdDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Товары</span>
                        <span class="detail-value">${order.items} шт</span>
                    </div>
                </div>

                ${this.getOrderSpecificDetails(order)}

                <div class="detail-section full-width">
                    <div class="section-title">История статусов</div>
                    <div class="timeline">
                        ${this.generateTimeline(order).join('')}
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-outline btn-cancel">
                    <i class="fas fa-times"></i> Закрыть
                </button>
                ${order.status === 'new' ? `
                    <button class="btn btn-primary" onclick="app.components.orders.processOrder('${order.id}')">
                        <i class="fas fa-play"></i> Обработать заказ
                    </button>
                ` : ''}
                ${order.status === 'problem' ? `
                    <button class="btn btn-warning" onclick="app.components.orders.resolveProblem('${order.id}')">
                        <i class="fas fa-wrench"></i> Решить проблему
                    </button>
                ` : ''}
            </div>
        `;
    }

    getOrderSpecificDetails(order) {
        if (order.platform === 'cdek') {
            return `
                <div class="detail-section">
                    <div class="section-title">CDEK Детали</div>
                    <div class="detail-item">
                        <span class="detail-label">Вес</span>
                        <span class="detail-value">${order.weight || '0'} г</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Габариты</span>
                        <span class="detail-value">${order.dimensions ? `${order.dimensions.length}x${order.dimensions.width}x${order.dimensions.height} см` : 'Не указано'}</span>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="detail-section">
                    <div class="section-title">Мегамаркет Детали</div>
                    <div class="detail-item">
                        <span class="detail-label">Метод доставки</span>
                        <span class="detail-value">${order.shipping?.method || 'Курьер'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Стоимость доставки</span>
                        <span class="detail-value">${this.app.formatCurrency(order.shipping?.cost || 0)}</span>
                    </div>
                </div>
            `;
        }
    }

    generateTimeline(order) {
        const events = [
            {
                date: order.createdDate,
                title: 'Заказ создан',
                description: 'Заказ успешно создан в системе'
            }
        ];

        if (order.status !== 'new') {
            events.push({
                date: new Date(order.createdDate).setHours(new Date(order.createdDate).getHours() + 2),
                title: 'Передан в обработку',
                description: 'Заказ взят в работу'
            });
        }

        if (['active', 'shipped', 'delivered'].includes(order.status)) {
            events.push({
                date: new Date(order.createdDate).setHours(new Date(order.createdDate).getHours() + 4),
                title: 'Передан в доставку',
                description: 'Заказ передан службе доставки'
            });
        }

        if (order.status === 'delivered') {
            events.push({
                date: new Date(order.createdDate).setHours(new Date(order.createdDate).getHours() + 24),
                title: 'Доставлен',
                description: 'Заказ успешно доставлен клиенту'
            });
        }

        if (order.status === 'problem') {
            events.push({
                date: new Date(order.createdDate).setHours(new Date(order.createdDate).getHours() + 3),
                title: 'Обнаружена проблема',
                description: order.notes || 'Требуется дополнительная проверка'
            });
        }

        return events.map((event, index) => `
            <div class="timeline-event">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-title">${event.title}</div>
                    <div class="timeline-description">${event.description}</div>
                    <div class="timeline-date">${this.app.formatDateTime(event.date)}</div>
                </div>
            </div>
        `);
    }

    showConfirmModal(title, message, confirmCallback, confirmText = 'Подтвердить', cancelText = 'Отмена') {
        const modalHTML = `
            <div class="modal-body">
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--warning); margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 10px;">${title}</h3>
                    <p style="color: var(--text-secondary); line-height: 1.5;">${message}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline btn-cancel">
                    <i class="fas fa-times"></i> ${cancelText}
                </button>
                <button class="btn btn-danger" id="confirm-action">
                    <i class="fas fa-check"></i> ${confirmText}
                </button>
            </div>
        `;

        const modal = this.showModal('confirm', title, modalHTML);

        // Добавляем обработчик для кнопки подтверждения
        const confirmBtn = modal.querySelector('#confirm-action');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                confirmCallback();
                this.hide();
            });
        }
    }

    showModal(type, title, content) {
        // Скрываем предыдущее модальное окно
        if (this.currentModal) {
            this.hide();
        }

        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                ${content}
            </div>
        `;

        document.body.appendChild(modal);
        this.currentModal = modal;

        // Блокируем прокрутку body
        document.body.style.overflow = 'hidden';

        return modal;
    }

    hide() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
        }

        // Восстанавливаем прокрутку body
        document.body.style.overflow = '';
    }

    // Утилиты для работы с модальными окнами
    showLoadingModal(message = 'Загрузка...') {
        const modalHTML = `
            <div class="modal-body">
                <div style="text-align: center; padding: 40px;">
                    <div class="loading-spinner" style="margin: 0 auto 20px;"></div>
                    <p>${message}</p>
                </div>
            </div>
        `;

        return this.showModal('loading', 'Загрузка', modalHTML);
    }

    showErrorModal(title, message) {
        const modalHTML = `
            <div class="modal-body">
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--danger); margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 10px;">${title}</h3>
                    <p style="color: var(--text-secondary); line-height: 1.5;">${message}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-cancel">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            </div>
        `;

        return this.showModal('error', title, modalHTML);
    }

    showSuccessModal(title, message) {
        const modalHTML = `
            <div class="modal-body">
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-check-circle" style="font-size: 48px; color: var(--success); margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 10px;">${title}</h3>
                    <p style="color: var(--text-secondary); line-height: 1.5;">${message}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-cancel">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            </div>
        `;

        return this.showModal('success', title, modalHTML);
    }
}
