# Core Feature Improvement Audit

Audit ini memetakan fitur yang masih perlu perbaikan pada Sistem Ujian Online Sagaya. Prioritas utama adalah fitur core CBT: data akademik, bank soal, paket/jadwal ujian, pengerjaan siswa, monitoring, scoring, dan laporan. UI/UX dicatat sebagai pendukung, bukan pengganti perbaikan alur inti.

Status:

- `P0`: wajib dibereskan sebelum simulasi/produksi karena bisa mengganggu ujian atau akurasi data.
- `P1`: penting untuk operasional sekolah agar flow lebih aman dan efisien.
- `P2`: polish UI/UX atau peningkatan kenyamanan.

## Ringkasan Prioritas Core

| Prioritas | Area | Masalah utama | Rekomendasi next action |
| --- | --- | --- | --- |
| P0 | Migration & production readiness | Beberapa fitur baru bergantung pada migration audit logs dan lock fields. Jika belum dijalankan di Supabase, UI bisa error atau aksi tidak lengkap. Halaman Super Admin Production Readiness sudah tersedia untuk cek akun, audit logs, lock fields, jadwal tanpa peserta, dan siswa tanpa kelas. | Lanjutkan dengan checklist migration final dan tambahkan cek baru setiap ada modul core baru. |
| P0 | Exam package publish readiness | Paket ujian sudah punya readiness summary, distribusi PG/Essay, distribusi difficulty, dan validasi server-side sebelum publish. Belum ada review modal/detail panjang untuk paket besar. | Tambahkan review modal/detail jika sekolah membutuhkan pengecekan paket sebelum publish secara formal. |
| P0 | Schedule conflict & participant integrity | Jadwal sudah sync peserta dan sekarang punya validasi konflik waktu untuk kelas target sebelum status `scheduled`/`active`. UI jadwal juga menampilkan readiness summary, warning tanpa peserta, dan warning konflik visible. Konflik guru/proctor belum dibuat karena belum ada assignment pengawas/jadwal khusus. | Tambahkan calendar view dan konflik proctor/guru jika schema assignment disetujui. |
| P0 | Exam room reliability | Autosave, anti-cheating, offline banner, status simpan, retry otomatis terbatas, retry manual per soal, last-saved indicator, dan blok submit manual saat save pending/gagal sudah tersedia tanpa perubahan schema. | Tambahkan persistence queue/server-side conflict resolution hanya jika uji staging menunjukkan kebutuhan. |
| P0 | Scoring/report trust | Scoring sudah reusable dan laporan memakai finalized, tetapi belum ada halaman admin review grading lintas guru. | Tambahkan admin/super-admin grading review read-only/override sesuai permission. |
| P1 | Proctor assignment | Proctor bisa monitoring, tetapi belum ada assignment pengawas ke jadwal/ruang. Semua jadwal bisa muncul tergantung permission. | Desain tabel/fitur `exam_proctors` atau assignment proctor per schedule sebelum produksi multi-ruang. |
| P1 | User security | CRUD user ada, reset password ada, tetapi belum ada self-service change password/session revoke/email verification workflow. | Tambahkan ganti password mandiri dan admin session revoke bila Supabase Admin API tersedia. |
| P1 | Import/export commit consistency | Import guru/siswa/kelas/assignment/bank soal ada, tetapi import/export paket/jadwal/token/monitoring belum ada. | Tambahkan import/export hanya untuk data yang formatnya stabil; dahulukan export monitoring/kehadiran. |
| P1 | Audit log coverage | Banyak aksi sudah tercatat, audit logs sudah punya filter tanggal/user/action/entity dan payload expandable. Settings persistence/backup action belum seluruhnya punya coverage final karena fiturnya masih read-only/SOP. | Tambahkan audit untuk aksi settings/backup jika fitur mutasi dibuat. |
| P2 | UI density & mobile ergonomics | Banyak tabel dan form besar; beberapa halaman memakai banyak tombol kecil dalam satu cell. | Rapikan action menu/dropdown, sticky filters, responsive table cards untuk mobile. |

## Detail Audit

| Area | Status saat ini | Gap core | Gap UI/UX | Rekomendasi |
| --- | --- | --- | --- | --- |
| Auth & RBAC | Login, session persist, role redirect, permission guard, dan menu permission-based sudah stabil. | Belum ada self-service change password, revoke session, dan audit login/logout lengkap. | Pesan error login masih generik untuk beberapa kasus. | P1: tambah change password di profile. P1: audit login/logout. P2: pesan login lebih ramah. |
| Super Admin Users | CRUD akun operasional non-guru/non-siswa, status toggle, reset password, role label edit, ringkasan governance, distribusi role, quick link CRUD Master Data, role summary, permission matrix filter, dan proteksi action super_admin sudah ada. | Belum ada proteksi eksplisit agar admin non-super tidak membuat role sensitif tertentu jika permission seed longgar. | Form user cukup panjang dan reset password inline membuat tabel padat; matrix permission tetap lebar di desktop kecil. | P1: harden role option policy. P2: pindah reset password ke dialog/action menu dan buat responsive matrix mode. |
| Master Data Sekolah | CRUD sekolah, tahun ajaran, semester, kelas, mapel, guru, siswa tersedia. Halaman Kelas sudah punya readiness summary, anggota aktif vs riwayat, warning tanpa siswa, dan warning tanpa wali. Halaman Guru/Siswa sudah punya readiness summary untuk assignment guru, kelas aktif siswa, dan kelas aktif ganda. | Validasi duplikasi masih dominan di aplikasi; belum semua unique rule dipaksa database. | Form CRUD tampil di halaman yang sama dengan tabel sehingga halaman panjang. | P1: tambah validasi unique kode mapel/NIS/NISN/NIP sesuai scope. P2: gunakan drawer/modal untuk form edit. |
| Admin Sekolah Overview | Dashboard admin sekolah sudah menampilkan metrik operasional master data, jadwal, peserta, kelas tanpa siswa/wali, grading, dan laporan. | Scope multi-school masih memakai pola single-school/default data; belum ada filter sekolah eksplisit. | Kartu banyak, tetapi membantu operasional harian. | P1: scope sekolah eksplisit saat multi-school diaktifkan. P2: grouping kartu per area. |
| Assignment Guru/Siswa | Guru-mapel-kelas dan siswa-kelas tersedia, history class_members dijaga. | Belum ada validasi bentrok assignment lintas tahun ajaran dan bulk assignment review. | Riwayat assignment tampil padat di halaman guru/siswa. | P1: validasi active academic year. P2: detail assignment tabular terpisah. |
| Bank Soal | CRUD kategori/soal, opsi, status, import CSV, teacher scoping query/mutation, publish validation, question versioning, stimulus bersama, dan attachment/media metadata tersedia. | Belum ada duplicate question, UI manajemen stimulus terpisah, storage upload langsung, dan review perubahan sebelum publish yang berbentuk UI formal. | Editor soal masih textarea sederhana; media memakai URL metadata, opsi A-D basic dan belum hide otomatis saat tipe essay dipilih. | P1: duplicate question + review publish UI. P2: storage upload/rich text editor. |
| Paket Ujian | CRUD paket, pilih soal published, publish/archive, readiness summary, distribusi PG/Essay, distribusi difficulty, dan validasi publish server-side tersedia. | Belum ada review final berbentuk modal/detail untuk paket besar, distribusi kategori, randomization preview, dan duplicate package. | Pemilihan soal pada form bisa berat jika soal banyak. | P1: preview soal/filter lebih lengkap + duplicate package. |
| Jadwal Ujian | CRUD jadwal, target kelas, token, sync peserta, validasi publish/active, readiness summary, conflict validation kelas/waktu, filter tanggal, warning token, dan hint sync peserta tersedia. | Belum ada deteksi bentrok guru/proctor, proctor assignment, dan bulk mark absent. | Banyak tombol status/action dalam satu kolom. | P1: proctor assignment. P2: action menu per jadwal dan calendar view. |
| Token Ujian | Token regenerate tersedia di jadwal dan siswa wajib input token bila required. Proctor juga punya halaman Token Ujian read-only dengan print view tanpa regenerate. | Belum ada token rotation policy dan token visibility audit granular. | Token masih tampil sebagai kartu sederhana. | P2: copy button dengan masking dan audit visibility granular jika diperlukan. |
| Exam Room Siswa | Fullscreen exam-only, countdown, autosave, refresh persistence, submit confirmation, anti-cheat warning, lock read-only, network status, save status, retry otomatis, retry manual, last-saved indicator, dan submit guard saat save pending/gagal tersedia. | Retry queue masih client-side memory, belum persistent lintas reload jika browser ditutup saat offline. | Mobile cukup responsive, tetapi navigasi nomor soal bisa padat untuk banyak soal. | P2: compact question navigator, sticky footer mobile, dan persistent offline queue jika benar-benar dibutuhkan. |
| Anti-Cheating | Detect tab/focus/fullscreen/copy/paste/context menu/shortcut, warning, auto-submit pelanggaran 3 tersedia. | Server-side enforcement masih terbatas; event dipakai sebagai audit/sinyal. | Modal warning bisa terasa mengganggu jika fullscreen browser bermasalah. | P1: policy setting per exam package/schedule. P2: wording warning lebih operasional. |
| Monitoring | Auto-refresh, filter schedule/class/status/subject, reset filter, summary status lengkap, progress submit, event count, last event, export progress CSV, dan action panel force submit/reset/lock/unlock/absent tersedia. | Belum realtime Supabase dan belum proctor assignment. | Tabel monitoring masih lebar, tetapi aksi sudah lebih terkendali. | P1: proctor assignment. P2: row detail drawer. |
| Scoring & Grading | Helper scoring reusable, essay grading, finalize guard, audit grading/finalize tersedia. | Admin/super-admin belum punya halaman grading review sendiri; bulk finalize belum ada. | Detail jawaban cukup padat dan belum ada filter hanya essay pending. | P1: admin grading review. P1: filter answer detail by essay/pending. P2: grading keyboard flow. |
| Results Siswa | Dashboard siswa, history, dan detail hasil menghormati `show_result` dan finalisasi essay. Dashboard sudah menampilkan hasil terakhir dan rata-rata nilai yang boleh dilihat. | Belum ada cetak/unduh hasil siswa dan transcript per semester/mapel. | Result pending sudah lebih jelas di dashboard, tetapi halaman history masih tabel sederhana. | P1: result transcript per semester. P2: print/download hasil siswa. |
| Reports | Per siswa/ujian/kelas/mapel, finalized averages, absent/pending, filters, export by filter, drill-down agregat ke report per siswa, pending grading link, reset filter siswa, dan detail attempt link tersedia. | Belum ada grafik/trend dan export detail jawaban. | Filter banyak dalam satu baris dapat sempit di laptop kecil. | P2: chart summary dan collapsible filter panel. |
| Principal Dashboard | Executive view tersedia dengan completion, average final, pending grading, absent, progress health, ujian completion rendah, top kelas, kelas perlu perhatian, mapel rata-rata terendah, dan drill-down ke laporan terfilter. | Belum ada chart/trend periode. | Dashboard sudah read-only dan fokus insight, bukan kontrol operasional. | P2: chart completion/finalized dan filter periode jika dibutuhkan. |
| Teacher Dashboard | Assignment, mapel/kelas, soal draft/published, paket draft/published, jadwal upcoming/active, pending grading, quick actions per workflow, dan halaman "Mapel & Kelas Saya" read-only tersedia. | Belum ada filter tahun ajaran di halaman assignment pribadi. | Kartu sudah operasional dan assignment guru mapel terpisah dari kelas binaan. | P2: filter tahun ajaran jika data assignment bertambah banyak. |
| Wali Kelas | Homeroom extension tersedia dari `classes.homeroom_teacher_id`. | Belum ada detail rekap siswa per mapel/semester dan export kelas binaan. | Masih terasa sebagai halaman tambahan guru, bukan dashboard wali kelas. | P1: drill-down siswa kelas binaan. P2: label/menu lebih eksplisit. |
| Proctor | Dashboard operasional, Jadwal Pengawasan read-only, Token Ujian print view, export kehadiran/progress, quick filters, dan monitoring tersedia. | Belum ada jadwal pengawasan assigned per proctor/ruang. | Scoping masih berdasarkan permission monitoring karena belum ada `exam_proctors`. | P1: proctor assignment jika produksi multi-ruang membutuhkan pembatasan pengawas. |
| Import/Export | Template, preview, import master data/assignment/bank soal, export laporan tersedia. | Import commit dari halaman import-export umum belum terpusat; sebagian import dilakukan dari halaman modul masing-masing. | Landing import/export menjelaskan readiness, tapi workflow terpencar. | P1: pusatkan job history/import status. P2: wizard import dengan preview dan commit. |
| Audit Logs | Tabel/helper/filter tersedia; banyak action sudah logged. Date range, summary cards, reset filter, dan expandable prettified payload sudah ada. | Perlu memastikan migration production selalu terpasang. Belum ada export audit log atau detail drawer penuh. | Payload sudah expandable tetapi masih inline di tabel. | P2: export audit log dan prettified JSON drawer jika volume audit besar. |
| Settings | Read-only env readiness tersedia. | Belum ada settings persistent dan policy exam-level anti-cheat/result visibility global. | Halaman masih checklist, bukan config management. | P1: jangan buat persistent settings sampai schema disetujui. P2: group readiness lebih visual. |
| Backup/Recovery | Runbook/checklist tersedia. | Belum ada backup automation dan restore test evidence. | Halaman SOP cukup statis. | P1: deployment checklist + backup evidence upload/link. |
| RLS/Security Production | Belum diaktifkan penuh sesuai catatan deployment. | Ini security hardening besar dan sebaiknya di akhir setelah flow stabil. | Tidak relevan UI. | P0 sebelum production: desain policy, test per role, rollback plan. |

## UI/UX Findings Yang Paling Terasa

| Prioritas | Halaman/Komponen | Masalah | Saran |
| --- | --- | --- | --- |
| P1 | `src/app/(dashboard)/dashboard/exams/schedules/page.tsx` | Kolom aksi berisi banyak tombol status/token/sync/archive sehingga tabel berat dan rawan salah klik. | Ganti menjadi dropdown action dengan primary actions: Edit, Sync Peserta, Token; status di submenu. |
| P1 | `src/app/(dashboard)/dashboard/proctor/monitoring/page.tsx` | Monitoring sangat lebar dan action force/reset/lock/absent bercampur. | Buat detail drawer per peserta dan action group. |
| P1 | `src/features/exam-room/components/exam-room-workspace.tsx` | Untuk jumlah soal besar, navigator nomor bisa panjang; belum ada indikator save failure global. | Sticky bottom nav mobile, compact number grid, global save status/offline banner. |
| P2 | Reports pages | Filter terlalu banyak dalam satu baris setelah tahun/semester ditambah. | Collapsible filter panel atau grid 2 baris dengan tombol reset. |
| P2 | Master data pages | Form create/edit dan tabel berada di satu halaman sehingga halaman panjang. | Gunakan drawer/modal untuk create/edit, tabel sebagai fokus utama. |
| P2 | Audit logs | Payload hanya truncate; sulit investigasi detail. | Tambah detail drawer JSON dan date range. |
| P2 | Dashboard role cards | Sebagian workbench masih EmptyState generik. | Ganti dengan task list kontekstual: pending grading, jadwal aktif, import terakhir. |

## Roadmap Perbaikan Disarankan

1. **P0 Package & Schedule Safety**
   - Review modal/detail paket besar sebelum publish jika diperlukan.
   - Validasi konflik jadwal kelas/siswa.
   - Tombol action jadwal lebih aman.

2. **P0 Exam Room Reliability**
   - Sudah ada offline/failed-save banner.
   - Sudah ada retry otomatis terbatas dan retry manual.
   - Sudah ada submit guard saat save pending/gagal.

3. **P1 Monitoring & Proctor Operations**
   - Proctor assignment ke jadwal/ruang.
   - Export attendance/progress.
   - Monitoring row detail drawer.

4. **P1 Grading & Report Drill-down**
   - Admin grading review.
   - Drill-down laporan agregat ke attempt list.
   - Filter answer detail untuk essay pending.

5. **P1 User/Profile Security**
   - Change password mandiri.
   - Optional session revoke/admin security actions.

6. **P1 Audit/Readiness**
   - Export audit logs jika dibutuhkan untuk pemeriksaan eksternal.
   - Tambah cek readiness baru untuk konflik jadwal dan integritas paket ujian.

7. **P2 UI Polish Batch**
   - Action dropdowns.
   - Collapsible filters.
   - Form drawer/modal.
   - Better empty states and dashboard task lists.

## Catatan Database/Migration

Perbaikan yang kemungkinan butuh migration baru:

- `exam_proctors` atau model assignment pengawas jika proctor harus scoped.
- Unique constraints untuk kode/NIS/NISN/NIP jika belum ada di database.
- Settings persistent jika konfigurasi runtime perlu diedit dari UI.
- RLS policies production pada sprint security hardening.

Perbaikan yang tidak perlu schema besar:

- Package publish review.
- Schedule conflict validation kelas/waktu sudah tersedia; sisa konflik guru/proctor menunggu desain assignment.
- Autosave retry/offline UI.
- Report drill-down.
- Action dropdown UI.
- Audit log date range/detail view.
