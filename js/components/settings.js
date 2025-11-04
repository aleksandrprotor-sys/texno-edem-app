// Компонент настроек
class SettingsComponent {
    constructor(app) {
        this.app = app;
        this.unsavedChanges = false;
        this.testResults = {
            cdek: null,
            megamarket: null
        };
        this.init();
    }

    init() {
        console.log('✅ SettingsComponent initialized');
    }

    render() {
        const container = document.getElementById('settings-container');
        if (!container) return;

        container.innerHTML = this.createSettingsHTML();
        this.attachEventListeners();
        this.updateSaveButton();
    }

    createSettingsHTML() {
        const config = this.app.config;
        
        return `
            <div class="settings-content">
                <div class="settings-grid">
                    <!-- Настройки API -->
                    <div class="settings-section">
                        <div class="section-header">
                            <h3 class="section-title">
                                <i class="fas fa-plug"></i>
                                Настройки API
                            </h3>
                            <p>Настройки интеграции с платформами доставки и маркетплейсами</p>
                        </div>
                        
                        <div class="settings-group">
                            <!-- CDEK Settings -->
                            <div class="setting-group">
                                <h4 class="setting-group-title">
                                    <i class="fas fa-shipping-fast"></i>
                                    CDEK Logistics
                                </h4>
                                
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h5 class="setting-title">Включить интеграцию</h5>
                                        <p class="setting-description">
                                            Активировать синхронизацию с CDEK API
                                        </p>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" id="cdek-enabled" 
                                               ${config.get('API.CDEK.ENABLED', true) ? 'checked' : ''}>
                                        <span class="slider"></span>
                                    </label>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h5 class="setting-title">Client ID</h5>
                                        <p class="setting-description">Идентификатор клиента в системе CDEK</p>
                                    </div>
                                    <input type="text" class="setting-input" id="cdek-client-id" 
                                           value="${config.get('API.CDEK.CLIENT_ID', '')}" 
                                           placeholder="Введите Client ID"
                                           ${!config.get('API.CDEK.ENABLED', true) ? 'disabled' : ''}>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h5 class="setting-title">Client Secret</h5>
                                        <p class="setting-description">Секретный ключ для доступа к API</p>
                                    </div>
                                    <div class="password-input">
                                        <input type="password" class="setting-input" id="cdek-client-secret" 
                                               value="${config.get('API.CDEK.CLIENT_SECRET', '')}" 
                                               placeholder="Введите Client Secret"
                                               ${!config.get('API.CDEK.ENABLED', true) ? 'disabled' : ''}>
                                        <button type="button" class="password-toggle" onclick="this.togglePassword('cdek-client-secret')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Megamarket Settings -->
                            <div class="setting-group">
                                <h4 class="setting-group-title">
                                    <i class="fas fa-store"></i>
                                    Мегамаркет
                                </h4>
                                
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h5 class="setting-title">Включить интеграцию</h5>
                                        <p class="setting-description">
                                            Активировать синхронизацию с API Мегамаркет
                                        </p>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" id="megamarket-enabled" 
                                               ${config.get('API.MEGAMARKET.ENABLED', true) ? 'checked' : ''}>
                                        <span class="slider"></span>
                                    </label>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h5 class="setting-title">API Key</h5>
                                        <p class="setting-description">Ключ API для доступа к платформе</p>
                                    </div>
                                    <div class="password-input">
                                        <input type="password" class="setting-input" id="megamarket-api-key" 
                                               value="${config.get('API.MEGAMARKET.API_KEY', '')}" 
                                               placeholder="Введите API Key"
                                               ${!config.get('API.MEGAMARKET.ENABLED', true) ? 'disabled' : ''}>
                                        <button type="button" class="password-toggle" onclick="this.togglePassword('megamarket-api-key')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h5 class="setting-title">Campaign ID</h5>
                                        <p class="setting-description">Идентификатор кампании продавца</p>
                                    </div>
                                    <input type="text" class="setting-input" id="megamarket-campaign-id" 
                                           value="${config.get('API.MEGAMARKET.CAMPAIGN_ID', '')}" 
                                           placeholder="Введите Campaign ID"
                                           ${!config.get('API.MEGAMARKET.ENABLED', true) ? 'disabled' : ''}>
                                </div>
                            </div>

                            <div class="setting-actions">
                                <button class="btn btn-primary" onclick="app.components.settings.testApiConnections()">
                                    <i class="fas fa-bolt"></i>
                                    Проверить соединение
                                </button>
                                <button class="btn btn-outline" onclick="app.components.settings.resetApiSettings()">
                                    <i class="fas fa-undo"></i>
                                    Сбросить настройки API
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Настройки приложения -->
                    <div class="settings-section">
                        <div class="section-header">
                            <h3 class="section-title">
                                <i class="fas fa-cog"></i>
                                Настройки приложения
                            </h3>
                            <p>Общие настройки интерфейса и поведения приложения</p>
                        </div>

                        <div class="settings-group">
                            <div class="setting-item">
                                <div class="setting-info">
                                    <h5 class="setting-title">Автосинхронизация</h5>
                                    <p class="setting-description">
                                        Автоматическая синхронизация данных с платформами
                                    </p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="auto-sync" 
                                           ${config.get('SETTINGS.AUTO_SYNC', true) ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <h5 class="setting-title">Уведомления</h5>
                                    <p class="setting-description">
                                        Показывать уведомления о новых заказах и событиях
                                    </p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="notifications-enabled" 
                                           ${config.get('FEATURES.NOTIFICATIONS', true) ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <h5 class="setting-title">Элементов на странице</h5>
                                    <p class="setting-description">
                                        Количество заказов, отображаемых на одной странице
                                    </p>
                                </div>
                                <select class="setting-select" id="items-per-page">
                                    <option value="10" ${config.get('SETTINGS.ITEMS_PER_PAGE', 20) === 10 ? 'selected' : ''}>10</option>
                                    <option value="20" ${config.get('SETTINGS.ITEMS_PER_PAGE', 20) === 20 ? 'selected' : ''}>20</option>
                                    <option value="50" ${config.get('SETTINGS.ITEMS_PER_PAGE', 20) === 50 ? 'selected' : ''}>50</option>
                                    <option value="100" ${config.get('SETTINGS.ITEMS_PER_PAGE', 20) === 100 ? 'selected' : ''}>100</option>
                                </select>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <h5 class="setting-title">Тема оформления</h5>
                                    <p class="setting-description">
                                        Внешний вид и цветовая схема приложения
                                    </p>
                                </div>
                                <select class="setting-select" id="theme-select">
                                    <option value="auto" ${config.get('SETTINGS.THEME', 'auto') === 'auto' ? 'selected' : ''}>Авто</option>
                                    <option value="light" ${config.get('SETTINGS.THEME', 'auto') === 'light' ? 'selected' : ''}>Светлая</option>
                                    <option value="dark" ${config.get('SETTINGS.THEME', 'auto') === 'dark' ? 'selected' : ''}>Темная</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Статус API -->
                    <div class="settings-section">
                        <div class="section-header">
                            <h3 class="section-title">
                                <i class="fas fa-heartbeat"></i>
                                Статус сервисов
                            </h3>
                            <p>Статус подключения и работоспособности API платформ</p>
                        </div>

                        <div class="api-status">
                            <div class="status-item ${this.getCDEKStatus()}">
                                <div class="status-indicator"></div>
                                <div class="status-info">
                                    <span class="status-name">CDEK API</span>
                                    <span class="status-details">${this.getCDEKStatusText()}</span>
                                </div>
                                <div class="status-actions">
                                    ${this.testResults.cdek ? `
                                        <span class="test-result ${this.testResults.cdek.success ? 'success' : 'error'}">
                                            <i class="fas fa-${this.testResults.cdek.success ? 'check' : 'times'}"></i>
                                            ${this.testResults.cdek.message || ''}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="status-item ${this.getMegamarketStatus()}">
                                <div class="status-indicator"></div>
                                <div class="status-info">
                                    <span class="status-name">Мегамаркет API</span>
                                    <span class="status-details">${this.getMegamarketStatusText()}</span>
                                </div>
                                <div class="status-actions">
                                    ${this.testResults.megamarket ? `
                                        <span class="test-result ${this.testResults.megamarket.success ? 'success' : 'error'}">
                                            <i class="fas fa-${this.testResults.megamarket.success ? 'check' : 'times'}"></i>
                                            ${this.testResults.megamarket.message || ''}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>

                            <div class="status-testing" id="api-test-results">
                                <i class="fas fa-info-circle"></i>
                                <span>Нажмите "Проверить соединение" для тестирования API подключения</span>
                            </div>
                        </div>
                    </div>

                    <!-- Управление данными -->
                    <div class="settings-section">
                        <div class="section-header">
                            <h3 class="section-title">
                                <i class="fas fa-database"></i>
                                Управление данными
                            </h3>
                            <p>Управление кэшем, резервными копиями и данными приложения</p>
                        </div>

                        <div class="data-management">
                            <div class="data-action">
                                <div class="action-info">
                                    <h5>Очистка кэша</h5>
                                    <p>Удаление временных данных и перезагрузка информации</p>
                                </div>
                                <button class="btn btn-outline" onclick="app.components.settings.clearCache()">
                                    <i class="fas fa-broom"></i>
                                    Очистить кэш
                                </button>
                            </div>

                            <div class="data-action danger">
                                <div class="action-info">
                                    <h5>Сброс настроек</h5>
                                    <p>Восстановление заводских настроек по умолчанию</p>
                                </div>
                                <button class="btn btn-danger" onclick="app.components.settings.resetSettings()">
                                    <i class="fas fa-trash"></i>
                                    Сбросить настройки
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- О приложении -->
                    <div class="settings-section">
                        <div class="section-header">
                            <h3 class="section-title">
                                <i class="fas fa-info-circle"></i>
                                О приложении
                            </h3>
                            <p>Информация о версии и технические детали</p>
                        </div>

                        <div class="about-info">
                            <div class="about-item">
                                <span class="label">Версия приложения</span>
                                <span class="value">${config.get('APP.VERSION', '2.0.0')}</span>
                            </div>
                            <div class="about-item">
                                <span class="label">Название</span>
                                <span class="value">${config.get('APP.NAME', 'TEXNO EDEM')}</span>
                            </div>
                            <div class="about-item">
                                <span class="label">Компания</span>
                                <span class="value">${config.get('APP.COMPANY', 'TEXNO EDEM LLC')}</span>
                            </div>
                            <div class="about-item">
                                <span class="label">Последнее обновление</span>
                                <span class="value">${new Date().toLocaleDateString('ru-RU')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Действия настроек -->
                <div class="settings-actions">
                    <button class="btn btn-secondary" onclick="app.showSection('dashboard')">
                        <i class="fas fa-arrow-left"></i>
                        Назад
                    </button>
                    <div class="actions-right">
                        <button class="btn btn-outline" onclick="app.components.settings.cancelChanges()">
                            <i class="fas fa-times"></i>
                            Отменить
                        </button>
                        <button class="btn btn-primary ${this.unsavedChanges ? 'has-changes' : ''}" 
                                onclick="app.components.settings.saveSettings()"
                                ${!this.unsavedChanges ? 'disabled' : ''}>
                            <i class="fas fa-save"></i>
                            Сохранить настройки
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Отслеживаем изменения в настройках
        const inputs = document.querySelectorAll('#settings-container input, #settings-container select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.unsavedChanges = true;
                this.updateSaveButton();
                
                // Включаем/выключаем поля в зависимости от состояния чекбоксов
                if (input.id === 'cdek-enabled') {
                    this.toggleCDEKFields(input.checked);
                } else if (input.id === 'megamarket-enabled') {
                    this.toggleMegamarketFields(input.checked);
                }
            });
        });

        // Инициализируем состояние полей
        this.toggleCDEKFields(document.getElementById('cdek-enabled')?.checked || false);
        this.toggleMegamarketFields(document.getElementById('megamarket-enabled')?.checked || false);
    }

    toggleCDEKFields(enabled) {
        const fields = ['cdek-client-id', 'cdek-client-secret'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.disabled = !enabled;
            }
        });
    }

    toggleMegamarketFields(enabled) {
        const fields = ['megamarket-api-key', 'megamarket-campaign-id'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.disabled = !enabled;
            }
        });
    }

    togglePassword(fieldId) {
        const field = document.getElementById(fieldId);
        const toggle = field.nextElementSibling;
        
        if (field.type === 'password') {
            field.type = 'text';
            toggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            field.type = 'password';
            toggle.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }

    updateSaveButton() {
        const saveButton = document.querySelector('.settings-actions .btn-primary');
        if (saveButton) {
            saveButton.disabled = !this.unsavedChanges;
            if (this.unsavedChanges) {
                saveButton.classList.add('has-changes');
            } else {
                saveButton.classList.remove('has-changes');
            }
        }
    }

    // Методы статуса API
    getCDEKStatus() {
        const config = this.app.config;
        if (!config.get('API.CDEK.ENABLED', true)) return 'offline';
        if (!config.get('API.CDEK.CLIENT_ID') || !config.get('API.CDEK.CLIENT_SECRET')) return 'warning';
        return this.testResults.cdek?.success ? 'online' : 'unknown';
    }

    getCDEKStatusText() {
        const status = this.getCDEKStatus();
        const texts = {
            'online': 'Подключено и работает',
            'offline': 'Отключено',
            'warning': 'Требуется настройка',
            'unknown': 'Статус неизвестен',
            'error': 'Ошибка подключения'
        };
        return texts[status] || 'Неизвестно';
    }

    getMegamarketStatus() {
        const config = this.app.config;
        if (!config.get('API.MEGAMARKET.ENABLED', true)) return 'offline';
        if (!config.get('API.MEGAMARKET.API_KEY') || !config.get('API.MEGAMARKET.CAMPAIGN_ID')) return 'warning';
        return this.testResults.megamarket?.success ? 'online' : 'unknown';
    }

    getMegamarketStatusText() {
        const status = this.getMegamarketStatus();
        const texts = {
            'online': 'Подключено и работает',
            'offline': 'Отключено',
            'warning': 'Требуется настройка',
            'unknown': 'Статус неизвестен',
            'error': 'Ошибка подключения'
        };
        return texts[status] || 'Неизвестно';
    }

    // Тестирование API
    async testApiConnections() {
        const resultsContainer = document.getElementById('api-test-results');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <i class="fas fa-sync fa-spin"></i>
            <span>Тестирование подключения к API...</span>
        `;

        try {
            const tests = [];
            
            // Тест CDEK
            if (this.app.config.get('API.CDEK.ENABLED', true)) {
                tests.push(this.testCDEKConnection());
            }
            
            // Тест Мегамаркет
            if (this.app.config.get('API.MEGAMARKET.ENABLED', true)) {
                tests.push(this.testMegamarketConnection());
            }

            const results = await Promise.allSettled(tests);
            
            let successCount = 0;
            let errorCount = 0;
            const messages = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value.success) {
                    successCount++;
                    messages.push(`✓ ${result.value.service}: Успешно`);
                } else {
                    errorCount++;
                    const serviceName = index === 0 ? 'CDEK' : 'Мегамаркет';
                    const errorMessage = result.reason?.message || 'Неизвестная ошибка';
                    messages.push(`✗ ${serviceName}: ${errorMessage}`);
                }
            });

            resultsContainer.innerHTML = `
                <i class="fas fa-${errorCount === 0 ? 'check' : 'exclamation-triangle'}"></i>
                <span>${successCount} успешно, ${errorCount} с ошибками</span>
                <div style="font-size: 12px; margin-top: 4px;">${messages.join(', ')}</div>
            `;

            this.app.showNotification(
                `Тестирование завершено: ${successCount} успешно, ${errorCount} с ошибками`,
                errorCount === 0 ? 'success' : 'warning'
            );

            // Перерисовываем статусы
            this.render();

        } catch (error) {
            resultsContainer.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <span>Ошибка тестирования: ${error.message}</span>
            `;
            this.app.showNotification('Ошибка тестирования API', 'error');
        }
    }

    async testCDEKConnection() {
        try {
            // Для демо - имитируем успешное подключение
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const hasCredentials = this.app.config.get('API.CDEK.CLIENT_ID') && 
                                 this.app.config.get('API.CDEK.CLIENT_SECRET');
            
            if (!hasCredentials) {
                throw new Error('Не указаны учетные данные');
            }

            this.testResults.cdek = {
                success: true,
                message: 'Подключение успешно',
                timestamp: new Date()
            };

            return { success: true, service: 'CDEK' };
        } catch (error) {
            this.testResults.cdek = {
                success: false,
                message: error.message,
                timestamp: new Date()
            };
            return { success: false, service: 'CDEK', error: error.message };
        }
    }

    async testMegamarketConnection() {
        try {
            // Для демо - имитируем успешное подключение
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const hasCredentials = this.app.config.get('API.MEGAMARKET.API_KEY') && 
                                 this.app.config.get('API.MEGAMARKET.CAMPAIGN_ID');
            
            if (!hasCredentials) {
                throw new Error('Не указаны учетные данные');
            }

            this.testResults.megamarket = {
                success: true,
                message: 'Подключение успешно',
                timestamp: new Date()
            };

            return { success: true, service: 'Мегамаркет' };
        } catch (error) {
            this.testResults.megamarket = {
                success: false,
                message: error.message,
                timestamp: new Date()
            };
            return { success: false, service: 'Мегамаркет', error: error.message };
        }
    }

    // Сохранение настроек
    async saveSettings() {
        try {
            this.app.showLoading('Сохранение настроек...');

            // Собираем настройки API CDEK
            this.app.config.set('API.CDEK.ENABLED', document.getElementById('cdek-enabled').checked);
            this.app.config.set('API.CDEK.CLIENT_ID', document.getElementById('cdek-client-id').value);
            this.app.config.set('API.CDEK.CLIENT_SECRET', document.getElementById('cdek-client-secret').value);

            // Собираем настройки API Megamarket
            this.app.config.set('API.MEGAMARKET.ENABLED', document.getElementById('megamarket-enabled').checked);
            this.app.config.set('API.MEGAMARKET.API_KEY', document.getElementById('megamarket-api-key').value);
            this.app.config.set('API.MEGAMARKET.CAMPAIGN_ID', document.getElementById('megamarket-campaign-id').value);

            // Собираем настройки приложения
            this.app.config.set('SETTINGS.AUTO_SYNC', document.getElementById('auto-sync').checked);
            this.app.config.set('SETTINGS.ITEMS_PER_PAGE', parseInt(document.getElementById('items-per-page').value));
            this.app.config.set('SETTINGS.THEME', document.getElementById('theme-select').value);
            this.app.config.set('FEATURES.NOTIFICATIONS', document.getElementById('notifications-enabled').checked);

            // Сохраняем конфигурацию
            this.app.saveConfig();
            
            // Применяем тему
            this.app.applyTheme();

            this.unsavedChanges = false;
            this.updateSaveButton();
            
            this.app.showNotification('Настройки успешно сохранены', 'success');
            
            // Перезапускаем автосинхронизацию
            this.app.stopAutoSync();
            this.app.startAutoSync();
            
            // Перерисовываем компонент для обновления статусов
            setTimeout(() => this.render(), 100);

        } catch (error) {
            console.error('Error saving settings:', error);
            this.app.showNotification('Ошибка сохранения настроек', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    cancelChanges() {
        this.unsavedChanges = false;
        this.updateSaveButton();
        this.render(); // Перерисовываем с исходными значениями
        this.app.showNotification('Изменения отменены', 'info');
    }

    // Управление данными
    clearCache() {
        try {
            // Очищаем localStorage
            Storage.clear();
            
            this.app.showNotification('Кэш успешно очищен', 'success');
            
            // Перезагружаем данные
            setTimeout(() => {
                this.app.loadInitialData();
            }, 1000);
            
        } catch (error) {
            console.error('Error clearing cache:', error);
            this.app.showNotification('Ошибка очистки кэша', 'error');
        }
    }

    resetApiSettings() {
        if (confirm('Сбросить настройки API к значениям по умолчанию?')) {
            try {
                this.app.config.set('API.CDEK.ENABLED', true);
                this.app.config.set('API.CDEK.CLIENT_ID', '');
                this.app.config.set('API.CDEK.CLIENT_SECRET', '');
                
                this.app.config.set('API.MEGAMARKET.ENABLED', true);
                this.app.config.set('API.MEGAMARKET.API_KEY', '');
                this.app.config.set('API.MEGAMARKET.CAMPAIGN_ID', '');
                
                this.unsavedChanges = true;
                this.updateSaveButton();
                this.render();
                
                this.app.showNotification('Настройки API сброшены', 'info');
            } catch (error) {
                console.error('Error resetting API settings:', error);
                this.app.showNotification('Ошибка сброса настроек API', 'error');
            }
        }
    }

    resetSettings() {
        if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию? Это действие нельзя отменить.')) {
            try {
                this.app.config.reset();
                this.unsavedChanges = false;
                this.updateSaveButton();
                this.render();
                this.app.showNotification('Настройки сброшены к значениям по умолчанию', 'success');
            } catch (error) {
                console.error('Error resetting settings:', error);
                this.app.showNotification('Ошибка сброса настроек', 'error');
            }
        }
    }
}

// Добавляем метод togglePassword в прототип
SettingsComponent.prototype.togglePassword = function(fieldId) {
    const field = document.getElementById(fieldId);
    const toggle = field?.parentNode?.querySelector('.password-toggle');
    
    if (field && toggle) {
        if (field.type === 'password') {
            field.type = 'text';
            toggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            field.type = 'password';
            toggle.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }
};
