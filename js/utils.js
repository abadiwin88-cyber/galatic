// Utility functions
class Utils {
    static formatTime(date) {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static formatDate(date) {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static formatDateTime(date) {
        return date.toLocaleString('id-ID', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static calculateTimeRemaining(endTime) {
        const now = new Date().getTime();
        const end = new Date(endTime).getTime();
        const remaining = end - now;

        if (remaining <= 0) {
            return { minutes: 0, seconds: 0, expired: true };
        }

        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        return { minutes, seconds, expired: false };
    }

    static validateTime(timeString) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(timeString);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }

    static getShiftFromTime(time) {
        const hour = parseInt(time.split(':')[0]);
        
        if (hour >= 6 && hour < 14) return 'pagi';
        if (hour >= 14 && hour < 22) return 'siang';
        return 'malam';
    }

    static isShiftActive(shiftStart, loginWindow) {
        const now = new Date();
        const [hours, minutes] = shiftStart.split(':');
        const shiftTime = new Date();
        shiftTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const loginEnd = new Date(shiftTime);
        loginEnd.setHours(loginEnd.getHours() + loginWindow);
        
        return now >= shiftTime && now <= loginEnd;
    }
}

// LocalStorage helper
class StorageHelper {
    static get(key, defaultValue = null) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    }

    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static remove(key) {
        localStorage.removeItem(key);
    }

    static clear() {
        localStorage.clear();
    }
}

// Export for use in other files
window.Utils = Utils;
window.StorageHelper = StorageHelper;