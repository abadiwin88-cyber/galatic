class Dashboard {
    constructor() {
        this.currentUser = null;
        this.staffOnLeave = [];
        this.leaveHistory = [];
        this.currentLeaveType = null;
    }
    
    init() {
        this.checkLogin();
        this.loadData();
        this.updateDisplay();
        this.setupEventListeners();
        this.startClock();
        this.checkAndResetQuotas();
    }
    
    checkLogin() {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            window.location.href = 'login.html';
            return;
        }
        
        this.currentUser = JSON.parse(userData);
        
        // Check if session expired (8 hours)
        const loginTime = new Date(this.currentUser.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 8) {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    }
    
    loadData() {
        // Load staff on leave from localStorage
        this.staffOnLeave = JSON.parse(localStorage.getItem('staffOnLeave')) || [];
        
        // Load leave history from localStorage
        this.leaveHistory = JSON.parse(localStorage.getItem('leaveHistory')) || [];
        
        // Filter current user's history
        this.userHistory = this.leaveHistory.filter(
            record => record.username === this.currentUser.username
        );
    }
    
    updateDisplay() {
        // Update user info
        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userDetails').innerHTML = `
            Shift: ${this.getShiftName(this.currentUser.shift)} | 
            Departemen: ${this.currentUser.department || '-'} | 
            Jobdesk: ${this.currentUser.jobdesk || '-'}
        `;
        
        const loginTime = new Date(this.currentUser.loginTime);
        document.getElementById('loginTime').textContent = 
            `Login: ${loginTime.toLocaleTimeString('id-ID')}`;
        
        // Update quota display
        this.updateQuotaDisplay();
        
        // Update staff on leave
        this.updateStaffOnLeave();
        
        // Update leave history
        this.updateLeaveHistory();
        
        // Check if user has active leave
        this.checkActiveLeave();
    }
    
    getShiftName(shift) {
        const shiftNames = {
            'pagi': 'Pagi (06:00-14:00)',
            'siang': 'Siang (14:00-22:00)',
            'malam': 'Malam (22:00-06:00)'
        };
        return shiftNames[shift] || shift;
    }
    
    updateQuotaDisplay() {
        const perms = this.currentUser.permissions;
        
        // Short leave
        document.getElementById('shortTotal').textContent = perms.dailyShort;
        document.getElementById('shortUsed').textContent = perms.usedShort;
        document.getElementById('shortRemaining').textContent = perms.dailyShort - perms.usedShort;
        
        // Meal leave
        document.getElementById('mealTotal').textContent = perms.dailyMeal;
        document.getElementById('mealUsed').textContent = perms.usedMeal;
        document.getElementById('mealRemaining').textContent = perms.dailyMeal - perms.usedMeal;
    }
    
    updateStaffOnLeave() {
        const container = document.getElementById('staffOnLeaveList');
        
        if (this.staffOnLeave.length === 0) {
            container.innerHTML = '<p style="color: #64b5f6; text-align: center;">Tidak ada staff yang sedang izin</p>';
            return;
        }
        
        const html = this.staffOnLeave.map(staff => `
            <div class="leave-card">
                <h4>${staff.name}</h4>
                <p style="color: #e0e0e0; font-size: 0.9em; margin: 5px 0;">
                    <i class="fas fa-briefcase"></i> ${staff.jobdesk}
                </p>
                <p style="color: #e0e0e0; font-size: 0.9em; margin: 5px 0;">
                    <i class="fas fa-clock"></i> ${staff.type} (${staff.duration} menit)
                </p>
                <p style="color: #D4AF37; font-size: 0.8em;">
                    Mulai: ${new Date(staff.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    updateLeaveHistory() {
        const tbody = document.getElementById('leaveHistoryTable');
        
        if (this.userHistory.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #64b5f6;">Belum ada riwayat izin</td>
                </tr>
            `;
            return;
        }
        
        // Show last 5 records
        const recentHistory = this.userHistory.slice(-5).reverse();
        
        const html = recentHistory.map(record => `
            <tr>
                <td>${new Date(record.startTime).toLocaleDateString('id-ID')}</td>
                <td>${record.type}</td>
                <td>${record.jobdesk}</td>
                <td>${record.duration} menit</td>
                <td>
                    <span class="status-badge ${record.status === 'active' ? 'status-active' : 'status-completed'}">
                        ${record.status === 'active' ? 'Aktif' : 'Selesai'}
                    </span>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
    }
    
    checkActiveLeave() {
        const activeLeave = this.userHistory.find(
            record => record.status === 'active' && record.username === this.currentUser.username
        );
        
        const endBtn = document.getElementById('endLeaveBtn');
        if (activeLeave) {
            endBtn.style.display = 'inline-flex';
        } else {
            endBtn.style.display = 'none';
        }
    }
    
    checkAndResetQuotas() {
        const today = new Date().toDateString();
        
        if (this.currentUser.lastReset !== today) {
            this.currentUser.permissions.usedShort = 0;
            this.currentUser.permissions.usedMeal = 0;
            this.currentUser.lastReset = today;
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.updateQuotaDisplay();
            
            this.showMessage('Kuota izin telah direset untuk hari ini!', 'info');
        }
    }
    
    setupEventListeners() {
        // Leave request buttons
        document.getElementById('requestShortBtn').addEventListener('click', () => {
            this.requestLeave('short');
        });
        
        document.getElementById('requestMealBtn').addEventListener('click', () => {
            this.requestLeave('meal');
        });
        
        // End leave button
        document.getElementById('endLeaveBtn').addEventListener('click', () => {
            this.endCurrentLeave();
        });
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
        
        // Leave modal buttons
        document.getElementById('submitLeaveBtn').addEventListener('click', () => {
            this.submitLeaveRequest();
        });
        
        document.getElementById('cancelLeaveBtn').addEventListener('click', () => {
            document.getElementById('leaveModal').style.display = 'none';
        });
        
        // Close modal when clicking outside
        document.getElementById('leaveModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('leaveModal')) {
                document.getElementById('leaveModal').style.display = 'none';
            }
        });
    }
    
    requestLeave(type) {
        // Check if user already has active leave
        const activeLeave = this.userHistory.find(
            record => record.status === 'active' && record.username === this.currentUser.username
        );
        
        if (activeLeave) {
            this.showMessage('Anda masih memiliki izin aktif!', 'error');
            return;
        }
        
        // Check quota
        const perms = this.currentUser.permissions;
        if (type === 'short' && perms.usedShort >= perms.dailyShort) {
            this.showMessage('Kuota izin 15 menit sudah habis!', 'error');
            return;
        }
        
        if (type === 'meal' && perms.usedMeal >= perms.dailyMeal) {
            this.showMessage('Kuota izin makan sudah habis!', 'error');
            return;
        }
        
        // Check if jobdesk is already on leave
        const jobdeskOnLeave = this.staffOnLeave.find(
            staff => staff.jobdesk === this.currentUser.jobdesk
        );
        
        if (jobdeskOnLeave) {
            this.showMessage('Jobdesk ini sedang izin!', 'error');
            return;
        }
        
        // Store leave type and show modal
        this.currentLeaveType = type;
        const modalTitle = type === 'short' ? 'Ajukan Izin 15 Menit' : 'Ajukan Izin Makan';
        document.getElementById('modalTitle').textContent = modalTitle;
        document.getElementById('jobdeskInput').value = this.currentUser.jobdesk || '';
        document.getElementById('leaveModal').style.display = 'flex';
    }
    
    submitLeaveRequest() {
        const jobdesk = document.getElementById('jobdeskInput').value.trim();
        
        if (!jobdesk) {
            this.showMessage('Masukkan jobdesk!', 'error');
            return;
        }
        
        const duration = this.currentLeaveType === 'short' ? 15 : 7;
        const type = this.currentLeaveType === 'short' ? 'Izin 15 Menit' : 'Izin Makan';
        
        // Update user quota
        if (this.currentLeaveType === 'short') {
            this.currentUser.permissions.usedShort++;
        } else {
            this.currentUser.permissions.usedMeal++;
        }
        
        // Create leave record
        const leaveRecord = {
            username: this.currentUser.username,
            name: this.currentUser.name,
            jobdesk: jobdesk,
            type: type,
            duration: duration,
            startTime: new Date().toISOString(),
            status: 'active'
        };
        
        // Add to staff on leave
        this.staffOnLeave.push(leaveRecord);
        
        // Add to history
        this.leaveHistory.push(leaveRecord);
        this.userHistory.push(leaveRecord);
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('staffOnLeave', JSON.stringify(this.staffOnLeave));
        localStorage.setItem('leaveHistory', JSON.stringify(this.leaveHistory));
        
        // Hide modal
        document.getElementById('leaveModal').style.display = 'none';
        
        // Update displays
        this.updateQuotaDisplay();
        this.updateStaffOnLeave();
        this.updateLeaveHistory();
        this.checkActiveLeave();
        
        this.showMessage('Izin berhasil diajukan!', 'success');
    }
    
    endCurrentLeave() {
        const activeIndex = this.staffOnLeave.findIndex(
            staff => staff.username === this.currentUser.username && staff.status === 'active'
        );
        
        if (activeIndex === -1) {
            this.showMessage('Tidak ada izin aktif!', 'error');
            return;
        }
        
        // Update status in staff on leave
        this.staffOnLeave[activeIndex].status = 'completed';
        
        // Update status in leave history
        const historyIndex = this.leaveHistory.findIndex(
            record => record.username === this.currentUser.username && record.status === 'active'
        );
        
        if (historyIndex !== -1) {
            this.leaveHistory[historyIndex].status = 'completed';
        }
        
        // Remove from staff on leave list
        this.staffOnLeave = this.staffOnLeave.filter(staff => staff.status === 'active');
        
        // Save to localStorage
        localStorage.setItem('staffOnLeave', JSON.stringify(this.staffOnLeave));
        localStorage.setItem('leaveHistory', JSON.stringify(this.leaveHistory));
        
        // Update displays
        this.updateStaffOnLeave();
        this.updateLeaveHistory();
        this.checkActiveLeave();
        
        this.showMessage('Izin telah diakhiri!', 'success');
    }
    
    startClock() {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('id-ID', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            document.getElementById('dashboardClock').textContent = timeString;
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }
    
    showMessage(message, type) {
        // Remove existing messages
        const existing = document.querySelectorAll('.toast');
        existing.forEach(msg => msg.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }
}

// Make Dashboard globally available
window.Dashboard = Dashboard;
