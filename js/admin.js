class AdminPanel {
    constructor() {
        this.currentAdmin = JSON.parse(localStorage.getItem('currentUser'));
        this.settings = StorageHelper.get('adminSettings', this.getDefaultSettings());
        this.staffList = this.loadStaffList();
        this.leaveHistory = StorageHelper.get('leaveHistory', []);
        this.staffOnLeave = StorageHelper.get('staffOnLeave', []);
    }

    getDefaultSettings() {
        return {
            shifts: {
                pagi: { 
                    name: 'Pagi', 
                    start: '06:00', 
                    end: '14:00', 
                    loginWindow: 2,
                    color: '#D4AF37'
                },
                siang: { 
                    name: 'Siang', 
                    start: '14:00', 
                    end: '22:00', 
                    loginWindow: 2,
                    color: '#64b5f6'
                },
                malam: { 
                    name: 'Malam', 
                    start: '22:00', 
                    end: '06:00', 
                    loginWindow: 2,
                    color: '#9C27B0'
                }
            },
            permissions: {
                shortLeave: {
                    count: 4,
                    duration: 15,
                    cooldown: 30
                },
                mealLeave: {
                    count: 3,
                    duration: 7,
                    cooldown: 60
                },
                general: {
                    maxConcurrent: 1,
                    resetTime: '00:00',
                    allowEarlyLogin: true
                }
            },
            appearance: {
                logo: 'assets/logo.png',
                background: 'assets/background.jpg',
                primaryColor: '#0a192f',
                accentColor: '#D4AF37',
                secondaryColor: '#64b5f6',
                logoSize: 120,
                bgOpacity: 15
            },
            jobdeskList: [
                { name: 'IT Support', department: 'IT', description: 'Technical support staff' },
                { name: 'Security', department: 'Security', description: 'Security personnel' },
                { name: 'Cleaning Staff', department: 'Cleaning', description: 'Cleaning and maintenance' },
                { name: 'Receptionist', department: 'Reception', description: 'Front desk reception' },
                { name: 'HR Staff', department: 'HR', description: 'Human resources' }
            ]
        };
    }

    loadStaffList() {
        const storedStaff = StorageHelper.get('staffList', []);
        
        // Jika belum ada staff di localStorage, load dari staff.js
        if (storedStaff.length === 0) {
            const staffList = [];
            for (const [username, data] of Object.entries(staffDatabase)) {
                if (username !== 'master') {
                    staffList.push({
                        username: username,
                        name: data.name,
                        password: data.password,
                        department: data.department,
                        jobdesk: data.jobdesk,
                        shift: data.shift || 'pagi',
                        isAdmin: data.isAdmin || false,
                        createdAt: new Date().toISOString(),
                        lastLogin: null
                    });
                }
            }
            StorageHelper.set('staffList', staffList);
            return staffList;
        }
        
        return storedStaff;
    }

    init() {
        // Check admin access
        if (!this.currentAdmin || !this.currentAdmin.isAdmin) {
            window.location.href = 'login.html';
            return;
        }

        this.initializeClock();
        this.initializeTabs();
        this.loadStats();
        this.loadStaffTable();
        this.loadShiftTable();
        this.loadJobdeskTable();
        this.loadPermissions();
        this.loadAppearance();
        this.initializeEventListeners();
    }

    initializeClock() {
        const updateClock = () => {
            const now = new Date();
            const timeElement = document.getElementById('currentTime');
            if (timeElement) {
                timeElement.textContent = now.toLocaleTimeString('id-ID', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            // Update admin clock
            const adminClock = document.getElementById('adminClock');
            if (adminClock) {
                adminClock.innerHTML = now.toLocaleTimeString('id-ID', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }

    initializeTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.add('active');
            document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        }
    }

    loadStats() {
        // Total staff
        document.getElementById('totalStaff').textContent = this.staffList.length;
        
        // Staff on leave
        document.getElementById('activeLeaves').textContent = this.staffOnLeave.length;
        
        // Today's leaves
        const today = new Date().toDateString();
        const todayLeaves = this.leaveHistory.filter(leave => {
            return new Date(leave.startTime).toDateString() === today;
        }).length;
        document.getElementById('todayLeaves').textContent = todayLeaves;
    }

    loadStaffTable() {
        const tbody = document.getElementById('staffListTable');
        if (!tbody) return;

        tbody.innerHTML = this.staffList.map(staff => `
            <tr>
                <td>${staff.username}</td>
                <td>${staff.name}</td>
                <td>${staff.department}</td>
                <td>${staff.jobdesk}</td>
                <td>${this.getShiftName(staff.shift)}</td>
                <td>${staff.isAdmin ? 'Admin' : 'Staff'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-edit" onclick="adminPanel.editStaff('${staff.username}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-small btn-delete" onclick="adminPanel.deleteStaff('${staff.username}')">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getShiftName(shiftKey) {
        const shift = this.settings.shifts[shiftKey];
        return shift ? shift.name : shiftKey;
    }

    loadShiftTable() {
        const tbody = document.getElementById('shiftListTable');
        if (!tbody) return;

        tbody.innerHTML = Object.entries(this.settings.shifts).map(([key, shift]) => {
            const staffCount = this.staffList.filter(s => s.shift === key).length;
            return `
                <tr>
                    <td>${shift.name}</td>
                    <td>${shift.start} - ${shift.end}</td>
                    <td>${shift.loginWindow} jam</td>
                    <td>
                        <span style="display: inline-block; width: 20px; height: 20px; background: ${shift.color}; border-radius: 3px;"></span>
                        ${shift.color}
                    </td>
                    <td>${staffCount} staff</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-small btn-edit" onclick="adminPanel.editShift('${key}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-small btn-delete" onclick="adminPanel.deleteShift('${key}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    loadJobdeskTable() {
        const tbody = document.getElementById('jobdeskListTable');
        if (!tbody) return;

        tbody.innerHTML = this.settings.jobdeskList.map((jobdesk, index) => {
            const staffCount = this.staffList.filter(s => s.jobdesk === jobdesk.name).length;
            return `
                <tr>
                    <td>${jobdesk.name}</td>
                    <td>${jobdesk.department}</td>
                    <td>${jobdesk.description || '-'}</td>
                    <td>${staffCount} staff</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-small btn-edit" onclick="adminPanel.editJobdesk(${index})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-small btn-delete" onclick="adminPanel.deleteJobdesk(${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    loadPermissions() {
        const permissions = this.settings.permissions;
        
        // Short leave
        document.getElementById('shortLeaveCount').value = permissions.shortLeave.count;
        document.getElementById('shortLeaveDuration').value = permissions.shortLeave.duration;
        document.getElementById('shortLeaveCooldown').value = permissions.shortLeave.cooldown;
        
        // Meal leave
        document.getElementById('mealLeaveCount').value = permissions.mealLeave.count;
        document.getElementById('mealLeaveDuration').value = permissions.mealLeave.duration;
        document.getElementById('mealLeaveCooldown').value = permissions.mealLeave.cooldown;
        
        // General
        document.getElementById('maxConcurrentLeave').value = permissions.general.maxConcurrent;
        document.getElementById('quotaResetTime').value = permissions.general.resetTime;
        document.getElementById('allowEarlyLogin').checked = permissions.general.allowEarlyLogin;
    }

    loadAppearance() {
        const appearance = this.settings.appearance;
        
        // Logo preview
        const logoPreview = document.getElementById('logoPreview');
        if (logoPreview) {
            logoPreview.src = appearance.logo;
            logoPreview.style.display = 'block';
        }
        
        // Background preview
        const bgPreview = document.getElementById('bgPreview');
        if (bgPreview) {
            bgPreview.src = appearance.background;
            bgPreview.style.display = 'block';
        }
        
        // Color pickers
        document.getElementById('primaryColor').value = appearance.primaryColor;
        document.getElementById('accentColor').value = appearance.accentColor;
        document.getElementById('secondaryColor').value = appearance.secondaryColor;
        
        // Sliders
        document.getElementById('logoSize').value = appearance.logoSize;
        document.getElementById('logoSizeValue').textContent = `${appearance.logoSize}px`;
        document.getElementById('bgOpacity').value = appearance.bgOpacity;
        document.getElementById('bgOpacityValue').textContent = `${appearance.bgOpacity}%`;
        
        // Preview
        document.getElementById('previewBg').textContent = 'Custom';
        document.getElementById('previewLogo').textContent = appearance.logo.split('/').pop();
        document.getElementById('previewTheme').textContent = 'Custom Theme';
    }

    initializeEventListeners() {
        // Back to login button
        document.getElementById('backToLogin')?.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });

        // Add staff form
        document.getElementById('addStaffForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewStaff();
        });

        // Add shift form
        document.getElementById('addShiftForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewShift();
        });

        // Add jobdesk form
        document.getElementById('addJobdeskForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewJobdesk();
        });

        // Save permissions
        document.getElementById('savePermissions')?.addEventListener('click', () => {
            this.savePermissions();
        });

        // Save appearance
        document.getElementById('saveAppearance')?.addEventListener('click', () => {
            this.saveAppearance();
        });

        // File uploads
        document.getElementById('logoUploadArea')?.addEventListener('click', () => {
            document.getElementById('logoUpload').click();
        });

        document.getElementById('logoUpload')?.addEventListener('change', (e) => {
            this.handleLogoUpload(e);
        });

        document.getElementById('bgUploadArea')?.addEventListener('click', () => {
            document.getElementById('bgUpload').click();
        });

        document.getElementById('bgUpload')?.addEventListener('change', (e) => {
            this.handleBgUpload(e);
        });

        // Slider events
        document.getElementById('logoSize')?.addEventListener('input', (e) => {
            document.getElementById('logoSizeValue').textContent = `${e.target.value}px`;
        });

        document.getElementById('bgOpacity')?.addEventListener('input', (e) => {
            document.getElementById('bgOpacityValue').textContent = `${e.target.value}%`;
        });

        // Color picker
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectColorOption(option);
            });
        });

        // Report generation
        document.getElementById('generateReport')?.addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('reportPeriod')?.addEventListener('change', (e) => {
            const customRange = document.getElementById('customDateRange');
            customRange.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });

        // Export buttons
        document.getElementById('exportPDF')?.addEventListener('click', () => {
            this.exportPDF();
        });

        document.getElementById('exportExcel')?.addEventListener('click', () => {
            this.exportExcel();
        });

        // Close modal
        document.getElementById('closeEditModal')?.addEventListener('click', () => {
            this.hideModal();
        });
    }

    addNewStaff() {
        const name = document.getElementById('staffName').value.trim();
        const username = document.getElementById('staffUsername').value.trim().toLowerCase();
        const password = document.getElementById('staffPassword').value.trim();
        const confirmPassword = document.getElementById('staffConfirmPassword').value.trim();
        const department = document.getElementById('staffDepartment').value;
        const jobdesk = document.getElementById('staffJobdesk').value.trim();
        const shift = document.getElementById('staffShift').value;
        const isAdmin = document.getElementById('staffIsAdmin').value === 'true';

        // Validation
        if (!name || !username || !password || !department || !jobdesk) {
            this.showToast('Harap isi semua field yang diperlukan!', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showToast('Password tidak cocok!', 'error');
            return;
        }

        if (this.staffList.some(staff => staff.username === username)) {
            this.showToast('Username sudah digunakan!', 'error');
            return;
        }

        // Add to staff list
        const newStaff = {
            username: username,
            name: name,
            password: password,
            department: department,
            jobdesk: jobdesk,
            shift: shift,
            isAdmin: isAdmin,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        this.staffList.push(newStaff);
        StorageHelper.set('staffList', this.staffList);

        // Add to staff database for login
        staffDatabase[username] = {
            name: name,
            password: password,
            isAdmin: isAdmin,
            department: department,
            jobdesk: jobdesk,
            shift: shift
        };

        // Reset form
        document.getElementById('addStaffForm').reset();

        // Update table
        this.loadStaffTable();
        this.loadStats();

        this.showToast(`Staff ${name} berhasil ditambahkan!`, 'success');
    }

    editStaff(username) {
        const staff = this.staffList.find(s => s.username === username);
        if (!staff) return;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <form id="editStaffForm">
                <div class="form-group">
                    <label>Nama Lengkap</label>
                    <input type="text" id="editStaffName" value="${staff.name}" required>
                </div>
                <div class="form-group">
                    <label>Departemen</label>
                    <select id="editStaffDepartment" required>
                        <option value="IT" ${staff.department === 'IT' ? 'selected' : ''}>IT</option>
                        <option value="HR" ${staff.department === 'HR' ? 'selected' : ''}>HR</option>
                        <option value="Security" ${staff.department === 'Security' ? 'selected' : ''}>Security</option>
                        <option value="Cleaning" ${staff.department === 'Cleaning' ? 'selected' : ''}>Cleaning</option>
                        <option value="Reception" ${staff.department === 'Reception' ? 'selected' : ''}>Reception</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Jobdesk</label>
                    <input type="text" id="editStaffJobdesk" value="${staff.jobdesk}" required>
                </div>
                <div class="form-group">
                    <label>Shift</label>
                    <select id="editStaffShift" required>
                        <option value="pagi" ${staff.shift === 'pagi' ? 'selected' : ''}>Shift Pagi</option>
                        <option value="siang" ${staff.shift === 'siang' ? 'selected' : ''}>Shift Siang</option>
                        <option value="malam" ${staff.shift === 'malam' ? 'selected' : ''}>Shift Malam</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Password Baru (kosongkan jika tidak diubah)</label>
                    <input type="password" id="editStaffPassword" placeholder="Password baru">
                </div>
                <button type="submit" class="btn-login">
                    <i class="fas fa-save"></i> Simpan Perubahan
                </button>
            </form>
        `;

        // Show modal
        document.getElementById('editModal').style.display = 'flex';

        // Handle form submission
        document.getElementById('editStaffForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateStaff(username);
        });
    }

    updateStaff(username) {
        const staffIndex = this.staffList.findIndex(s => s.username === username);
        if (staffIndex === -1) return;

        const name = document.getElementById('editStaffName').value.trim();
        const department = document.getElementById('editStaffDepartment').value;
        const jobdesk = document.getElementById('editStaffJobdesk').value.trim();
        const shift = document.getElementById('editStaffShift').value;
        const newPassword = document.getElementById('editStaffPassword').value.trim();

        // Update staff data
        this.staffList[staffIndex].name = name;
        this.staffList[staffIndex].department = department;
        this.staffList[staffIndex].jobdesk = jobdesk;
        this.staffList[staffIndex].shift = shift;

        // Update password if provided
        if (newPassword) {
            this.staffList[staffIndex].password = newPassword;
            staffDatabase[username].password = newPassword;
        }

        // Update staff database
        staffDatabase[username].name = name;
        staffDatabase[username].department = department;
        staffDatabase[username].jobdesk = jobdesk;
        staffDatabase[username].shift = shift;

        // Save changes
        StorageHelper.set('staffList', this.staffList);

        // Hide modal
        this.hideModal();

        // Update table
        this.loadStaffTable();

        this.showToast(`Data staff ${name} berhasil diperbarui!`, 'success');
    }

    deleteStaff(username) {
        if (!confirm(`Apakah Anda yakin ingin menghapus staff ${username}?`)) {
            return;
        }

        const staffIndex = this.staffList.findIndex(s => s.username === username);
        if (staffIndex === -1) return;

        const staffName = this.staffList[staffIndex].name;

        // Remove from staff list
        this.staffList.splice(staffIndex, 1);
        StorageHelper.set('staffList', this.staffList);

        // Remove from staff database
        delete staffDatabase[username];

        // Update table and stats
        this.loadStaffTable();
        this.loadStats();

        this.showToast(`Staff ${staffName} berhasil dihapus!`, 'success');
    }

    addNewShift() {
        const name = document.getElementById('shiftName').value.trim();
        const start = document.getElementById('shiftStart').value;
        const end = document.getElementById('shiftEnd').value;
        const loginWindow = parseInt(document.getElementById('shiftLoginWindow').value);
        const color = document.getElementById('shiftColor').value;

        if (!name || !start || !end) {
            this.showToast('Harap isi semua field!', 'error');
            return;
        }

        const shiftKey = name.toLowerCase();
        this.settings.shifts[shiftKey] = {
            name: name,
            start: start,
            end: end,
            loginWindow: loginWindow,
            color: color
        };

        StorageHelper.set('adminSettings', this.settings);

        // Reset form
        document.getElementById('addShiftForm').reset();

        // Update table
        this.loadShiftTable();

        this.showToast(`Shift ${name} berhasil ditambahkan!`, 'success');
    }

    editShift(shiftKey) {
        const shift = this.settings.shifts[shiftKey];
        if (!shift) return;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <form id="editShiftForm">
                <div class="form-group">
                    <label>Nama Shift</label>
                    <input type="text" id="editShiftName" value="${shift.name}" required>
                </div>
                <div class="form-group">
                    <label>Waktu Mulai</label>
                    <input type="time" id="editShiftStart" value="${shift.start}" required>
                </div>
                <div class="form-group">
                    <label>Waktu Selesai</label>
                    <input type="time" id="editShiftEnd" value="${shift.end}" required>
                </div>
                <div class="form-group">
                    <label>Durasi Login (jam)</label>
                    <input type="number" id="editShiftLoginWindow" value="${shift.loginWindow}" min="1" max="4" required>
                </div>
                <button type="submit" class="btn-login">
                    <i class="fas fa-save"></i> Simpan Perubahan
                </button>
            </form>
        `;

        document.getElementById('editModal').style.display = 'flex';

        document.getElementById('editShiftForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateShift(shiftKey);
        });
    }

    updateShift(shiftKey) {
        const name = document.getElementById('editShiftName').value.trim();
        const start = document.getElementById('editShiftStart').value;
        const end = document.getElementById('editShiftEnd').value;
        const loginWindow = parseInt(document.getElementById('editShiftLoginWindow').value);

        this.settings.shifts[shiftKey].name = name;
        this.settings.shifts[shiftKey].start = start;
        this.settings.shifts[shiftKey].end = end;
        this.settings.shifts[shiftKey].loginWindow = loginWindow;

        StorageHelper.set('adminSettings', this.settings);
        this.hideModal();
        this.loadShiftTable();
        this.showToast(`Shift ${name} berhasil diperbarui!`, 'success');
    }

    deleteShift(shiftKey) {
        if (!confirm('Apakah Anda yakin ingin menghapus shift ini?')) {
            return;
        }

        const shiftName = this.settings.shifts[shiftKey].name;
        delete this.settings.shifts[shiftKey];

        StorageHelper.set('adminSettings', this.settings);
        this.loadShiftTable();
        this.showToast(`Shift ${shiftName} berhasil dihapus!`, 'success');
    }

    addNewJobdesk() {
        const name = document.getElementById('jobdeskName').value.trim();
        const department = document.getElementById('jobdeskDepartment').value;
        const description = document.getElementById('jobdeskDescription').value.trim();

        if (!name || !department) {
            this.showToast('Harap isi nama dan departemen!', 'error');
            return;
        }

        const newJobdesk = {
            name: name,
            department: department,
            description: description
        };

        this.settings.jobdeskList.push(newJobdesk);
        StorageHelper.set('adminSettings', this.settings);

        // Reset form
        document.getElementById('addJobdeskForm').reset();

        // Update table
        this.loadJobdeskTable();

        this.showToast(`Jobdesk ${name} berhasil ditambahkan!`, 'success');
    }

    editJobdesk(index) {
        const jobdesk = this.settings.jobdeskList[index];
        if (!jobdesk) return;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <form id="editJobdeskForm">
                <div class="form-group">
                    <label>Nama Jobdesk</label>
                    <input type="text" id="editJobdeskName" value="${jobdesk.name}" required>
                </div>
                <div class="form-group">
                    <label>Departemen</label>
                    <select id="editJobdeskDepartment" required>
                        <option value="IT" ${jobdesk.department === 'IT' ? 'selected' : ''}>IT</option>
                        <option value="HR" ${jobdesk.department === 'HR' ? 'selected' : ''}>HR</option>
                        <option value="Security" ${jobdesk.department === 'Security' ? 'selected' : ''}>Security</option>
                        <option value="Cleaning" ${jobdesk.department === 'Cleaning' ? 'selected' : ''}>Cleaning</option>
                        <option value="Reception" ${jobdesk.department === 'Reception' ? 'selected' : ''}>Reception</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Deskripsi</label>
                    <textarea id="editJobdeskDescription" rows="3">${jobdesk.description || ''}</textarea>
                </div>
                <button type="submit" class="btn-login">
                    <i class="fas fa-save"></i> Simpan Perubahan
                </button>
            </form>
        `;

        document.getElementById('editModal').style.display = 'flex';

        document.getElementById('editJobdeskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateJobdesk(index);
        });
    }

    updateJobdesk(index) {
        const name = document.getElementById('editJobdeskName').value.trim();
        const department = document.getElementById('editJobdeskDepartment').value;
        const description = document.getElementById('editJobdeskDescription').value.trim();

        this.settings.jobdeskList[index].name = name;
        this.settings.jobdeskList[index].department = department;
        this.settings.jobdeskList[index].description = description;

        StorageHelper.set('adminSettings', this.settings);
        this.hideModal();
        this.loadJobdeskTable();
        this.showToast(`Jobdesk ${name} berhasil diperbarui!`, 'success');
    }

    deleteJobdesk(index) {
        if (!confirm('Apakah Anda yakin ingin menghapus jobdesk ini?')) {
            return;
        }

        const jobdeskName = this.settings.jobdeskList[index].name;
        this.settings.jobdeskList.splice(index, 1);

        StorageHelper.set('adminSettings', this.settings);
        this.loadJobdeskTable();
        this.showToast(`Jobdesk ${jobdeskName} berhasil dihapus!`, 'success');
    }

    savePermissions() {
        this.settings.permissions = {
            shortLeave: {
                count: parseInt(document.getElementById('shortLeaveCount').value),
                duration: parseInt(document.getElementById('shortLeaveDuration').value),
                cooldown: parseInt(document.getElementById('shortLeaveCooldown').value)
            },
            mealLeave: {
                count: parseInt(document.getElementById('mealLeaveCount').value),
                duration: parseInt(document.getElementById('mealLeaveDuration').value),
                cooldown: parseInt(document.getElementById('mealLeaveCooldown').value)
            },
            general: {
                maxConcurrent: parseInt(document.getElementById('maxConcurrentLeave').value),
                resetTime: document.getElementById('quotaResetTime').value,
                allowEarlyLogin: document.getElementById('allowEarlyLogin').checked
            }
        };

        StorageHelper.set('adminSettings', this.settings);
        this.showToast('Pengaturan izin berhasil disimpan!', 'success');
    }

    saveAppearance() {
        this.settings.appearance = {
            logo: document.getElementById('logoPreview').src || 'assets/logo.png',
            background: document.getElementById('bgPreview').src || 'assets/background.jpg',
            primaryColor: document.getElementById('primaryColor').value,
            accentColor: document.getElementById('accentColor').value,
            secondaryColor: document.getElementById('secondaryColor').value,
            logoSize: parseInt(document.getElementById('logoSize').value),
            bgOpacity: parseInt(document.getElementById('bgOpacity').value)
        };

        StorageHelper.set('adminSettings', this.settings);
        
        // Update preview
        this.updateAppearancePreview();
        
        this.showToast('Pengaturan tampilan berhasil disimpan!', 'success');
    }

    updateAppearancePreview() {
        const appearance = this.settings.appearance;
        
        // Update CSS variables
        document.documentElement.style.setProperty('--primary-dark', appearance.primaryColor);
        document.documentElement.style.setProperty('--accent-gold', appearance.accentColor);
        document.documentElement.style.setProperty('--accent-blue', appearance.secondaryColor);
        
        // Update logo size
        const logo = document.querySelector('.logo-login, .landing-logo, #company-logo');
        if (logo) {
            logo.style.width = `${appearance.logoSize}px`;
            logo.style.height = `${appearance.logoSize}px`;
        }
        
        // Update background opacity
        const bgElements = document.querySelectorAll('.login-background::before, .landing-container::before');
        bgElements.forEach(bg => {
            bg.style.opacity = `${appearance.bgOpacity / 100}`;
        });
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            this.showToast('Hanya file gambar yang diperbolehkan!', 'error');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            this.showToast('Ukuran file maksimal 2MB!', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('logoPreview');
            img.src = e.target.result;
            img.style.display = 'block';
            
            // Update preview text
            document.getElementById('previewLogo').textContent = file.name;
        };
        reader.readAsDataURL(file);
    }

    handleBgUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            this.showToast('Hanya file gambar yang diperbolehkan!', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showToast('Ukuran file maksimal 5MB!', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('bgPreview');
            img.src = e.target.result;
            img.style.display = 'block';
            
            // Update preview text
            document.getElementById('previewBg').textContent = file.name;
        };
        reader.readAsDataURL(file);
    }

    selectColorOption(option) {
        // Remove selected class from all options
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Set the color
        const color = option.dataset.color;
        document.getElementById('primaryColor').value = color;
        
        // Update preview
        document.getElementById('previewTheme').textContent = 'Custom Color';
    }

    generateReport() {
        const period = document.getElementById('reportPeriod').value;
        const department = document.getElementById('reportDepartment').value;
        
        // Filter leave history based on criteria
        let filteredLeaves = [...this.leaveHistory];
        
        // Filter by department
        if (department !== 'all') {
            filteredLeaves = filteredLeaves.filter(leave => {
                const staff = this.staffList.find(s => s.username === leave.username);
                return staff && staff.department === department;
            });
        }
        
        // Calculate statistics
        const totalLeaves = filteredLeaves.length;
        const totalDuration = filteredLeaves.reduce((sum, leave) => sum + (leave.duration || 0), 0);
        const avgDuration = totalLeaves > 0 ? (totalDuration / totalLeaves).toFixed(1) : 0;
        
        const uniqueUsers = new Set(filteredLeaves.map(leave => leave.username)).size;
        
        // Calculate utilization (percentage of available leave slots used)
        const totalStaff = department === 'all' ? this.staffList.length : 
            this.staffList.filter(s => s.department === department).length;
        const maxLeavesPerDay = (this.settings.permissions.shortLeave.count + this.settings.permissions.mealLeave.count) * totalStaff;
        const utilization = maxLeavesPerDay > 0 ? 
            Math.min(100, Math.round((filteredLeaves.length / (maxLeavesPerDay * 30)) * 100)) : 0;
        
        // Update statistics display
        document.getElementById('reportTotal').textContent = totalLeaves;
        document.getElementById('reportAverage').textContent = avgDuration;
        document.getElementById('reportUsers').textContent = uniqueUsers;
        document.getElementById('reportUtilization').textContent = `${utilization}%`;
        
        // Update detail table
        const tbody = document.getElementById('reportDetailTable');
        if (tbody) {
            tbody.innerHTML = filteredLeaves.slice(0, 20).map(leave => {
                const staff = this.staffList.find(s => s.username === leave.username);
                return `
                    <tr>
                        <td>${staff ? staff.name : leave.username}</td>
                        <td>${staff ? staff.department : '-'}</td>
                        <td>${leave.type || 'Izin'}</td>
                        <td>${new Date(leave.startTime).toLocaleDateString('id-ID')}</td>
                        <td>${leave.duration} menit</td>
                        <td>${leave.status || 'Selesai'}</td>
                    </tr>
                `;
            }).join('');
            
            if (filteredLeaves.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: #64b5f6;">
                            Tidak ada data izin untuk filter yang dipilih
                        </td>
                    </tr>
                `;
            }
        }
        
        this.showToast('Laporan berhasil digenerate!', 'success');
    }

    exportPDF() {
        this.showToast('Fitur export PDF dalam pengembangan!', 'info');
    }

    exportExcel() {
        this.showToast('Fitur export Excel dalam pengembangan!', 'info');
    }

    hideModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3500);
    }
}

// Make adminPanel available globally
window.adminPanel = new AdminPanel();
