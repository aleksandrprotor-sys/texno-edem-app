class ExternalIntegrations {
    static async sendToTelegram(message, chatId = null) {
        if (!CONFIG.get('INTEGRATIONS.TELEGRAM_BOT_TOKEN')) {
            console.warn('Telegram bot token not configured');
            return;
        }

        const payload = {
            chat_id: chatId || CONFIG.get('INTEGRATIONS.TELEGRAM_CHAT_ID'),
            text: message,
            parse_mode: 'HTML'
        };

        try {
            const response = await fetch(`https://api.telegram.org/bot${CONFIG.get('INTEGRATIONS.TELEGRAM_BOT_TOKEN')}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            return response.ok;
        } catch (error) {
            console.error('Telegram integration error:', error);
            return false;
        }
    }

    static async exportToGoogleSheets(data, spreadsheetId) {
        // Интеграция с Google Sheets API
        console.log('Exporting to Google Sheets:', data.length, 'rows');
        // Реализация экспорта
    }

    static async syncWithCRM(orderData) {
        // Интеграция с CRM системами
        console.log('Syncing order with CRM:', orderData.id);
        // Реализация синхронизации
    }
}
