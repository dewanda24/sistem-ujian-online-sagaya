# Audit Refactor Sidebar Sagaya - 2026-06-14

## Ruang Lingkup

Refactor ini hanya mengubah struktur dan label navigasi dashboard. Route, permission, middleware, API, database, dan RLS tidak diubah.

## Sumber Konfigurasi

Menu aktif dashboard berasal dari satu konfigurasi terpusat:

- `src/lib/auth/access-matrix.ts`
- Diekspor ulang oleh `src/constants/dashboard-menu.ts`
- Dipakai oleh `src/components/dashboard/dashboard-shell.tsx`
- Dirender oleh `src/components/dashboard/dashboard-sidebar.tsx`

Komponen `src/components/layouts/dashboard-sidebar.tsx` adalah sidebar lama yang tidak dipakai oleh layout dashboard aktif.

## Menu Lama

### Super Admin

- Dashboard Pusat
- Manajemen Sekolah
- Admin Sekolah
- Pengguna Global
- Akses Sistem
- Pemantauan Sekolah
- Pusat Pemulihan
- Catatan Aktivitas
- Laporan Global
- Import & Unduh Data
- Cadangan & Pemulihan
- Pengaturan Sistem
- Bantuan Sekolah
- Profil

### Admin Sekolah

- Beranda
- Akademik
  - Tahun Ajaran
  - Semester
  - Mata Pelajaran
  - Kelas
- Pengguna
  - Guru
  - Siswa
- Data Sekolah
  - Penugasan Guru
- Ujian
  - Jadwal Ujian
  - Penugasan Pengawas
  - Pemantauan Ujian
  - Pusat Pemulihan
- Nilai & Laporan
  - Rekap Nilai
  - Rekap Ujian
- Data Sekolah
  - Import Data
  - Unduh Data
  - Cetak Akun Login
- Profil

### Guru

- Beranda
- Bank Soal
  - Semua Soal
  - Tambah Soal
- Paket Ujian
- Jadwal Ujian
- Nilai
  - Koreksi Essay
  - Hasil Ujian
  - Rekap Nilai
- Pemantauan Ujian
- Pusat Pemulihan
- Profil

### Pengawas Ujian

- Dashboard Pengawas
- Pemantauan Ujian
- Pusat Pemulihan
- Profil

## Menu Baru

### Super Admin

- Dashboard
- Akademik
  - Sekolah
  - Tahun Ajaran & Semester
- Pengguna
  - Admin Sekolah
  - Pengguna
  - Pengawas Ujian
- Ujian
  - Monitoring Ujian
  - Pusat Pemulihan
  - Cadangan & Pemulihan
- Laporan
  - Hasil Ujian
  - Analitik
  - Ekspor Laporan
- Sistem
  - Hak Akses
  - Catatan Aktivitas
  - Kesiapan Sistem
  - Pengaturan
  - Bantuan Sekolah
- Profil

### Admin Sekolah

- Dashboard
- Akademik
  - Tahun Ajaran & Semester
  - Kelas
  - Mata Pelajaran
  - Penugasan Guru
- Bank Soal
  - Bank Soal
  - Kategori Soal
  - Impor & Ekspor
- Ujian
  - Paket Ujian
  - Jadwal Ujian
  - Monitoring Ujian
  - Pusat Pemulihan
- Laporan
  - Hasil Ujian
  - Analitik
  - Ekspor Laporan
- Pengguna
  - Guru
  - Siswa
  - Pengawas Ujian
- Profil

### Guru

- Dashboard
- Bank Soal
  - Bank Soal
  - Kategori Soal
  - Impor & Ekspor
- Ujian
  - Paket Ujian
  - Jadwal Ujian
  - Monitoring Ujian
  - Pusat Pemulihan
- Laporan
  - Koreksi Esai
  - Hasil Ujian
  - Analitik
  - Ekspor Laporan
- Profil

Catatan: menu Monitoring Ujian dan Pusat Pemulihan untuk guru tetap mengikuti guard lama `has_active_proctor_assignment`.

### Pengawas Ujian

- Dashboard
- Ujian
  - Monitoring Ujian
  - Pusat Pemulihan
- Profil

Catatan: Laporan tidak ditampilkan untuk Pengawas Ujian karena role ini belum memiliki permission `reports.view` pada konfigurasi yang ada.

### Siswa

Tidak ikut struktur sidebar baru. Menu siswa tetap sederhana:

- Dashboard
- Ujian Berlangsung
- Riwayat Ujian
- Profil

## Mapping Menu Lama ke Baru

| Lama | Baru | Route tetap |
| --- | --- | --- |
| Beranda / Dashboard Pusat / Dashboard Pengawas | Dashboard | Ya |
| Tahun Ajaran + Semester | Tahun Ajaran & Semester | Ya |
| Pemantauan Ujian | Monitoring Ujian | Ya |
| Penugasan Pengawas | Pengawas Ujian | Ya |
| Recovery Center | Pusat Pemulihan | Ya |
| Nilai & Laporan | Laporan | Ya |
| Rekap Nilai / Rekap Ujian | Analitik | Ya |
| Import & Unduh Data | Impor & Ekspor / Ekspor Laporan | Ya |
| Koreksi Essay | Koreksi Esai | Ya |
| Proctor / Pengawas Khusus | Pengawas Ujian | Ya |

## Route Terdampak Tampilan Navigasi

- `/dashboard/admin`
- `/dashboard/super-admin`
- `/dashboard/teacher`
- `/dashboard/proctor`
- `/dashboard/master-data`
- `/dashboard/master-data/academic-years`
- `/dashboard/master-data/semesters`
- `/dashboard/master-data/classes`
- `/dashboard/master-data/subjects`
- `/dashboard/master-data/teacher-assignments`
- `/dashboard/master-data/teachers`
- `/dashboard/master-data/students`
- `/dashboard/master-data/proctors`
- `/dashboard/question-bank`
- `/dashboard/question-bank/questions`
- `/dashboard/question-bank/categories`
- `/dashboard/question-bank/import-excel`
- `/dashboard/question-bank/import-word`
- `/dashboard/exams`
- `/dashboard/exams/packages`
- `/dashboard/exams/schedules`
- `/dashboard/exams/proctors`
- `/dashboard/admin/monitoring`
- `/dashboard/teacher/monitoring`
- `/dashboard/proctor/monitoring`
- `/dashboard/recovery-center`
- `/dashboard/reports`
- `/dashboard/reports/students`
- `/dashboard/reports/classes`
- `/dashboard/reports/exams`
- `/dashboard/reports/subjects`
- `/dashboard/super-admin/monitoring`
- `/dashboard/super-admin/reports`
- `/dashboard/super-admin/import-export`
- `/dashboard/super-admin/backup-recovery`
- `/dashboard/super-admin/settings`
- `/dashboard/super-admin/readiness`
- `/dashboard/super-admin/audit-logs`
- `/dashboard/super-admin/support`

## Komponen yang Diubah

- `src/lib/auth/access-matrix.ts`
  - Struktur menu role dibuat lebih sederhana dan konsisten.
  - Ditambahkan `activePaths` untuk menu gabungan seperti Tahun Ajaran & Semester.
- `src/components/dashboard/dashboard-sidebar.tsx`
  - Active state mendukung alias route dari `activePaths`.
- `src/components/dashboard/mobile-dashboard-nav.tsx`
  - Active state disamakan dengan sidebar utama.
- `src/components/dashboard/dashboard-breadcrumb.tsx`
  - Label breadcrumb diselaraskan ke Bahasa Indonesia.
- `src/constants/ui-labels.ts`
  - Label navigasi dan role diseragamkan.

## Risiko Perubahan

- Parent menu `Pengguna` untuk Admin Sekolah dibuat sebagai wadah tanpa permission khusus. Anak menu tetap dikontrol permission masing-masing (`teachers.view`, `students.view`, `exam_schedules.manage`) agar Guru dan Siswa tidak hilang saat akun tidak memiliki `users.view`.
- Super Admin tidak diarahkan ke route operasional sekolah yang route guard-nya memang bukan untuk Super Admin. Menu Super Admin tetap memakai route yang sudah diizinkan.
- Label gabungan seperti Tahun Ajaran & Semester mengarah ke halaman Tahun Ajaran karena halaman tersebut sudah menampilkan ringkasan semester. Route `/dashboard/master-data/semesters` tetap ada dan tetap aktif melalui alias.
- `Impor & Ekspor` Bank Soal mengarah ke impor Excel sebagai pintu masuk lama. Impor Word tetap route valid dan ikut active state.
- Pengawas Ujian belum melihat Laporan karena permission lama tidak memberi `reports.view`.

## Rekomendasi Bertahap

1. Validasi manual per role setelah login: Super Admin, Admin Sekolah, Guru, Pengawas Ujian.
2. Jika sekolah ingin Pengawas Ujian melihat laporan, lakukan perubahan permission terpisah di luar refactor sidebar.
3. Pertimbangkan redirect ringan dari `/dashboard/master-data/semesters` ke tab/section semester pada halaman Tahun Ajaran bila UX ingin benar-benar satu pintu.
4. Hapus atau migrasikan `src/components/layouts/dashboard-sidebar.tsx` pada cleanup berikutnya karena tidak dipakai layout dashboard aktif.
5. Tambahkan test snapshot menu per role agar perubahan label tidak memecah navigasi di masa depan.
