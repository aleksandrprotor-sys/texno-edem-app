// js/components/report-builder.js
class ReportBuilder {
    constructor(app) {
        this.app = app;
        this.templates = new Map();
        this.setupTemplates();
    }

    setupTemplates() {
        this.templates.set('daily_sales', {
            name: 'Ежедневный отчет по продажам',
            columns: ['Дата', 'Платформа', 'Заказы', 'Выручка', 'Средний чек'],
            dataSource: () => this.getDailySalesData()
        });

        this.templates.set('problem_orders', {
            name: 'Отчет по проблемным заказам',
            columns: ['ID заказа', 'Платформа', 'Статус', 'Проблема', 'Дата создания'],
            dataSource: () => this.getProblemOrdersData()
        });
    }

    generateReport(templateId, format = 'csv') {
        const template = this.templates.get(templateId);
        if (!template) throw new Error(`Template ${templateId} not found`);

        const data = template.dataSource();
        
        switch (format) {
            case 'csv':
                return this.toCSV(template.columns, data);
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'html':
                return this.toHTML(template.columns, data);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    toCSV(columns, data) {
        const header = columns.join(',');
        const rows = data.map(row => 
            columns.map(col => this.escapeCSV(row[col])).join(',')
        );
        return [header, ...rows].join('\n');
    }

    escapeCSV(value) {
        if (value === null || value === undefined) return '';
        const string = String(value);
        return `"${string.replace(/"/g, '""')}"`;
    }

    getDailySalesData() {
        const orders = this.app.orders.all;
        const dailyData = {};
        
        orders.forEach(order => {
            const date = order.createdDate.split('T')[0];
            const platform = order.platform;
            const key = `${date}_${platform}`;
            
            if (!dailyData[key]) {
                dailyData[key] = {
                    date,
                    platform,
                    orders: 0,
                    revenue: 0
                };
            }
            
            dailyData[key].orders++;
            dailyData[key].revenue += order.cost || order.totalAmount || 0;
        });
        
        return Object.values(dailyData).map(item => ({
            ...item,
            average: item.revenue / item.orders
        }));
    }
}
