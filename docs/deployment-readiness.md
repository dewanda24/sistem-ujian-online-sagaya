# Deployment Readiness

Dokumen ini merangkum checklist produksi untuk Sistem Ujian Online SMP.

## Environment

Variable wajib:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Jalankan pengecekan lokal:

```bash
npm run check:env
```

## Database

Jalankan migration berurutan dari folder `database/supabase/migrations`.

Migration Sprint 13 menambahkan permission:

- `import_export.view`
- `import_export.manage`

Permission diberikan ke role:

- `super_admin`
- `admin`

## Smoke Test

1. Login sebagai super admin atau admin.
2. Buka `/dashboard/import-export`.
3. Download template siswa, guru, kelas, dan bank soal.
4. Download export laporan dari modul reports.
5. Login sebagai teacher dan pastikan menu operasional guru tetap tampil sesuai permission.
6. Login sebagai student dan pastikan exam room masih bisa dibuka dari active exams.

## Production Notes

- Jangan aktifkan RLS sebelum semua policy diuji per role.
- Simpan `SUPABASE_SERVICE_ROLE_KEY` hanya di server environment.
- Backup database sebelum menjalankan migration produksi.
- Gunakan HTTPS untuk deployment.
- Jalankan `npm run lint` dan `npm run build` sebelum release.
