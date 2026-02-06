// Staff Database dengan akun test
const staffDatabase = {
    // Admin account
    'master': {
        name: 'Administrator',
        password: 'aa1234',
        isAdmin: true,
        department: 'Management',
        jobdesk: 'System Administrator'
    },
    
    // Test staff accounts
    'test.staff': {
        name: 'Staff Test',
        password: 'password123',
        isAdmin: false,
        department: 'IT',
        jobdesk: 'IT Support',
        shift: 'pagi'
    },
    
    'budi.santoso': {
        name: 'Budi Santoso',
        password: 'password123',
        isAdmin: false,
        department: 'Security',
        jobdesk: 'Security Guard',
        shift: 'pagi'
    },
    
    'sari.dewi': {
        name: 'Sari Dewi',
        password: 'password123',
        isAdmin: false,
        department: 'Cleaning',
        jobdesk: 'Cleaning Staff',
        shift: 'siang'
    },
    
    'ahmad.rijal': {
        name: 'Ahmad Rijal',
        password: 'password123',
        isAdmin: false,
        department: 'Reception',
        jobdesk: 'Receptionist',
        shift: 'siang'
    },
    
    'lina.wati': {
        name: 'Lina Wati',
        password: 'password123',
        isAdmin: false,
        department: 'Kitchen',
        jobdesk: 'Kitchen Staff',
        shift: 'malam'
    }
};

// Function to validate login
function validateStaffLogin(username, password) {
    const staff = staffDatabase[username];
    
    if (!staff) {
        return {
            success: false,
            message: 'Username tidak ditemukan'
        };
    }
    
    if (staff.password !== password) {
        return {
            success: false,
            message: 'Password salah'
        };
    }
    
    return {
        success: true,
        data: {
            name: staff.name,
            isAdmin: staff.isAdmin || false,
            department: staff.department,
            jobdesk: staff.jobdesk,
            shift: staff.shift
        }
    };
}

// Function to get all staff
function getAllStaff() {
    return Object.entries(staffDatabase).map(([username, data]) => ({
        username,
        ...data
    }));
}

// Function to add new staff
function addStaff(username, staffData) {
    staffDatabase[username] = staffData;
    return true;
}

// Function to update staff
function updateStaff(username, updates) {
    if (staffDatabase[username]) {
        staffDatabase[username] = { ...staffDatabase[username], ...updates };
        return true;
    }
    return false;
}

// Function to delete staff
function deleteStaff(username) {
    if (staffDatabase[username] && username !== 'master') {
        delete staffDatabase[username];
        return true;
    }
    return false;
}

// Make functions available globally
window.staffDatabase = staffDatabase;
window.validateStaffLogin = validateStaffLogin;
window.getAllStaff = getAllStaff;
window.addStaff = addStaff;
window.updateStaff = updateStaff;
window.deleteStaff = deleteStaff;