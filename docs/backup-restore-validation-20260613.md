# Backup & Restore Validation - 2026-06-13

## 1. Audit Backup System

Fitur backup aplikasi berada di:

- Halaman: `src/app/(dashboard)/dashboard/super-admin/backup-recovery/page.tsx`
- Query histori: `src/features/super-admin/advanced.ts`
- Action backup/restore: `src/features/super-admin/advanced-actions.ts`
- Tabel metadata/snapshot: `public.super_admin_backup_jobs`
- Migration: `database/supabase/migrations/20260610_super_admin_advanced_backend.sql`
- RLS hardening: `database/supabase/migrations/20260612_production_rls_hardening.sql`

Backup yang ada saat ini adalah snapshot aplikasi terbatas, bukan full database dump.

Dicadangkan ke snapshot:

- `system_settings`: `key`, `value`, `description`
- `schools`: seluruh metadata sekolah; global semua sekolah, school scope satu sekolah
- `users`: hanya ringkasan `id`, `email`, `username`, `status`, `role_id`, `school_id`
- `exam_schedules`: hanya ringkasan `id`, `title`, `status`, `school_id`

Dicatat sebagai row count:

- `system_settings`
- `schools`
- `users`
- `exam_schedules`
- `exam_attempts`

Dipulihkan oleh restore terbatas:

- `system_settings`
- metadata `schools` untuk backup scope sekolah

Tidak dipulihkan oleh restore terbatas:

- users, profiles, roles, permissions
- subjects, classes, teacher assignments
- question bank, packages, schedules, participants
- attempts, answers, results, audit logs
- media storage `question-media`

Lokasi penyimpanan: database table `super_admin_backup_jobs.snapshot` sebagai JSONB. Format: JSONB snapshot. Ukuran backup mengikuti ukuran JSONB row snapshot; saat ini tidak ada pembatas eksplisit di aplikasi.

Permission: hanya `super_admin` via `requireRole("super_admin")` dan RLS `super_admin_backup_jobs_*_super_admin_hardened`.

## 2. Backup Coverage Matrix

| Area | Ter-backup | Tidak |
| --- | --- | --- |
| Schools | Ya, metadata penuh | Restore hanya scope sekolah |
| Users | Ringkasan saja | Tidak dipulihkan |
| Profiles | Tidak | Ya |
| Roles | Tidak | Ya |
| Permissions | Tidak | Ya |
| Subjects | Tidak | Ya |
| Classes | Tidak | Ya |
| Question Bank | Tidak | Ya |
| Exam Packages | Tidak | Ya |
| Schedules | Ringkasan saja | Tidak dipulihkan |
| Participants | Tidak | Ya |
| Attempts | Count saja | Ya |
| Answers | Tidak | Ya |
| Results | Tidak | Ya |
| Audit Logs | Tidak | Ya |
| Media | Tidak | Ya |

Gap utama: fitur aplikasi belum menjadi mekanisme disaster recovery penuh. Untuk pemulihan insiden produksi, gunakan backup database dan storage Supabase.

## 3. Restore Validation Report

Status validasi kode:

- Backup dapat dibuat melalui `createBackupAction`.
- Snapshot disimpan ke `super_admin_backup_jobs.snapshot`.
- Restore membaca backup dengan status `completed`.
- Restore mengubah status job menjadi `restored` atau `failed`.
- Restore mencatat audit log `backup.restore_limited`.

Skenario 1, Backup -> Restore -> Verifikasi:

- Aman diuji di staging.
- Jangan dijalankan langsung di produksi tanpa maintenance window.
- Verifikasi minimal: `system_settings` kembali sesuai snapshot, metadata sekolah scope sekolah kembali sesuai snapshot, job berubah menjadi `restored`.

Skenario 2, Backup -> Tambah data baru -> Restore backup lama -> Verifikasi:

- Untuk fitur saat ini, data baru pada `users`, `subjects`, `classes`, soal, jadwal, peserta, jawaban tidak akan rollback.
- Perubahan pada `system_settings` akan rollback.
- Perubahan metadata sekolah pada backup scope sekolah akan rollback.

## 4. Recovery Test Matrix

| Area | Expected dari fitur aplikasi | Status |
| --- | --- | --- |
| User kembali | Tidak didukung | Perlu backup database |
| Role kembali | Tidak didukung | Perlu backup database |
| Profile kembali | Tidak didukung | Perlu backup database |
| Kelas kembali | Tidak didukung | Perlu backup database |
| Mapel kembali | Tidak didukung | Perlu backup database |
| Assignment kembali | Tidak didukung | Perlu backup database |
| Paket kembali | Tidak didukung | Perlu backup database |
| Jadwal kembali | Tidak didukung restore; hanya ringkasan backup | Perlu backup database |
| Peserta kembali | Tidak didukung | Perlu backup database |
| Event tetap valid | Tidak dimutasi restore terbatas | Verifikasi read-only |

## 5. RLS Safety Check

Restore terbatas tidak menjalankan DDL sehingga tidak menghapus policy, trigger, function, atau helper database.

Checklist setelah restore database penuh:

- Pastikan RLS masih aktif pada tabel tenant.
- Pastikan policy `super_admin_backup_jobs_*_super_admin_hardened` ada.
- Pastikan policy `question_media_school_*_hardened` ada pada `storage.objects`.
- Pastikan trigger/constraint master data tetap ada.
- Uji isolasi sekolah, export scope, dan proctor scope setelah restore.

## 6. Media Validation

Bucket: `question-media`.

Upload media menyimpan object path:

```text
{school_id}/{user_id}/{yyyy-mm-dd}/{uuid}.{ext}
```

Signed URL dibuat selama 7 hari saat upload. Snapshot backup aplikasi tidak menyimpan object storage dan tidak membuat ulang signed URL. Jika media hilang, restore aplikasi tidak dapat memulihkannya.

Checklist media:

- File masih ada di bucket `question-media`.
- Path diawali `school_id` yang benar.
- Policy storage school scope tetap aktif.
- Signed URL lama bisa kedaluwarsa; buat ulang URL dari object path jika diperlukan.

## 7. Disaster Recovery Runbook

### Kehilangan Data

1. Identifikasi modul, sekolah, dan waktu kejadian.
2. Hentikan sementara perubahan data pada modul terkait.
3. Ambil backup current state sebelum pemulihan.
4. Pilih backup database/storage yang relevan.
5. Restore ke staging terlebih dahulu.
6. Verifikasi login, data master, soal, jadwal, peserta, attempts, answers, hasil, audit log, dan media.
7. Restore produksi pada maintenance window.
8. Reopen layanan setelah smoke test selesai.

### Gagal Deployment

1. Rollback aplikasi ke versi stabil.
2. Cek status migration terakhir.
3. Jika migration merusak data, restore database dari backup sebelum migration.
4. Verifikasi policy, trigger, function, dan constraint.
5. Jalankan smoke test login, dashboard, export scope, proctor scope, dan CBT read-only.

### Kerusakan Data Sekolah

1. Isolasi sekolah terdampak dan hentikan operasi perubahan data.
2. Backup current state sekolah.
3. Restore snapshot/staging untuk menentukan titik aman.
4. Jika hanya metadata sekolah rusak, restore terbatas dapat digunakan.
5. Jika data akademik/ujian rusak, gunakan restore database scoped/manual dari backup penuh.
6. Validasi data master, paket, jadwal, peserta, hasil, dan media sebelum reopen.

## 8. Dashboard Status

Dashboard Super Admin menampilkan:

- Backup terakhir
- Status backup
- Jumlah backup
- Restore terakhir

Status ini berasal dari `super_admin_backup_jobs` dan hanya tersedia untuk Super Admin.

## 9. Test Checklist

- [ ] Backup berhasil dibuat di staging.
- [ ] Snapshot dapat dibaca dari `super_admin_backup_jobs.snapshot`.
- [ ] Restore terbatas berhasil di staging.
- [ ] `system_settings` kembali.
- [ ] Metadata sekolah kembali untuk scope sekolah.
- [ ] User/CBT/media diverifikasi tidak ikut restore aplikasi.
- [ ] Backup database penuh tersedia sebelum production restore.
- [ ] RLS, policy, trigger, function, dan constraint tetap ada setelah restore database.
- [ ] Export scope tetap aman.
- [ ] Proctor scope tetap aman.
- [ ] Tidak ada data lintas sekolah bocor.

## 10. Risiko Tersisa

- Backup aplikasi bukan full disaster recovery.
- Media `question-media` tidak ikut snapshot.
- Restore full user/CBT/result membutuhkan backup database Supabase.
- Tidak ada automation backup harian dari aplikasi.
- Tidak ada bukti restore produksi; uji restore wajib dilakukan di staging.

## 11. Rekomendasi Production Rollout

1. Wajib aktifkan Supabase PITR atau jadwal dump database.
2. Wajib backup bucket `question-media`.
3. Jalankan restore drill bulanan di staging.
4. Simpan evidence backup: waktu, operator, ukuran, lokasi, hasil checksum.
5. Gunakan fitur backup aplikasi hanya sebagai snapshot konfigurasi/metadata cepat, bukan pengganti backup database.
