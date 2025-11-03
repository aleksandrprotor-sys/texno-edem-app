// js/components/dashboard.js
class DashboardComponent {
    constructor(app) {
        this.app = app;
    }

    render() {
        const container = document.getElementById('dashboard-view');
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard">
                <div class="dashboard-header">
                    <h1>📊 Дашборд</h1>
                    <p>Обзор заказов и статистика</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📦</div>
                        <div class="stat-info">
                            <h3>Всего заказов</h3>
                            <span class="stat-value">0</span>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🚚</div>
                        <div class="stat-info">
                            <h3>CDEK заказы</h3>
                            <span class="stat-value">0</span>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🏪</div>
                        <div class="stat-info">
                            <h3>Мегамаркет заказы</h3>
                            <span class="stat-value">0</span>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-info">
                            <h3>Выполнено</h3>
                            <span class="stat-value">0</span>
                        </div>
                    </div>
                </div>

                <div class="recent-orders">
                    <h3>Последние заказы</h3>
                    <div class="orders-list">
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <p>Заказы не найдены</p>
                            <button class="btn btn-primary" onclick="app.syncData()">
                                Синхронизировать
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
