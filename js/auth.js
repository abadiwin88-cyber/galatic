class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.adminPassword = 'aa1234';
        this.shifts = {
            'pagi': { start: '06:00', loginWindow: 2 },
            'siang': { start: '14:00', loginWindow: 2 },
            'malam': { start: '22:00', loginWindow: 2 }
        };
        this.initializeEventListeners();
        this.updateClock();
    }

    initializeEventListeners() {
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('adminAccessBtn').addEventListener('click', () => this.showAdminModal());
        document.getElementById('adminLoginBtn').addEventListener('click', () => this.adminLogin());
        document.querySelector('.close-modal').addEventListener('click', () => this.hideAdminModal());
        
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        
        document.getElementById('adminPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.adminLogin();
        });
    }

    login() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const shift = document.getElementById('shift').value;

        if (!username || !password || !shift) {
            this.showToast('Harap isi semua field!', 'error');
            return;
        }

        if (!this.isWithinLoginWindow(shift)) {
            this.showToast('Tidak dapat login di luar waktu shift!', 'error');
            return;
        }

        // Simulasi login berhasil
        this.currentUser = {
            username,
            shift,
            loginTime: new Date(),
            permissions: {
                dailyShort: 4,
                dailyMeal: 3,
                usedShort: 0,
                usedMeal: 0
            },
            currentLeave: null
        };

        // Simpan ke localStorage
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        this.showToast('Login berhasil!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }

    isWithinLoginWindow(shiftType) {
        const shift = this.shifts[shiftType];
        if (!shift) return false;

        const now = new Date();
        const shiftStart = new Date();
        const [hours, minutes] = shift.start.split(':');
        shiftStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const loginEnd = new Date(shiftStart);
        loginEnd.setHours(loginEnd.getHours() + shift.loginWindow);

        return now >= shiftStart && now <= loginEnd;
    }

    showAdminModal() {
        document.getElementById('adminModal').style.display = 'flex';
    }

    hideAdminModal() {
        document.getElementById('adminModal').style.display = 'none';
        document.getElementById('adminPassword').value = '';
    }

    adminLogin() {
        const password = document.getElementById('adminPassword').value.trim();
        
        if (password === this.adminPassword) {
            this.showToast('Login admin berhasil!', 'success');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            this.showToast('Password admin salah!', 'error');
        }
    }

    updateClock() {
        const clockElement = document.getElementById('clock');
        if (!clockElement) return;

        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('id-ID', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const dateString = now.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            clockElement.innerHTML = `
                <div class="time">${timeString}</div>
                <div class="date">${dateString}</div>
            `;
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Remove toast after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3500);
    }
}

// Initialize auth system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});