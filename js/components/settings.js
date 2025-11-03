// js/components/settings.js - Расширенная версия
class SettingsComponent {
    constructor(app) {
        this.app = app;
        this.unsavedChanges = false;
        this.currentSettings = this.loadCurrentSettings();
        this.apiServices = new ApiServicesManager(this.app);
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
        return {
            // Основные настройки
            autoSync: CONFIG.get('SETTINGS.AUTO_SYNC', true),
            syncInterval: CONFIG.get('SETTINGS.SYNC_INTERVAL', 300000),
            notificationSound: CONFIG.get('SETTINGS.NOTIFICATION_SOUND', true),
            
            // Настройки темы
            theme: CONFIG.get('SETTINGS.THEME', 'auto'),
            themeMode: CONFIG.get('SETTINGS.THEME_MODE', 'light'),
            accentColor: CONFIG.get('SETTINGS.ACCENT_COLOR', '#3498DB'),
            fontSize: CONFIG.get('SETTINGS.FONT_SIZE', 'medium'),
            animations: CONFIG.get('SETTINGS.ANIMATIONS', true),
            reduceMotion: CONFIG.get('SETTINGS.REDUCE_MOTION', false),
            
            // Настройки интерфейса
            compactMode: CONFIG.get('UI.COMPACT_MODE', false),
            sidebarCollapsed: CONFIG.get('UI.SIDEBAR_COLLAPSED', false),
            gridView: CONFIG.get('UI.GRID_VIEW', false),
            
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
            userName: this.app.user?.firstName || '',
            userEmail: '',
            userPhone: '',
            notificationsEnabled: true,
            emailReports: false,
            pushNotifications: true
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
                                <button class="btn btn-sm btn-outline" onclick="app.settingsComponent.getCdekDocumentation()">
                                    <i class="fas fa-book"></i> Документация
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
                            <p>Настройки темы и отображения</p>
                        </div>
                    </div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Тема оформления</h4>
                                <p>Выберите цветовую схему приложения</p>
                            </div>
                            <div class="setting-control">
                                <select id="theme-mode" class="form-control">
                                    <option value="auto" ${this.currentSettings.themeMode === 'auto' ? 'selected' : ''}>Авто</option>
                                    <option value="light" ${this.currentSettings.themeMode === 'light' ? 'selected' : ''}>Светлая</option>
                                    <option value="dark" ${this.currentSettings.themeMode === 'dark' ? 'selected' : ''}>Темная</option>
                                    <option value="professional" ${this.currentSettings.themeMode === 'professional' ? 'selected' : ''}>Профессиональная</option>
                                </select>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Акцентный цвет</h4>
                                <p>Основной цвет элементов интерфейса</p>
                            </div>
                            <div class="setting-control">
                                <div class="color-picker-container">
                                    <input type="color" id="accent-color" class="color-picker" 
                                           value="${this.currentSettings.accentColor}">
                                    <span class="color-value">${this.currentSettings.accentColor}</span>
                                </div>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Размер шрифта</h4>
                                <p>Размер текста в приложении</p>
                            </div>
                            <div class="setting-control">
                                <select id="font-size" class="form-control">
                                    <option value="small" ${this.currentSettings.fontSize === 'small' ? 'selected' : ''}>Малый</option>
                                    <option value="medium" ${this.currentSettings.fontSize === 'medium' ? 'selected' : ''}>Средний</option>
                                    <option value="large" ${this.currentSettings.fontSize === 'large' ? 'selected' : ''}>Большой</option>
                                </select>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Анимации</h4>
                                <p>Плавные переходы и анимации</p>
                            </div>
                            <div class="setting-control">
                                <label class="switch">
                                    <input type="checkbox" id="animations" 
                                           ${this.currentSettings.animations ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Уменьшить движение</h4>
                                <p>Для пользователей с чувствительностью к анимациям</p>
                            </div>
                            <div class="setting-control">
                                <label class="switch">
                                    <input type="checkbox" id="reduce-motion" 
                                           ${this.currentSettings.reduceMotion ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Другие настройки (синхронизация, уведомления и т.д.) -->
                ${this.createOtherSettingsHTML()}

                <!-- Действия -->
                <div class="settings-actions">
                    <button class="btn btn-secondary" onclick="app.settingsComponent.resetSettings()">
                        <i class="fas fa-undo"></i> Сбросить настройки
                    </button>
                    <button class="btn btn-primary" id="save-settings-btn"
                            onclick="app.settingsComponent.saveSettings()"
                            disabled>
                        <i class="fas fa-save"></i> Сохранить изменения
                    </button>
                </div>
            </div>
        `;
    }

    createOtherSettingsHTML() {
        return `
            <!-- Синхронизация -->
            <div class="settings-section">
                <div class="section-header">
                    <i class="fas fa-sync-alt"></i>
                    <div class="section-header-text">
                        <h3>Синхронизация данных</h3>
                        <p>Настройки автоматического обновления данных</p>
                    </div>
                </div>
                <div class="settings-grid">
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Автоматическая синхронизация</h4>
                            <p>Автоматически обновлять данные с платформ</p>
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
                            <p>Как часто обновлять данные с платформ</p>
                        </div>
                        <div class="setting-control">
                            <select id="sync-interval" class="form-control">
                                <option value="60000" ${this.currentSettings.syncInterval === 60000 ? 'selected' : ''}>1 минута</option>
                                <option value="300000" ${this.currentSettings.syncInterval === 300000 ? 'selected' : ''}>5 минут</option>
                                <option value="900000" ${this.currentSettings.syncInterval === 900000 ? 'selected' : ''}>15 минут</option>
                                <option value="1800000" ${this.currentSettings.syncInterval === 1800000 ? 'selected' : ''}>30 минут</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Уведомления -->
            <div class="settings-section">
                <div class="section-header">
                    <i class="fas fa-bell"></i>
                    <div class="section-header-text">
                        <h3>Уведомления</h3>
                        <p>Настройки оповещений и звуков</p>
                    </div>
                </div>
                <div class="settings-grid">
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Звуковые уведомления</h4>
                            <p>Воспроизводить звук при новых уведомлениях</p>
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

            <!-- О приложении -->
            <div class="settings-section">
                <div class="section-header">
                    <i class="fas fa-info-circle"></i>
                    <div class="section-header-text">
                        <h3>О приложении</h3>
                        <p>Информация о версии и системные данные</p>
                    </div>
                </div>
                <div class="about-info">
                    <div class="about-item">
                        <span class="label">Версия</span>
                        <span class="value">${CONFIG.get('APP.VERSION', '1.2.0')}</span>
                    </div>
                    <div class="about-item">
                        <span class="label">Сборка</span>
                        <span class="value">${CONFIG.get('APP.BUILD', '2024.01.20')}</span>
                    </div>
                    <div class="about-item">
                        <span class="label">Последнее обновление</span>
                        <span class="value">${this.app.lastSyncTime ? this.formatRelativeTime(this.app.lastSyncTime) : 'Никогда'}</span>
                    </div>
                    <div class="about-item">
                        <span class="label">Режим работы</span>
                        <span class="value">${this.app.tg ? 'Telegram Mini App' : 'Браузер'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Отслеживаем изменения настроек
        const inputs = [
            'auto-sync', 'sync-interval', 'notification-sound',
            'theme-mode', 'accent-color', 'font-size', 'animations', 'reduce-motion',
            'compact-mode', 'cdek-enabled', 'megamarket-enabled',
            'user-name', 'user-email', 'user-phone', 'email-reports', 'push-notifications',
            'cdek-client-id', 'cdek-client-secret', 'megamarket-api-key', 
            'megamarket-secret-key', 'megamarket-campaign-id'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.unsavedChanges = true;
                    this.updateSaveButton();
                    this.handleApiToggle(id);
                });

                element.addEventListener('input', () => {
                    this.unsavedChanges = true;
                    this.updateSaveButton();
                });
            }
        });

        // Обработка выбора цвета
        const colorPicker = document.getElementById('accent-color');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                const colorValue = document.querySelector('.color-value');
                if (colorValue) {
                    colorValue.textContent = e.target.value;
                }
                this.unsavedChanges = true;
                this.updateSaveButton();
            });
        }

        console.log('✅ Settings event listeners attached');
    }

    handleApiToggle(elementId) {
        if (elementId === 'cdek-enabled') {
            const cdekFields = document.getElementById('cdek-fields');
            const isEnabled = document.getElementById('cdek-enabled').checked;
            if (cdekFields) {
                cdekFields.classList.toggle('active', isEnabled);
            }
        } else if (elementId === 'megamarket-enabled') {
            const megamarketFields = document.getElementById('megamarket-fields');
            const isEnabled = document.getElementById('megamarket-enabled').checked;
            if (megamarketFields) {
                megamarketFields.classList.toggle('active', isEnabled);
            }
        }
    }

    // API методы
    async testCdekConnection() {
        const clientId = document.getElementById('cdek-client-id').value;
        const clientSecret = document.getElementById('cdek-client-secret').value;

        if (!clientId || !clientSecret) {
            this.app.showNotification('Заполните все поля для CDEK API', 'warning');
            return;
        }

        this.app.showLoading('Проверка подключения CDEK...');
        
        try {
            // Здесь будет реальная проверка подключения
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Имитация успешного подключения
            const success = Math.random() > 0.3; // 70% успеха для демо
            
            if (success) {
                this.app.showNotification('✅ Подключение к CDEK успешно установлено', 'success');
            } else {
                this.app.showNotification('❌ Ошибка подключения к CDEK. Проверьте данные', 'error');
            }
            
        } catch (error) {
            this.app.showNotification('Ошибка при проверке подключения', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async testMegamarketConnection() {
        const apiKey = document.getElementById('megamarket-api-key').value;
        const secretKey = document.getElementById('megamarket-secret-key').value;
        const campaignId = document.getElementById('megamarket-campaign-id').value;

        if (!apiKey || !secretKey || !campaignId) {
            this.app.showNotification('Заполните все поля для Мегамаркет API', 'warning');
            return;
        }

        this.app.showLoading('Проверка подключения Мегамаркет...');
        
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const success = Math.random() > 0.3;
            
            if (success) {
                this.app.showNotification('✅ Подключение к Мегамаркет успешно установлено', 'success');
            } else {
                this.app.showNotification('❌ Ошибка подключения к Мегамаркет. Проверьте данные', 'error');
            }
            
        } catch (error) {
            this.app.showNotification('Ошибка при проверке подключения', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    getCdekDocumentation() {
        this.app.showNotification('Открываю документацию CDEK...', 'info');
        window.open('https://api-docs.cdek.ru/', '_blank');
    }

    updateSaveButton() {
        const saveButton = document.getElementById('save-settings-btn');
        if (saveButton) {
            saveButton.disabled = !this.unsavedChanges;
            if (this.unsavedChanges) {
                saveButton.classList.add('has-changes');
                saveButton.innerHTML = '<i class="fas fa-save"></i> Сохранить изменения ●';
            } else {
                saveButton.classList.remove('has-changes');
                saveButton.innerHTML = '<i class="fas fa-save"></i> Сохранить изменения';
            }
        }
    }

    saveSettings() {
        try {
            console.log('💾 Saving settings...');

            // Собираем данные с формы
            const newSettings = {
                // Основные настройки
                autoSync: document.getElementById('auto-sync').checked,
                syncInterval: parseInt(document.getElementById('sync-interval').value),
                notificationSound: document.getElementById('notification-sound').checked,
                
                // Настройки темы
                themeMode: document.getElementById('theme-mode').value,
                accentColor: document.getElementById('accent-color').value,
                fontSize: document.getElementById('font-size').value,
                animations: document.getElementById('animations').checked,
                reduceMotion: document.getElementById('reduce-motion').checked,
                
                // Настройки интерфейса
                compactMode: document.getElementById('compact-mode')?.checked || false,
                
                // Интеграции
                cdekEnabled: document.getElementById('cdek-enabled').checked,
                megamarketEnabled: document.getElementById('megamarket-enabled').checked,
                
                // API ключи
                cdekClientId: document.getElementById('cdek-client-id').value,
                cdekClientSecret: document.getElementById('cdek-client-secret').value,
                megamarketApiKey: document.getElementById('megamarket-api-key').value,
                megamarketSecretKey: document.getElementById('megamarket-secret-key').value,
                megamarketCampaignId: document.getElementById('megamarket-campaign-id').value,
                
                // Настройки пользователя
                userName: document.getElementById('user-name').value,
                userEmail: document.getElementById('user-email').value,
                userPhone: document.getElementById('user-phone').value,
                emailReports: document.getElementById('email-reports').checked,
                pushNotifications: document.getElementById('push-notifications').checked
            };

            // Сохраняем в конфиг
            this.saveSettingsToConfig(newSettings);

            // Обновляем текущие настройки
            this.currentSettings = newSettings;
            this.unsavedChanges = false;
            this.updateSaveButton();
            
            this.app.showNotification('Настройки успешно сохранены', 'success');
            
            console.log('✅ Settings saved successfully');

        } catch (error) {
            console.error('❌ Error saving settings:', error);
            this.app.showNotification('Ошибка сохранения настроек', 'error');
        }
    }

    saveSettingsToConfig(newSettings) {
        // Основные настройки
        CONFIG.set('SETTINGS.AUTO_SYNC', newSettings.autoSync);
        CONFIG.set('SETTINGS.SYNC_INTERVAL', newSettings.syncInterval);
        CONFIG.set('SETTINGS.NOTIFICATION_SOUND', newSettings.notificationSound);
        
        // Настройки темы
        CONFIG.set('SETTINGS.THEME_MODE', newSettings.themeMode);
        CONFIG.set('SETTINGS.ACCENT_COLOR', newSettings.accentColor);
        CONFIG.set('SETTINGS.FONT_SIZE', newSettings.fontSize);
        CONFIG.set('SETTINGS.ANIMATIONS', newSettings.animations);
        CONFIG.set('SETTINGS.REDUCE_MOTION', newSettings.reduceMotion);
        
        // Настройки интерфейса
        CONFIG.set('UI.COMPACT_MODE', newSettings.compactMode);
        
        // Интеграции
        CONFIG.set('API.CDEK.ENABLED', newSettings.cdekEnabled);
        CONFIG.set('API.MEGAMARKET.ENABLED', newSettings.megamarketEnabled);
        
        // API ключи
        CONFIG.set('API.CDEK.CLIENT_ID', newSettings.cdekClientId);
        CONFIG.set('API.CDEK.CLIENT_SECRET', newSettings.cdekClientSecret);
        CONFIG.set('API.MEGAMARKET.API_KEY', newSettings.megamarketApiKey);
        CONFIG.set('API.MEGAMARKET.SECRET_KEY', newSettings.megamarketSecretKey);
        CONFIG.set('API.MEGAMARKET.CAMPAIGN_ID', newSettings.megamarketCampaignId);

        // Применяем изменения
        CONFIG.applyTheme();
        
        // Перезапускаем автосинхронизацию если нужно
        this.app.stopAutoSync();
        this.app.startAutoSync();

        // Сохраняем настройки пользователя
        this.saveUserSettings(newSettings);
    }

    saveUserSettings(settings) {
        // Сохраняем настройки пользователя в localStorage
        const userSettings = {
            userName: settings.userName,
            userEmail: settings.userEmail,
            userPhone: settings.userPhone,
            emailReports: settings.emailReports,
            pushNotifications: settings.pushNotifications,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('texno_edem_user_settings', JSON.stringify(userSettings));
        
        // Обновляем данные пользователя в приложении
        if (this.app.user) {
            this.app.user.firstName = settings.userName;
            this.app.user.email = settings.userEmail;
            this.app.user.phone = settings.userPhone;
        }
        
        this.app.renderHeader();
    }

    resetSettings() {
        if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию? Это действие нельзя отменить.')) {
            CONFIG.reset();
            localStorage.removeItem('texno_edem_user_settings');
            this.app.showNotification('Настройки сброшены к значениям по умолчанию', 'info');
            
            // Перезагружаем компонент
            setTimeout(() => {
                this.render();
            }, 500);
        }
    }

    discardChanges() {
        // Сбрасываем несохраненные изменения
        this.unsavedChanges = false;
        this.updateSaveButton();
        // Перезагружаем настройки
        this.currentSettings = this.loadCurrentSettings();
    }

    formatRelativeTime(date) {
        if (!date) return 'Никогда';
        
        try {
            const now = new Date();
            const diffMs = now - new Date(date);
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffMins < 1) return 'только что';
            if (diffMins < 60) return `${diffMins} мин. назад`;
            if (diffHours < 24) return `${diffHours} ч. назад`;
            if (diffDays === 1) return 'вчера';
            if (diffDays < 7) return `${diffDays} дн. назад`;
            
            return new Date(date).toLocaleDateString('ru-RU');
        } catch (error) {
            return 'Ошибка даты';
        }
    }

    // Метод для проверки несохраненных изменений
    hasUnsavedChanges() {
        return this.unsavedChanges;
    }

    // Метод для принудительного сохранения
    forceSave() {
        if (this.unsavedChanges) {
            this.saveSettings();
            return true;
        }
        return false;
    }
}
