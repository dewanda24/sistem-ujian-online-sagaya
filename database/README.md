# Panduan Database & Migrasi Supabase CBT Sagaya

Folder ini (`database/`) merupakan direktori kerja resmi (**workdir**) untuk seluruh skema database, migrasi Supabase PostgreSQL, dan data seed sistem CBT Sagaya.

---

## 📌 Perintah Supabase CLI

Gunakan perintah `npm run` yang telah dikonfigurasi dengan `--workdir database`:

| Perintah | Deskripsi |
|---|---|
| `npm run supabase:link` | Menghubungkan project lokal ke remote Supabase instance |
| `npm run supabase:migrations` | Melihat daftar status migrasi (applied vs pending) |
| `npm run supabase:db:push` | Menerapkan seluruh migrasi baru ke database Supabase |

---

## 📂 Struktur Direktori

```
database/
├── README.md               # Panduan ini
└── supabase/
    ├── migrations/         # Seluruh berkas SQL migrasi terurut tanggal
    └── rollbacks/          # Cadangan rollback untuk hardening RLS
```

---

## 📑 Kronologi Fase Migrasi

1. **Fase 1: Foundation & Master Data (Mei 2026)**
   - `create_exam_foundation.sql`, `create_question_bank_foundation.sql`, `create_exam_room_foundation.sql`
   - Master data tahun ajaran, semester, kelas, mapel, guru, siswa, dan RBAC permissions.

2. **Fase 2: Multi-School & Tenant Isolation (Juni 2026)**
   - `20260602_multi_school_hardening.sql`: Isolasi data antar sekolah berbasis `users.school_id`.
   - `20260610_super_admin_advanced_backend.sql`: Hak akses platform owner & Super Admin.

3. **Fase 3: Production RLS Hardening & Storage (Juni 2026)**
   - `20260612_production_rls_hardening.sql`: Pengetatan Row Level Security produksi.
   - `20260612_create_question_media_bucket.sql`: Supabase Storage bucket untuk foto/media soal.

4. **Fase 4: Audit Logs & Security Hardening (Agustus 2026)**
   - `20260820_add_admin_scoped_audit_logs.sql`: Perekaman aktivitas admin per sekolah.
   - `20260820_fix_admin_privilege_escalation.sql`: Pencegahan eskalasi hak akses role.
