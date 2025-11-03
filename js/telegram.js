// telegram.js - УЛУЧШЕННАЯ ВЕРСИЯ
class TelegramIntegration {
    constructor() {
        this.isInitialized = false;
        this.isAvailable = false;
        this.user = null;
        this.webApp = null;
        this.initPromise = null;
        this.initAttempts = 0;
        this.maxInitAttempts = 3;
        this.eventHandlers = new Map();
        
        console.log('🤖 Telegram Integration constructor called');
    }

    async init() {
        if (this.isInitialized) {
            console.log('⚠️ Already initialized');
            return this.webApp;
        }

        // Если уже идет инициализация, возвращаем существующий промис
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this.initializeTelegram();
        return this.initPromise;
    }

    async initializeTelegram() {
        if (this.initAttempts >= this.maxInitAttempts) {
            console.error('❌ Max initialization attempts reached');
            throw new Error('Failed to initialize Telegram integration');
        }

        this.initAttempts++;
        
        try {
            console.log('🔧 Initializing Telegram Web App...');
            
            // Проверяем доступность Telegram Web App
            if (typeof window.Telegram === 'undefined' || !window.Telegram.WebApp) {
                console.warn('⚠️ Telegram Web App not available, running in standalone mode');
                this.isAvailable = false;
                this.createMockWebApp();
                return this.webApp;
            }

            this.webApp = window.Telegram.WebApp;
            this.isAvailable = true;

            // Настраиваем приложение
            this.setupWebApp();
            
            // Инициализируем пользователя
            await this.initUser();
            
            // Настраиваем события
            this.setupEventHandlers();
            
            this.isInitialized = true;
            
            console.log('✅ Telegram Web App initialized successfully');
            console.log('👤 User:', this.user);
            console.log('📱 Platform:', this.webApp.platform);
            console.log('🎨 Theme:', this.webApp.colorScheme);
            
            return this.webApp;
            
        } catch (error) {
            console.error('❌ Telegram initialization failed:', error);
            
            // Создаем мок для автономной работы
            this.createMockWebApp();
            this.isAvailable = false;
            
            throw error;
        }
    }

    setupWebApp() {
        if (!this.isAvailable) return;

        try {
            // Расширяем приложение на весь экран
            this.webApp.expand();
            
            // Настраиваем тему
            this.applyTelegramTheme();
            
            // Настраиваем кнопку назад
            this.webApp.BackButton.show();
            
            // Отключаем стандартную клавиатуру для лучшего UX
            this.webApp.disableVerticalSwipes();
            
            console.log('✅ Telegram Web App configured');
            
        } catch (error) {
            console.warn('⚠️ WebApp configuration failed:', error);
        }
    }

    applyTelegramTheme() {
        if (!this.isAvailable) return;

        try {
            const themeParams = this.webApp.themeParams;
            
            // Применяем тему Telegram к нашему приложению
            document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#999999');
            document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#2481cc');
            document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#2481cc');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || '#f1f1f1');
            
            // Добавляем класс для темной темы
            if (this.webApp.colorScheme === 'dark') {
                document.documentElement.classList.add('tg-theme-dark');
                document.documentElement.classList.remove('tg-theme-light');
            } else {
                document.documentElement.classList.add('tg-theme-light');
                document.documentElement.classList.remove('tg-theme-dark');
            }
            
            console.log('🎨 Telegram theme applied');
            
        } catch (error) {
            console.warn('⚠️ Failed to apply Telegram theme:', error);
        }
    }

    async initUser() {
        if (!this.isAvailable) {
            this.user = this.createMockUser();
            return;
        }

        try {
            const initData = this.webApp.initData;
            const initDataUnsafe = this.webApp.initDataUnsafe;
            
            if (initDataUnsafe.user) {
                this.user = {
                    id: initDataUnsafe.user.id,
                    firstName: initDataUnsafe.user.first_name,
                    lastName: initDataUnsafe.user.last_name,
                    username: initDataUnsafe.user.username,
                    languageCode: initDataUnsafe.user.language_code,
                    isPremium: initDataUnsafe.user.is_premium || false,
                    photoUrl: initDataUnsafe.user.photo_url,
                    isBot: initDataUnsafe.user.is_bot || false
                };
            } else {
                // Если данных пользователя нет, создаем анонимного пользователя
                this.user = this.createAnonymousUser();
            }
            
            // Сохраняем данные для аналитики
            this.trackUserInit();
            
        } catch (error) {
            console.warn('⚠️ Failed to init user:', error);
            this.user = this.createAnonymousUser();
        }
    }

    createMockWebApp() {
        console.log('🔧 Creating mock Telegram Web App');
        
        this.webApp = {
            // Основные методы
            initData: '',
            initDataUnsafe: {},
            version: '7.0',
            platform: 'unknown',
            colorScheme: 'light',
            themeParams: {},
            isExpanded: true,
            viewportHeight: window.innerHeight,
            viewportStableHeight: window.innerHeight,
            headerColor: '#000000',
            backgroundColor: '#ffffff',
            
            // Методы управления
            expand: () => console.log('📱 Mock: expand'),
            close: () => console.log('📱 Mock: close'),
            ready: () => console.log('📱 Mock: ready'),
            
            // Кнопка назад
            BackButton: {
                isVisible: false,
                show: () => { 
                    console.log('📱 Mock: BackButton show');
                    this.webApp.BackButton.isVisible = true;
                },
                hide: () => { 
                    console.log('📱 Mock: BackButton hide');
                    this.webApp.BackButton.isVisible = false;
                },
                onClick: (callback) => {
                    console.log('📱 Mock: BackButton onClick handler set');
                }
            },
            
            // Основная кнопка
            MainButton: {
                text: 'CONTINUE',
                color: '#2481cc',
                textColor: '#ffffff',
                isVisible: false,
                isActive: true,
                isProgressVisible: false,
                show: () => { 
                    console.log('📱 Mock: MainButton show');
                    this.webApp.MainButton.isVisible = true;
                },
                hide: () => { 
                    console.log('📱 Mock: MainButton hide');
                    this.webApp.MainButton.isVisible = false;
                },
                enable: () => { 
                    console.log('📱 Mock: MainButton enable');
                    this.webApp.MainButton.isActive = true;
                },
                disable: () => { 
                    console.log('📱 Mock: MainButton disable');
                    this.webApp.MainButton.isActive = false;
                },
                showProgress: () => {
                    console.log('📱 Mock: MainButton showProgress');
                    this.webApp.MainButton.isProgressVisible = true;
                },
                hideProgress: () => {
                    console.log('📱 Mock: MainButton hideProgress');
                    this.webApp.MainButton.isProgressVisible = false;
                },
                setText: (text) => {
                    console.log(`📱 Mock: MainButton setText "${text}"`);
                    this.webApp.MainButton.text = text;
                },
                onClick: (callback) => {
                    console.log('📱 Mock: MainButton onClick handler set');
                }
            },
            
            // Свайпы
            disableVerticalSwipes: () => console.log('📱 Mock: disableVerticalSwipes'),
            enableVerticalSwipes: () => console.log('📱 Mock: enableVerticalSwipes'),
            
            // События
            onEvent: (eventType, callback) => {
                console.log(`📱 Mock: onEvent handler set for ${eventType}`);
            },
            offEvent: (eventType, callback) => {
                console.log(`📱 Mock: offEvent handler removed for ${eventType}`);
            },
            
            // Хэш и параметры
            CloudStorage: {
                setItem: (key, value, callback) => {
                    console.log(`📱 Mock: CloudStorage setItem ${key}`);
                    localStorage.setItem(`tg_${key}`, value);
                    if (callback) callback(true);
                },
                getItem: (key, callback) => {
                    console.log(`📱 Mock: CloudStorage getItem ${key}`);
                    const value = localStorage.getItem(`tg_${key}`);
                    if (callback) callback(value);
                }
            }
        };
        
        this.isAvailable = false;
    }

    createMockUser() {
        return {
            id: Math.floor(Math.random() * 1000000),
            firstName: 'Demo',
            lastName: 'User',
            username: 'demo_user',
            languageCode: 'ru',
            isPremium: false,
            isBot: false,
            isMock: true
        };
    }

    createAnonymousUser() {
        return {
            id: 0,
            firstName: 'Anonymous',
            lastName: 'User',
            username: 'anonymous',
            languageCode: 'ru',
            isPremium: false,
            isBot: false,
            isAnonymous: true
        };
    }

    setupEventHandlers() {
        if (!this.isAvailable) return;

        try {
            // Обработчик изменения темы
            this.webApp.onEvent('themeChanged', () => {
                console.log('🎨 Theme changed');
                this.applyTelegramTheme();
                this.dispatchEvent('themeChanged');
            });

            // Обработчик изменения размера окна
            this.webApp.onEvent('viewportChanged', (event) => {
                console.log('📐 Viewport changed:', event);
                this.dispatchEvent('viewportChanged', event);
            });

            // Обработчик кнопки назад
            this.webApp.BackButton.onClick(() => {
                console.log('⬅️ Back button clicked');
                this.dispatchEvent('backButtonClicked');
            });

            // Обработчик основной кнопки
            this.webApp.MainButton.onClick(() => {
                console.log('🔼 Main button clicked');
                this.dispatchEvent('mainButtonClicked');
            });

            console.log('✅ Telegram event handlers setup complete');
            
        } catch (error) {
            console.warn('⚠️ Failed to setup event handlers:', error);
        }
    }

    // НОВЫЙ МЕТОД: Отслеживание инициализации пользователя
    trackUserInit() {
        const userData = {
            id: this.user.id,
            platform: this.webApp.platform,
            theme: this.webApp.colorScheme,
            version: this.webApp.version,
            timestamp: new Date().toISOString()
        };
        
        console.log('👤 User initialized:', userData);
        
        // Сохраняем для аналитики
        localStorage.setItem('tg_user_init', JSON.stringify(userData));
    }

    // НОВЫЙ МЕТОД: Управление основной кнопкой
    setupMainButton(options = {}) {
        if (!this.isAvailable) return;

        try {
            const {
                text = 'Продолжить',
                color = '#2481cc',
                textColor = '#ffffff',
                isActive = true,
                isVisible = true,
                onClick = null
            } = options;

            this.webApp.MainButton.setText(text);
            this.webApp.MainButton.color = color;
            this.webApp.MainButton.textColor = textColor;
            
            if (isActive) {
                this.webApp.MainButton.enable();
            } else {
                this.webApp.MainButton.disable();
            }
            
            if (isVisible) {
                this.webApp.MainButton.show();
            } else {
                this.webApp.MainButton.hide();
            }
            
            if (onClick) {
                this.webApp.MainButton.onClick(onClick);
            }
            
        } catch (error) {
            console.warn('⚠️ Failed to setup main button:', error);
        }
    }

    // НОВЫЙ МЕТОД: Показ уведомления
    showNotification(message, type = 'info') {
        if (!this.isAvailable) {
            // Фолбэк для автономного режима
            console.log(`📱 Notification (${type}): ${message}`);
            return;
        }

        try {
            // В реальном приложении здесь будет вызов Telegram API для уведомлений
            console.log(`📱 Telegram notification (${type}): ${message}`);
            
        } catch (error) {
            console.warn('⚠️ Failed to show notification:', error);
        }
    }

    // НОВЫЙ МЕТОД: Управление хранением данных
    async setStorageItem(key, value) {
        try {
            if (this.isAvailable && this.webApp.CloudStorage) {
                return new Promise((resolve) => {
                    this.webApp.CloudStorage.setItem(key, JSON.stringify(value), (success) => {
                        if (success) {
                            console.log(`💾 Saved to Telegram Cloud: ${key}`);
                            resolve(true);
                        } else {
                            throw new Error('Cloud storage failed');
                        }
                    });
                });
            } else {
                // Фолбэк на localStorage
                localStorage.setItem(`tg_${key}`, JSON.stringify(value));
                console.log(`💾 Saved to localStorage: ${key}`);
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Failed to save to storage:', error);
            // Резервное сохранение
            localStorage.setItem(`tg_${key}`, JSON.stringify(value));
            return true;
        }
    }

    async getStorageItem(key) {
        try {
            if (this.isAvailable && this.webApp.CloudStorage) {
                return new Promise((resolve) => {
                    this.webApp.CloudStorage.getItem(key, (value) => {
                        if (value) {
                            resolve(JSON.parse(value));
                        } else {
                            resolve(null);
                        }
                    });
                });
            } else {
                // Фолбэк на localStorage
                const value = localStorage.getItem(`tg_${key}`);
                return value ? JSON.parse(value) : null;
            }
        } catch (error) {
            console.warn('⚠️ Failed to load from storage:', error);
            const value = localStorage.getItem(`tg_${key}`);
            return value ? JSON.parse(value) : null;
        }
    }

    // НОВЫЙ МЕТОД: Система событий
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }

    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).delete(handler);
        }
    }

    dispatchEvent(event, data = null) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`❌ Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    // НОВЫЙ МЕТОД: Получение информации о приложении
    getAppInfo() {
        if (!this.isAvailable) {
            return {
                platform: 'standalone',
                version: '1.0.0',
                theme: 'light',
                isAvailable: false
            };
        }

        return {
            platform: this.webApp.platform,
            version: this.webApp.version,
            theme: this.webApp.colorScheme,
            viewportHeight: this.webApp.viewportHeight,
            isExpanded: this.webApp.isExpanded,
            isAvailable: true
        };
    }

    // НОВЫЙ МЕТОД: Закрытие приложения
    closeApp() {
        if (this.isAvailable) {
            this.webApp.close();
        } else {
            console.log('📱 Mock: App close requested');
            // В автономном режиме показываем сообщение
            alert('Приложение может быть закрыто');
        }
    }

    // НОВЫЙ МЕТОД: Проверка поддержки функций
    supports(feature) {
        if (!this.isAvailable) return false;
        
        const supportedFeatures = {
            'cloudStorage': !!this.webApp.CloudStorage,
            'mainButton': !!this.webApp.MainButton,
            'backButton': !!this.webApp.BackButton,
            'theme': true,
            'viewport': true
        };
        
        return supportedFeatures[feature] || false;
    }

    // НОВЫЙ МЕТОД: Деинициализация
    destroy() {
        if (this.isAvailable) {
            // Очищаем обработчики событий
            this.eventHandlers.clear();
            
            // Скрываем кнопки
            this.webApp.BackButton.hide();
            this.webApp.MainButton.hide();
            
            console.log('🧹 Telegram integration destroyed');
        }
        
        this.isInitialized = false;
        this.initPromise = null;
    }
}

// Глобальная интеграция Telegram
window.telegramIntegration = new TelegramIntegration();
