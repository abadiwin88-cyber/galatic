# Sistem Izin Staff

Aplikasi web untuk mengelola izin keluar staff dengan sistem kuota dan monitoring real-time.

## Fitur Utama

### 1. Sistem Login
- Login dengan username dan password
- Validasi waktu login (2 jam dari shift)
- Akses admin dengan password khusus

### 2. Dashboard Staff
- Informasi kuota izin (4x izin 15 menit, 3x izin makan 7 menit)
- Pengajuan izin dengan validasi jobdesk
- Monitoring staff yang sedang izin
- Riwayat izin pribadi

### 3. Panel Admin
- Manajemen staff (tambah, edit, hapus)
- Pengaturan shift kerja
- Pengaturan jobdesk
- Konfigurasi sistem izin
- Statistik penggunaan

## Akun Test

### Admin:
- Username: `master`
- Password: `aa1234`

### Staff:
1. **test.staff** / password123
2. **budi.santoso** / password123
3. **sari.dewi** / password123
4. **ahmad.rijal** / password123
5. **lina.wati** / password123

## Aturan Sistem

1. **Waktu Login**: Hanya bisa login 15 menit sebelum sampai 2 jam setelah shift dimulai
2. **Kuota Izin**: 
   - 4x izin 15 menit per hari
   - 3x izin makan 7 menit per hari
3. **Jobdesk**: Hanya 1 staff per jobdesk yang bisa izin bersamaan
4. **Reset Kuota**: Otomatis reset setiap hari pukul 00:00

## Instalasi

1. Clone repository atau download semua file
2. Letakkan di folder web server (XAMPP, Netlify, dll)
3. Buka `index.html` di browser
4. Gunakan akun test untuk login

## Teknologi
- HTML5, CSS3, JavaScript (ES6+)
- Local Storage untuk penyimpanan data
- Font Awesome untuk ikon
- Pure CSS (tidak ada framework eksternal)

## Deployment

### Netlify:
1. Buat akun Netlify
2. Upload semua file ke repository GitHub
3. Connect ke Netlify
4. Deploy otomatis

## Catatan
- Aplikasi berjalan di browser client-side
- Data disimpan di localStorage browser
- Tidak memerlukan backend server
- Responsive untuk desktop dan mobile
