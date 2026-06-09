# Audit dan Refactor Super Admin sebagai Platform Owner

Tanggal audit: 2026-06-09

## 1. Struktur Menu Lama vs Baru

### Menu lama Super Admin
- Beranda Super Admin.
- Sistem: User, Role, Permission, Audit Log, Readiness, Settings, Backup.
- Master Data: Sekolah, Tahun Ajaran, Kelas, Mapel, Guru, Siswa.
- Ujian: Bank soal, tambah soal, kategori soal, paket ujian, jadwal ujian, monitoring.
- Laporan: hasil ujian, rekap nilai, kartu login siswa.
- Import/Export.

### Menu baru Super Admin
- Dashboard Platform.
- Manajemen Sekolah:
  - Daftar Sekolah.
  - Tambah Sekolah.
- Monitoring Ujian Global.
- Sistem:
  - Manajemen User Global.
  - Role & Permission.
  - Audit Log.
  - Operational Readiness.
  - Pengaturan Sistem.
  - Backup & Recovery.
- Laporan global tetap tersedia sebagai monitoring/reporting, bukan CRUD operasional sekolah.

Menu yang dikeluarkan dari sidebar utama Super Admin:
- Guru.
- Siswa.
- Kelas.
- Mata Pelajaran.
- Assignment Guru.
- Bank soal/tambah soal/kategori soal.
- Paket ujian/jadwal ujian sebagai fitur pengelolaan.
- Import/Export operasional sekolah.

## 2. Route yang Ditambah

- `/dashboard/super-admin/schools`
  Daftar sekolah dengan search, filter status, pagination DataTable, statistik per sekolah, detail, edit, aktifkan/nonaktifkan.
- `/dashboard/super-admin/schools/new`
  Form tambah sekolah.
- `/dashboard/super-admin/schools/[id]`
  Detail profil sekolah, statistik sekolah, daftar admin sekolah, tambah admin sekolah, aktif/nonaktif admin, reset password.

## 3. Route yang Dipindahkan

- `/dashboard/master-data/schools` sekarang redirect ke `/dashboard/super-admin/schools`.
- Route master data operasional tetap untuk Admin Sekolah:
  `/dashboard/master-data/classes`, `/subjects`, `/teachers`, `/students`, `/academic-years`, `/semesters`.
- Route pengelolaan ujian dan bank soal tidak lagi menjadi menu Super Admin utama. Super Admin memakai `/dashboard/super-admin/monitoring` untuk pengawasan global.

## 4. Komponen Baru yang Dibuat

- `src/features/super-admin/components/school-form.tsx`
  Form profil sekolah untuk tambah/edit.
- `src/features/super-admin/school-management.ts`
  Query agregat global Super Admin, daftar sekolah, detail sekolah, dan dashboard platform.

## 5. Query yang Diubah

- `src/features/super-admin/school-management.ts`
  Query baru untuk:
  - agregasi user admin/guru/siswa per `school_id`;
  - agregasi kelas per `school_id`;
  - agregasi ujian aktif/selesai per `school_id`;
  - aktivitas terbaru dari schools, exam_schedules, dan audit_logs.
- `src/lib/actions/master-data-actions.ts`
  `saveSchoolAction` sekarang menerima `education_level`, `city`, `province`, memakai redirect Super Admin baru, revalidate route baru, dan memvalidasi NPSN unik sebelum insert/update.
- `src/features/admin/actions.ts`
  Redirect action user admin diperluas agar dapat kembali ke detail sekolah baru; revalidate detail sekolah saat admin sekolah dibuat, dinonaktifkan, atau reset password.
- `src/lib/auth/access-matrix.ts`
  Super Admin tidak lagi mendapat menu master data operasional, pengelolaan ujian, bank soal, dan import/export.

## 6. Policy/RLS yang Perlu Diperbaiki

Sudah ada fondasi tenant-aware:
- `20260602_multi_school_hardening.sql` mengaktifkan RLS dan policy tenant untuk schools, users, master data, question bank, exam, participant, answer, event, dan tabel penghubung.
- `20260607_rls_role_hardening_draft.sql` memperketat helper `current_app_can_read_school`, `current_app_can_admin_school`, `current_app_can_manage_questions`, `current_app_can_manage_exams`, dan `current_app_can_monitor_exams`.

Perlu follow-up sebelum produksi:
- Pastikan policy `schools` memiliki insert/update/delete eksplisit untuk Super Admin pada versi hardening final, bukan hanya migration lama.
- Review policy untuk `question_versions_delete_super_admin_v2` dan `exam_events_delete_super_admin_v2`; Super Admin boleh audit/admin global, tetapi destructive delete perlu keputusan produk.
- Pastikan semua route export/API yang boleh diakses Admin/Guru/Proctor/Siswa tetap memanggil `requireScopedSchoolId` atau `assertSameSchool`.
- Service role Supabase Auth hanya boleh dipakai di server action terproteksi permission, seperti action user saat ini.

## 7. Risiko Migrasi

- Migrasi menambah kolom `schools.education_level` dan unique index NPSN non-kosong. Jika data lama punya NPSN duplikat, index gagal dibuat.
- Menu Super Admin berubah signifikan; user yang terbiasa mengelola guru/siswa/kelas dari Super Admin harus pindah ke role Admin Sekolah.
- Route lama `/dashboard/master-data/schools` redirect; bookmark lama tetap aman, tetapi permission route harus mengikuti redirect ini.
- Statistik dashboard global bergantung pada `school_id` di users, classes, dan exam_schedules. Data lama tanpa `school_id` tidak dihitung sebagai statistik sekolah.

## 8. Checklist Pengujian Manual

- Login Super Admin, pastikan sidebar hanya menampilkan Dashboard Platform, Manajemen Sekolah, Monitoring Ujian Global, Sistem, Laporan, Profil.
- Buka `/dashboard/super-admin/schools`, uji search nama/NPSN/kota/provinsi.
- Uji filter status active/inactive.
- Tambah sekolah dengan nama valid, email valid, dan NPSN baru.
- Coba tambah/edit sekolah dengan NPSN yang sama, harus ditolak.
- Buka detail sekolah, pastikan profil, status, statistik, dan daftar admin muncul.
- Tambah Admin Sekolah dari detail sekolah, pastikan akun terhubung ke `school_id` sekolah tersebut.
- Aktifkan/nonaktifkan sekolah dan admin sekolah dari detail.
- Reset password admin sekolah dari detail.
- Login Admin Sekolah, pastikan hanya melihat master data sekolahnya sendiri.
- Login Guru/Proctor/Siswa, pastikan data tetap terfilter ke sekolah masing-masing.
- Buka `/dashboard/master-data/schools`, pastikan redirect ke `/dashboard/super-admin/schools`.
