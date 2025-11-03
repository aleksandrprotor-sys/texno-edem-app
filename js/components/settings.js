// js/components/settings.js
class SettingsComponent {
    constructor(app) {
        this.app = app;
        this.unsavedChanges = false;
        
        // Защищенная инициализация
        try {
            this.currentSettings = this.loadCurrentSettings();
        } catch (error) {
            console.error('Settings initialization error:', error);
            this.currentSettings = this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            autoSync: true,
            syncInterval: 300000,
            notificationSound: true,
            themeMode: 'light',
            accentColor: '#3498DB',
            cdekEnabled: true,
            megamarketEnabled: true,
            cdekClientId: '',
            cdekClientSecret: '',
            megamarketApiKey: '',
            megamarketSecretKey: '',
            megamarketCampaignId: '',
            userName: 'Пользователь',
            userEmail: '',
            userPhone: '',
            emailReports: false,
            pushNotifications: true
        };
    }

    render() {
        const container = document.getElementById('settings-container');
        if (!container) {
            console.error('❌ Settings container not found');
            return;
        }

        console.log('🎨 Rendering settings...');
        container.innerHTML = this.createSettingsHTML();
        this.attachEventListeners();
        this.updateSaveButton();
    }

    loadCurrentSettings() {
        const userSettings = JSON.parse(localStorage.getItem('texno_edem_user_settings') || '{}');
        
        return {
            // Основные настройки
            autoSync: CONFIG.get('SETTINGS.AUTO_SYNC', true),
            syncInterval: CONFIG.get('SETTINGS.SYNC_INTERVAL', 300000),
            notificationSound: CONFIG.get('SETTINGS.NOTIFICATION_SOUND', true),
            
            // Настройки темы
            themeMode: CONFIG.get('SETTINGS.THEME_MODE', 'light'),
            accentColor: CONFIG.get('SETTINGS.ACCENT_COLOR', '#3498DB'),
            
            // Интеграции
            cdekEnabled: CONFIG.get('API.CDEK.ENABLED', true),
            megamarketEnabled: CONFIG.get('API.MEGAMARKET.ENABLED', true),
            
            // API ключи
            cdekClientId: CONFIG.get('API.CDEK.CLIENT_ID', ''),
            cdekClientSecret: CONFIG.get('API.CDEK.CLIENT_SECRET', ''),
            megamarketApiKey: CONFIG.get('API.MEGAMARKET.API_KEY', ''),
            megamarketSecretKey: CONFIG.get('API.MEGAMARKET.SECRET_KEY', ''),
            megamarketCampaignId: CONFIG.get('API.MEGAMARKET.CAMPAIGN_ID', ''),
            
            // Настройки пользователя
            userName: userSettings.userName || this.app.user?.firstName || 'Пользователь',
            userEmail: userSettings.userEmail || this.app.user?.email || '',
            userPhone: userSettings.userPhone || this.app.user?.phone || '',
            emailReports: userSettings.emailReports || false,
            pushNotifications: userSettings.pushNotifications || true
        };
    }

    createSettingsHTML() {
        return `
            <div class="settings-content">
                <!-- Настройки аккаунта -->
                <div class="settings-section">
                    <div class="section-header">
                        <i class="fas fa-user-circle"></i>
                        <div class="section-header-text">
                            <h3>Аккаунт пользователя</h3>
                            <p>Управление профилем и уведомлениями</p>
                        </div>
                    </div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Имя пользователя</h4>
                                <p>Отображаемое имя в системе</p>
                            </div>
                            <div class="setting-control">
                                <input type="text" id="user-name" class="form-control" 
                                       value="${this.currentSettings.userName}" 
                                       placeholder="Введите ваше имя">
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Email для уведомлений</h4>
                                <p>Для отчетов и важных оповещений</p>
                            </div>
                            <div class="setting-control">
                                <input type="email" id="user-email" class="form-control" 
                                       value="${this.currentSettings.userEmail}" 
                                       placeholder="email@example.com">
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Телефон</h4>
                                <p>Для экстренных уведомлений</p>
                            </div>
                            <div class="setting-control">
                                <input type="tel" id="user-phone" class="form-control" 
                                       value="${this.currentSettings.userPhone}" 
                                       placeholder="+7 XXX XXX-XX-XX">
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Email отчеты</h4>
                                <p>Ежедневные отчеты на почту</p>
                            </div>
                            <div class="setting-control">
                                <label class="switch">
                                    <input type="checkbox" id="email-reports" 
                                           ${this.currentSettings.emailReports ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Push-уведомления</h4>
                                <p>Мгновенные оповещения в браузере</p>
                            </div>
                            <div class="setting-control">
                                <label class="switch">
                                    <input type="checkbox" id="push-notifications" 
                                           ${this.currentSettings.pushNotifications ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Настройки API интеграций -->
                <div class="settings-section">
                    <div class="section-header">
                        <i class="fas fa-key"></i>
                        <div class="section-header-text">
                            <h3>API интеграции</h3>
                            <p>Настройка подключения к платформам</p>
                        </div>
                    </div>

                    <!-- CDEK API -->
                    <div class="api-integration">
                        <div class="api-header">
                            <div class="api-info">
                                <i class="fas fa-shipping-fast"></i>
                                <div>
                                    <h4>CDEK API</h4>
                                    <p>Интеграция с логистической платформой</p>
                                </div>
                            </div>
                            <div class="api-control">
                                <label class="switch">
                                    <input type="checkbox" id="cdek-enabled" 
                                           ${this.currentSettings.cdekEnabled ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="api-fields ${this.currentSettings.cdekEnabled ? 'active' : ''}" id="cdek-fields">
                            <div class="api-field-row">
                                <div class="api-field">
                                    <label for="cdek-client-id">Client ID</label>
                                    <input type="text" id="cdek-client-id" class="form-control" 
                                           value="${this.currentSettings.cdekClientId}" 
                                           placeholder="Введите Client ID">
                                </div>
                                <div class="api-field">
                                    <label for="cdek-client-secret">Client Secret</label>
                                    <input type="password" id="cdek-client-secret" class="form-control" 
                                           value="${this.currentSettings.cdekClientSecret}" 
                                           placeholder="Введите Client Secret">
                                </div>
                            </div>
                            <div class="api-actions">
                                <button class="btn btn-sm btn-outline" onclick="app.settingsComponent.testCdekConnection()">
                                    <i class="fas fa-plug"></i> Проверить подключение
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Мегамаркет API -->
                    <div class="api-integration">
                        <div class="api-header">
                            <div class="api-info">
                                <i class="fas fa-store"></i>
                                <div>
                                    <h4>Мегамаркет API</h4>
                                    <p>Интеграция с маркетплейсом</p>
                                </div>
                            </div>
                            <div class="api-control">
                                <label class="switch">
                                    <input type="checkbox" id="megamarket-enabled" 
                                           ${this.currentSettings.megamarketEnabled ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="api-fields ${this.currentSettings.megamarketEnabled ? 'active' : ''}" id="megamarket-fields">
                            <div class="api-field-row">
                                <div class="api-field">
                                    <label for="megamarket-api-key">API Key</label>
                                    <input type="text" id="megamarket-api-key" class="form-control" 
                                           value="${this.currentSettings.megamarketApiKey}" 
                                           placeholder="Введите API Key">
                                </div>
                                <div class="api-field">
                                    <label for="megamarket-secret-key">Secret Key</label>
                                    <input type="password" id="megamarket-secret-key" class="form-control" 
                                           value="${this.currentSettings.megamarketSecretKey}" 
                                           placeholder="Введите Secret Key">
                                </div>
                            </div>
                            <div class="api-field">
                                <label for="megamarket-campaign-id">Campaign ID</label>
                                <input type="text" id="megamarket-campaign-id" class="form-control" 
                                       value="${this.currentSettings.megamarketCampaignId}" 
                                       placeholder="Введите Campaign ID">
                            </div>
                            <div class="api-actions">
                                <button class="btn btn-sm btn-outline" onclick="app.settingsComponent.testMegamarketConnection()">
                                    <i class="fas fa-plug"></i> Проверить подключение
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                                <!-- Внешний вид -->
                <div class="settings-section">
                    <div class="section-header">
                        <i class="fas fa-palette"></i>
                        <div class="section-header-text">
                            <h3>Внешний вид</h3>
                            <p>Настройте интерфейс под себя</p>
                        </div>
                    </div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Тема оформления</h4>
                                <p>Выберите светлую или темную тему</p>
                            </div>
                            <div class="setting-control">
                                <select id="theme-mode" class="form-control">
                                    <option value="light" ${this.currentSettings.themeMode === 'light' ? 'selected' : ''}>Светлая</option>
                                    <option value="dark" ${this.currentSettings.themeMode === 'dark' ? 'selected' : ''}>Темная</option>
                                    <option value="auto" ${this.currentSettings.themeMode === 'auto' ? 'selected' : ''}>Системная</option>
                                </select>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Акцентный цвет</h4>
                                <p>Основной цвет интерфейса</p>
                            </div>
                            <div class="setting-control">
                                <div class="color-picker-container">
                                    <input type="color" id="accent-color" class="color-picker" 
                                           value="${this.currentSettings.accentColor}">
                                    <span class="color-value">${this.currentSettings.accentColor}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Системные настройки -->
                <div class="settings-section">
                    <div class="section-header">
                        <i class="fas fa-cog"></i>
                        <div class="section-header-text">
                            <h3>Системные настройки</h3>
                            <p>Параметры работы приложения</p>
                        </div>
                    </div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Автосинхронизация</h4>
                                <p>Автоматическая синхронизация данных</p>
                            </div>
                            <div class="setting-control">
                                <label class="switch">
                                    <input type="checkbox" id="auto-sync" 
                                           ${this.currentSettings.autoSync ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Интервал синхронизации</h4>
                                <p>Частота обновления данных (минуты)</p>
                            </div>
                            <div class="setting-control">
                                <select id="sync-interval" class="form-control" 
                                        ${this.currentSettings.autoSync ? '' : 'disabled'}>
                                    <option value="60000" ${this.currentSettings.syncInterval === 60000 ? 'selected' : ''}>1 минута</option>
                                    <option value="300000" ${this.currentSettings.syncInterval === 300000 ? 'selected' : ''}>5 минут</option>
                                    <option value="900000" ${this.currentSettings.syncInterval === 900000 ? 'selected' : ''}>15 минут</option>
                                    <option value="1800000" ${this.currentSettings.syncInterval === 1800000 ? 'selected' : ''}>30 минут</option>
                                </select>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Звук уведомлений</h4>
                                <p>Звуковые оповещения о событиях</p>
                            </div>
                            <div class="setting-control">
                                <label class="switch">
                                    <input type="checkbox" id="notification-sound" 
                                           ${this.currentSettings.notificationSound ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Кнопки действий -->
                <div class="settings-actions">
                    <button class="btn btn-secondary" onclick="app.settingsComponent.resetToDefaults()">
                        <i class="fas fa-undo"></i> Сбросить настройки
                    </button>
                    <div class="action-buttons">
                        <button class="btn btn-outline" onclick="app.settingsComponent.cancelChanges()">
                            Отмена
                        </button>
                        <button class="btn btn-primary" id="save-settings" onclick="app.settingsComponent.saveSettings()" disabled>
                            <i class="fas fa-save"></i> Сохранить изменения
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Отслеживание изменений для показа кнопки сохранения
        const inputs = document.querySelectorAll('#settings-container input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.unsavedChanges = true;
                this.updateSaveButton();
            });
            input.addEventListener('input', () => {
                this.unsavedChanges = true;
                this.updateSaveButton();
            });
        });

        // Переключение видимости полей API
        document.getElementById('cdek-enabled').addEventListener('change', (e) => {
            const fields = document.getElementById('cdek-fields');
            fields.classList.toggle('active', e.target.checked);
            this.unsavedChanges = true;
            this.updateSaveButton();
        });

        document.getElementById('megamarket-enabled').addEventListener('change', (e) => {
            const fields = document.getElementById('megamarket-fields');
            fields.classList.toggle('active', e.target.checked);
            this.unsavedChanges = true;
            this.updateSaveButton();
        });

        // Обновление интервала синхронизации при изменении автосинхронизации
        document.getElementById('auto-sync').addEventListener('change', (e) => {
            document.getElementById('sync-interval').disabled = !e.target.checked;
            this.unsavedChanges = true;
            this.updateSaveButton();
        });

        // Обработчик выбора цвета
        document.getElementById('accent-color').addEventListener('input', (e) => {
            document.querySelector('.color-value').textContent = e.target.value;
            this.unsavedChanges = true;
            this.updateSaveButton();
        });
    }

    updateSaveButton() {
        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            saveButton.disabled = !this.unsavedChanges;
        }
    }

    getFormData() {
        return {
            // Настройки пользователя
            userName: document.getElementById('user-name').value,
            userEmail: document.getElementById('user-email').value,
            userPhone: document.getElementById('user-phone').value,
            emailReports: document.getElementById('email-reports').checked,
            pushNotifications: document.getElementById('push-notifications').checked,

            // Настройки API
            cdekEnabled: document.getElementById('cdek-enabled').checked,
            cdekClientId: document.getElementById('cdek-client-id').value,
            cdekClientSecret: document.getElementById('cdek-client-secret').value,
            
            megamarketEnabled: document.getElementById('megamarket-enabled').checked,
            megamarketApiKey: document.getElementById('megamarket-api-key').value,
            megamarketSecretKey: document.getElementById('megamarket-secret-key').value,
            megamarketCampaignId: document.getElementById('megamarket-campaign-id').value,

            // Внешний вид
            themeMode: document.getElementById('theme-mode').value,
            accentColor: document.getElementById('accent-color').value,

            // Системные настройки
            autoSync: document.getElementById('auto-sync').checked,
            syncInterval: parseInt(document.getElementById('sync-interval').value),
            notificationSound: document.getElementById('notification-sound').checked
        };
    }

    async saveSettings() {
        try {
            console.log('💾 Сохранение настроек...');
            const formData = this.getFormData();

            // Сохранение в CONFIG
            CONFIG.set('SETTINGS.AUTO_SYNC', formData.autoSync);
            CONFIG.set('SETTINGS.SYNC_INTERVAL', formData.syncInterval);
            CONFIG.set('SETTINGS.NOTIFICATION_SOUND', formData.notificationSound);
            CONFIG.set('SETTINGS.THEME_MODE', formData.themeMode);
            CONFIG.set('SETTINGS.ACCENT_COLOR', formData.accentColor);
            
            CONFIG.set('API.CDEK.ENABLED', formData.cdekEnabled);
            CONFIG.set('API.CDEK.CLIENT_ID', formData.cdekClientId);
            CONFIG.set('API.CDEK.CLIENT_SECRET', formData.cdekClientSecret);
            
            CONFIG.set('API.MEGAMARKET.ENABLED', formData.megamarketEnabled);
            CONFIG.set('API.MEGAMARKET.API_KEY', formData.megamarketApiKey);
            CONFIG.set('API.MEGAMARKET.SECRET_KEY', formData.megamarketSecretKey);
            CONFIG.set('API.MEGAMARKET.CAMPAIGN_ID', formData.megamarketCampaignId);

            // Сохранение пользовательских настроек
            const userSettings = {
                userName: formData.userName,
                userEmail: formData.userEmail,
                userPhone: formData.userPhone,
                emailReports: formData.emailReports,
                pushNotifications: formData.pushNotifications
            };
            localStorage.setItem('texno_edem_user_settings', JSON.stringify(userSettings));

            // Обновление текущих настроек
            this.currentSettings = formData;
            this.unsavedChanges = false;
            this.updateSaveButton();

            // Применение визуальных настроек
            this.applyVisualSettings();

            // Показ уведомления
            this.app.showNotification('Настройки успешно сохранены', 'success');
            
            console.log('✅ Настройки сохранены');

        } catch (error) {
            console.error('❌ Ошибка при сохранении настроек:', error);
            this.app.showNotification('Ошибка при сохранении настроек', 'error');
        }
    }

    applyVisualSettings() {
        // Применение темы
        document.documentElement.setAttribute('data-theme', this.currentSettings.themeMode);
        
        // Применение акцентного цвета
        document.documentElement.style.setProperty('--primary-color', this.currentSettings.accentColor);
        
        // Обновление интервала синхронизации если включена автосинхронизация
        if (this.currentSettings.autoSync && this.app.syncManager) {
            this.app.syncManager.setSyncInterval(this.currentSettings.syncInterval);
        }
    }

    cancelChanges() {
        if (this.unsavedChanges) {
            if (confirm('У вас есть несохраненные изменения. Вы уверены, что хотите отменить?')) {
                this.unsavedChanges = false;
                this.render(); // Перерисовываем с исходными значениями
            }
        } else {
            this.app.showMainView();
        }
    }

    resetToDefaults() {
        if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
            // Очистка пользовательских настроек
            localStorage.removeItem('texno_edem_user_settings');
            
            // Сброс CONFIG к значениям по умолчанию
            CONFIG.resetToDefaults();
            
            // Перезагрузка настроек и перерисовка
            this.currentSettings = this.loadCurrentSettings();
            this.unsavedChanges = true;
            this.render();
            
            this.app.showNotification('Настройки сброшены к значениям по умолчанию', 'info');
        }
    }

    async testCdekConnection() {
        try {
            const clientId = document.getElementById('cdek-client-id').value;
            const clientSecret = document.getElementById('cdek-client-secret').value;

            if (!clientId || !clientSecret) {
                this.app.showNotification('Заполните Client ID и Client Secret', 'warning');
                return;
            }

            this.app.showNotification('Проверка подключения к CDEK...', 'info');
            
            // Здесь будет реальная проверка подключения к API CDEK
            const isValid = await this.validateCdekCredentials(clientId, clientSecret);
            
            if (isValid) {
                this.app.showNotification('Подключение к CDEK успешно установлено', 'success');
            } else {
                this.app.showNotification('Ошибка подключения к CDEK. Проверьте учетные данные', 'error');
            }

        } catch (error) {
            console.error('❌ Ошибка проверки подключения CDEK:', error);
            this.app.showNotification('Ошибка при проверке подключения', 'error');
        }
    }

    async testMegamarketConnection() {
        try {
            const apiKey = document.getElementById('megamarket-api-key').value;
            const secretKey = document.getElementById('megamarket-secret-key').value;
            const campaignId = document.getElementById('megamarket-campaign-id').value;

            if (!apiKey || !secretKey || !campaignId) {
                this.app.showNotification('Заполните все поля для подключения к Мегамаркет', 'warning');
                return;
            }

            this.app.showNotification('Проверка подключения к Мегамаркет...', 'info');
            
            // Здесь будет реальная проверка подключения к API Мегамаркет
            const isValid = await this.validateMegamarketCredentials(apiKey, secretKey, campaignId);
            
            if (isValid) {
                this.app.showNotification('Подключение к Мегамаркет успешно установлено', 'success');
            } else {
                this.app.showNotification('Ошибка подключения к Мегамаркет. Проверьте учетные данные', 'error');
            }

        } catch (error) {
            console.error('❌ Ошибка проверки подключения Мегамаркет:', error);
            this.app.showNotification('Ошибка при проверке подключения', 'error');
        }
    }

    async validateCdekCredentials(clientId, clientSecret) {
        // Заглушка для реальной проверки API CDEK
        // В реальном приложении здесь будет запрос к CDEK API
        return new Promise((resolve) => {
            setTimeout(() => {
                // Имитация проверки - в реальности здесь должен быть fetch запрос
                resolve(clientId.length > 5 && clientSecret.length > 5);
            }, 1000);
        });
    }

    async validateMegamarketCredentials(apiKey, secretKey, campaignId) {
        // Заглушка для реальной проверки API Мегамаркет
        return new Promise((resolve) => {
            setTimeout(() => {
                // Имитация проверки - в реальности здесь должен быть fetch запрос
                resolve(apiKey.length > 5 && secretKey.length > 5 && campaignId.length > 5);
            }, 1000);
        });
    }

    destroy() {
        // Очистка событий и ресурсов
        this.unsavedChanges = false;
    }
}
