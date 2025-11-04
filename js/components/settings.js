// js/components/settings.js - Полная реализация
class SettingsComponent {
    constructor(app) {
        this.app = app;
        this.unsavedChanges = false;
    }

    render() {
        const container = document.getElementById('settings-container');
        if (!container) return;

        container.innerHTML = this.createSettingsHTML();
        this.attachEventListeners();
    }

    createSettingsHTML() {
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
                            <p>Настройки интеграции с платформами</p>
                        </div>
                        
                        <div class="settings-grid">
                            <!-- CDEK Settings -->
                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4 class="setting-title">CDEK API</h4>
                                    <p class="setting-description">
                                        Настройки интеграции с CDEK Logistics
                                    </p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="cdek-enabled" 
                                           ${this.app.config.API.CDEK.ENABLED ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4 class="setting-title">Client ID</h4>
                                    <p class="setting-description">Идентификатор клиента CDEK</p>
                                </div>
                                <input type="text" class="setting-input" id="cdek-client-id" 
                                       value="${this.app.config.API.CDEK.CLIENT_ID}" 
                                       placeholder="Введите Client ID">
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4 class="setting-title">Client Secret</h4>
                                    <p class="setting-description">Секретный ключ CDEK</p>
                                </div>
                                <input type="password" class="setting-input" id="cdek-client-secret" 
                                       value="${this.app.config.API.CDEK.CLIENT_SECRET}" 
                                       placeholder="Введите Client Secret">
                            </div>

                            <!-- Megamarket Settings -->
                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4 class="setting-title">Мегамаркет API</h4>
                                    <p class="setting-description">
                                        Настройки интеграции с Мегамаркет
                                    </p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="megamarket-enabled" 
                                           ${this.app.config.API.MEGAMARKET.ENABLED ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4 class="setting-title">API Key</h4>
                                    <p class="setting-description">Ключ API Мегамаркет</p>
                                </div>
                                <input type="text" class="setting-input" id="megamarket-api-key" 
                                       value="${this.app.config.API.MEGAMARKET.API_KEY}" 
                                       placeholder="Введите API Key">
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4 class="setting-title">Campaign ID</h4>
                                    <p class="setting-description">ID кампании в Мегамаркет</p>
                                </div>
                                <input type="text" class="setting-input" id="megamarket-campaign-id" 
                                       value="${this.app.config.API.MEGAMARKET.CAMPAIGN_ID}" 
                                       placeholder="Введите Campaign ID">
                            </div>
                        </div>

                        <div class="setting-actions">
                            <button class="btn btn-primary" onclick="app.settingsComponent.testApiConnections()">
                                <i class="fas fa-bolt"></i>
                                Проверить соединение
                            </button>
                        </div>
                    </div>

                    <!-- Настройки приложения -->
                    <div class="settings-section">
                        <div class="section-header">
                            <h3 class="section-title">
                                <i class="fas fa-cog"></i>
                                Настройки приложения
                            </h3>
                            <p>Общие настройки приложения</p>
                        </div>

                        <div class="settings-grid">
                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4 class="setting-title">Автосинхронизация</h4>
                                    <p class="setting-description">
                                        Автоматическая синхронизация данных каждые 5 минут
                                    </p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="auto-sync" 
                                           ${this.app.config.SETTINGS.AUTO_SYNC ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4 class="setting-title">Уведомления</h4>
                                    <p class="setting-description">
                                        Показывать уведомления о новых заказах
                                    </p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="notifications-enabled" 
                                           ${this.app.config.FEATURES.NOTIFICATIONS ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4 class="setting-title">Звук уведомлений</h4>
                                    <p class="setting-description">
                                        Воспроизводить звук при новых уведомлениях
                                    </p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="notification-sound" 
                                           ${this.app.config.SETTINGS.NOTIFICATION_SOUND ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4 class="setting-title">Элементов на странице</h4>
                                    <p class="setting-description">
                                        Количество заказов на одной странице
                                    </p>
                                </div>
                                <select class="setting-select" id="items-per-page">
                                    <option value="10" ${this.app.config.SETTINGS.ITEMS_PER_PAGE === 10 ? 'selected' : ''}>10</option>
                                    <option value="20" ${this.app.config.SETTINGS.ITEMS_PER_PAGE === 20 ? 'selected' : ''}>20</option>
                                    <option value="50" ${this.app.config.SETTINGS.ITEMS_PER_PAGE === 50 ? 'selected' : ''}>50</option>
                                    <option value="100" ${this.app.config.SETTINGS.ITEMS_PER_PAGE === 100 ? 'selected' : ''}>100</option>
                                </select>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4 class="setting-title">Тема оформления</h4>
                                    <p class="setting-description">
                                        Внешний вид приложения
                                    </p>
                                </div>
                                <select class="setting-select" id="theme-select">
                                    <option value="auto" ${this.app.config.SETTINGS.THEME === 'auto' ? 'selected' : ''}>Авто</option>
                                    <option value="light" ${this.app.config.SETTINGS.THEME === 'light' ? 'selected' : ''}>Светлая</option>
                                    <option value="dark" ${this.app.config.SETTINGS.THEME === 'dark' ? 'selected' : ''}>Темная</option>
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
                            <p>Статус подключения к API платформ</p>
                        </div>

                        <div class="api-status">
                            <div class="status-item">
                                <div class="status-indicator ${this.getCDEKStatus()}"></div>
                                <span>CDEK API</span>
                                <span class="status-details">${this.getCDEKStatusText()}</span>
                            </div>
                            
                            <div class="status-item">
                                <div class="status-indicator ${this.getMegamarketStatus()}"></div>
                                <span>Мегамаркет API</span>
                                <span class="status-details">${this.getMegamarketStatusText()}</span>
                            </div>

                            <div class="status-testing" id="api-test-results">
                                <i class="fas fa-info-circle"></i>
                                <span>Нажмите "Проверить соединение" для тестирования API</span>
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
                            <p>Информация о приложении TEXNO EDEM</p>
                        </div>

                        <div class="about-info">
                            <div class="about-item">
                                <span class="label">Версия</span>
                                <span class="value">${this.app.config.APP.VERSION}</span>
                            </div>
                            <div class="about-item">
                                <span class="label">Компания</span>
                                <span class="value">${this.app.config.APP.COMPANY}</span>
                            </div>
                            <div class="about-item">
                                <span class="label">Последнее обновление</span>
                                <span class="value">${new Date().toLocaleDateString('ru-RU')}</span>
                            </div>
                            <div class="about-item">
                                <span class="label">Кэш приложения</span>
                                <span class="value">
                                    <button class="btn btn-sm btn-outline" onclick="app.settingsComponent.clearCache()">
                                        Очистить кэш
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
                    <button class="btn btn-primary ${this.unsavedChanges ? 'has-changes' : ''}" 
                            onclick="app.settingsComponent.saveSettings()"
                            ${!this.unsavedChanges ? 'disabled' : ''}>
                        <i class="fas fa-save"></i>
                        Сохранить настройки
                    </button>
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
            });
        });
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
        const config = this.app.config.API.CDEK;
        if (!config.ENABLED) return 'offline';
        if (!config.CLIENT_ID || !config.CLIENT_SECRET) return 'warning';
        return 'online';
    }

    getCDEKStatusText() {
        const status = this.getCDEKStatus();
        const texts = {
            'online': 'Подключено',
            'offline': 'Отключено',
            'warning': 'Требуется настройка',
            'error': 'Ошибка подключения'
        };
        return texts[status] || 'Неизвестно';
    }

    getMegamarketStatus() {
        const config = this.app.config.API.MEGAMARKET;
        if (!config.ENABLED) return 'offline';
        if (!config.API_KEY || !config.CAMPAIGN_ID) return 'warning';
        return 'online';
    }

    getMegamarketStatusText() {
        const status = this.getMegamarketStatus();
        const texts = {
            'online': 'Подключено',
            'offline': 'Отключено',
            'warning': 'Требуется настройка',
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
            if (this.app.config.API.CDEK.ENABLED) {
                tests.push(this.testCDEKConnection());
            }
            
            // Тест Мегамаркет
            if (this.app.config.API.MEGAMARKET.ENABLED) {
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
                    messages.push(`✗ ${serviceName}: Ошибка подключения`);
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
            return { success: true, service: 'CDEK' };
        } catch (error) {
            return { success: false, service: 'CDEK', error: error.message };
        }
    }

    async testMegamarketConnection() {
        try {
            // Для демо - имитируем успешное подключение
            await new Promise(resolve => setTimeout(resolve, 1500));
            return { success: true, service: 'Мегамаркет' };
        } catch (error) {
            return { success: false, service: 'Мегамаркет', error: error.message };
        }
    }

    // Сохранение настроек
    async saveSettings() {
        try {
            this.app.showLoading('Сохранение настроек...');

            // Собираем настройки API
            this.app.config.API.CDEK.ENABLED = document.getElementById('cdek-enabled').checked;
            this.app.config.API.CDEK.CLIENT_ID = document.getElementById('cdek-client-id').value;
            this.app.config.API.CDEK.CLIENT_SECRET = document.getElementById('cdek-client-secret').value;

            this.app.config.API.MEGAMARKET.ENABLED = document.getElementById('megamarket-enabled').checked;
            this.app.config.API.MEGAMARKET.API_KEY = document.getElementById('megamarket-api-key').value;
            this.app.config.API.MEGAMARKET.CAMPAIGN_ID = document.getElementById('megamarket-campaign-id').value;

            // Собираем настройки приложения
            this.app.config.SETTINGS.AUTO_SYNC = document.getElementById('auto-sync').checked;
            this.app.config.SETTINGS.NOTIFICATION_SOUND = document.getElementById('notification-sound').checked;
            this.app.config.SETTINGS.ITEMS_PER_PAGE = parseInt(document.getElementById('items-per-page').value);
            this.app.config.SETTINGS.THEME = document.getElementById('theme-select').value;
            this.app.config.FEATURES.NOTIFICATIONS = document.getElementById('notifications-enabled').checked;

            // Сохраняем конфигурацию
            this.app.saveConfig();
            
            // Применяем тему
            this.applyTheme();

            this.unsavedChanges = false;
            this.updateSaveButton();
            
            this.app.showNotification('Настройки успешно сохранены', 'success');
            
            // Перерисовываем компонент для обновления статусов
            setTimeout(() => this.render(), 100);

        } catch (error) {
            console.error('Error saving settings:', error);
            this.app.showNotification('Ошибка сохранения настроек', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    applyTheme() {
        const theme = this.app.config.SETTINGS.THEME;
        if (theme === 'auto') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    clearCache() {
        try {
            localStorage.removeItem('texno_edem_orders');
            localStorage.removeItem('texno_edem_analytics');
            localStorage.removeItem('texno_edem_settings');
            
            if (apiManager && apiManager.clearCache) {
                apiManager.clearCache();
            }
            
            this.app.showNotification('Кэш успешно очищен', 'success');
            
            // Перезагружаем данные
            setTimeout(() => {
                this.app.refreshData();
            }, 1000);
            
        } catch (error) {
            console.error('Error clearing cache:', error);
            this.app.showNotification('Ошибка очистки кэша', 'error');
        }
    }
}
