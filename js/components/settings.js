// js/components/settings.js - Восстановленный компонент настроек
class SettingsComponent {
    constructor(app) {
        this.app = app;
        this.unsavedChanges = false;
        this.currentSettings = this.loadCurrentSettings();
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
            autoSync: CONFIG.get('SETTINGS.AUTO_SYNC', true),
            syncInterval: CONFIG.get('SETTINGS.SYNC_INTERVAL', 300000),
            notificationSound: CONFIG.get('SETTINGS.NOTIFICATION_SOUND', true),
            theme: CONFIG.get('SETTINGS.THEME', 'auto'),
            compactMode: CONFIG.get('UI.COMPACT_MODE', false),
            cdekEnabled: CONFIG.get('API.CDEK.ENABLED', true),
            megamarketEnabled: CONFIG.get('API.MEGAMARKET.ENABLED', true)
        };
    }

    createSettingsHTML() {
        return `
            <div class="settings-content">
                <!-- Настройки синхронизации -->
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

                <!-- Настройки уведомлений -->
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

                <!-- Настройки интерфейса -->
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
                                <p>Выберите preferred цветовую схему</p>
                            </div>
                            <div class="setting-control">
                                <select id="theme-select" class="form-control">
                                    <option value="auto" ${this.currentSettings.theme === 'auto' ? 'selected' : ''}>Авто</option>
                                    <option value="light" ${this.currentSettings.theme === 'light' ? 'selected' : ''}>Светлая</option>
                                    <option value="dark" ${this.currentSettings.theme === 'dark' ? 'selected' : ''}>Темная</option>
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
                                           ${this.currentSettings.compactMode ? 'checked' : ''}>
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
                        <div class="section-header-text">
                            <h3>Интеграции</h3>
                            <p>Управление подключенными платформами</p>
                        </div>
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
                                           ${this.currentSettings.cdekEnabled ? 'checked' : ''}>
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
                                           ${this.currentSettings.megamarketEnabled ? 'checked' : ''}>
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

        console.log('✅ Settings event listeners attached');
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
                autoSync: document.getElementById('auto-sync').checked,
                syncInterval: parseInt(document.getElementById('sync-interval').value),
                notificationSound: document.getElementById('notification-sound').checked,
                theme: document.getElementById('theme-select').value,
                compactMode: document.getElementById('compact-mode').checked,
                cdekEnabled: document.getElementById('cdek-enabled').checked,
                megamarketEnabled: document.getElementById('megamarket-enabled').checked
            };

            // Сохраняем в конфиг
            CONFIG.set('SETTINGS.AUTO_SYNC', newSettings.autoSync);
            CONFIG.set('SETTINGS.SYNC_INTERVAL', newSettings.syncInterval);
            CONFIG.set('SETTINGS.NOTIFICATION_SOUND', newSettings.notificationSound);
            CONFIG.set('SETTINGS.THEME', newSettings.theme);
            CONFIG.set('UI.COMPACT_MODE', newSettings.compactMode);
            CONFIG.set('API.CDEK.ENABLED', newSettings.cdekEnabled);
            CONFIG.set('API.MEGAMARKET.ENABLED', newSettings.megamarketEnabled);

            // Применяем изменения
            CONFIG.applyTheme();
            
            // Перезапускаем автосинхронизацию если нужно
            this.app.stopAutoSync();
            this.app.startAutoSync();

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

    resetSettings() {
        if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
            CONFIG.reset();
            this.app.showNotification('Настройки сброшены к значениям по умолчанию', 'info');
            
            // Перезагружаем компонент
            setTimeout(() => {
                this.render();
            }, 500);
        }
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
