// Компонент настроек для TEXNO EDEM
class SettingsComponent {
    constructor(app) {
        this.app = app;
    }

    render() {
        const container = document.getElementById('settings-container');
        if (!container) return;

        container.innerHTML = `
            <div class="settings-grid">
                <!-- Интеграции -->
                <div class="settings-section">
                    <h3 class="section-title">
                        <i class="fas fa-plug"></i>
                        Интеграции
                    </h3>
                    <div class="settings-cards">
                        ${this.renderIntegrationCard('cdek')}
                        ${this.renderIntegrationCard('megamarket')}
                    </div>
                </div>

                <!-- Настройки уведомлений -->
                <div class="settings-section">
                    <h3 class="section-title">
                        <i class="fas fa-bell"></i>
                        Уведомления
                    </h3>
                    <div class="settings-list">
                        ${this.renderNotificationSettings()}
                    </div>
                </div>

                <!-- Настройки синхронизации -->
                <div class="settings-section">
                    <h3 class="section-title">
                        <i class="fas fa-sync"></i>
                        Синхронизация
                    </h3>
                    <div class="settings-list">
                        ${this.renderSyncSettings()}
                    </div>
                </div>

                <!-- Внешний вид -->
                <div class="settings-section">
                    <h3 class="section-title">
                        <i class="fas fa-palette"></i>
                        Внешний вид
                    </h3>
                    <div class="settings-list">
                        ${this.renderAppearanceSettings()}
                    </div>
                </div>

                <!-- Действия -->
                <div class="settings-section">
                    <h3 class="section-title">
                        <i class="fas fa-cog"></i>
                        Действия
                    </h3>
                    <div class="settings-actions">
                        ${this.renderActionButtons()}
                    </div>
                </div>
            </div>
        `;
    }

    renderIntegrationCard(platform) {
        const config = this.getPlatformConfig(platform);
        const isEnabled = this.app.config.API[platform.toUpperCase()].ENABLED;
        const apiConfig = this.app.config.API[platform.toUpperCase()];

        return `
            <div class="integration-card ${isEnabled ? 'enabled' : 'disabled'}">
                <div class="integration-header">
                    <div class="integration-icon">
                        <i class="fas fa-${config.icon}"></i>
                    </div>
                    <div class="integration-info">
                        <h4>${config.name}</h4>
                        <p>${config.description}</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" ${isEnabled ? 'checked' : ''} 
                               onchange="app.settingsComponent.toggleIntegration('${platform}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="integration-details">
                    ${this.renderApiFields(platform, apiConfig, isEnabled)}
                    
                    <div class="integration-status">
                        <div class="status-indicator ${isEnabled ? 'online' : 'offline'}"></div>
                        <span>${isEnabled ? 'Подключено' : 'Отключено'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderApiFields(platform, apiConfig, isEnabled) {
        if (!isEnabled) return '<p class="integration-hint">Включите интеграцию для настройки</p>';

        const fields = {
            cdek: [
                { name: 'CLIENT_ID', label: 'Client ID', type: 'text', value: apiConfig.CLIENT_ID || '' },
                { name: 'CLIENT_SECRET', label: 'Client Secret', type: 'password', value: apiConfig.CLIENT_SECRET || '' }
            ],
            megamarket: [
                { name: 'API_KEY', label: 'API Key', type: 'password', value: apiConfig.API_KEY || '' }
            ]
        };

        const platformFields = fields[platform] || [];
        
        return platformFields.map(field => `
            <div class="form-group">
                <label>${field.label}</label>
                <input type="${field.type}" 
                       value="${field.value}"
                       placeholder="Введите ${field.label}"
                       onchange="app.settingsComponent.updateApiConfig('${platform}', '${field.name}', this.value)">
            </div>
        `).join('');
    }

    renderNotificationSettings() {
        const notifications = this.app.settings.notifications || {};
        
        return `
            <div class="setting-item">
                <div class="setting-info">
                    <label>Новые заказы</label>
                    <span>Уведомления о новых заказах</span>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" ${notifications.newOrders ? 'checked' : ''}
                           onchange="app.settingsComponent.updateSetting('notifications', 'newOrders', this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
            
            <div class="setting-item">
                <div class="setting-info">
                    <label>Проблемные заказы</label>
                    <span>Уведомления о проблемах с заказами</span>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" ${notifications.problemOrders ? 'checked' : ''}
                           onchange="app.settingsComponent.updateSetting('notifications', 'problemOrders', this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
            
            <div class="setting-item">
                <div class="setting-info">
                    <label>Завершение синхронизации</label>
                    <span>Уведомления об успешной синхронизации</span>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" ${notifications.syncComplete ? 'checked' : ''}
                           onchange="app.settingsComponent.updateSetting('notifications', 'syncComplete', this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
        `;
    }

    renderSyncSettings() {
        const sync = this.app.settings.sync || {};
        
        return `
            <div class="setting-item">
                <div class="setting-info">
                    <label>Авто-синхронизация</label>
                    <span>Автоматическое обновление данных</span>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" ${sync.autoSync ? 'checked' : ''}
                           onchange="app.settingsComponent.updateSetting('sync', 'autoSync', this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
            
            <div class="setting-item">
                <div class="setting-info">
                    <label>Интервал синхронизации</label>
                    <span>Частота обновления данных</span>
                </div>
                <select onchange="app.settingsComponent.updateSetting('sync', 'syncInterval', parseInt(this.value))">
                    <option value="5" ${sync.syncInterval === 5 ? 'selected' : ''}>5 минут</option>
                    <option value="10" ${sync.syncInterval === 10 ? 'selected' : ''}>10 минут</option>
                    <option value="15" ${sync.syncInterval === 15 ? 'selected' : ''}>15 минут</option>
                    <option value="30" ${sync.syncInterval === 30 ? 'selected' : ''}>30 минут</option>
                </select>
            </div>
        `;
    }

    renderAppearanceSettings() {
        const appearance = this.app.settings.appearance || {};
        
        return `
            <div class="setting-item">
                <div class="setting-info">
                    <label>Тема оформления</label>
                    <span>Цветовая схема приложения</span>
                </div>
                <select onchange="app.settingsComponent.updateSetting('appearance', 'theme', this.value)">
                    <option value="auto" ${appearance.theme === 'auto' ? 'selected' : ''}>Авто</option>
                    <option value="light" ${appearance.theme === 'light' ? 'selected' : ''}>Светлая</option>
                    <option value="dark" ${appearance.theme === 'dark' ? 'selected' : ''}>Темная</option>
                </select>
            </div>
            
            <div class="setting-item">
                <div class="setting-info">
                    <label>Компактный режим</label>
                    <span>Показывать больше информации на экране</span>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" ${appearance.compactMode ? 'checked' : ''}
                           onchange="app.settingsComponent.updateSetting('appearance', 'compactMode', this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
        `;
    }

    renderActionButtons() {
        return `
            <button class="btn btn-primary" onclick="app.manualSync()">
                <i class="fas fa-sync"></i> Синхронизировать сейчас
            </button>
            
            <button class="btn btn-outline" onclick="app.settingsComponent.clearCache()">
                <i class="fas fa-broom"></i> Очистить кэш
            </button>
            
            <button class="btn btn-outline" onclick="app.settingsComponent.exportSettings()">
                <i class="fas fa-download"></i> Экспорт настроек
            </button>
            
            <button class="btn btn-danger" onclick="app.settingsComponent.resetSettings()">
                <i class="fas fa-trash"></i> Сбросить настройки
            </button>
        `;
    }

    // Методы управления настройками
    toggleIntegration(platform, enabled) {
        this.app.config.API[platform.toUpperCase()].ENABLED = enabled;
        this.app.saveConfig();
        
        const status = enabled ? 'включена' : 'отключена';
        this.app.showNotification(`Интеграция ${platform.toUpperCase()} ${status}`, 'success');
        
        // Перерисовываем настройки
        setTimeout(() => this.render(), 100);
    }

    updateApiConfig(platform, field, value) {
        this.app.config.API[platform.toUpperCase()][field] = value;
        this.app.saveConfig();
    }

    updateSetting(category, key, value) {
        if (!this.app.settings[category]) {
            this.app.settings[category] = {};
        }
        this.app.settings[category][key] = value;
        this.app.saveSettings(this.app.settings);
    }

    clearCache() {
        this.app.clearCache();
        this.app.showNotification('Кэш очищен', 'success');
    }

    exportSettings() {
        const settingsData = {
            app: 'TEXNO EDEM',
            version: this.app.config.APP.VERSION,
            exportedAt: new Date().toISOString(),
            settings: this.app.settings,
            config: {
                API: {
                    CDEK: {
                        ENABLED: this.app.config.API.CDEK.ENABLED
                    },
                    MEGAMARKET: {
                        ENABLED: this.app.config.API.MEGAMARKET.ENABLED
                    }
                }
            }
        };

        this.downloadJSON(settingsData, `texno-edem-settings-${new Date().toISOString().split('T')[0]}.json`);
        this.app.showNotification('Настройки экспортированы', 'success');
    }

    resetSettings() {
        if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
            this.app.settings = this.app.getDefaultSettings();
            this.app.saveSettings(this.app.settings);
            this.app.showNotification('Настройки сброшены', 'success');
            this.render();
        }
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    getPlatformConfig(platform) {
        const configs = {
            cdek: {
                name: 'CDEK Logistics',
                description: 'Интеграция с API доставки',
                icon: 'shipping-fast'
            },
            megamarket: {
                name: 'Мегамаркет',
                description: 'Интеграция с маркетплейсом',
                icon: 'store'
            }
        };
        return configs[platform] || configs.cdek;
    }
}
