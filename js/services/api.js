// Обновленный метод loadOrders в app.js
async loadOrders() {
    try {
        // Загрузка заказов CDEK с правильными параметрами
        if (this.config?.get('API.CDEK.ENABLED', true)) {
            try {
                const cdekOrders = await CDEKService.getOrders({
                    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    date_to: new Date().toISOString().split('T')[0],
                    size: 50,
                    page: 0
                });
                this.orders.cdek = cdekOrders;
                console.log(`✅ CDEK orders loaded: ${cdekOrders.length}`);
            } catch (error) {
                console.warn('⚠️ CDEK orders load failed, using mock data:', error);
                this.orders.cdek = this.generateDemoCDEKOrders();
            }
        } else {
            this.orders.cdek = this.generateDemoCDEKOrders();
        }

        // Загрузка заказов Megamarket с правильными параметрами
        if (this.config?.get('API.MEGAMARKET.ENABLED', true)) {
            try {
                const megamarketOrders = await MegamarketService.getOrders({
                    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    limit: 50
                });
                this.orders.megamarket = megamarketOrders;
                console.log(`✅ Megamarket orders loaded: ${megamarketOrders.length}`);
            } catch (error) {
                console.warn('⚠️ Megamarket orders load failed, using mock data:', error);
                this.orders.megamarket = this.generateDemoMegamarketOrders();
            }
        } else {
            this.orders.megamarket = this.generateDemoMegamarketOrders();
        }

        // Объединение и сортировка всех заказов
        this.orders.all = [...this.orders.cdek, ...this.orders.megamarket]
            .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

        console.log(`✅ All orders loaded: CDEK ${this.orders.cdek.length}, Megamarket ${this.orders.megamarket.length}`);

    } catch (error) {
        console.error('❌ Error loading orders:', error);
        this.useDemoData();
    }
}
