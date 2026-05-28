# Dashboard Feature Audit

Audit ini memetakan kelengkapan dashboard Sistem Ujian Online Sagaya berdasarkan route, menu, guard RBAC, dan modul fitur yang ada saat ini. Audit ini tidak mengubah kode aplikasi, database, atau middleware.

Status:

- `sudah ada`: route/UI/guard dan data flow utama sudah tersedia.
- `sebagian`: fondasi tersedia, tetapi masih placeholder, statis, manual refresh, atau belum lengkap secara operasional.
- `belum ada`: belum ada dashboard/route/UI operasional untuk fitur tersebut.

| Dashboard | Fitur | Status | File terkait | Catatan masalah | Rekomendasi implementasi |
| --- | --- | --- | --- | --- | --- |
| Super Admin | overview | sudah ada | `src/app/(dashboard)/dashboard/super-admin/page.tsx`, `src/features/dashboard/components/role-dashboard-view.tsx`, `src/features/dashboard/queries.ts` | Overview sudah membaca total user, jadwal published, dan pending grading. | Tambahkan grafik/trend hanya jika dibutuhkan. |
| Super Admin | user/profile | sebagian | `src/app/(dashboard)/dashboard/profile/page.tsx`, `src/app/(dashboard)/dashboard/admin/users/page.tsx`, `src/features/profile/*`, `src/features/admin/*` | Shared profile sudah ada dan user table hanya untuk daftar/filter akun. CRUD guru dan siswa dikelola dari Master Data. | Tambahkan reset password/email confirmation yang diaudit bila diperlukan. |
| Super Admin | master data | sudah ada | `src/app/(dashboard)/dashboard/master-data/*`, `src/lib/master-data/queries.ts`, `src/lib/actions/master-data-actions.ts` | Master data sekolah, tahun ajaran, semester, kelas, mapel, guru, siswa, import CSV guru, dan import CSV siswa sudah tersedia. Daftar guru/siswa difilter dengan `roles.name`. | Tambahkan audit mutation dan validasi duplikasi data penting. |
| Super Admin | assignment | sudah ada | `src/app/(dashboard)/dashboard/master-data/teachers/page.tsx`, `src/app/(dashboard)/dashboard/master-data/students/page.tsx`, `src/lib/actions/master-data-actions.ts` | Assignment guru-mapel-kelas dan siswa-kelas sudah ada. | Tambahkan validasi bentrok assignment dan view riwayat yang lebih mudah difilter. |
| Super Admin | bank soal | sudah ada | `src/app/(dashboard)/dashboard/question-bank/*`, `src/features/question-bank/*` | Bank soal global aktif; teacher scope sudah dipisah di query. | Tambahkan audit publish/archive dan versi soal jika dibutuhkan. |
| Super Admin | paket ujian | sudah ada | `src/app/(dashboard)/dashboard/exams/packages/page.tsx`, `src/features/exams/actions.ts`, `src/features/exams/queries.ts` | CRUD paket ujian tersedia. | Tambahkan review final sebelum publish dan ringkasan distribusi soal. |
| Super Admin | jadwal ujian | sudah ada | `src/app/(dashboard)/dashboard/exams/schedules/page.tsx`, `src/features/exams/actions.ts`, `src/features/exams/queries.ts` | Jadwal dan target kelas tersedia. | Tambahkan calendar view dan filter status/periode. |
| Super Admin | token ujian | sudah ada | `src/app/(dashboard)/dashboard/exams/schedules/page.tsx`, `src/features/exams/actions.ts` | Token dibuat/regenerate dari halaman jadwal, belum ada route token khusus. | Pertahankan di jadwal kecuali operasional membutuhkan halaman token terpusat. |
| Super Admin | monitoring | sebagian | `src/app/(dashboard)/dashboard/super-admin/monitoring/page.tsx`, `src/app/(dashboard)/dashboard/proctor/monitoring/page.tsx`, `src/features/monitoring/queries.ts` | Super admin punya alias monitoring, tetapi update masih manual refresh. | Tambahkan polling atau Supabase realtime di sprint monitoring lanjutan. |
| Super Admin | koreksi essay | sebagian | `src/app/(dashboard)/dashboard/teacher/grading/page.tsx`, `src/features/results/actions.ts`, `src/features/results/queries.ts` | Koreksi essay route saat ini berada di area teacher. Super admin punya permission bypass, tetapi menu khusus belum ada. | Buat route admin grading review jika super admin perlu override/finalize. |
| Super Admin | nilai | sudah ada | `src/app/(dashboard)/dashboard/exam-results/[attemptId]/page.tsx`, `src/app/(dashboard)/dashboard/reports/*`, `src/features/results/*`, `src/features/reports/queries.ts` | Detail hasil dan rekap laporan tersedia. | Tambahkan filter dan drill-down dari laporan ke detail attempt. |
| Super Admin | laporan | sudah ada | `src/app/(dashboard)/dashboard/reports/*`, `src/features/reports/queries.ts` | Laporan per ujian, kelas, mapel, dan siswa tersedia. | Tambahkan filter periode/mapel/kelas dan grafik ringkas. |
| Super Admin | import/export | sebagian | `src/app/(dashboard)/dashboard/import-export/page.tsx`, `src/features/import-export/components/import-preview-form.tsx`, `src/app/api/templates/[type]/route.ts`, `src/app/api/reports/export/route.ts` | Template CSV, export laporan, dan staging preview sudah tersedia. Import commit ke database belum ada. | Tambahkan import commit setelah audit log dan validasi duplikasi siap. |
| Super Admin | audit logs | sebagian | `src/app/(dashboard)/dashboard/admin/audit-logs/page.tsx`, `src/features/admin/queries.ts`, `docs/database-schema.md` | UI membaca `audit_logs` jika tabel ada, tetapi migration aktif untuk audit log belum ditemukan. | Buat migration audit_logs dan helper `logAuditEvent()` setelah desain disetujui. |
| Super Admin | settings | sebagian | `src/app/(dashboard)/dashboard/super-admin/settings/page.tsx` | Route placeholder sudah ada, belum ada data persistence. | Definisikan schema settings atau gunakan env-only settings read-only dulu. |
| Super Admin | backup/recovery | sebagian | `src/app/(dashboard)/dashboard/super-admin/backup-recovery/page.tsx`, `docs/deployment-readiness.md` | Route placeholder dan dokumen ada, belum ada proses backup otomatis. | Buat SOP backup Supabase dulu; automation hanya setelah security design matang. |
| Admin Sekolah | overview | sudah ada | `src/app/(dashboard)/dashboard/admin/page.tsx`, `src/features/dashboard/components/role-dashboard-view.tsx`, `src/features/dashboard/queries.ts` | Overview admin sudah membaca total siswa, guru, dan kelas. | Tambahkan metrik jadwal aktif jika dibutuhkan. |
| Admin Sekolah | user/profile | sebagian | `src/app/(dashboard)/dashboard/profile/page.tsx`, `src/app/(dashboard)/dashboard/admin/users/page.tsx`, `src/features/profile/*`, `src/features/admin/*` | Shared profile tersedia; user management hanya daftar/filter role/status. CRUD guru/siswa berada di Master Data. | Batasi perubahan akun melalui halaman master data sesuai role. |
| Admin Sekolah | master data | sudah ada | `src/app/(dashboard)/dashboard/master-data/*` | Admin punya menu master data sesuai permission. | Tambahkan filter default sekolah aktif dan validasi single-school. |
| Admin Sekolah | assignment | sudah ada | `src/app/(dashboard)/dashboard/master-data/teachers/page.tsx`, `src/app/(dashboard)/dashboard/master-data/students/page.tsx` | Assignment guru dan siswa tersedia. | Tambahkan bulk assignment dan validasi tahun ajaran aktif. |
| Admin Sekolah | bank soal | sudah ada | `src/app/(dashboard)/dashboard/question-bank/*` | Admin dapat mengelola bank soal jika permission tersedia. | Tambahkan audit perubahan soal. |
| Admin Sekolah | paket ujian | sudah ada | `src/app/(dashboard)/dashboard/exams/packages/page.tsx` | Paket ujian tersedia. | Tambahkan filter pembuat dan status. |
| Admin Sekolah | jadwal ujian | sudah ada | `src/app/(dashboard)/dashboard/exams/schedules/page.tsx` | Jadwal ujian tersedia. | Tambahkan agenda view dan validasi konflik jadwal. |
| Admin Sekolah | token ujian | sudah ada | `src/app/(dashboard)/dashboard/exams/schedules/page.tsx` | Token menyatu dengan jadwal. | Tambahkan kontrol print/share token jika diperlukan. |
| Admin Sekolah | monitoring | belum ada | `src/constants/dashboard-menu.ts`, `src/app/(dashboard)/dashboard/proctor/monitoring/page.tsx` | Admin tidak punya menu monitoring khusus; route proctor dikunci untuk proctor dan alias super admin. | Tentukan apakah admin sekolah boleh monitoring; jika ya buat alias admin dan guard permission. |
| Admin Sekolah | koreksi essay | belum ada | `src/app/(dashboard)/dashboard/teacher/grading/page.tsx` | Koreksi essay hanya tampil di dashboard guru. | Jika admin perlu supervisi, buat halaman review grading read-only. |
| Admin Sekolah | nilai | sudah ada | `src/app/(dashboard)/dashboard/reports/*`, `src/app/(dashboard)/dashboard/exam-results/[attemptId]/page.tsx` | Admin termasuk allowed role untuk hasil/laporan. | Tambahkan filter kelas/mapel/tahun ajaran. |
| Admin Sekolah | laporan | sudah ada | `src/app/(dashboard)/dashboard/reports/*` | Laporan aktif. | Tambahkan export by filter. |
| Admin Sekolah | import/export | sudah ada | `src/app/(dashboard)/dashboard/import-export/page.tsx` | Menu import/export tersedia untuk admin jika permission seed dijalankan. | Tambahkan import preview dan log hasil import. |
| Admin Sekolah | audit logs | belum ada | `src/app/(dashboard)/dashboard/admin/audit-logs/page.tsx`, `src/constants/dashboard-menu.ts` | Audit logs menu hanya untuk super_admin. | Tetapkan kebijakan: admin sekolah read-only audit sekolah atau tetap super admin saja. |
| Admin Sekolah | settings | belum ada | Tidak ada route admin settings | Belum ada settings khusus sekolah. | Buat school settings terbatas jika dibutuhkan, memakai data `schools`. |
| Admin Sekolah | backup/recovery | belum ada | `docs/deployment-readiness.md` | Backup/recovery hanya placeholder super admin dan SOP dokumen. | Tetap batasi ke super admin. |
| Guru | overview | sudah ada | `src/app/(dashboard)/dashboard/teacher/page.tsx`, `src/features/dashboard/components/role-dashboard-view.tsx`, `src/features/dashboard/queries.ts` | Overview guru sudah membaca assignment, draft soal, dan pending grading. | Tambahkan jadwal aktif guru jika diperlukan. |
| Guru | user/profile | sudah ada | `src/app/(dashboard)/dashboard/profile/page.tsx`, `src/features/profile/*` | Shared profile tersedia untuk update nama, telepon, dan avatar. | Tambahkan ganti password jika disetujui. |
| Guru | master data | belum ada | `src/constants/dashboard-menu.ts` | Guru tidak punya menu master data. | Tetap read-only, kecuali perlu melihat kelas/mapel assigned. |
| Guru | assignment | sebagian | `src/features/question-bank/queries.ts`, `src/features/exams/queries.ts`, `src/lib/master-data/queries.ts` | Teacher scoping memakai `teacher_subjects`, tetapi belum ada halaman guru untuk melihat assignment pribadi. | Tambahkan "Mapel & Kelas Saya" read-only. |
| Guru | bank soal | sudah ada | `src/app/(dashboard)/dashboard/question-bank/*`, `src/features/question-bank/*` | Guru bisa melihat/mengelola soal sesuai assigned subjects. | Tambahkan indikator scope mapel di UI. |
| Guru | paket ujian | sudah ada | `src/app/(dashboard)/dashboard/exams/packages/page.tsx`, `src/features/exams/*` | Guru punya akses exams jika permission tersedia. | Pastikan query hanya mapel assigned, lalu tambahkan duplicate package. |
| Guru | jadwal ujian | sudah ada | `src/app/(dashboard)/dashboard/exams/schedules/page.tsx` | Jadwal ujian tersedia. | Tambahkan filter jadwal milik guru. |
| Guru | token ujian | sudah ada | `src/app/(dashboard)/dashboard/exams/schedules/page.tsx`, `src/features/exams/actions.ts` | Guru bisa mengelola token jika permission `exam_tokens.manage` tersedia. | Review apakah token sebaiknya hanya admin/proctor atau guru juga. |
| Guru | monitoring | belum ada | `src/app/(dashboard)/dashboard/proctor/monitoring/page.tsx` | Guru tidak punya menu monitoring. | Jika guru perlu memantau ujiannya sendiri, buat teacher monitoring scoped. |
| Guru | koreksi essay | sudah ada | `src/app/(dashboard)/dashboard/teacher/grading/page.tsx`, `src/features/results/actions.ts`, `src/features/results/queries.ts` | Koreksi essay tersedia. | Tambahkan filter ujian/mapel dan bulk finalize. |
| Guru | nilai | sebagian | `src/app/(dashboard)/dashboard/reports/*`, `src/features/reports/queries.ts`, `src/features/results/queries.ts` | Guru masuk reports dan query reports scoped ke jadwal mapel guru. | Tambahkan menu nilai khusus guru bila reports terlalu luas. |
| Guru | laporan | sudah ada | `src/app/(dashboard)/dashboard/reports/*` | Reports tersedia untuk teacher. | Tambahkan export guru per ujian/mapel. |
| Guru | import/export | belum ada | `src/app/(dashboard)/dashboard/import-export/page.tsx`, `src/constants/dashboard-menu.ts` | Import/export hanya admin/super_admin. | Pertimbangkan template/import soal untuk guru setelah validasi aman. |
| Guru | audit logs | belum ada | Tidak ada route guru audit | Guru tidak memiliki audit view. | Tidak prioritas; cukup log aktivitas guru di audit sistem. |
| Guru | settings | belum ada | Tidak ada route guru settings | Belum ada preferensi/profil. | Gabungkan ke shared profile/settings. |
| Guru | backup/recovery | belum ada | Tidak ada route guru backup | Tidak relevan untuk guru. | Tidak perlu dibuat. |
| Siswa | overview | sudah ada | `src/app/(dashboard)/dashboard/student/page.tsx`, `src/features/dashboard/components/role-dashboard-view.tsx`, `src/features/dashboard/queries.ts` | Overview siswa sudah membaca ujian aktif dan riwayat attempt. | Tambahkan jadwal terdekat jika diperlukan. |
| Siswa | user/profile | sudah ada | `src/app/(dashboard)/dashboard/profile/page.tsx`, `src/features/profile/*` | Shared profile tersedia untuk update nama, telepon, dan avatar. | Tambahkan info kelas aktif dari `class_members`. |
| Siswa | master data | belum ada | `src/constants/dashboard-menu.ts` | Siswa tidak punya master data. | Tidak perlu. |
| Siswa | assignment | sebagian | `src/app/(dashboard)/dashboard/student/schedules/page.tsx`, `src/features/exam-room/queries.ts`, `class_members` | Siswa melihat jadwal berdasarkan kelas, tetapi tidak ada halaman riwayat kelas/profil akademik. | Tambahkan info kelas aktif di profile siswa. |
| Siswa | bank soal | belum ada | `src/constants/dashboard-menu.ts` | Siswa tidak punya akses bank soal. | Tidak perlu. |
| Siswa | paket ujian | belum ada | Tidak ada route paket ujian siswa | Siswa hanya melihat ujian aktif/jadwal, bukan paket. | Tidak perlu expose paket. |
| Siswa | jadwal ujian | sudah ada | `src/app/(dashboard)/dashboard/student/schedules/page.tsx`, `src/features/exam-room/queries.ts` | Jadwal siswa tersedia. | Tambahkan filter upcoming/done. |
| Siswa | token ujian | sudah ada | `src/app/(dashboard)/dashboard/student/active-exams/page.tsx`, `src/features/exam-room/actions.ts` | Input token tersedia saat mulai ujian. | Tambahkan pesan error lebih spesifik untuk token expired/invalid. |
| Siswa | monitoring | belum ada | Tidak ada route siswa monitoring | Tidak relevan. | Tidak perlu. |
| Siswa | koreksi essay | belum ada | Tidak ada route siswa grading | Siswa hanya melihat hasil setelah dinilai. | Tidak perlu. |
| Siswa | nilai | sudah ada | `src/app/(dashboard)/dashboard/student/history/page.tsx`, `src/app/(dashboard)/dashboard/exam-results/[attemptId]/page.tsx` | Riwayat dan detail hasil tersedia. | Tambahkan tampilan per mapel/semester. |
| Siswa | laporan | sebagian | `src/app/(dashboard)/dashboard/student/history/page.tsx` | Laporan siswa berupa riwayat individual, bukan report module. | Tambahkan ringkasan progres siswa bila diperlukan. |
| Siswa | import/export | belum ada | Tidak ada route siswa export | Tidak relevan atau opsional. | Opsional: cetak hasil ujian. |
| Siswa | audit logs | belum ada | Tidak ada route siswa audit | Tidak relevan. | Tidak perlu expose. |
| Siswa | settings | belum ada | Tidak ada route siswa settings | Belum ada profile/preference. | Tambahkan shared profile. |
| Siswa | backup/recovery | belum ada | Tidak ada route siswa backup | Tidak relevan. | Tidak perlu. |
| Proctor/Pengawas | overview | sudah ada | `src/app/(dashboard)/dashboard/proctor/page.tsx`, `src/features/dashboard/components/role-dashboard-view.tsx`, `src/features/dashboard/queries.ts` | Overview proctor sudah membaca jumlah jadwal yang tersedia untuk monitoring. | Tambahkan sesi berjalan setelah status monitoring final. |
| Proctor/Pengawas | user/profile | sudah ada | `src/app/(dashboard)/dashboard/profile/page.tsx`, `src/features/profile/*` | Shared profile tersedia untuk update nama, telepon, dan avatar. | Tambahkan ganti password jika disetujui. |
| Proctor/Pengawas | master data | belum ada | `src/constants/dashboard-menu.ts` | Proctor tidak punya master data. | Tidak perlu, kecuali read-only daftar ruang/jadwal. |
| Proctor/Pengawas | assignment | belum ada | Tidak ada proctor assignment route | Belum ada assignment pengawas ke jadwal/ruang. | Tambahkan `exam_proctors` atau assignment jadwal jika schema disetujui. |
| Proctor/Pengawas | bank soal | belum ada | Tidak ada route proctor bank soal | Tidak relevan. | Tidak perlu. |
| Proctor/Pengawas | paket ujian | belum ada | Tidak ada route proctor paket | Tidak relevan untuk pengawas. | Tidak perlu. |
| Proctor/Pengawas | jadwal ujian | sebagian | `src/app/(dashboard)/dashboard/proctor/monitoring/page.tsx`, `src/features/monitoring/queries.ts` | Jadwal muncul sebagai dropdown monitoring, bukan halaman jadwal pengawas. | Tambahkan jadwal pengawasan jika assignment proctor dibuat. |
| Proctor/Pengawas | token ujian | belum ada | `src/app/(dashboard)/dashboard/exams/schedules/page.tsx` | Token dikelola dari jadwal exams, bukan dashboard proctor. | Tentukan apakah proctor boleh melihat/regenerate token; jika ya buat view terbatas. |
| Proctor/Pengawas | monitoring | sebagian | `src/app/(dashboard)/dashboard/proctor/monitoring/page.tsx`, `src/features/monitoring/queries.ts` | Monitoring tersedia, refresh masih manual, belum ada tindakan paksa/pause/resume. | Tambahkan realtime/polling dan action proctor setelah aturan operasional jelas. |
| Proctor/Pengawas | koreksi essay | belum ada | Tidak ada route proctor grading | Tidak relevan. | Tidak perlu. |
| Proctor/Pengawas | nilai | belum ada | Tidak ada route proctor nilai | Tidak relevan. | Tidak perlu. |
| Proctor/Pengawas | laporan | belum ada | Tidak ada route proctor reports | Tidak relevan atau opsional. | Opsional: laporan kehadiran sesi. |
| Proctor/Pengawas | import/export | belum ada | Tidak ada route proctor import/export | Tidak relevan. | Tidak perlu. |
| Proctor/Pengawas | audit logs | belum ada | Tidak ada route proctor audit | Tidak relevan untuk UI. | Log aktivitas proctor di audit sistem. |
| Proctor/Pengawas | settings | belum ada | Tidak ada route proctor settings | Belum ada profile/preference. | Tambahkan shared profile. |
| Proctor/Pengawas | backup/recovery | belum ada | Tidak ada route proctor backup | Tidak relevan. | Tidak perlu. |
| Wali Kelas | overview | belum ada | `src/app/(dashboard)/dashboard/master-data/classes/page.tsx` | Tidak ada role/dashboard wali kelas khusus; wali kelas baru field `homeroom_teacher_id`. | Tentukan apakah wali kelas adalah role baru atau teacher dengan assignment wali kelas. |
| Wali Kelas | user/profile | belum ada | `users`, `user_profiles` | Tidak ada konteks wali kelas di profile. | Jika dibutuhkan, tampilkan kelas wali di profile guru. |
| Wali Kelas | master data | sebagian | `src/app/(dashboard)/dashboard/master-data/classes/page.tsx` | Admin mengatur wali kelas, tetapi wali kelas tidak punya dashboard sendiri. | Buat read-only kelas binaan untuk guru wali kelas. |
| Wali Kelas | assignment | sebagian | `classes.homeroom_teacher_id`, `src/lib/master-data/queries.ts` | Assignment wali kelas tersimpan di kelas. | Tambahkan query "kelas yang saya wali". |
| Wali Kelas | bank soal | belum ada | Tidak ada dashboard wali kelas | Tidak relevan kecuali wali kelas juga guru mapel. | Gunakan dashboard guru untuk bank soal. |
| Wali Kelas | paket ujian | belum ada | Tidak ada dashboard wali kelas | Belum ada akses paket khusus wali kelas. | Tidak prioritas. |
| Wali Kelas | jadwal ujian | belum ada | Tidak ada dashboard wali kelas | Wali kelas belum bisa melihat jadwal kelas binaan secara khusus. | Tambahkan jadwal kelas binaan read-only. |
| Wali Kelas | token ujian | belum ada | Tidak ada dashboard wali kelas | Tidak ada akses token wali kelas. | Tidak perlu kecuali kebijakan sekolah mengizinkan. |
| Wali Kelas | monitoring | belum ada | Tidak ada dashboard wali kelas | Belum ada monitoring kelas binaan. | Buat monitoring read-only untuk kelas binaan jika dibutuhkan. |
| Wali Kelas | koreksi essay | belum ada | Tidak ada dashboard wali kelas | Tidak relevan kecuali guru mapel. | Gunakan dashboard guru. |
| Wali Kelas | nilai | belum ada | Tidak ada dashboard wali kelas | Belum ada rekap nilai kelas binaan. | Tambahkan rekap kelas binaan read-only. |
| Wali Kelas | laporan | belum ada | Tidak ada dashboard wali kelas | Belum ada laporan wali kelas. | Buat dashboard wali kelas sebagai teacher extension. |
| Wali Kelas | import/export | belum ada | Tidak ada dashboard wali kelas | Tidak relevan. | Tidak perlu. |
| Wali Kelas | audit logs | belum ada | Tidak ada dashboard wali kelas | Tidak relevan. | Tidak perlu expose. |
| Wali Kelas | settings | belum ada | Tidak ada dashboard wali kelas | Tidak ada settings. | Gunakan shared profile. |
| Wali Kelas | backup/recovery | belum ada | Tidak ada dashboard wali kelas | Tidak relevan. | Tidak perlu. |
| Import/Export | overview | sudah ada | `src/app/(dashboard)/dashboard/import-export/page.tsx` | Halaman landing import/export tersedia. | Tambahkan statistik file/template yang sering dipakai bila perlu. |
| Import/Export | user/profile | belum ada | Tidak ada kaitan langsung | Tidak relevan untuk modul import/export. | Tidak perlu. |
| Import/Export | master data | sebagian | `src/features/import-export/templates.ts`, `src/features/import-export/components/import-preview-form.tsx`, `src/app/api/templates/[type]/route.ts`, `src/app/(dashboard)/dashboard/master-data/teachers/page.tsx`, `src/app/(dashboard)/dashboard/master-data/students/page.tsx` | Template, preview validasi, import CSV guru, dan import CSV siswa tersedia. Import kelas belum ada. | Tambahkan import kelas/assignment setelah validasi duplikasi matang. |
| Import/Export | assignment | sebagian | `src/features/import-export/templates.ts` | Template kelas punya homeroom teacher email; belum ada template assignment guru/siswa khusus. | Tambahkan template assignment guru-mapel-kelas dan siswa-kelas jika import dibangun. |
| Import/Export | bank soal | sebagian | `src/features/import-export/templates.ts`, `src/features/import-export/components/import-preview-form.tsx` | Template bank soal dan preview validasi tersedia, import commit belum ada. | Bangun commit import soal setelah validasi preview matang. |
| Import/Export | paket ujian | belum ada | Tidak ada template paket ujian | Belum ada import/export paket ujian. | Tunda sampai struktur paket final. |
| Import/Export | jadwal ujian | belum ada | Tidak ada template jadwal | Belum ada import/export jadwal. | Tunda; jadwal rawan konflik waktu/kelas. |
| Import/Export | token ujian | belum ada | Tidak ada export token khusus | Token hanya di jadwal. | Jika perlu, tambahkan export token per jadwal dengan guard ketat. |
| Import/Export | monitoring | belum ada | Tidak ada export monitoring | Monitoring belum punya export. | Opsional: export kehadiran/progress sesi. |
| Import/Export | koreksi essay | belum ada | Tidak ada export grading khusus | Export grading belum terpisah. | Opsional: export pending/final essay. |
| Import/Export | nilai | sudah ada | `src/app/api/reports/export/route.ts`, `src/features/reports/queries.ts` | Export nilai CSV tersedia. | Tambahkan export berdasarkan filter. |
| Import/Export | laporan | sudah ada | `src/app/api/reports/export/route.ts`, `src/app/(dashboard)/dashboard/reports/students/page.tsx` | Export laporan siswa tersedia. | Tambahkan export per ujian/kelas/mapel. |
| Import/Export | import/export | sebagian | `src/app/(dashboard)/dashboard/import-export/page.tsx`, `src/features/import-export/components/import-preview-form.tsx`, `src/app/api/templates/[type]/route.ts` | Download template, export, validation errors, dan preview CSV sudah ada; commit import belum ada. | Implementasikan commit step setelah audit log tersedia. |
| Import/Export | audit logs | belum ada | Tidak ada log import/export | Belum ada audit import/export. | Log download/export/import setelah audit_logs dibuat. |
| Import/Export | settings | sebagian | `src/app/(dashboard)/dashboard/import-export/page.tsx`, `src/lib/env.ts` | Halaman menampilkan env readiness, bukan setting import. | Tambahkan konfigurasi batas file/format jika import dibangun. |
| Import/Export | backup/recovery | sebagian | `docs/deployment-readiness.md`, `src/app/(dashboard)/dashboard/super-admin/backup-recovery/page.tsx` | Backup masih SOP/placeholder, bukan modul import/export. | Pisahkan backup database dari import/export data akademik. |

## Ringkasan Prioritas

1. **Audit logging foundation**  
   UI audit logs sudah ada, tetapi tabel/migration audit aktif belum ada. Ini penting sebelum banyak aksi admin/import berjalan.

2. **Import commit setelah staging preview**  
   Template CSV, preview, import guru, dan import siswa sudah ada. Langkah berikutnya adalah commit import bank soal dan kelas dengan audit log.

3. **Monitoring realtime/polling**  
   Monitoring sudah ada namun refresh manual. Tambahkan polling aman sebelum realtime penuh.

4. **Dashboard Wali Kelas sebagai teacher extension**  
   Jangan buat role baru dulu. Manfaatkan `classes.homeroom_teacher_id` untuk read-only kelas binaan, jadwal, dan rekap nilai.

5. **Filter laporan lanjutan dan export by filter**  
   Filter UI dasar sudah ditambahkan pada laporan siswa dan beberapa tabel utama. Export masih belum mengikuti filter.

6. **Ganti password/profile security**  
   Shared profile sudah tersedia, tetapi belum ada ganti password mandiri.
