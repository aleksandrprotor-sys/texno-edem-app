// js/components/settings.js - Компонент настроек
class SettingsComponent {
    constructor(app) {
        this.app = app;
        this.settings = this.loadSettings();
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
                <!-- Уведомления -->
                <div class="settings-section">
                    <div class="section-header">
                        <h3><i class="fas fa-bell"></i> Уведомления</h3>
                        <p>Настройте получение уведомлений о событиях</p>
                    </div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Новые заказы</h4>
                                <p>Уведомления о поступлении новых заказов</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="notify-new-orders" ${this.settings.notifications.newOrders ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Проблемные заказы</h4>
                                <p>Уведомления о заказах с проблемами доставки</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="notify-problems" ${this.settings.notifications.problemOrders ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Завершение синхронизации</h4>
                                <p>Уведомления об успешной синхронизации данных</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="notify-sync" ${this.settings.notifications.syncComplete ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Внешний вид -->
                <div class="settings-section">
                    <div class="section-header">
                        <h3><i class="fas fa-palette"></i> Внешний вид</h3>
                        <p>Настройте внешний вид приложения</p>
                    </div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Тема оформления</h4>
                                <p>Выберите preferred цветовую схему</p>
                            </div>
                            <select id="theme-select" class="form-control">
                                <option value="auto" ${this.settings.appearance.theme === 'auto' ? 'selected' : ''}>Авто</option>
                                <option value="light" ${this.settings.appearance.theme === 'light' ? 'selected' : ''}>Светлая</option>
                                <option value="dark" ${this.settings.appearance.theme === 'dark' ? 'selected' : ''}>Темная</option>
                            </select>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Компактный режим</h4>
                                <p>Уменьшите отступы для большего количества информации</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="compact-mode" ${this.settings.appearance.compactMode ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Синхронизация -->
                <div class="settings-section">
                    <div class="section-header">
                        <h3><i class="fas fa-sync"></i> Синхронизация</h3>
                        <p>Настройки автоматической синхронизации данных</p>
                    </div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Автосинхронизация</h4>
                                <p>Автоматическая синхронизация данных с платформами</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="auto-sync" ${this.settings.sync.autoSync ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Интервал синхронизации</h4>
                                <p>Как часто обновлять данные (в минутах)</p>
                            </div>
                            <select id="sync-interval" class="form-control">
                                <option value="5" ${this.settings.sync.syncInterval === 5 ? 'selected' : ''}>5 минут</option>
                                <option value="10" ${this.settings.sync.syncInterval === 10 ? 'selected' : ''}>10 минут</option>
                                <option value="15" ${this.settings.sync.syncInterval === 15 ? 'selected' : ''}>15 минут</option>
                                <option value="30" ${this.settings.sync.syncInterval === 30 ? 'selected' : ''}>30 минут</option>
                                <option value="60" ${this.settings.sync.syncInterval === 60 ? 'selected' : ''}>1 час</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Интеграции -->
                <div class="settings-section">
                    <div class="section-header">
                        <h3><i class="fas fa-plug"></i> Интеграции</h3>
                        <p>Настройки подключения к платформам</p>
                    </div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>CDEK API</h4>
                                <p>Настройки подключения к API CDEK</p>
                            </div>
                            <div class="setting-actions">
                                <button class="btn btn-outline" onclick="app.settingsComponent.testCDEKConnection()">
                                    <i class="fas fa-test"></i> Проверить подключение
                                </button>
                            </div>
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Мегамаркет API</h4>
                                <p>Настройки подключения к API Мегамаркет</p>
                            </div>
                            <div class="setting-actions">
                                <button class="btn btn-outline" onclick="app.settingsComponent.testMegamarketConnection()">
                                    <i class="fas fa-test"></i> Проверить подключение
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- О приложении -->
                <div class="settings-section">
                    <div class="section-header">
                        <h3><i class="fas fa-info-circle"></i> О приложении</h3>
                        <p>Информация о версии и системные настройки</p>
                    </div>
                    <div class="about-info">
                        <div class="about-item">
                            <span class="label">Версия:</span>
                            <span class="value">1.0.1</span>
                        </div>
                        <div class="about-item">
                            <span class="label">Последнее обновление:</span>
                            <span class="value">${formatDate(new Date().toISOString())}</span>
                        </div>
                        <div class="about-item">
                            <span class="label">Разработчик:</span>
                            <span class="value">TEXNO EDEM LLC</span>
                        </div>
                    </div>
                </div>

                <!-- Действия -->
                <div class="settings-actions">
                    <button class="btn btn-secondary" onclick="app.settingsComponent.resetSettings()">
                        <i class="fas fa-undo"></i> Сбросить настройки
                    </button>
                    <button class="btn btn-primary" onclick="app.settingsComponent.saveSettings()">
                        <i class="fas fa-save"></i> Сохранить изменения
                    </button>
                </div>
            </div>
        `;
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('texno_edem_settings');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }

        // Настройки по умолчанию
        return {
            notifications: {
                newOrders: true,
                problemOrders: true,
                syncComplete: false
            },
            appearance: {
                theme: 'auto',
                compactMode: false
            },
            sync: {
                autoSync: true,
                syncInterval: 10
            }
        };
    }

    saveSettings() {
        try {
            // Собираем текущие настройки из формы
            this.settings = {
                notifications: {
                    newOrders: document.getElementById('notify-new-orders').checked,
                    problemOrders: document.getElementById('notify-problems').checked,
                    syncComplete: document.getElementById('notify-sync').checked
                },
                appearance: {
                    theme: document.getElementById('theme-select').value,
                    compactMode: document.getElementById('compact-mode').checked
                },
                sync: {
                    autoSync: document.getElementById('auto-sync').checked,
                    syncInterval: parseInt(document.getElementById('sync-interval').value)
                }
            };

            localStorage.setItem('texno_edem_settings', JSON.stringify(this.settings));
            this.app.showNotification('Настройки успешно сохранены', 'success');
            
            // Применяем настройки темы
            this.applyThemeSettings();
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.app.showNotification('Ошибка сохранения настроек', 'error');
        }
    }

    applyThemeSettings() {
        const theme = this.settings.appearance.theme;
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    resetSettings() {
        if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
            localStorage.removeItem('texno_edem_settings');
            this.settings = this.loadSettings();
            this.render();
            this.app.showNotification('Настройки сброшены к значениям по умолчанию', 'info');
        }
    }

    testCDEKConnection() {
        this.app.showLoading('Проверка подключения к CDEK...');
        
        // Имитация проверки подключения
        setTimeout(() => {
            this.app.hideLoading();
            this.app.showNotification('Подключение к CDEK API успешно', 'success');
        }, 2000);
    }

    testMegamarketConnection() {
        this.app.showLoading('Проверка подключения к Мегамаркет...');
        
        // Имитация проверки подключения
        setTimeout(() => {
            this.app.hideLoading();
            this.app.showNotification('Подключение к Мегамаркет API успешно', 'success');
        }, 2000);
    }

    attachEventListeners() {
        // Автосохранение при изменении настроек
        const inputs = document.querySelectorAll('#settings-container input, #settings-container select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                // Помечаем несохраненные изменения
                const saveBtn = document.querySelector('.settings-actions .btn-primary');
                if (saveBtn) {
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить изменения •';
                    saveBtn.classList.add('has-changes');
                }
            });
        });
    }
}
