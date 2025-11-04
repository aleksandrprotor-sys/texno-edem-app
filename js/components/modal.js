// js/components/modal.js
class ModalComponent {
    constructor() {
        this.container = document.getElementById('modals-container');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Закрытие модального окна по клику на бэкдроп
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.hide();
            }
        });

        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }

    showOrderDetails(order) {
        const modalHtml = `
            <div class="modal active tg-slide-in">
                <div class="modal-backdrop"></div>
                <div class="modal-dialog tg-card">
                    <div class="modal-header">
                        <h3 class="modal-title">Детали заказа</h3>
                        <button class="modal-close tg-tap-effect" onclick="app.modal.hide()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="order-details-header">
                            <div class="order-main-info">
                                <div class="order-title">
                                    <span>${order.id}</span>
                                    <span class="order-platform ${order.platform}">
                                        <i class="fas fa-${order.platform === 'cdek' ? 'shipping-fast' : 'store'}"></i>
                                        ${order.platform === 'cdek' ? 'CDEK' : 'Мегамаркет'}
                                    </span>
                                </div>
                                <div class="order-tracking">
                                    ${order.trackingNumber ? `Трек-номер: ${order.trackingNumber}` : 'Трек-номер не назначен'}
                                </div>
                            </div>
                            <div class="order-status-badge" style="--status-color: ${app.orders.getStatusColor(order.status)}">
                                ${app.orders.getStatusText(order.status)}
                            </div>
                        </div>

                        <div class="details-grid">
                            <div class="detail-section">
                                <h4 class="section-title">Информация о заказе</h4>
                                <div class="detail-item">
                                    <span class="detail-label">Дата создания</span>
                                    <span class="detail-value">${app.formatters.formatDateTime(order.date)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Сумма заказа</span>
                                    <span class="detail-value">${app.formatters.formatCurrency(order.amount)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Статус оплаты</span>
                                    <span class="detail-value ${order.paymentStatus === 'paid' ? 'text-success' : 'text-warning'}">
                                        ${order.paymentStatus === 'paid' ? 'Оплачен' : 'Ожидает оплаты'}
                                    </span>
                                </div>
                            </div>

                            <div class="detail-section">
                                <h4 class="section-title">Данные клиента</h4>
                                <div class="detail-item">
                                    <span class="detail-label">Имя</span>
                                    <span class="detail-value">${order.customerName}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Телефон</span>
                                    <span class="detail-value">
                                        <a href="tel:${order.customerPhone}" class="tg-tap-effect">${order.customerPhone}</a>
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Email</span>
                                    <span class="detail-value">
                                        <a href="mailto:${order.customerEmail}" class="tg-tap-effect">${order.customerEmail}</a>
                                    </span>
                                </div>
                            </div>

                            <div class="detail-section full-width">
                                <h4 class="section-title">Товары в заказе</h4>
                                <div class="order-items-list">
                                    ${order.items.map((item, index) => `
                                        <div class="order-item-detail">
                                            <div class="item-image">
                                                ${item.image ? 
                                                    `<img src="${item.image}" alt="${item.name}" loading="lazy">` : 
                                                    `<i class="fas fa-box"></i>`
                                                }
                                            </div>
                                            <div class="item-info">
                                                <div class="item-name">${item.name}</div>
                                                <div class="item-sku">Артикул: ${item.sku}</div>
                                                <div class="item-brand">${item.brand || ''}</div>
                                            </div>
                                            <div class="item-quantity">${item.quantity} шт.</div>
                                            <div class="item-price">${app.formatters.formatCurrency(item.price)}</div>
                                            <div class="item-total">${app.formatters.formatCurrency(item.price * item.quantity)}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            ${order.timeline && order.timeline.length > 0 ? `
                                <div class="detail-section full-width">
                                    <h4 class="section-title">История статусов</h4>
                                    <div class="timeline">
                                        ${order.timeline.map(event => `
                                            <div class="timeline-event">
                                                <div class="timeline-dot"></div>
                                                <div class="timeline-content">
                                                    <div class="timeline-title">${event.status}</div>
                                                    <div class="timeline-date">${app.formatters.formatDateTime(event.date)}</div>
                                                    ${event.description ? `<div class="timeline-desc">${event.description}</div>` : ''}
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        ${order.trackingNumber ? `
                            <button class="btn btn-outline tg-tap-effect" onclick="app.orders.trackOrder('${order.id}')">
                                <i class="fas fa-truck"></i> Отследить
                            </button>
                        ` : ''}
                        
                        ${order.status === 'new' || order.status === 'processing' ? `
                            <button class="btn btn-danger tg-tap-effect" onclick="app.orders.cancelOrder('${order.id}')">
                                <i class="fas fa-times"></i> Отменить заказ
                            </button>
                        ` : ''}
                        
                        <button class="btn btn-primary tg-main-button tg-tap-effect" onclick="app.modal.hide()">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = modalHtml;
        document.body.style.overflow = 'hidden';
    }

    async confirm(title, message, confirmText = 'Подтвердить', type = 'primary') {
        return new Promise((resolve) => {
            const modalHtml = `
                <div class="modal active tg-slide-in">
                    <div class="modal-backdrop"></div>
                    <div class="modal-dialog tg-card">
                        <div class="modal-header">
                            <h3 class="modal-title">${title}</h3>
                            <button class="modal-close tg-tap-effect" onclick="this.resolveConfirm(false)">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div class="modal-body">
                            <div class="confirm-content">
                                <div class="confirm-icon">
                                    <i class="fas fa-${type === 'danger' ? 'exclamation-triangle' : 'question-circle'}"></i>
                                </div>
                                <div class="confirm-message">${message}</div>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button class="btn btn-outline tg-tap-effect" onclick="this.resolveConfirm(false)">
                                Отмена
                            </button>
                            <button class="btn btn-${type} tg-main-button tg-tap-effect" onclick="this.resolveConfirm(true)">
                                ${confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            this.container.innerHTML = modalHtml;
            
            // Добавляем методы для разрешения промиса
            this.container.querySelector('.modal').resolveConfirm = (result) => {
                this.hide();
                resolve(result);
            };
            
            document.body.style.overflow = 'hidden';
        });
    }

    hide() {
        this.container.innerHTML = '';
        document.body.style.overflow = '';
    }
}
