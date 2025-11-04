// js/components/header.js
class HeaderComponent {
    constructor() {
        this.syncStatus = {
            element: document.getElementById('sync-status'),
            indicator: document.getElementById('sync-indicator'),
            text: document.getElementById('sync-text')
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateSyncStatus('idle');
    }

    bindEvents() {
        // Обработчики для кнопок хедера
        document.querySelector('.logo').addEventListener('click', () => {
            app.showSection('dashboard');
        });

        document.querySelector('.user-info').addEventListener('click', () => {
            app.showSection('settings');
        });

        // Обработчик для кнопки синхронизации
        document.querySelector('.btn-icon[title="Обновить данные"]').addEventListener('click', () => {
            app.manualSync();
        });
    }

    updateSyncStatus(status, message = '') {
        const statusConfig = {
            'idle': { class: '', text: 'Готов к работе', color: 'var(--success)' },
            'syncing': { class: 'syncing', text: 'Синхронизация...', color: 'var(--warning)' },
            'error': { class: 'error', text: 'Ошибка синхронизации', color: 'var(--danger)' },
            'success': { class: 'success', text: 'Данные обновлены', color: 'var(--success)' }
        };

        const config = statusConfig[status] || statusConfig.idle;
        
        this.syncStatus.indicator.className = 'sync-indicator';
        this.syncStatus.indicator.classList.add(config.class);
        this.syncStatus.indicator.style.background = config.color;
        this.syncStatus.text.textContent = message || config.text;
    }

    updateUserInfo(userData) {
        const userName = document.getElementById('user-name');
        if (userData && userData.name) {
            userName.textContent = userData.name;
        }
    }

    updateBadge(section, count) {
        const badge = document.getElementById(`nav-badge-${section}`);
        if (badge) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
}
