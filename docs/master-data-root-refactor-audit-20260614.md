# Audit Refactor Halaman `/dashboard/master-data`

Tanggal: 2026-06-14

## Kondisi Saat Ini

Halaman `/dashboard/master-data` sebelumnya berfungsi sebagai launcher menu berbentuk card. Card yang ditemukan:

| Card Lama | Route Tujuan | Status Setelah Refactor |
| --- | --- | --- |
| Tahun Ajaran | `/dashboard/master-data/academic-years` | Tetap tersedia melalui sidebar Akademik > Tahun Ajaran & Semester |
| Siswa | `/dashboard/master-data/students` | Tetap tersedia melalui sidebar Pengguna > Siswa |
| Guru | `/dashboard/master-data/teachers` | Tetap tersedia melalui sidebar Pengguna > Guru |
| Kelas | `/dashboard/master-data/classes` | Tetap tersedia melalui sidebar Akademik > Kelas |
| Mata Pelajaran | `/dashboard/master-data/subjects` | Tetap tersedia melalui sidebar Akademik > Mata Pelajaran |

Tidak ada fitur yang dihapus. Route operasional tetap aktif dan permission tetap mengikuti konfigurasi yang sudah ada.

## Temuan UX

- Halaman root master data menduplikasi fungsi sidebar.
- Pengguna harus melakukan klik tambahan sebelum sampai ke halaman data.
- Card launcher membuat pola navigasi tidak konsisten dengan struktur sidebar baru.
- Root route masih berguna sebagai parent menu dan halaman ringkasan, sehingga redirect penuh tidak direkomendasikan.

## Route Terdampak

- `/dashboard/master-data`
- Route tujuan card lama tidak diubah:
  - `/dashboard/master-data/academic-years`
  - `/dashboard/master-data/students`
  - `/dashboard/master-data/teachers`
  - `/dashboard/master-data/classes`
  - `/dashboard/master-data/subjects`

## Komponen Terdampak

- `src/app/(dashboard)/dashboard/master-data/page.tsx`
- `src/lib/master-data/queries.ts` dipakai ulang tanpa perubahan.
- `src/lib/auth/access-matrix.ts` tidak perlu diubah karena `/dashboard/master-data` tetap menjadi parent sidebar.

## Risiko Perubahan

- Query ringkasan mengambil beberapa dataset master data sekaligus. Risiko performa rendah pada data kecil-menengah, tetapi perlu dipantau jika jumlah siswa/kelas sangat besar.
- Super Admin dapat melihat ringkasan lintas sekolah; label aktif bisa menampilkan lebih dari satu tahun/semester aktif karena scope-nya global.
- Tidak ada perubahan database, API, middleware, permission, RLS, atau logika bisnis.

## Rekomendasi Implementasi

Pertahankan `/dashboard/master-data` sebagai halaman ringkasan akademik, bukan redirect. Alasannya:

- Route masih digunakan sebagai parent navigasi sidebar.
- Halaman ringkasan memberi nilai informasi tanpa membuat navigasi ganda.
- Bookmark lama tetap aman.
- Pola menjadi konsisten: Sidebar = navigasi, Halaman = informasi dan operasional.

Tahap berikutnya:

1. Pantau performa halaman setelah data siswa dan kelas bertambah besar.
2. Jika perlu, buat query agregasi khusus untuk ringkasan agar tidak mengambil seluruh row.
3. Tambahkan filter sekolah untuk Super Admin bila ringkasan lintas sekolah dirasa terlalu padat.

## File Yang Diubah

- `src/app/(dashboard)/dashboard/master-data/page.tsx`
- `docs/master-data-root-refactor-audit-20260614.md`
