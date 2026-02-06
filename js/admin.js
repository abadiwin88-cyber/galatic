class AdminPanel {
    constructor() {
        this.initializeAdminPanel();
    }

    initializeAdminPanel() {
        // Check if user is admin
        if (!localStorage.getItem('isAdmin')) {
            window.location.href = 'index.html';
            return;
        }

        this.loadSettings();
        this.initializeEventListeners();
        this.initializeTabs();
    }

    loadSettings() {
        // Load settings from localStorage or use defaults
        this.settings = StorageHelper.get('adminSettings', {
            shifts: {
                pagi: { start: '06:00', loginWindow: 2 },
                siang: { start: '14:00', loginWindow: 2 },
                malam: { start: '22:00', loginWindow: 2 }
            },
            permissions: {
                dailyShort: 4,
                dailyMeal: 3,
                shortDuration: 15,
                mealDuration: 7
            },
            appearance: {
                logo: 'assets/logo.png',
                background: 'assets/background.jpg',
                primaryColor: '#0a192f',
                accentColor: '#D4AF37'
            },
            jobdeskList: ['Security', 'Cleaning', 'Reception', 'IT Support']
        });
    }

    initializeEventListeners() {
        document.getElementById('backToLogin')?.addEventListener('click', () => {
            localStorage.removeItem('isAdmin');
            window.location.href = 'index.html';
        });
    }

    initializeTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });

        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab content
        document.getElementById(tabId).style.display = 'block';
        
        // Add active class to clicked button
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Load tab content
        this.loadTabContent(tabId);
    }

    loadTabContent(tabId) {
        switch(tabId) {
            case 'shifts':
                this.loadShiftsTab();
                break;
            case 'jobdesk':
                this.loadJobdeskTab();
                break;
            case 'settings':
                this.loadSettingsTab();
                break;
            case 'appearance':
                this.loadAppearanceTab();
                break;
            case 'reports':
                this.loadReportsTab();
                break;
        }
    }

    loadShiftsTab() {
        const container = document.getElementById('shifts');
        container.innerHTML = `
            <div class="admin-section">
                <h2><i class="fas fa-clock"></i> Kelola Shift</h2>
                <div class="shift-controls">
                    ${Object.entries(this.settings.shifts).map(([key, shift]) => `
                        <div class="form-group">
                            <label>Shift ${key.charAt(0).toUpperCase() + key.slice(1)}</label>
                            <input type="time" id="shift_${key}_time" value="${shift.start}">
                            <input type="number" id="shift_${key}_window" value="${shift.loginWindow}" min="1" max="4">
                            <button class="btn-admin update-shift" data-shift="${key}">
                                <i class="fas fa-save"></i> Update
                            </button>
                            <button class="btn-login delete-shift" data-shift="${key}">
                                <i class="fas fa-trash"></i> Hapus
                            </button>
                        </div>
                    `).join('')}
                </div>
                <div class="form-group">
                    <h3>Tambah Shift Baru</h3>
                    <input type="text" id="newShiftName" placeholder="Nama Shift">
                    <input type="time" id="newShiftTime" placeholder="Waktu Mulai">
                    <input type="number" id="newShiftWindow" placeholder="Durasi Login (jam)" min="1" max="4">
                    <button id="addNewShift" class="btn-login">
                        <i class="fas fa-plus"></i> Tambah Shift
                    </button>
                </div>
            </div>
        `;
    }

    // Other tab loading methods would go here...

    saveSettings() {
        StorageHelper.set('adminSettings', this.settings);
        this.showToast('Pengaturan berhasil disimpan!', 'success');
    }

    showToast(message, type) {
        // Toast implementation
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});