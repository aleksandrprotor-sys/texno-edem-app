// Компонент модальных окон для TEXNO EDEM
class ModalComponent {
    constructor(app) {
        this.app = app;
        this.currentModal = null;
    }

    // Показать модальное окно
    show(modalId, options = {}) {
        this.close(); // Закрываем предыдущее модальное окно

        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal ${modalId} not found`);
            return;
        }

        this.currentModal = modalId;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Фокус на первом инпуте
        if (options.autoFocus !== false) {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }

        // Закрытие по ESC
        if (options.closeOnEsc !== false) {
            this.escHandler = (e) => {
                if (e.key === 'Escape') this.close();
            };
            document.addEventListener('keydown', this.escHandler);
        }

        // Анимация появления
        if (options.animate !== false) {
            modal.style.animation = 'modalSlideIn 0.3s ease-out';
        }
    }

    // Закрыть модальное окно
    close() {
        if (!this.currentModal) return;

        const modal = document.getElementById(this.currentModal);
        if (modal) {
            modal.classList.remove('active');
            
            // Анимация закрытия
            modal.style.animation = 'modalSlideOut 0.2s ease-in';
            setTimeout(() => {
                modal.style.animation = '';
            }, 200);
        }

        document.body.style.overflow = '';
        
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
            this.escHandler = null;
        }

        this.currentModal = null;
    }

    // Показать детали заказа
    showOrderDetails(order) {
        const modalContent = this.createOrderDetailsHTML(order);
        
        // Создаем или обновляем модальное окно
        let modal = document.getElementById('order-details-modal');
        if (!modal) {
            modal = this.createModal('order-details-modal', 'Детали заказа', modalContent);
        } else {
            modal.querySelector('.modal-content').innerHTML = modalContent;
        }

        this.show('order-details-modal');
    }

    // Создать HTML для деталей заказа
    createOrderDetailsHTML(order) {
        if (order.platform === 'cdek') {
            return this.createCDEKOrderDetails(order);
        } else {
            return this.createMegamarketOrderDetails(order);
        }
    }

    createCDEKOrderDetails(order) {
        const statusConfig = CONFIG.STATUSES.CDEK[order.statusCode] || 
                           this.getFallbackStatusConfig(order.status);

        return `
            <div class="modal-body">
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
                        ${order.contacts ? `
                            <div class="detail-item">
                                <span class="detail-label">Телефон отправителя</span>
                                <span class="detail-value">${order.contacts.sender?.phone || 'Не указан'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Телефон получателя</span>
                                <span class="detail-value">${order.contacts.recipient?.phone || 'Не указан'}</span>
                            </div>
                        ` : ''}
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
                        ${order.deliveredDate ? `
                            <div class="detail-item">
                                <span class="detail-label">Фактическая доставка</span>
                                <span class="detail-value">${formatDateTime(order.deliveredDate)}</span>
                            </div>
                        ` : ''}
                        ${order.insurance ? `
                            <div class="detail-item">
                                <span class="detail-label">Страховая стоимость</span>
                                <span class="detail-value">${formatCurrency(order.insurance)}</span>
                            </div>
                        ` : ''}
                    </div>

                    ${order.packages && order.packages.length > 0 ? `
                        <div class="detail-section">
                            <h4 class="section-title">Упаковки (${order.packages.length})</h4>
                            ${order.packages.map(pkg => `
                                <div class="package-item">
                                    <div class="package-header">
                                        <span class="package-number">${pkg.number}</span>
                                        <span class="package-weight">${pkg.weight / 1000} кг</span>
                                    </div>
                                    <div class="package-dimensions">
                                        ${pkg.length} × ${pkg.width} × ${pkg.height} см
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${order.timeline && order.timeline.length > 0 ? `
                        <div class="detail-section full-width">
                            <h4 class="section-title">История статусов</h4>
                            <div class="timeline">
                                ${order.timeline.map(event => `
                                    <div class="timeline-event">
                                        <div class="timeline-dot"></div>
                                        <div class="timeline-content">
                                            <div class="timeline-title">${event.description}</div>
                                            <div class="timeline-date">${formatDateTime(event.date)}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="app.modal.close()">Закрыть</button>
                <button class="btn btn-primary" onclick="app.modal.printOrderDetails('${order.platform}', '${order.id}')">
                    <i class="fas fa-print"></i> Печать
                </button>
                ${order.status === 'problem' ? `
                    <button class="btn btn-warning" onclick="app.modal.contactSupport('${order.platform}', '${order.id}')">
                        <i class="fas fa-headset"></i> Поддержка
                    </button>
                ` : ''}
            </div>
        `;
    }

    createMegamarketOrderDetails(order) {
        const statusConfig = CONFIG.STATUSES.MEGAMARKET[order.statusCode] || 
                           this.getFallbackStatusConfig(order.status);

        return `
            <div class="modal-body">
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
                            <span class="detail-value">${formatCurrency(order.deliveryCost)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Скидка</span>
                            <span class="detail-value">${formatCurrency(order.discount)}</span>
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
                        ${order.customerEmail ? `
                            <div class="detail-item">
                                <span class="detail-label">Email</span>
                                <span class="detail-value">${order.customerEmail}</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="detail-section">
                        <h4 class="section-title">Доставка</h4>
                        <div class="detail-item">
                            <span class="detail-label">Адрес доставки</span>
                            <span class="detail-value">${order.deliveryAddress}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Тип доставки</span>
                            <span class="detail-value">${this.getDeliveryTypeText(order.deliveryType)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Дата создания</span>
                            <span class="detail-value">${formatDateTime(order.createdDate)}</span>
                        </div>
                        ${order.payment?.paidAt ? `
                            <div class="detail-item">
                                <span class="detail-label">Оплачен</span>
                                <span class="detail-value">${formatDateTime(order.payment.paidAt)}</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="detail-section full-width">
                        <h4 class="section-title">Товары (${order.items.length})</h4>
                        <div class="order-items-list">
                            ${order.items.map(item => `
                                <div class="order-item-detail">
                                    <div class="item-image">
                                        ${item.image ? 
                                            `<img src="${item.image}" alt="${item.name}" />` : 
                                            `<i class="fas fa-box"></i>`
                                        }
                                    </div>
                                    <div class="item-info">
                                        <div class="item-name">${item.name}</div>
                                        <div class="item-sku">Артикул: ${item.sku}</div>
                                        <div class="item-brand">${item.brand || ''}</div>
                                    </div>
                                    <div class="item-quantity">${item.quantity} шт.</div>
                                    <div class="item-price">${formatCurrency(item.price)}</div>
                                    <div class="item-total">${formatCurrency(item.total)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    ${order.promotions && order.promotions.length > 0 ? `
                        <div class="detail-section">
                            <h4 class="section-title">Акции и скидки</h4>
                            ${order.promotions.map(promo => `
                                <div class="promotion-item">
                                    <div class="promotion-type">${promo.type}</div>
                                    <div class="promotion-value">${formatCurrency(promo.value)}</div>
                                    <div class="promotion-desc">${promo.description}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="app.modal.close()">Закрыть</button>
                <button class="btn btn-primary" onclick="app.modal.printOrderDetails('${order.platform}', '${order.id}')">
                    <i class="fas fa-print"></i> Печать
                </button>
                ${order.status === 'new' ? `
                    <button class="btn btn-success" onclick="app.modal.confirmOrder('${order.id}')">
                        <i class="fas fa-check"></i> Подтвердить
                    </button>
                ` : ''}
            </div>
        `;
    }

    // Вспомогательные методы
    getFallbackStatusConfig(status) {
        const fallbackConfigs = {
            'new': { text: 'Новый', color: '#3b82f6' },
            'processing': { text: 'В обработке', color: '#f59e0b' },
            'active': { text: 'Активный', color: '#8b5cf6' },
            'shipped': { text: 'Отправлен', color: '#6366f1' },
            'delivered': { text: 'Доставлен', color: '#10b981' },
            'problem': { text: 'Проблема', color: '#ef4444' },
            'cancelled': { text: 'Отменен', color: '#6b7280' }
        };
        
        return fallbackConfigs[status] || { text: status, color: '#6b7280' };
    }

    getDeliveryTypeText(type) {
        const types = {
            'COURIER': 'Курьерская доставка',
            'PICKUP': 'Самовывоз',
            'POST': 'Почтовая доставка'
        };
        return types[type] || type;
    }

    // Создать модальное окно
    createModal(id, title, content) {
        const modalHTML = `
            <div class="modal" id="${id}">
                <div class="modal-backdrop" onclick="app.modal.close()"></div>
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" onclick="app.modal.close()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    ${content}
                </div>
            </div>
        `;

        const modalsContainer = document.getElementById('modals-container');
        if (!modalsContainer) {
            const container = document.createElement('div');
            container.id = 'modals-container';
            container.innerHTML = modalHTML;
            document.body.appendChild(container);
        } else {
            modalsContainer.innerHTML += modalHTML;
        }

        return document.getElementById(id);
    }

    // Действия модального окна
    printOrderDetails(platform, orderId) {
        // Mock метод для печати
        this.app.showNotification('Подготовка к печати...', 'info');
        setTimeout(() => {
            window.print();
        }, 500);
    }

    contactSupport(platform, orderId) {
        this.app.showNotification(`Связь с поддержкой для заказа ${orderId}`, 'info');
    }

    confirmOrder(orderId) {
        this.app.showNotification(`Заказ ${orderId} подтвержден`, 'success');
        this.close();
    }
}
