// js/components/settings.js
class SettingsComponent {
    constructor(app) {
        this.app = app;
        this.settings = {};
        this.init();
    }

    init() {
        console.log('✅ SettingsComponent инициализирован');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.handleToggle(e.target);
            }
            if (e.target.classList.contains('setting-select')) {
                this.handleSelectChange(e.target);
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('setting-input')) {
                this.handleInputChange(e.target);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-save')) {
                this.saveSettings();
            }
            if (e.target.closest('.btn-test-api')) {
                this.testAPI(e.target.closest('.btn-test-api').dataset.platform);
            }
            if (e.target.closest('.btn-reset')) {
                this.resetSettings();
            }
        });
    }

    async load() {
        try {
            // Получаем настройки из основного приложения
            this.settings = this.app.getSettings();
            this.config = this.app.getConfig();
            
            this.renderSettings();
            this.updateAPIStatus();
            
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
            this.renderErrorState();
        }
    }

    renderSettings() {
        this.renderAPISettings();
        this.renderSyncSettings();
        this.renderNotificationSettings();
        this.renderThemeSettings();
    }

    renderAPISettings() {
        const container = document.getElementById('api-settings');
        if (!container) return;

        container.innerHTML = `
            <div class="settings-section">
                <h3 class="section-title">Настройки API</h3>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">CDEK API</div>
                        <div class="setting-description">
                            Интеграция с API службы доставки CDEK
                        </div>
                    </div>
                    <div class="setting-controls">
                        <label class="switch">
                            <input type="checkbox" class="api-toggle" data-platform="cdek" 
                                   ${this.config.api.cdek.enabled ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">API ключ CDEK</div>
                        <div class="setting-description">
                            Ключ для доступа к API CDEK
                        </div>
                    </div>
                    <div class="setting-controls">
                        <input type="password" class="setting-input api-key" data-platform="cdek" 
                               value="${this.config.api.cdek.apiKey || ''}" 
                               placeholder="Введите API ключ">
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">Мегамаркет API</div>
                        <div class="setting-description">
                            Интеграция с API маркетплейса Мегамаркет
                        </div>
                    </div>
                    <div class="setting-controls">
                        <label class="switch">
                            <input type="checkbox" class="api-toggle" data-platform="megamarket" 
                                   ${this.config.api.megamarket.enabled ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">API ключ Мегамаркет</div>
                        <div class="setting-description">
                            Ключ для доступа к API Мегамаркет
                        </div>
                    </div>
                    <div class="setting-controls">
                        <input type="password" class="setting-input api-key" data-platform="megamarket" 
                               value="${this.config.api.megamarket.apiKey || ''}" 
                               placeholder="Введите API ключ">
                    </div>
                </div>
                
                <div class="api-status">
                    <div class="status-item">
                        <div class="status-indicator" id="cdek-status"></div>
                        <span>CDEK API</span>
                        <button class="btn btn-outline btn-sm btn-test-api" data-platform="cdek">
                            Тестировать
                        </button>
                    </div>
                    <div class="status-item">
                        <div class="status-indicator" id="megamarket-status"></div>
                        <span>Мегамаркет API</span>
                        <button class="btn btn-outline btn-sm btn-test-api" data-platform="megamarket">
                            Тестировать
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderSyncSettings() {
        const container = document.getElementById('sync-settings');
        if (!container) return;

        container.innerHTML = `
            <div class="settings-section">
                <h3 class="section-title">Синхронизация данных</h3>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">Автоматическая синхронизация</div>
                        <div class="setting-description">
                            Автоматически обновлять данные каждые 5 минут
                        </div>
                    </div>
                    <div class="setting-controls">
                        <label class="switch">
                            <input type="checkbox" class="sync-toggle" 
                                   ${this.config.sync.autoSync ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">Интервал синхронизации</div>
                        <div class="setting-description">
                            Как часто обновлять данные
                        </div>
                    </div>
                    <div class="setting-controls">
                        <select class="setting-select sync-interval">
                            <option value="300000" ${this.config.sync.syncInterval === 300000 ? 'selected' : ''}>5 минут</option>
                            <option value="600000" ${this.config.sync.syncInterval === 600000 ? 'selected' : ''}>10 минут</option>
                            <option value="900000" ${this.config.sync.syncInterval === 900000 ? 'selected' : ''}>15 минут</option>
                            <option value="1800000" ${this.config.sync.syncInterval === 1800000 ? 'selected' : ''}>30 минут</option>
                        </select>
                    </div>
                </div>
                
                <div class="setting-actions">
                    <button class="btn btn-primary btn-sync-now" onclick="app.manualSync()">
                        <i class="fas fa-sync-alt"></i> Синхронизировать сейчас
                    </button>
                </div>
            </div>
        `;
    }

    renderNotificationSettings() {
        const container = document.getElementById('notification-settings');
        if (!container) return;

        container.innerHTML = `
            <div class="settings-section">
                <h3 class="section-title">Уведомления</h3>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">Включить уведомления</div>
                        <div class="setting-description">
                            Получать уведомления о новых заказах и проблемах
                        </div>
                    </div>
                    <div class="setting-controls">
                        <label class="switch">
                            <input type="checkbox" class="notification-toggle" 
                                   ${this.config.notifications.enabled ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">Звуковые уведомления</div>
                        <div class="setting-description">
                            Воспроизводить звук при новых уведомлениях
                        </div>
                    </div>
                    <div class="setting-controls">
                        <label class="switch">
                            <input type="checkbox" class="sound-toggle" 
                                   ${this.config.notifications.sound ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">Вибрация</div>
                        <div class="setting-description">
                            Виброотклик при уведомлениях (для мобильных устройств)
                        </div>
                    </div>
                    <div class="setting-controls">
                        <label class="switch">
                            <input type="checkbox" class="vibration-toggle" 
                                   ${this.config.notifications.vibration ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    renderThemeSettings() {
        const container = document.getElementById('theme-settings');
        if (!container) return;

        container.innerHTML = `
            <div class="settings-section">
                <h3 class="section-title">Внешний вид</h3>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">Тема оформления</div>
                        <div class="setting-description">
                            Выберите preferred цветовую схему
                        </div>
                    </div>
                    <div class="setting-controls">
                        <select class="setting-select theme-select">
                            <option value="auto" ${this.settings.theme === 'auto' ? 'selected' : ''}>Авто</option>
                            <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Светлая</option>
                            <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Темная</option>
                        </select>
                    </div>
                </div>
                
                <div class="setting-actions">
                    <button class="btn btn-outline btn-reset">
                        <i class="fas fa-undo"></i> Сбросить настройки
                    </button>
                    <button class="btn btn-primary btn-save">
                        <i class="fas fa-save"></i> Сохранить изменения
                    </button>
                </div>
            </div>
        `;
    }

    handleToggle(checkbox) {
        const settingType = this.getSettingType(checkbox);
        const value = checkbox.checked;

        switch (settingType) {
            case 'api':
                this.config.api[checkbox.dataset.platform].enabled = value;
                break;
            case 'sync':
                this.config.sync.autoSync = value;
                break;
            case 'notification':
                this.config.notifications.enabled = value;
                break;
            case 'sound':
                this.config.notifications.sound = value;
                break;
            case 'vibration':
                this.config.notifications.vibration = value;
                break;
        }

        this.app.showNotification('Настройка обновлена', 'success');
    }

    handleSelectChange(select) {
        if (select.classList.contains('sync-interval')) {
            this.config.sync.syncInterval = parseInt(select.value);
        } else if (select.classList.contains('theme-select')) {
            this.settings.theme = select.value;
            this.app.applyThemeSettings();
        }

        this.app.showNotification('Настройка обновлена', 'success');
    }

    handleInputChange(input) {
        if (input.classList.contains('api-key')) {
            this.config.api[input.dataset.platform].apiKey = input.value;
        }
    }

    getSettingType(checkbox) {
        if (checkbox.classList.contains('api-toggle')) return 'api';
        if (checkbox.classList.contains('sync-toggle')) return 'sync';
        if (checkbox.classList.contains('notification-toggle')) return 'notification';
        if (checkbox.classList.contains('sound-toggle')) return 'sound';
        if (checkbox.classList.contains('vibration-toggle')) return 'vibration';
        return 'unknown';
    }

    async testAPI(platform) {
        try {
            this.app.showLoading(`Тестирование ${platform.toUpperCase()} API...`);
            
            // Имитация тестирования API
            await this.app.delay(2000);
            
            const success = Math.random() > 0.3; // 70% успеха для демонстрации
            
            if (success) {
                this.updateAPIStatus(platform, 'online');
                this.app.showNotification(`${platform.toUpperCase()} API подключен успешно`, 'success');
            } else {
                this.updateAPIStatus(platform, 'error');
                this.app.showNotification(`Ошибка подключения к ${platform.toUpperCase()} API`, 'error');
            }
            
        } catch (error) {
            console.error(`Ошибка тестирования API ${platform}:`, error);
            this.updateAPIStatus(platform, 'error');
            this.app.showNotification(`Ошибка тестирования ${platform.toUpperCase()} API`, 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    updateAPIStatus(platform = null, status = null) {
        const platforms = platform ? [platform] : ['cdek', 'megamarket'];
        
        platforms.forEach(platform => {
            const indicator = document.getElementById(`${platform}-status`);
            if (!indicator) return;

            // Если статус не передан, используем текущий из конфига
            const currentStatus = status || (this.config.api[platform].enabled ? 'online' : 'offline');
            
            indicator.className = 'status-indicator';
            indicator.classList.add(currentStatus);
            
            // Добавляем tooltip
            const statusText = this.getStatusText(currentStatus);
            indicator.title = `${platform.toUpperCase()}: ${statusText}`;
        });
    }

    getStatusText(status) {
        const statusMap = {
            'online': 'Подключен',
            'offline': 'Отключен',
            'error': 'Ошибка',
            'warning': 'Проблемы'
        };
        return statusMap[status] || status;
    }

    async saveSettings() {
        try {
            this.app.showLoading('Сохранение настроек...');
            
            // Сохраняем настройки в основном приложении
            await this.app.saveSettings();
            
            // Сохраняем конфигурацию
            localStorage.setItem('texno_edem_config', JSON.stringify(this.config));
            
            await this.app.delay(500);
            
            this.app.showNotification('Настройки успешно сохранены', 'success');
            
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
            this.app.showNotification('Ошибка сохранения настроек', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async resetSettings() {
        const confirmed = confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?');
        if (!confirmed) return;

        try {
            this.app.showLoading('Сброс настроек...');
            
            // Сбрасываем настройки
            this.config = this.app.getDefaultConfig();
            this.settings = {};
            
            // Очищаем localStorage
            localStorage.removeItem('texno_edem_config');
            localStorage.removeItem('texno_edem_settings');
            
            await this.app.delay(500);
            
            // Перезагружаем настройки
            this.renderSettings();
            this.updateAPIStatus();
            
            this.app.showNotification('Настройки сброшены к значениям по умолчанию', 'success');
            
        } catch (error) {
            console.error('Ошибка сброса настроек:', error);
            this.app.showNotification('Ошибка сброса настроек', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    renderErrorState() {
        const containers = [
            'api-settings',
            'sync-settings',
            'notification-settings',
            'theme-settings'
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-cog"></i>
                        <h3>Настройки недоступны</h3>
                        <p>Попробуйте обновить страницу</p>
                        <button class="btn btn-primary" onclick="app.components.settings.load()">
                            <i class="fas fa-redo"></i> Повторить загрузку
                        </button>
                    </div>
                `;
            }
        });
    }
}
