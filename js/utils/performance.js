// js/utils/performance.js
class PerformanceOptimizer {
    constructor() {
        this.observer = null;
        this.visibilityHandler = null;
        this.cleanupInterval = null;
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupVisibilityListener();
        this.startCleanupInterval();
        this.optimizeAnimations();
        console.log('✅ PerformanceOptimizer инициализирован');
    }

    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.handleElementVisible(entry.target);
                    }
                });
            }, { 
                rootMargin: '50px 0px 50px 0px',
                threshold: 0.1 
            });

            // Наблюдаем за элементами, которые должны загружаться лениво
            setTimeout(() => {
                document.querySelectorAll('.lazy-load').forEach(el => {
                    this.observer.observe(el);
                });
            }, 100);
        }
    }

    handleElementVisible(element) {
        element.classList.add('visible');
        
        // Загружаем изображения только когда они в зоне видимости
        this.lazyLoadImages(element);
        
        // Загружаем данные для видимых компонентов
        this.lazyLoadData(element);
    }

    lazyLoadImages(container) {
        const images = container.querySelectorAll('img[data-src]');
        images.forEach(img => {
            const src = img.dataset.src;
            img.src = src;
            img.removeAttribute('data-src');
            
            // Обработка ошибок загрузки изображений
            img.onerror = () => {
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7QndGD0LbQvdC+INC90LUg0YPQtNCw0LvRj9C90YvQuTwvdGV4dD48L3N2Zz4=';
            };
        });
    }

    lazyLoadData(container) {
        // Загрузка данных для специфичных компонентов
        if (container.classList.contains('orders-list') && window.app) {
            const platform = container.dataset.platform;
            if (platform && window.app.components.orders) {
                window.app.components.orders.loadLazyData(platform);
            }
        }
    }

    setupVisibilityListener() {
        this.visibilityHandler = () => {
            if (document.hidden) {
                this.throttleBackgroundProcesses();
            } else {
                this.resumeBackgroundProcesses();
            }
        };

        document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    throttleBackgroundProcesses() {
        // Приостанавливаем не критичные процессы когда страница не видна
        if (window.app && window.app.syncManager) {
            window.app.syncManager.pauseAutoSync();
        }

        // Уменьшаем частоту таймеров
        this.throttleIntervals();
    }

    resumeBackgroundProcesses() {
        // Возобновляем процессы когда страница снова видна
        if (window.app && window.app.syncManager) {
            window.app.syncManager.resumeAutoSync();
        }

        // Восстанавливаем нормальную работу таймеров
        this.resumeIntervals();
    }

    throttleIntervals() {
        // Сохраняем оригинальные интервалы
        this.originalIntervals = this.originalIntervals || new Map();
        
        // Находим все интервалы и увеличиваем их время
        for (let i = 1; i < 1000; i++) {
            const intervalId = i;
            if (this.originalIntervals.has(intervalId)) continue;
            
            // Здесь могла бы быть логика для идентификации наших интервалов
            // В реальном приложении нужно отслеживать созданные интервалы
        }
    }

    resumeIntervals() {
        // Восстанавливаем оригинальные интервалы
        if (this.originalIntervals) {
            this.originalIntervals.forEach((originalTime, intervalId) => {
                // Логика восстановления интервалов
            });
        }
    }

    optimizeAnimations() {
        // Добавляем will-change для элементов с анимациями
        const animatedElements = document.querySelectorAll('.stat-card, .widget, .activity-item, .order-card');
        animatedElements.forEach(el => {
            el.style.willChange = 'transform, opacity';
        });

        // Оптимизируем CSS transitions
        this.optimizeTransitions();
    }

    optimizeTransitions() {
        const style = document.createElement('style');
        style.textContent = `
            .stat-card,
            .widget,
            .activity-item,
            .order-card {
                transform: translateZ(0);
                backface-visibility: hidden;
                perspective: 1000px;
            }
            
            @media (prefers-reduced-motion: reduce) {
                * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ОЧИСТКА ПАМЯТИ
    cleanupMemory() {
        if (window.performance && performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const limit = performance.memory.jsHeapSizeLimit;
            
            if (used / limit > 0.75) {
                // Высокое использование памяти - очищаем кэш
                this.forceCleanup();
            }
        }

        // Периодическая очистка
        this.cleanupOldData();
        this.cleanupDOM();
    }

    forceCleanup() {
        console.log('🧹 Принудительная очистка памяти');
        
        // Очищаем кэш компонентов
        if (window.app && window.app.components.orders) {
            window.app.components.orders.clearCache();
        }
        
        // Очищаем модальные окна
        if (window.app && window.app.components.modal) {
            window.app.components.modal.cleanup();
        }
        
        // Принудительный сбор мусора (если доступен)
        if (window.gc) {
            window.gc();
        }
    }

    cleanupOldData() {
        // Очищаем старые данные из localStorage
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('cache_')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data && data.timestamp && data.timestamp < oneWeekAgo) {
                            localStorage.removeItem(key);
                        }
                    } catch (e) {
                        // Удаляем поврежденные данные
                        localStorage.removeItem(key);
                    }
                }
            }
        } catch (error) {
            console.warn('Ошибка очистки старых данных:', error);
        }
    }

    cleanupDOM() {
        // Удаляем скрытые или неиспользуемые DOM элементы
        const hiddenModals = document.querySelectorAll('.modal:not(.active)');
        hiddenModals.forEach(modal => {
            if (!modal.contains(document.activeElement)) {
                modal.remove();
            }
        });

        // Очищаем старые уведомления
        const oldNotifications = document.querySelectorAll('.notification-toast:not(.show)');
        oldNotifications.forEach(notification => {
            if (Date.now() - notification.dataset.created > 10000) {
                notification.remove();
            }
        });
    }

    startCleanupInterval() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupMemory();
        }, 30000); // Каждые 30 секунд
    }

    // МЕТРИКИ ПРОИЗВОДИТЕЛЬНОСТИ
    startPerformanceMonitoring() {
        if ('performance' in window) {
            // Мониторинг времени загрузки
            window.addEventListener('load', () => {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                this.reportMetric('page_load_time', loadTime);
            });

            // Мониторинг взаимодействия
            this.monitorUserInteractions();
        }
    }

    monitorUserInteractions() {
        let interactionStart = Date.now();
        
        document.addEventListener('click', () => {
            const responseTime = Date.now() - interactionStart;
            this.reportMetric('click_response_time', responseTime);
            interactionStart = Date.now();
        }, { passive: true });

        document.addEventListener('keydown', () => {
            const responseTime = Date.now() - interactionStart;
            this.reportMetric('keyboard_response_time', responseTime);
            interactionStart = Date.now();
        }, { passive: true });
    }

    reportMetric(name, value) {
        // Отправка метрик в аналитику
        if (typeof gtag !== 'undefined') {
            gtag('event', 'timing_complete', {
                name: name,
                value: Math.round(value),
                event_category: 'Performance'
            });
        }

        // Локальное хранение метрик
        this.storeMetric(name, value);
    }

    storeMetric(name, value) {
        try {
            const metrics = JSON.parse(localStorage.getItem('texno_edem_metrics') || '{}');
            if (!metrics[name]) {
                metrics[name] = [];
            }
            metrics[name].push({
                value: value,
                timestamp: new Date().toISOString()
            });
            
            // Сохраняем только последние 100 записей для каждой метрики
            if (metrics[name].length > 100) {
                metrics[name] = metrics[name].slice(-100);
            }
            
            localStorage.setItem('texno_edem_metrics', JSON.stringify(metrics));
        } catch (error) {
            console.warn('Не удалось сохранить метрику:', error);
        }
    }

    getPerformanceReport() {
        const metrics = JSON.parse(localStorage.getItem('texno_edem_metrics') || '{}');
        const report = {};
        
        Object.keys(metrics).forEach(name => {
            const values = metrics[name].map(m => m.value);
            report[name] = {
                count: values.length,
                average: values.reduce((a, b) => a + b, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                last: values[values.length - 1]
            };
        });
        
        return report;
    }

    // ОСТАНОВКА ОПТИМИЗАТОРА
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        console.log('✅ PerformanceOptimizer остановлен');
    }
}
