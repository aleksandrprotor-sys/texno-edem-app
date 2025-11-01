// js/components/modal.js - Улучшенный компонент модальных окон
class ModalComponent {
    constructor(app) {
        this.app = app;
        this.currentModal = null;
    }

    showOrderDetails(order) {
        const modalId = 'order-details-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = this.createModal(modalId, 'Детали заказа', '');
            document.getElementById('modals-container').appendChild(modal);
        }

        const content = order.platform === 'cdek' ? 
            this.createCDEKOrderDetails(order) : 
            this.createMegamarketOrderDetails(order);

        modal.querySelector('.modal-body').innerHTML = content;
        this.show(modalId);
    }

    createCDEKOrderDetails(order) {
        const statusConfig = this.app.getStatusConfig(order);

        return `
            <div class="order-details-header">
                <div class="order-main-info">
                    <div class="order-title">
                        <i class="fas fa-shipping-fast"></i>
                        Отправление CDEK
                    </div>
                    <div class="order-tracking">${order.trackingNumber}</div>
                </div>
                <div class="order-status-badge" style="--status-color: ${statusConfig.color}">
                    ${statusConfig.text}
                </div>
            </div>

            <div class="details-grid">
                <div class="detail-section">
                    <h4 class="section-title">Основная информация</h4>
                    <div class="detail-item">
                        <span class="detail-label">Трек номер</span>
                        <span class="detail-value">${order.trackingNumber}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Статус</span>
                        <span class="detail-value">${statusConfig.text}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Маршрут</span>
                        <span class="detail-value">${order.fromCity} → ${order.toCity}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Вес</span>
                        <span class="detail-value">${order.weight} кг</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Стоимость доставки</span>
                        <span class="detail-value">${formatCurrency(order.cost)}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4 class="section-title">Контакты</h4>
                    <div class="detail-item">
                        <span class="detail-label">Отправитель</span>
                        <span class="detail-value">${order.sender}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Получатель</span>
                        <span class="detail-value">${order.recipient}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4 class="section-title">Детали доставки</h4>
                    <div class="detail-item">
                        <span class="detail-label">Дата создания</span>
                        <span class="detail-value">${formatDateTime(order.createdDate)}</span>
                    </div>
                    ${order.estimatedDelivery ? `
                        <div class="detail-item">
                            <span class="detail-label">Ожидаемая доставка</span>
                            <span class="detail-value">${formatDate(order.estimatedDelivery)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="app.modal.close()">Закрыть</button>
                <button class="btn btn-primary" onclick="app.modal.printOrderDetails()">
                    <i class="fas fa-print"></i> Печать
                </button>
                ${order.status === 'problem' ? `
                    <button class="btn btn-warning" onclick="app.ordersComponent.contactSupport('${order.platform}', '${order.id}')">
                        <i class="fas fa-headset"></i> Поддержка
                    </button>
                ` : ''}
            </div>
        `;
    }

    createMegamarketOrderDetails(order) {
        const statusConfig = this.app.getStatusConfig(order);

        return `
            <div class="order-details-header">
                <div class="order-main-info">
                    <div class="order-title">
                        <i class="fas fa-store"></i>
                        Заказ Мегамаркет
                    </div>
                    <div class="order-number">#${order.orderNumber}</div>
                </div>
                <div class="order-status-badge" style="--status-color: ${statusConfig.color}">
                    ${statusConfig.text}
                </div>
            </div>

            <div class="details-grid">
                <div class="detail-section">
                    <h4 class="section-title">Информация о заказе</h4>
                    <div class="detail-item">
                        <span class="detail-label">Номер заказа</span>
                        <span class="detail-value">#${order.orderNumber}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Статус</span>
                        <span class="detail-value">${statusConfig.text}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Общая сумма</span>
                        <span class="detail-value">${formatCurrency(order.totalAmount)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Стоимость доставки</span>
                        <span class="detail-value">${formatCurrency(order.deliveryCost || 0)}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4 class="section-title">Информация о клиенте</h4>
                    <div class="detail-item">
                        <span class="detail-label">Имя клиента</span>
                        <span class="detail-value">${order.customerName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Телефон</span>
                        <span class="detail-value">${order.customerPhone || 'Не указан'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Адрес доставки</span>
                        <span class="detail-value">${order.deliveryAddress}</span>
                    </div>
                </div>

                ${order.items ? `
                    <div class="detail-section full-width">
                        <h4 class="section-title">Товары (${order.items.length})</h4>
                        <div class="order-items-list">
                            ${order.items.map(item => `
                                <div class="order-item-detail">
                                    <div class="item-image">
                                        <i class="fas fa-box"></i>
                                    </div>
                                    <div class="item-info">
                                        <div class="item-name">${item.name}</div>
                                        <div class="item-quantity">${item.quantity} шт.</div>
                                    </div>
                                    <div class="item-price">${formatCurrency(item.price)}</div>
                                    <div class="item-total">${formatCurrency(item.total)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="app.modal.close()">Закрыть</button>
                <button class="btn btn-primary" onclick="app.modal.printOrderDetails()">
                    <i class="fas fa-print"></i> Печать
                </button>
                ${order.status === 'new' ? `
                    <button class="btn btn-success" onclick="app.ordersComponent.confirmOrder('${order.platform}', '${order.id}')">
                        <i class="fas fa-check"></i> Подтвердить
                    </button>
                ` : ''}
            </div>
        `;
    }

    createModal(id, title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = id;
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="app.modal.close()"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="app.modal.close()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        return modal;
    }

    show(modalId) {
        this.close(); // Закрываем предыдущее модальное окно

        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal ${modalId} not found`);
            return;
        }

        this.currentModal = modalId;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        if (!this.currentModal) return;

        const modal = document.getElementById(this.currentModal);
        if (modal) {
            modal.classList.remove('active');
        }

        document.body.style.overflow = '';
        this.currentModal = null;
    }

    printOrderDetails() {
        this.app.showNotification('Подготовка к печати...', 'info');
        setTimeout(() => {
            window.print();
        }, 500);
    }
}
