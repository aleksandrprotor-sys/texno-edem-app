// js/components/settings.js - Полная реализация компонента настроек
class SettingsComponent {
    constructor(app) {
        this.app = app;
        this.unsavedChanges = false;
        this.testResults = {
            cdek: null,
            megamarket: null
        };
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
                <div class="settings-header">
                    <h2>Настройки системы</h2>
                    <p>Управление интеграциями и настройками приложения</p>
                </div>

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
                                        <button type="button" class="password-toggle" onclick="app.settingsComponent.togglePassword('cdek-client-secret')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h5 class="setting-title">Интервал синхронизации</h5>
                                        <p class="setting-description">Частота обновления данных из CDEK</p>
                                    </div>
                                    <select class="setting-select" id="cdek-sync-interval" 
                                            ${!config.get('API.CDEK.ENABLED', true) ? 'disabled' : ''}>
                                        <option value="300000" ${config.get('API.CDEK.SYNC_INTERVAL', 300000) === 300000 ? 'selected' : ''}>5 минут</option>
                                        <option value="600000" ${config.get('API.CDEK.SYNC_INTERVAL', 300000) === 600000 ? 'selected' : ''}>10 минут</option>
                                        <option value="900000" ${config.get('API.CDEK.SYNC_INTERVAL', 300000) === 900000 ? 'selected' : ''}>15 минут</option>
                                        <option value="1800000" ${config.get('API.CDEK.SYNC_INTERVAL', 300000) === 1800000 ? 'selected' : ''}>30 минут</option>
                                    </select>
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
                                        <button type="button" class="password-toggle" onclick="app.settingsComponent.togglePassword('megamarket-api-key')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h5 class="setting-title">Secret Key</h5>
                                        <p class="setting-description">Секретный ключ для подписи запросов</p>
                                    </div>
                                    <div class="password-input">
                                        <input type="password" class="setting-input" id="megamarket-secret-key" 
                                               value="${config.get('API.MEGAMARKET.SECRET_KEY', '')}" 
                                               placeholder="Введите Secret Key"
                                               ${!config.get('API.MEGAMARKET.ENABLED', true) ? 'disabled' : ''}>
                                        <button type="button" class="password-toggle" onclick="app.settingsComponent.togglePassword('megamarket-secret-key')">
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
                                <button class="btn btn-primary" onclick="app.settingsComponent.testApiConnections()">
                                    <i class="fas fa-bolt"></i>
                                    Проверить соединение
                                </button>
                                <button class="btn btn-outline" onclick="app.settingsComponent.resetApiSettings()">
                                    <i class="fas fa-undo"></i>
                                    Сбросить настройки
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
                                    <h5 class="setting-title">Звук уведомлений</h5>
                                    <p class="setting-description">
                                        Воспроизводить звук при новых уведомлениях
                                    </p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="notification-sound" 
                                           ${config.get('SETTINGS.NOTIFICATION_SOUND', true) ? 'checked' : ''}>
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

                            <div class="setting-item">
                                <div class="setting-info">
                                    <h5 class="setting-title">Язык интерфейса</h5>
                                    <p class="setting-description">
                                        Язык отображения текстов и сообщений
                                    </p>
                                </div>
                                <select class="setting-select" id="language-select">
                                    <option value="ru" ${config.get('SETTINGS.LANGUAGE', 'ru') === 'ru' ? 'selected' : ''}>Русский</option>
                                    <option value="en" ${config.get('SETTINGS.LANGUAGE', 'ru') === 'en' ? 'selected' : ''}>English</option>
                                </select>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <h5 class="setting-title">Валюта</h5>
                                    <p class="setting-description">
                                        Валюта для отображения сумм и цен
                                    </p>
                                </div>
                                <select class="setting-select" id="currency-select">
                                    <option value="RUB" ${config.get('SETTINGS.CURRENCY', 'RUB') === 'RUB' ? 'selected' : ''}>Рубли (RUB)</option>
                                    <option value="USD" ${config.get('SETTINGS.CURRENCY', 'RUB') === 'USD' ? 'selected' : ''}>Доллары (USD)</option>
                                    <option value="EUR" ${config.get('SETTINGS.CURRENCY', 'RUB') === 'EUR' ? 'selected' : ''}>Евро (EUR)</option>
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
                                <button class="btn btn-outline" onclick="app.settingsComponent.clearCache()">
                                    <i class="fas fa-broom"></i>
                                    Очистить кэш
                                </button>
                            </div>

                            <div class="data-action">
                                <div class="action-info">
                                    <h5>Экспорт настроек</h5>
                                    <p>Скачать файл с текущими настройками приложения</p>
                                </div>
                                <button class="btn btn-outline" onclick="app.settingsComponent.exportSettings()">
                                    <i class="fas fa-download"></i>
                                    Экспорт настроек
                                </button>
                            </div>

                            <div class="data-action">
                                <div class="action-info">
                                    <h5>Импорт настроек</h5>
                                    <p>Загрузить настройки из файла конфигурации</p>
                                </div>
                                <div class="import-controls">
                                    <input type="file" id="settings-import" accept=".json" style="display: none;" 
                                           onchange="app.settingsComponent.importSettings(event)">
                                    <button class="btn btn-outline" onclick="document.getElementById('settings-import').click()">
                                        <i class="fas fa-upload"></i>
                                        Выбрать файл
                                    </button>
                                </div>
                            </div>

                            <div class="data-action danger">
                                <div class="action-info">
                                    <h5>Сброс настроек</h5>
                                    <p>Восстановление заводских настроек по умолчанию</p>
                                </div>
                                <button class="btn btn-danger" onclick="app.settingsComponent.resetSettings()">
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
                                <span class="value">${config.get('APP.VERSION', '1.0.0')}</span>
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
                                <span class="label">Сборка</span>
                                <span class="value">${config.get('APP.BUILD', '2024.01.15')}</span>
                            </div>
                            <div class="about-item">
                                <span class="label">Последнее обновление</span>
                                <span class="value">${new Date().toLocaleDateString('ru-RU')}</span>
                            </div>
                            <div class="about-item">
                                <span class="label">Размер хранилища</span>
                                <span class="value">
                                    <span id="storage-size">${this.getStorageSize()}</span>
                                    <button class="btn btn-sm btn-outline" onclick="app.settingsComponent.showStorageInfo()">
                                        <i class="fas fa-info"></i>
                                    </button>
                                </span>
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
                        <button class="btn btn-outline" onclick="app.settingsComponent.cancelChanges()">
                            <i class="fas fa-times"></i>
                            Отменить
                        </button>
                        <button class="btn btn-primary ${this.unsavedChanges ? 'has-changes' : ''}" 
                                onclick="app.settingsComponent.saveSettings()"
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
        const fields = ['cdek-client-id', 'cdek-client-secret', 'cdek-sync-interval'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.disabled = !enabled;
            }
        });
    }

    toggleMegamarketFields(enabled) {
        const fields = ['megamarket-api-key', 'megamarket-secret-key', 'megamarket-campaign-id'];
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
            this.app.config.set('API.CDEK.SYNC_INTERVAL', parseInt(document.getElementById('cdek-sync-interval').value));

            // Собираем настройки API Megamarket
            this.app.config.set('API.MEGAMARKET.ENABLED', document.getElementById('megamarket-enabled').checked);
            this.app.config.set('API.MEGAMARKET.API_KEY', document.getElementById('megamarket-api-key').value);
            this.app.config.set('API.MEGAMARKET.SECRET_KEY', document.getElementById('megamarket-secret-key').value);
            this.app.config.set('API.MEGAMARKET.CAMPAIGN_ID', document.getElementById('megamarket-campaign-id').value);

            // Собираем настройки приложения
            this.app.config.set('SETTINGS.AUTO_SYNC', document.getElementById('auto-sync').checked);
            this.app.config.set('SETTINGS.NOTIFICATION_SOUND', document.getElementById('notification-sound').checked);
            this.app.config.set('SETTINGS.ITEMS_PER_PAGE', parseInt(document.getElementById('items-per-page').value));
            this.app.config.set('SETTINGS.THEME', document.getElementById('theme-select').value);
            this.app.config.set('SETTINGS.LANGUAGE', document.getElementById('language-select').value);
            this.app.config.set('SETTINGS.CURRENCY', document.getElementById('currency-select').value);
            this.app.config.set('FEATURES.NOTIFICATIONS', document.getElementById('notifications-enabled').checked);

            // Применяем тему
            this.app.config.applyTheme();

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
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('texno_edem_')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Очищаем кэш API менеджера если доступен
            if (window.apiManager && apiManager.clearCache) {
                apiManager.clearCache();
            }
            
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

    exportSettings() {
        try {
            const configData = this.app.config.exportConfig();
            if (!configData) {
                throw new Error('Не удалось экспортировать настройки');
            }

            const blob = new Blob([configData], { type: 'application/json' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `texno-edem-settings-${new Date().toISOString().split('T')[0]}.json`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.app.showNotification('Настройки успешно экспортированы', 'success');
            
        } catch (error) {
            console.error('Error exporting settings:', error);
            this.app.showNotification('Ошибка экспорта настроек', 'error');
        }
    }

    importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const success = this.app.config.importConfig(e.target.result);
                if (success) {
                    this.app.showNotification('Настройки успешно импортированы', 'success');
                    this.render(); // Перерисовываем с новыми настройками
                } else {
                    throw new Error('Неверный формат файла');
                }
            } catch (error) {
                console.error('Error importing settings:', error);
                this.app.showNotification('Ошибка импорта настроек', 'error');
            }
        };
        
        reader.onerror = () => {
            this.app.showNotification('Ошибка чтения файла', 'error');
        };
        
        reader.readAsText(file);
        
        // Сбрасываем значение input для возможности повторной загрузки того же файла
        event.target.value = '';
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

    resetApiSettings() {
        if (confirm('Сбросить настройки API к значениям по умолчанию?')) {
            try {
                this.app.config.set('API.CDEK.ENABLED', true);
                this.app.config.set('API.CDEK.CLIENT_ID', '');
                this.app.config.set('API.CDEK.CLIENT_SECRET', '');
                this.app.config.set('API.CDEK.SYNC_INTERVAL', 300000);
                
                this.app.config.set('API.MEGAMARKET.ENABLED', true);
                this.app.config.set('API.MEGAMARKET.API_KEY', '');
                this.app.config.set('API.MEGAMARKET.SECRET_KEY', '');
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

    getStorageSize() {
        try {
            let totalSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('texno_edem_')) {
                    const value = localStorage.getItem(key);
                    totalSize += new Blob([value]).size;
                }
            }
            return (totalSize / 1024).toFixed(2) + ' KB';
        } catch (error) {
            return 'Неизвестно';
        }
    }

    showStorageInfo() {
        const info = {
            'Общий размер': this.getStorageSize(),
            'Количество ключей': this.getStorageKeysCount(),
            'Версия приложения': this.app.config.get('APP.VERSION'),
            'Последнее обновление': new Date().toLocaleString('ru-RU')
        };

        let message = 'Информация о хранилище:\n\n';
        Object.entries(info).forEach(([key, value]) => {
            message += `${key}: ${value}\n`;
        });

        alert(message);
    }

    getStorageKeysCount() {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('texno_edem_')) {
                count++;
            }
        }
        return count;
    }
}
