// js/components/modal.js
class ModalComponent {
    constructor(app) {
        this.app = app;
        this.modals = new Map();
        this.init();
    }

    init() {
        this.createModalContainer();
        this.setupEventListeners();
        console.log('✅ ModalComponent инициализирован');
    }

    createModalContainer() {
        let container = document.getElementById('modals-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'modals-container';
            container.className = 'modals-container';
            document.body.appendChild(container);
        }
        this.container = container;
    }

    showOrderDetails(order) {
        const modalId = `order-details-${order.id}`;
        
        if (this.modals.has(modalId)) {
            this.close(modalId);
        }

        const modalHTML = `
            <div class="modal active" id="${modalId}">
                <div class="modal-backdrop" onclick="app.components.modal.close('${modalId}')"></div>
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3 class="modal-title">Детали заказа</h3>
                        <button class="modal-close" onclick="app.components.modal.close('${modalId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="order-details-content">
                            <div class="order-info-section">
                                <h4>Основная информация</h4>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <label>Номер заказа:</label>
                                        <span class="order-number">${order.orderNumber}</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Платформа:</label>
                                        <span class="platform-badge platform-${order.platform}">
                                            ${order.platform === 'cdek' ? 'CDEK' : 'Мегамаркет'}
                                        </span>
                                    </div>
                                    <div class="info-item">
                                        <label>Статус:</label>
                                        <span class="status-badge status-${order.status}">
                                            ${this.app.getStatusText(order.status)}
                                        </span>
                                    </div>
                                    <div class="info-item">
                                        <label>Сумма:</label>
                                        <span class="amount">${this.app.formatCurrency(order.amount)}</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Клиент:</label>
                                        <span>${order.customer}</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Город доставки:</label>
                                        <span>${order.deliveryCity}</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Товаров:</label>
                                        <span>${order.items} шт</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Дата создания:</label>
                                        <span>${this.app.formatDateTime(order.createdDate)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            ${this.getPlatformSpecificContent(order)}
                            
                            <div class="order-actions-section">
                                <h4>Действия</h4>
                                <div class="action-buttons">
                                    <button class="btn btn-outline" onclick="app.components.modal.printOrder('${order.id}')">
                                        <i class="fas fa-print"></i> Печать
                                    </button>
                                    <button class="btn btn-outline" onclick="app.components.modal.copyOrderInfo('${order.id}')">
                                        <i class="fas fa-copy"></i> Копировать
                                    </button>
                                    ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
                                    <button class="btn btn-warning" onclick="app.components.modal.updateOrderStatus('${order.id}', 'problem')">
                                        <i class="fas fa-exclamation-triangle"></i> Проблема
                                    </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="app.components.modal.close('${modalId}')">
                            Закрыть
                        </button>
                        <button class="btn btn-primary" onclick="app.components.modal.trackOrder('${order.id}')">
                            <i class="fas fa-map-marker-alt"></i> Отследить
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', modalHTML);
        const modalElement = document.getElementById(modalId);
        this.modals.set(modalId, { 
            element: modalElement,
            order: order
        });

        // Анимация появления
        setTimeout(() => {
            modalElement.classList.add('visible');
        }, 10);
    }

    getPlatformSpecificContent(order) {
        if (order.platform === 'cdek') {
            return `
                <div class="delivery-info-section">
                    <h4>Информация о доставке</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Трек номер:</label>
                            <span class="tracking-number">${order.orderNumber}</span>
                        </div>
                        <div class="info-item">
                            <label>Тариф:</label>
                            <span>Экспресс-доставка</span>
                        </div>
                        <div class="info-item">
                            <label>Срок доставки:</label>
                            <span>2-3 рабочих дня</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (order.platform === 'megamarket') {
            return `
                <div class="market-info-section">
                    <h4>Информация о заказе</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Тип доставки:</label>
                            <span>Курьерская доставка</span>
                        </div>
                        <div class="info-item">
                            <label>Способ оплаты:</label>
                            <span>Онлайн-оплата</span>
                        </div>
                        <div class="info-item">
                            <label>Срок сборки:</label>
                            <span>1-2 дня</span>
                        </div>
                    </div>
                </div>
            `;
        }
        return '';
    }

    close(modalId) {
        const modal = this.modals.get(modalId);
        if (modal) {
            modal.element.classList.remove('visible');
            setTimeout(() => {
                if (modal.element.parentNode) {
                    modal.element.parentNode.removeChild(modal.element);
                }
                this.modals.delete(modalId);
            }, 300);
        }
    }

    closeAll() {
        this.modals.forEach((modal, id) => this.close(id));
    }

    trackOrder(orderId) {
        const order = this.app.orders.find(o => o.id === orderId);
        if (order) {
            let trackingUrl = '';
            if (order.platform === 'cdek') {
                trackingUrl = `https://www.cdek.ru/ru/tracking?order_id=${order.orderNumber}`;
            } else if (order.platform === 'megamarket') {
                trackingUrl = `https://megamarket.ru/track/${order.orderNumber}`;
            }
            
            if (trackingUrl) {
                window.open(trackingUrl, '_blank');
                this.app.showNotification('Открыта страница отслеживания', 'info');
            } else {
                this.app.showNotification('Ссылка для отслеживания недоступна', 'warning');
            }
        }
    }

    printOrder(orderId) {
        const order = this.app.orders.find(o => o.id === orderId);
        if (order) {
            const printWindow = window.open('', '_blank');
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Заказ ${order.orderNumber}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .order-info { margin-bottom: 20px; }
                        .info-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .label { font-weight: bold; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Заказ ${order.orderNumber}</h1>
                        <p>TEXNO EDEM Business Intelligence</p>
                    </div>
                    <div class="order-info">
                        <div class="info-item"><span class="label">Платформа:</span> <span>${order.platform === 'cdek' ? 'CDEK' : 'Мегамаркет'}</span></div>
                        <div class="info-item"><span class="label">Статус:</span> <span>${this.app.getStatusText(order.status)}</span></div>
                        <div class="info-item"><span class="label">Сумма:</span> <span>${this.app.formatCurrency(order.amount)}</span></div>
                        <div class="info-item"><span class="label">Клиент:</span> <span>${order.customer}</span></div>
                        <div class="info-item"><span class="label">Город:</span> <span>${order.deliveryCity}</span></div>
                        <div class="info-item"><span class="label">Товаров:</span> <span>${order.items} шт</span></div>
                        <div class="info-item"><span class="label">Дата:</span> <span>${this.app.formatDateTime(order.createdDate)}</span></div>
                    </div>
                </body>
                </html>
            `;
            
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        }
    }

    copyOrderInfo(orderId) {
        const order = this.app.orders.find(o => o.id === orderId);
        if (order) {
            const orderText = `
Заказ: ${order.orderNumber}
Платформа: ${order.platform === 'cdek' ? 'CDEK' : 'Мегамаркет'}
Статус: ${this.app.getStatusText(order.status)}
Сумма: ${this.app.formatCurrency(order.amount)}
Клиент: ${order.customer}
Город: ${order.deliveryCity}
Товаров: ${order.items} шт
Дата: ${this.app.formatDateTime(order.createdDate)}
            `.trim();

            navigator.clipboard.writeText(orderText).then(() => {
                this.app.showNotification('Информация о заказе скопирована', 'success');
            }).catch(() => {
                // Fallback для старых браузеров
                const textArea = document.createElement('textarea');
                textArea.value = orderText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.app.showNotification('Информация о заказе скопирована', 'success');
            });
        }
    }

    updateOrderStatus(orderId, newStatus) {
        const order = this.app.orders.find(o => o.id === orderId);
        if (order) {
            const oldStatus = order.status;
            order.status = newStatus;
            order.updatedDate = new Date().toISOString();
            
            this.app.showNotification(`Статус заказа изменен на: ${this.app.getStatusText(newStatus)}`, 'success');
            
            // Закрываем модальное окно
            this.close(`order-details-${orderId}`);
            
            // Обновляем UI если открыт раздел заказов
            if (this.app.components.orders) {
                this.app.components.orders.refreshOrdersList();
            }
        }
    }

    setupEventListeners() {
        // ESC для закрытия модальных окон
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAll();
            }
        });

        // Клик по backdrop
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.close(modal.id);
                }
            }
        });

        // Предотвращаем закрытие при клике на контент
        document.addEventListener('click', (e) => {
            if (e.target.closest('.modal-dialog')) {
                e.stopPropagation();
            }
        });
    }

    // УТИЛИТНЫЕ МЕТОДЫ
    getOpenModalsCount() {
        return this.modals.size;
    }

    isAnyModalOpen() {
        return this.modals.size > 0;
    }

    // ОЧИСТКА ПАМЯТИ
    cleanup() {
        this.closeAll();
        this.modals.clear();
    }
}
