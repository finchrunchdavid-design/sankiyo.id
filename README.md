# Sistem Absensi Karyawan

Aplikasi absensi modern dengan sistem 4 shift dan perhitungan gaji otomatis.

## Fitur Utama

### 🕐 Sistem 4 Shift
- **Shift 1**: 06:00-09:00 + 12:00-15:00 (dengan istirahat)
- **Shift 2**: 09:00-12:00 + 15:00-18:00 (dengan istirahat)  
- **Shift 3**: 18:00-00:00 (tanpa istirahat)
- **Shift 4**: 00:00-06:00 (tanpa istirahat)

### 💰 Perhitungan Gaji Otomatis
- Gaji penuh Rp 80.000 untuk kerja 6+ jam
- Gaji proporsional untuk kerja kurang dari 6 jam
- Tidak ada bonus lembur - tarif tetap
- Pemotongan gaji otomatis jika pulang cepat

### 📱 Antarmuka Modern
- Desain responsif untuk mobile dan desktop
- Jam real-time dan status absensi
- Riwayat absensi dengan breakdown gaji
- Statistik bulanan (hari kerja, total jam, total gaji)

### 🔐 Keamanan
- Autentikasi dengan Supabase Auth
- Row Level Security (RLS)
- Setiap karyawan hanya bisa melihat data sendiri

## Teknologi

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Deployment**: Netlify (frontend) + Supabase (backend)

## Setup Development

1. **Clone dan Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Supabase**
   - Buat project baru di [Supabase](https://supabase.com)
   - Copy URL dan Anon Key dari project dashboard
   - Buat file `.env` dari `.env.example`
   - Isi dengan credentials Supabase Anda

3. **Jalankan Migrasi Database**
   - Jalankan file SQL di folder `supabase/migrations/` secara berurutan
   - Atau gunakan Supabase CLI jika tersedia

4. **Deploy Edge Function**
   - Upload function `calculate-salary` ke Supabase
   - Function ini menghitung gaji otomatis setelah check-out

5. **Jalankan Development Server**
   ```bash
   npm run dev
   ```

## Struktur Database

### Tables
- `shifts` - Definisi 4 shift kerja
- `employees` - Data karyawan (linked ke auth.users)
- `attendance_records` - Record absensi harian

### Edge Functions
- `calculate-salary` - Menghitung jam kerja dan gaji otomatis

## Cara Penggunaan

1. **Registrasi/Login**
   - Karyawan mendaftar dengan email dan password
   - Sistem otomatis membuat profile karyawan

2. **Absensi Harian**
   - Klik tombol sesuai status (Masuk/Istirahat/Masuk Lagi/Pulang)
   - Sistem otomatis detect shift berdasarkan waktu
   - Perhitungan gaji otomatis setelah selesai kerja

3. **Lihat Riwayat**
   - Riwayat absensi per bulan
   - Statistik total hari kerja, jam, dan gaji
   - Detail check-in/check-out setiap hari

## Aturan Bisnis

- Setiap karyawan kerja 6 jam per hari
- Shift 1 & 2 ada istirahat, Shift 3 & 4 tanpa istirahat
- Gaji Rp 80.000 untuk 6+ jam kerja
- Gaji dipotong proporsional jika kurang dari 6 jam
- Tidak ada bonus lembur

## Deployment

1. **Frontend (Netlify)**
   ```bash
   npm run build
   # Upload dist/ folder ke Netlify
   ```

2. **Backend (Supabase)**
   - Database dan Auth sudah hosted
   - Deploy Edge Functions via Supabase dashboard

## Support

Untuk pertanyaan atau masalah, silakan buat issue di repository ini.