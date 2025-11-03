// js/components/settings.js - Компонент настроек
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
                <!-- Настройки синхронизации -->
                <div class="settings-section">
                    <div class="section-header">
                        <i class="fas fa-sync-alt"></i>
                        <h3>Синхронизация данных</h3>
                    </div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Автоматическая синхронизация</h4>
                                <p>Автоматически обновлять данные каждые 5 минут</p>
                            </div>
                            <div class="setting-control">
                                <label class="switch">
                                    <input type="checkbox" id="auto-sync" 
                                           ${CONFIG.get('SETTINGS.AUTO_SYNC', true) ? 'checked' : ''}>
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
                                    <option value="60000" ${CONFIG.get('SETTINGS.SYNC_INTERVAL', 300000) === 60000 ? 'selected' : ''}>1 минута</option>
                                    <option value="300000" ${CONFIG.get('SETTINGS.SYNC_INTERVAL', 300000) === 300000 ? 'selected' : ''}>5 минут</option>
                                    <option value="900000" ${CONFIG.get('SETTINGS.SYNC_INTERVAL', 300000) === 900000 ? 'selected' : ''}>15 минут</option>
                                    <option value="1800000" ${CONFIG.get('SETTINGS.SYNC_INTERVAL', 300000) === 1800000 ? 'selected' : ''}>30 минут</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Настройки уведомлений -->
                <div class="settings-section">
                    <div class="section-header">
                        <i class="fas fa-bell"></i>
                        <h3>Уведомления</h3>
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
                                           ${CONFIG.get('SETTINGS.NOTIFICATION_SOUND', true) ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Настройки интерфейса -->
                <div class="settings-section">
                    <div class="section-header">
                        <i class="fas fa-palette"></i>
                        <h3>Внешний вид</h3>
                    </div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Тема оформления</h4>
                                <p>Выберите preferred цветовую схему</p>
                            </div>
                            <div class="setting-control">
                                <select id="theme-select" class="form-control">
                                    <option value="auto" ${CONFIG.get('SETTINGS.THEME', 'auto') === 'auto' ? 'selected' : ''}>Авто</option>
                                    <option value="light" ${CONFIG.get('SETTINGS.THEME', 'auto') === 'light' ? 'selected' : ''}>Светлая</option>
                                    <option value="dark" ${CONFIG.get('SETTINGS.THEME', 'auto') === 'dark' ? 'selected' : ''}>Темная</option>
                                </select>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Компактный режим</h4>
                                <p>Показывать больше информации на экране</p>
                            </div>
                            <div class="setting-control">
                                <label class="switch">
                                    <input type="checkbox" id="compact-mode" 
                                           ${CONFIG.get('UI.COMPACT_MODE', false) ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Интеграции -->
                <div class="settings-section">
                    <div class="section-header">
                        <i class="fas fa-plug"></i>
                        <h3>Интеграции</h3>
                    </div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>CDEK API</h4>
                                <p>Интеграция с логистической платформой CDEK</p>
                            </div>
                            <div class="setting-control">
                                <label class="switch">
                                    <input type="checkbox" id="cdek-enabled" 
                                           ${CONFIG.get('API.CDEK.ENABLED', true) ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>Мегамаркет API</h4>
                                <p>Интеграция с маркетплейсом Мегамаркет</p>
                            </div>
                            <div class="setting-control">
                                <label class="switch">
                                    <input type="checkbox" id="megamarket-enabled" 
                                           ${CONFIG.get('API.MEGAMARKET.ENABLED', true) ? 'checked' : ''}>
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
                        <h3>О приложении</h3>
                    </div>
                    <div class="about-info">
                        <div class="about-item">
                            <span class="label">Версия</span>
                            <span class="value">${CONFIG.get('APP.VERSION', '1.0.0')}</span>
                        </div>
                        <div class="about-item">
                            <span class="label">Сборка</span>
                            <span class="value">${CONFIG.get('APP.BUILD', '2024.01.15')}</span>
                        </div>
                        <div class="about-item">
                            <span class="label">Последнее обновление</span>
                            <span class="value">${this.app.lastSyncTime ? formatRelativeTime(this.app.lastSyncTime) : 'Никогда'}</span>
                        </div>
                    </div>
                </div>

                <!-- Действия -->
                <div class="settings-actions">
                    <button class="btn btn-secondary" onclick="app.settingsComponent.resetSettings()">
                        <i class="fas fa-undo"></i> Сбросить
                    </button>
                    <button class="btn btn-primary ${this.unsavedChanges ? 'has-changes' : ''}" 
                            onclick="app.settingsComponent.saveSettings()"
                            ${!this.unsavedChanges ? 'disabled' : ''}>
                        <i class="fas fa-save"></i> Сохранить изменения
                    </button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Отслеживаем изменения настроек
        const inputs = [
            'auto-sync', 'sync-interval', 'notification-sound',
            'theme-select', 'compact-mode', 'cdek-enabled', 'megamarket-enabled'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.unsavedChanges = true;
                    this.updateSaveButton();
                });
            }
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

    saveSettings() {
        try {
            // Синхронизация
            CONFIG.set('SETTINGS.AUTO_SYNC', document.getElementById('auto-sync').checked);
            CONFIG.set('SETTINGS.SYNC_INTERVAL', parseInt(document.getElementById('sync-interval').value));
            
            // Уведомления
            CONFIG.set('SETTINGS.NOTIFICATION_SOUND', document.getElementById('notification-sound').checked);
            
            // Интерфейс
            CONFIG.set('SETTINGS.THEME', document.getElementById('theme-select').value);
            CONFIG.set('UI.COMPACT_MODE', document.getElementById('compact-mode').checked);
            
            // Интеграции
            CONFIG.set('API.CDEK.ENABLED', document.getElementById('cdek-enabled').checked);
            CONFIG.set('API.MEGAMARKET.ENABLED', document.getElementById('megamarket-enabled').checked);

            // Применяем изменения
            CONFIG.applyTheme();
            
            // Перезапускаем автосинхронизацию если нужно
            this.app.stopAutoSync();
            this.app.startAutoSync();

            this.unsavedChanges = false;
            this.updateSaveButton();
            
            this.app.showNotification('Настройки сохранены', 'success');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.app.showNotification('Ошибка сохранения настроек', 'error');
        }
    }

    resetSettings() {
        if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
            CONFIG.reset();
            this.app.showNotification('Настройки сброшены', 'info');
            this.render();
        }
    }
}
