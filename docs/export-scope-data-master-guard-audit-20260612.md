# Export Scope Audit + Data Master Guard

Tanggal audit: 2026-06-12

## Endpoint export/download yang diaudit

| Endpoint / Fitur | File | Permission | Scope | Risiko | Rekomendasi / Patch |
| --- | --- | --- | --- | --- | --- |
| `GET /api/data-export/teachers` | `src/app/api/data-export/[type]/route.ts` | `teachers.view` | Super Admin global, Admin Sekolah by `school_id` | Rendah | Sudah login, permission, dan tenant guard. |
| `GET /api/data-export/students` | `src/app/api/data-export/[type]/route.ts` | `students.view` | Super Admin global, Admin Sekolah by `school_id` | Rendah | Sudah login, permission, dan tenant guard. |
| `GET /api/data-export/classes` | `src/app/api/data-export/[type]/route.ts` | `classes.view` | Super Admin global, Admin Sekolah by `school_id` | Rendah | Sudah login, permission, dan tenant guard. |
| `GET /api/data-export/teacher-assignments` | `src/app/api/data-export/[type]/route.ts` | `teachers.view` | Super Admin global, Admin Sekolah by joined school scope | Rendah | Sudah login, permission, dan tenant guard pada guru, mapel, kelas, tahun ajaran. |
| `GET /api/reports/export` | `src/app/api/reports/export/route.ts` | `reports.export` | Super Admin global, Admin/Principal by school schedules, Teacher by assigned/owned subject schedules | Rendah | Query helper sudah membatasi schedule IDs by role/school. |
| `GET /api/monitoring/export` | `src/app/api/monitoring/export/route.ts` | `exam_monitoring.view` | Super Admin global, Admin by school, Teacher by created/proctored/assigned subject schedule | Sedang | Dipatch agar detail peserta memanggil `getScheduleMonitoring` dengan scope teacher/user yang sama seperti daftar jadwal. |
| `GET /api/question-bank/export` | `src/app/api/question-bank/export/route.ts` | `question_bank.export` | Super Admin global, Admin by school subjects, Teacher by assigned subjects | Sedang | Dipatch dari `question_bank.view` ke permission khusus `question_bank.export`. |
| `GET /api/super-admin/export/schools` | `src/app/api/super-admin/export/[type]/route.ts` | role `super_admin` | Global only | Rendah | Sudah role guard super admin. |
| `GET /api/super-admin/export/users` | `src/app/api/super-admin/export/[type]/route.ts` | role `super_admin` | Global only | Rendah | Sudah role guard super admin. |
| `GET /api/super-admin/export/reports` | `src/app/api/super-admin/export/[type]/route.ts` | role `super_admin` | Global only | Rendah | Sudah role guard super admin. |
| `GET /api/templates/[type]` | `src/app/api/templates/[type]/route.ts` | `import_export.view` | Template statis, tidak memuat data tenant | Rendah | Sudah login dan permission. |
| `GET /api/templates/questions-excel` | `src/app/api/templates/questions-excel/route.ts` | `question_bank.manage` | Template statis | Rendah | Dipatch login + permission. |
| `GET /api/templates/questions-word` | `src/app/api/templates/questions-word/route.ts` | `question_bank.manage` | Template statis | Rendah | Dipatch login + permission. |
| Print kartu ujian | `src/app/(dashboard)/dashboard/exams/cards/page.tsx` | page guard via dashboard route + exam query scope | Super Admin global, Admin by school, Teacher by assigned subjects | Rendah | Query `getExamAdmissionCards` memakai `getExamSchedules` scoped. |
| Print/download kartu login siswa | `src/app/(dashboard)/dashboard/master-data/students/login-cards/page.tsx` | page guard + `students.view` flow | Admin by school | Rendah | Query `getStudentLoginCards` scoped dari master data helper. |
| Print monitoring | `src/features/monitoring/components/print-button.tsx` | page data from monitoring scope | Role sesuai halaman monitoring | Rendah | Client print hanya mencetak data yang sudah difilter server. |

## Temuan dan patch

- Tidak ditemukan `SELECT *` raw SQL pada endpoint export. Query memakai Supabase query builder.
- Patch `question_bank.export` ditambahkan agar export soal tidak cukup hanya dengan view permission.
- Patch monitoring export meneruskan `{ scope, user }` ke detail peserta supaya teacher tetap divalidasi sampai level schedule detail.
- Patch template Word/Excel bank soal mewajibkan `question_bank.manage`.
- Migration menambahkan permission `question_bank.export` dan grant ke `super_admin`, `admin`, `teacher`.

## Migration, constraint, dan trigger

Migration baru:

- `database/supabase/migrations/20260612_export_scope_data_master_guard.sql`

Constraint/index baru:

- `uq_users_username_ci` untuk `users.username`
- `uq_users_email_ci` untuk `users.email`
- `uq_user_profiles_nis` untuk NIS siswa pada `user_profiles.nis`
- `uq_user_profiles_nisn` untuk NISN siswa pada `user_profiles.nisn`
- `uq_user_profiles_nip` untuk NIP guru pada `user_profiles.nip`
- `uq_subjects_school_code_ci` untuk `subjects.code` per sekolah
- `uq_academic_years_one_active_per_school` untuk satu tahun ajaran aktif per sekolah

Trigger baru:

- `trg_single_active_semester_per_school`
- Function: `public.assert_single_active_semester_per_school()`

## Validation service dan dashboard

Service baru:

- `src/features/master-data/readiness.ts`

Validasi yang dihitung:

- siswa tanpa kelas
- guru tanpa mapel
- mapel tanpa guru
- kelas tanpa siswa
- jadwal tanpa peserta
- jadwal tanpa pengawas
- paket tanpa soal
- soal pilihan tanpa opsi jawaban
- user tanpa role
- user operasional tanpa school

Dashboard Admin Sekolah:

- `src/features/dashboard/queries.ts` mengambil `dataIssues`
- `src/features/dashboard/components/role-dashboard-view.tsx` menampilkan ringkasan "Masalah Data" dengan badge `Critical`, `Warning`, `Info` dan link ke halaman terkait

## Checklist verifikasi

Export:

- Admin Sekolah A tidak bisa export data Sekolah B.
- Teacher tidak bisa export soal, laporan, atau monitoring di luar subject/schedule yang berhak diakses.
- Student tidak memiliki route/menu export administratif dan permission export.
- Super Admin tetap bisa export global melalui `/api/super-admin/export/*`.

Data Master:

- Tidak bisa membuat `users.username` duplikat.
- Tidak bisa membuat `users.email` duplikat.
- Tidak bisa membuat NIS duplikat di `user_profiles.nis`.
- Tidak bisa membuat NISN duplikat di `user_profiles.nisn`.
- Tidak bisa membuat NIP duplikat di `user_profiles.nip`.
- Tidak bisa mengaktifkan dua tahun ajaran sekaligus dalam sekolah yang sama.
- Tidak bisa mengaktifkan dua semester sekaligus dalam sekolah yang sama.

Validation:

- Siswa tanpa kelas muncul di dashboard admin sekolah.
- Guru tanpa mapel muncul di dashboard admin sekolah.
- Mapel tanpa guru muncul di dashboard admin sekolah.
- Kelas tanpa siswa muncul di dashboard admin sekolah.
- Paket tanpa soal muncul di dashboard admin sekolah.
- Jadwal tanpa peserta muncul di dashboard admin sekolah.
- Jadwal tanpa pengawas muncul di dashboard admin sekolah.
- Soal pilihan tanpa opsi jawaban muncul di dashboard admin sekolah.

## Eksekusi 2026-06-13

Deteksi duplikat database:

- `users.username`: 0 duplikat
- `users.email`: 0 duplikat
- `user_profiles.nis`: ditemukan 1 duplikat, NIS `2345`
- `user_profiles.nisn`: 0 duplikat
- `user_profiles.nip`: 0 duplikat
- `subjects.code` per sekolah: 0 duplikat

Pembersihan data:

- Record lama dipertahankan: `0efd8ad3-3c6b-4d0a-98bc-e482f3fe30a4`, NIS `2345`
- Record baru diubah: `acf06bdc-e295-4021-8bca-6329347789ce`, NIS dari `2345` menjadi `2345-acf0`
- Deteksi ulang setelah pembersihan: semua kategori duplikat 0

Status apply migration:

- Bagian DML permission `question_bank.export` sudah diterapkan ke database untuk role `super_admin`, `admin`, dan `teacher`.
- Supabase CLI diperbarui dari `2.101.0` ke `2.106.0`; binary `supabase.exe` tidak lagi menggantung.
- Project lokal berhasil di-link ke `rmngbxuyzjwbsvqflwxg`.
- Migration SQL dieksekusi via `supabase db query --workdir database --linked --file supabase\migrations\20260612_export_scope_data_master_guard.sql`.
- Index constraint dan trigger berhasil diverifikasi di database.
- Test constraint berbasis `DO` block berhasil: duplikasi username/email/NIS/NISN/NIP/kode mapel, dua tahun ajaran aktif, dan dua semester aktif diblokir.
- Catatan: `supabase db push` standar belum dipakai karena remote belum punya `supabase_migrations.schema_migrations` dan file migration lama memakai timestamp 8 digit yang tidak ideal untuk CLI migration history.

Test dashboard "Masalah Data":

- Query data readiness menunjukkan masing-masing sekolah aktif memiliki 1 masalah `jadwal belum memiliki pengawas`.
- Build Next.js sukses dan route `/dashboard/admin` tetap diproteksi auth dengan redirect `307` ke `/login` saat belum login.

Point 3 - Exam Readiness Checker:

- Service baru: `src/features/exams/readiness.ts`
- Halaman Paket Ujian dan Jadwal Ujian menampilkan ringkasan kesiapan paket, jadwal, dan jumlah masalah ujian.
- Checker mencakup paket kosong/nonaktif/tidak sinkron/soal belum siap/mapel mismatch/bobot tidak valid, jadwal tanpa paket/waktu/kelas/peserta/pengawas, paket jadwal belum published/aktif, dan bentrok jadwal kelas.

## Risiko tersisa

- Migration unique index akan gagal jika database produksi sudah memiliki duplikasi existing. Bersihkan duplikasi sebelum apply migration.
- NIS, NISN, dan NIP disimpan di `user_profiles`, bukan tabel `students`/`teachers` terpisah; constraint diterapkan di struktur aktual aplikasi.
- Template download tidak membawa data tenant, tetapi sekarang tetap diguard agar pola download konsisten.
- Constraint/trigger DDL sprint ini sudah dijalankan dan diverifikasi via Supabase CLI `db query`.
- Jika ingin memakai `supabase db push` ke depan, migration history perlu dirapikan terlebih dahulu agar CLI tidak mencoba push ulang seluruh migration lama.
