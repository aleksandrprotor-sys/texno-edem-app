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
                <div class="settings-section">
                    <h3 class="section-title">Интеграции</h3>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">CDEK Integration</div>
                            <div class="setting-description">Подключение к API логистики CDEK</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" ${this.app.settings.cdekEnabled ? 'checked' : ''} 
                                   onchange="app.settingsComponent.toggleIntegration('cdekEnabled', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Мегамаркет Integration</div>
                            <div class="setting-description">Подключение к API маркетплейса Мегамаркет</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" ${this.app.settings.megamarketEnabled ? 'checked' : ''} 
                                   onchange="app.settingsComponent.toggleIntegration('megamarketEnabled', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h3 class="section-title">Настройки API</h3>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">CDEK Client ID</div>
                            <div class="setting-description">Идентификатор клиента CDEK API</div>
                        </div>
                        <input type="text" class="setting-input" 
                               value="${CONFIG.API.CDEK.CLIENT_ID || ''}"
                               placeholder="Введите Client ID"
                               onchange="app.settingsComponent.updateApiConfig('CDEK_CLIENT_ID', this.value)">
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">CDEK Client Secret</div>
                            <div class="setting-description">Секретный ключ CDEK API</div>
                        </div>
                        <input type="password" class="setting-input" 
                               value="${CONFIG.API.CDEK.CLIENT_SECRET || ''}"
                               placeholder="Введите Client Secret"
                               onchange="app.settingsComponent.updateApiConfig('CDEK_CLIENT_SECRET', this.value)">
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Мегамаркет API Key</div>
                            <div class="setting-description">Ключ API маркетплейса</div>
                        </div>
                        <input type="text" class="setting-input" 
                               value="${CONFIG.API.MEGAMARKET.API_KEY || ''}"
                               placeholder="Введите API Key"
                               onchange="app.settingsComponent.updateApiConfig('MEGAMARKET_API_KEY', this.value)">
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Мегамаркет Secret Key</div>
                            <div class="setting-description">Секретный ключ для подписи</div>
                        </div>
                        <input type="password" class="setting-input" 
                               value="${CONFIG.API.MEGAMARKET.SECRET_KEY || ''}"
                               placeholder="Введите Secret Key"
                               onchange="app.settingsComponent.updateApiConfig('MEGAMARKET_SECRET_KEY', this.value)">
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">ID Кампании</div>
                            <div class="setting-description">Идентификатор кампании в Мегамаркет</div>
                        </div>
                        <input type="text" class="setting-input" 
                               value="${CONFIG.API.MEGAMARKET.CAMPAIGN_ID || ''}"
                               placeholder="Введите ID кампании"
                               onchange="app.settingsComponent.updateApiConfig('MEGAMARKET_CAMPAIGN_ID', this.value)">
                    </div>
                </div>

                <div class="settings-section">
                    <h3 class="section-title">Общие настройки</h3>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Авто-синхронизация</div>
                            <div class="setting-description">Автоматическое обновление данных каждые 5 минут</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" ${this.app.settings.autoSync ? 'checked' : ''} 
                                   onchange="app.settingsComponent.toggleSetting('autoSync', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Уведомления</div>
                            <div class="setting-description">Показывать системные уведомления</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" ${this.app.settings.notifications ? 'checked' : ''} 
                                   onchange="app.settingsComponent.toggleSetting('notifications', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Элементов на странице</div>
                            <div class="setting-description">Количество заказов на одной странице</div>
                        </div>
                        <select class="setting-select" onchange="app.settingsComponent.updateItemsPerPage(this.value)">
                            <option value="10" ${CONFIG.SETTINGS.ITEMS_PER_PAGE === 10 ? 'selected' : ''}>10</option>
                            <option value="20" ${CONFIG.SETTINGS.ITEMS_PER_PAGE === 20 ? 'selected' : ''}>20</option>
                            <option value="50" ${CONFIG.SETTINGS.ITEMS_PER_PAGE === 50 ? 'selected' : ''}>50</option>
                            <option value="100" ${CONFIG.SETTINGS.ITEMS_PER_PAGE === 100 ? 'selected' : ''}>100</option>
                        </select>
                    </div>
                </div>

                <div class="settings-section">
                    <h3 class="section-title">Действия</h3>
                    
                    <div class="setting-actions">
                        <button class="btn btn-primary" onclick="app.settingsComponent.testConnections()">
                            <i class="fas fa-plug"></i> Проверить подключения
                        </button>
                        
                        <button class="btn btn-secondary" onclick="app.settingsComponent.clearCache()">
                            <i class="fas fa-trash"></i> Очистить кэш
                        </button>
                        
                        <button class="btn btn-outline" onclick="app.settingsComponent.exportSettings()">
                            <i class="fas fa-download"></i> Экспорт настроек
                        </button>
                    </div>

                    <div class="api-status" id="api-status">
                        <div class="status-item">
                            <div class="status-indicator ${this.app.settings.cdekEnabled ? 'online' : 'offline'}"></div>
                            <span>CDEK API: ${this.app.settings.cdekEnabled ? 'Подключено' : 'Отключено'}</span>
                        </div>
                        <div class="status-item">
                            <div class="status-indicator ${this.app.settings.megamarketEnabled ? 'online' : 'offline'}"></div>
                            <span>Мегамаркет API: ${this.app.settings.megamarketEnabled ? 'Подключено' : 'Отключено'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    toggleIntegration(key, value) {
        this.app.updateSettings({ [key]: value });
        this.render();
    }

    toggleSetting(key, value) {
        this.app.updateSettings({ [key]: value });
    }

    updateApiConfig(key, value) {
        const configMap = {
            'CDEK_CLIENT_ID': 'API.CDEK.CLIENT_ID',
            'CDEK_CLIENT_SECRET': 'API.CDEK.CLIENT_SECRET',
            'MEGAMARKET_API_KEY': 'API.MEGAMARKET.API_KEY',
            'MEGAMARKET_SECRET_KEY': 'API.MEGAMARKET.SECRET_KEY',
            'MEGAMARKET_CAMPAIGN_ID': 'API.MEGAMARKET.CAMPAIGN_ID'
        };

        const path = configMap[key];
        if (path) {
            this.updateNestedConfig(this.app.config, path.split('.'), value);
            this.app.updateConfig(this.app.config);
        }
    }

    updateNestedConfig(obj, path, value) {
        const lastKey = path.pop();
        const lastObj = path.reduce((o, k) => o[k] = o[k] || {}, obj);
        lastObj[lastKey] = value;
    }

    updateItemsPerPage(value) {
        const itemsPerPage = parseInt(value);
        this.app.config.SETTINGS.ITEMS_PER_PAGE = itemsPerPage;
        this.app.updateConfig(this.app.config);
        this.app.ordersComponent.itemsPerPage = itemsPerPage;
        this.app.showNotification(`Количество элементов изменено на ${itemsPerPage}`, 'success');
    }

    async testConnections() {
        const statusContainer = document.getElementById('api-status');
        if (!statusContainer) return;

        statusContainer.innerHTML = `
            <div class="status-testing">
                <i class="fas fa-sync fa-spin"></i>
                <span>Проверка подключений...</span>
            </div>
        `;

        const results = [];

        // Проверка CDEK
        if (this.app.settings.cdekEnabled && CONFIG.API.CDEK.CLIENT_ID && CONFIG.API.CDEK.CLIENT_SECRET) {
            try {
                await CDEKService.getOrders({ limit: 1 });
                results.push({ name: 'CDEK', status: 'success', message: 'Успешное подключение' });
            } catch (error) {
                results.push({ name: 'CDEK', status: 'error', message: 'Ошибка подключения' });
            }
        } else {
            results.push({ name: 'CDEK', status: 'warning', message: 'Не настроено' });
        }

        // Проверка Мегамаркет
        if (this.app.settings.megamarketEnabled && CONFIG.API.MEGAMARKET.API_KEY) {
            try {
                await MegamarketService.getOrders({ limit: 1 });
                results.push({ name: 'Мегамаркет', status: 'success', message: 'Успешное подключение' });
            } catch (error) {
                results.push({ name: 'Мегамаркет', status: 'error', message: 'Ошибка подключения' });
            }
        } else {
            results.push({ name: 'Мегамаркет', status: 'warning', message: 'Не настроено' });
        }

        // Обновляем статус
        statusContainer.innerHTML = results.map(result => `
            <div class="status-item">
                <div class="status-indicator ${result.status}"></div>
                <span>${result.name}: ${result.message}</span>
            </div>
        `).join('');

        this.app.showNotification('Проверка подключений завершена', 'success');
    }

    clearCache() {
        localStorage.removeItem('texno_edem_orders');
        localStorage.removeItem('texno_edem_analytics');
        this.app.showNotification('Кэш очищен', 'success');
        
        // Перезагружаем данные
        setTimeout(() => {
            this.app.loadInitialData();
        }, 1000);
    }

    exportSettings() {
        const settingsData = {
            app: this.app.settings,
            api: {
                cdek: {
                    clientId: CONFIG.API.CDEK.CLIENT_ID ? '***' : '',
                    enabled: this.app.settings.cdekEnabled
                },
                megamarket: {
                    apiKey: CONFIG.API.MEGAMARKET.API_KEY ? '***' : '',
                    enabled: this.app.settings.megamarketEnabled
                }
            },
            exportDate: new Date().toISOString()
        };

        this.downloadJSON(settingsData, `texno-edem-settings-${new Date().toISOString().split('T')[0]}.json`);
        this.app.showNotification('Настройки экспортированы', 'success');
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Добавляем в глобальную область видимости
window.app.settingsComponent = new SettingsComponent(app);
