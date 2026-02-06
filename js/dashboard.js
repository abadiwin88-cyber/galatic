class Dashboard {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.staffOnLeave = JSON.parse(localStorage.getItem('staffOnLeave')) || [];
        this.leaveHistory = JSON.parse(localStorage.getItem('leaveHistory')) || [];
        this.jobdeskList = JSON.parse(localStorage.getItem('jobdeskList')) || ['Security', 'Cleaning', 'Reception', 'IT Support'];
        this.initializeDashboard();
    }

    initializeDashboard() {
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        this.updateUserInfo();
        this.updateQuotaDisplay();
        this.updateStaffOnLeave();
        this.updateLeaveHistory();
        this.initializeEventListeners();
        this.startClock();
    }

    updateUserInfo() {
        document.getElementById('userName').textContent = this.currentUser.username;
        document.getElementById('userShift').textContent = this.getShiftName(this.currentUser.shift);
        document.getElementById('loginTime').textContent = new Date(this.currentUser.loginTime).toLocaleTimeString('id-ID');
    }

    getShiftName(shiftKey) {
        const shiftNames = {
            'pagi': 'Shift Pagi (06:00 - 14:00)',
            'siang': 'Shift Siang (14:00 - 22:00)',
            'malam': 'Shift Malam (22:00 - 06:00)'
        };
        return shiftNames[shiftKey] || shiftKey;
    }

    updateQuotaDisplay() {
        const user = this.currentUser;
        
        // Update short leave quota
        document.getElementById('shortLeaveTotal').textContent = user.permissions.dailyShort;
        document.getElementById('shortLeaveUsed').textContent = user.permissions.usedShort;
        document.getElementById('shortLeaveRemaining').textContent = 
            user.permissions.dailyShort - user.permissions.usedShort;
        
        // Update meal leave quota
        document.getElementById('mealLeaveTotal').textContent = user.permissions.dailyMeal;
        document.getElementById('mealLeaveUsed').textContent = user.permissions.usedMeal;
        document.getElementById('mealLeaveRemaining').textContent = 
            user.permissions.dailyMeal - user.permissions.usedMeal;

        // Update progress bars
        this.updateProgressBar('shortProgress', user.permissions.usedShort / user.permissions.dailyShort);
        this.updateProgressBar('mealProgress', user.permissions.usedMeal / user.permissions.dailyMeal);
    }

    updateProgressBar(elementId, percentage) {
        const progressBar = document.getElementById(elementId);
        if (progressBar) {
            const progress = Math.min(percentage * 100, 100);
            progressBar.style.width = `${progress}%`;
            progressBar.style.backgroundColor = progress > 80 ? '#f44336' : progress > 60 ? '#FF9800' : '#4CAF50';
        }
    }

    updateStaffOnLeave() {
        const container = document.getElementById('currentLeaveList');
        if (!container) return;

        if (this.staffOnLeave.length === 0) {
            container.innerHTML = '<p class="no-data">Tidak ada staff yang sedang izin</p>';
            return;
        }

        container.innerHTML = this.staffOnLeave.map(staff => `
            <div class="leave-card">
                <div class="leave-header">
                    <h4>${staff.name}</h4>
                    <span class="status-badge status-active">Sedang Izin</span>
                </div>
                <div class="leave-details">
                    <p><i class="fas fa-briefcase"></i> ${staff.jobdesk}</p>
                    <p><i class="fas fa-clock"></i> ${staff.type}</p>
                    <p><i class="fas fa-hourglass-half"></i> ${staff.duration} menit</p>
                    <p class="leave-timer" data-start="${staff.startTime}">
                        Waktu tersisa: <span class="time-remaining"></span>
                    </p>
                </div>
            </div>
        `).join('');

        // Start timers for each leave
        this.startLeaveTimers();
    }

    startLeaveTimers() {
        document.querySelectorAll('.leave-timer').forEach(timer => {
            const startTime = new Date(timer.dataset.start).getTime();
            const duration = parseInt(timer.closest('.leave-details').querySelector('p:nth-child(3)').textContent.split(' ')[1]) * 60000;
            const endTime = startTime + duration;

            const updateTimer = () => {
                const now = new Date().getTime();
                const remaining = endTime - now;

                if (remaining <= 0) {
                    timer.querySelector('.time-remaining').textContent = 'Selesai';
                    // Auto-remove from list when time's up
                    setTimeout(() => this.removeCompletedLeaves(), 1000);
                } else {
                    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                    timer.querySelector('.time-remaining').textContent = 
                        `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            };

            updateTimer();
            setInterval(updateTimer, 1000);
        });
    }

    removeCompletedLeaves() {
        const now = new Date().getTime();
        this.staffOnLeave = this.staffOnLeave.filter(staff => {
            const startTime = new Date(staff.startTime).getTime();
            const duration = staff.duration * 60000;
            return startTime + duration > now;
        });
        
        localStorage.setItem('staffOnLeave', JSON.stringify(this.staffOnLeave));
        this.updateStaffOnLeave();
    }

    updateLeaveHistory() {
        const container = document.getElementById('leaveHistory');
        if (!container) return;

        const userHistory = this.leaveHistory
            .filter(record => record.username === this.currentUser.username)
            .slice(-10) // Show last 10 records
            .reverse();

        if (userHistory.length === 0) {
            container.innerHTML = '<p class="no-data">Belum ada riwayat izin</p>';
            return;
        }

        container.innerHTML = userHistory.map(record => `
            <tr>
                <td>${new Date(record.timestamp).toLocaleString('id-ID')}</td>
                <td>${record.type}</td>
                <td>${record.jobdesk}</td>
                <td>${record.duration} menit</td>
                <td><span class="status-badge ${record.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${record.status === 'active' ? 'Aktif' : 'Selesai'}
                </span></td>
            </tr>
        `).join('');
    }

    requestLeave(type) {
        if (this.currentUser.currentLeave) {
            this.showToast('Anda masih memiliki izin aktif!', 'error');
            return;
        }

        // Check quota
        if (type === 'short' && this.currentUser.permissions.usedShort >= this.currentUser.permissions.dailyShort) {
            this.showToast('Kuota izin 15 menit sudah habis!', 'error');
            return;
        }

        if (type === 'meal' && this.currentUser.permissions.usedMeal >= this.currentUser.permissions.dailyMeal) {
            this.showToast('Kuota izin makan sudah habis!', 'error');
            return;
        }

        // Show jobdesk selection
        this.showJobdeskModal(type);
    }

    showJobdeskModal(type) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2><i class="fas fa-briefcase"></i> Pilih Jobdesk</h2>
                <div class="form-group">
                    <label for="jobdeskSelect">Jobdesk</label>
                    <select id="jobdeskSelect">
                        <option value="">Pilih Jobdesk</option>
                        ${this.jobdeskList.map(job => `<option value="${job}">${job}</option>`).join('')}
                    </select>
                </div>
                <button id="submitLeaveBtn" class="btn-login">
                    <i class="fas fa-paper-plane"></i> Ajukan Izin
                </button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        const closeBtn = modal.querySelector('.close-modal');
        const submitBtn = modal.querySelector('#submitLeaveBtn');
        const jobdeskSelect = modal.querySelector('#jobdeskSelect');

        closeBtn.onclick = () => modal.remove();
        
        submitBtn.onclick = () => {
            const jobdesk = jobdeskSelect.value;
            if (!jobdesk) {
                this.showToast('Pilih jobdesk terlebih dahulu!', 'error');
                return;
            }

            // Check if jobdesk is already on leave
            if (this.staffOnLeave.some(staff => staff.jobdesk === jobdesk)) {
                this.showToast('Jobdesk ini sedang izin!', 'error');
                return;
            }

            this.processLeaveRequest(type, jobdesk);
            modal.remove();
        };
    }

    processLeaveRequest(type, jobdesk) {
        const duration = type === 'short' ? 15 : 7;
        const leaveRecord = {
            username: this.currentUser.username,
            name: this.currentUser.username,
            jobdesk,
            type: type === 'short' ? 'Izin 15 Menit' : 'Izin Makan',
            duration,
            startTime: new Date().toISOString(),
            status: 'active'
        };

        // Update user quota
        if (type === 'short') {
            this.currentUser.permissions.usedShort++;
        } else {
            this.currentUser.permissions.usedMeal++;
        }

        // Set current leave
        this.currentUser.currentLeave = leaveRecord;

        // Add to staff on leave list
        this.staffOnLeave.push(leaveRecord);

        // Add to history
        this.leaveHistory.push(leaveRecord);

        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('staffOnLeave', JSON.stringify(this.staffOnLeave));
        localStorage.setItem('leaveHistory', JSON.stringify(this.leaveHistory));

        // Update displays
        this.updateQuotaDisplay();
        this.updateStaffOnLeave();
        this.updateLeaveHistory();

        this.showToast('Izin berhasil diajukan!', 'success');
    }

    endCurrentLeave() {
        if (!this.currentUser.currentLeave) {
            this.showToast('Tidak ada izin aktif!', 'error');
            return;
        }

        // Remove from staff on leave
        this.staffOnLeave = this.staffOnLeave.filter(
            staff => staff.username !== this.currentUser.username
        );

        // Update history
        const leaveIndex = this.leaveHistory.findIndex(
            record => record.username === this.currentUser.username && record.status === 'active'
        );
        
        if (leaveIndex !== -1) {
            this.leaveHistory[leaveIndex].status = 'completed';
        }

        // Clear current leave
        this.currentUser.currentLeave = null;

        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('staffOnLeave', JSON.stringify(this.staffOnLeave));
        localStorage.setItem('leaveHistory', JSON.stringify(this.leaveHistory));

        // Update displays
        this.updateStaffOnLeave();
        this.updateLeaveHistory();

        this.showToast('Izin telah diakhiri!', 'success');
    }

    startClock() {
        const clockElement = document.getElementById('dashboardClock');
        if (!clockElement) return;

        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('id-ID', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            clockElement.innerHTML = `
                <div class="time-display">
                    <i class="fas fa-clock"></i>
                    <span class="time">${timeString}</span>
                </div>
            `;
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    initializeEventListeners() {
        // Leave request buttons
        document.getElementById('requestShortLeave')?.addEventListener('click', () => this.requestLeave('short'));
        document.getElementById('requestMealLeave')?.addEventListener('click', () => this.requestLeave('meal'));
        document.getElementById('endCurrentLeave')?.addEventListener('click', () => this.endCurrentLeave());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
    }

    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    showToast(message, type = 'info') {
        // Toast implementation (same as in auth.js)
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 3500);
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});