class Logger {
    static levels = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };

    constructor(level = 'INFO') {
        this.level = Logger.levels[level] || Logger.levels.INFO;
    }

    error(message, data = null) {
        this.log('ERROR', message, data);
    }

    warn(message, data = null) {
        if (this.level >= Logger.levels.WARN) {
            this.log('WARN', message, data);
        }
    }

    info(message, data = null) {
        if (this.level >= Logger.levels.INFO) {
            this.log('INFO', message, data);
        }
    }

    debug(message, data = null) {
        if (this.level >= Logger.levels.DEBUG) {
            this.log('DEBUG', message, data);
        }
    }

    log(level, message, data) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            level,
            message,
            data,
            timestamp,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console[level.toLowerCase()](`[${timestamp}] ${level}: ${message}`, data);
        this.storeLog(logEntry);
    }

    storeLog(entry) {
        try {
            const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
            logs.push(entry);
            
            // Ограничиваем размер логов
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            localStorage.setItem('app_logs', JSON.stringify(logs));
        } catch (e) {
            console.error('Failed to store log:', e);
        }
    }

    exportLogs() {
        const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
        return JSON.stringify(logs, null, 2);
    }
}
