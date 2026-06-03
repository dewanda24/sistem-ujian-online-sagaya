# Manual Guide Penggunaan Sistem Ujian Online Sagaya

Dokumen ini adalah panduan lengkap penggunaan Sistem Ujian Online Sagaya untuk operasional CBT sekolah. Panduan disusun berdasarkan role pengguna dan alur kerja nyata: persiapan data, bank soal, paket ujian, jadwal ujian, pengerjaan siswa, monitoring pengawas, koreksi, laporan, hingga audit.

## 1. Gambaran Umum Sistem

Sistem Ujian Online Sagaya adalah aplikasi CBT berbasis web untuk mengelola:

- autentikasi dan role pengguna,
- master data sekolah,
- guru, siswa, kelas, mata pelajaran,
- bank soal,
- paket ujian,
- jadwal ujian,
- token ujian,
- pengerjaan soal siswa,
- monitoring ujian,
- anti-cheating,
- koreksi essay,
- rekap nilai,
- export laporan,
- audit logs.

Sistem menggunakan role-based access control. Menu yang tampil pada dashboard mengikuti role dan permission user.

## 2. Role Pengguna

### 2.1 Super Admin

Super Admin memiliki akses tertinggi untuk:

- mengelola user operasional,
- melihat role dan permission,
- mengelola master data,
- mengelola bank soal,
- mengelola paket dan jadwal ujian,
- monitoring ujian,
- melihat laporan,
- melihat audit logs,
- melihat settings dan backup/recovery checklist.

### 2.2 Admin Sekolah

Admin sekolah menangani operasional sekolah:

- master data,
- guru dan siswa,
- kelas dan mapel,
- paket ujian,
- jadwal ujian,
- token,
- monitoring,
- laporan.

Admin sekolah kini dikelola dari Master Data agar konsisten dengan data operasional sekolah.

### 2.3 Guru

Guru menangani:

- bank soal sesuai mapel yang ditugaskan,
- paket ujian sesuai scope,
- jadwal ujian,
- monitoring terbatas sesuai mapel/jadwal,
- koreksi essay,
- laporan nilai sesuai scope.

### 2.4 Siswa

Siswa dapat:

- melihat ujian aktif,
- memasukkan token ujian,
- mengerjakan soal,
- menyimpan jawaban otomatis,
- submit ujian,
- melihat riwayat dan hasil jika sudah dibuka.

### 2.5 Proctor/Pengawas

Proctor/Pengawas bertugas:

- memonitor peserta ujian,
- melihat status pengerjaan,
- melihat event anti-cheating,
- lock/unlock attempt,
- force submit,
- reset attempt,
- tandai peserta absent.

Akun proctor kini dikelola dari Master Data Proctor/Pengawas.

### 2.6 Principal/Kepala Sekolah

Principal dapat:

- melihat ringkasan performa ujian,
- membuka laporan,
- memantau hasil akademik secara agregat.

## 3. Login dan Logout

### 3.1 Login

1. Buka halaman `/login`.
2. Masukkan email dan password.
3. Klik tombol login.
4. Setelah berhasil, sistem otomatis mengarahkan user ke dashboard sesuai role:
   - `super_admin` ke dashboard super admin,
   - `admin` ke dashboard admin,
   - `teacher` ke dashboard guru,
   - `student` ke dashboard siswa,
   - `proctor` ke dashboard pengawas,
   - `principal` ke dashboard kepala sekolah.

Jika login gagal:

- Pastikan email dan password benar.
- Pastikan user sudah ada di Supabase Auth.
- Pastikan user internal di tabel `users` sudah terhubung ke `auth_user_id`.
- Pastikan user punya role.
- Pastikan status user aktif.

### 3.2 Logout

1. Klik menu akun/topbar.
2. Pilih logout.
3. Sistem akan menghapus session dan kembali ke halaman login.

## 4. Dashboard

Setelah login, user masuk ke dashboard sesuai role.

Dashboard berisi:

- ringkasan statistik,
- menu sidebar sesuai permission,
- akses cepat ke fitur utama,
- role badge,
- profile/user menu.

Jika menu tidak muncul:

- Cek role user.
- Cek permission role.
- Cek apakah permission sudah di-seed ke database.
- Logout dan login ulang agar session permission termuat ulang.

## 5. Manajemen User Operasional

Lokasi:

- `/dashboard/admin/users`

Fitur ini digunakan untuk mengelola user operasional seperti:

- admin,
- principal,
- proctor,
- role operasional lain selain guru dan siswa.

Catatan:

- Admin Sekolah juga tersedia di `/dashboard/master-data/admins`.
- Proctor/Pengawas juga tersedia di `/dashboard/master-data/proctors`.
- Guru dikelola dari Master Data Guru.
- Siswa dikelola dari Master Data Siswa.
- Jangan membuat guru/siswa dari halaman Users.
- Untuk operasional harian sekolah, gunakan Master Data agar lebih rapi.

### 5.1 Tambah User Operasional

1. Buka menu Users.
2. Isi nama lengkap.
3. Isi email.
4. Isi username.
5. Isi password awal.
6. Pilih role.
7. Pilih status `active`.
8. Klik tambah/simpan.

Sistem akan:

- membuat user internal,
- membuat mapping auth jika service role tersedia,
- mencatat audit log.

### 5.2 Edit User

1. Klik Edit pada baris user.
2. Ubah data yang diperlukan.
3. Kosongkan password jika tidak ingin mengubah password.
4. Simpan.

### 5.3 Reset Password

1. Cari user operasional.
2. Isi password baru pada form reset.
3. Klik reset.

Catatan:

- Reset password membutuhkan Supabase service role key.
- Teacher dan student tidak di-reset dari halaman Users jika kebijakan project tetap memisahkan CRUD guru/siswa.

### 5.4 Aktif/Nonaktif User

1. Klik toggle status.
2. User inactive tidak boleh mengakses sistem.

## 6. Roles dan Permissions

Lokasi:

- `/dashboard/admin/roles`
- `/dashboard/admin/permissions`

### 6.1 Roles

Halaman Roles menampilkan:

- nama role,
- label role,
- jumlah user,
- jumlah permission.

Super admin dapat mengubah label role jika permission tersedia.

### 6.2 Permissions Matrix

Halaman Permissions menampilkan mapping role-permission.

Gunakan fitur ini dengan hati-hati:

- Jangan mencabut permission login/dashboard dari role aktif.
- Jangan memberikan permission super admin ke role umum tanpa kebijakan.
- Setelah permission diubah, user sebaiknya logout dan login ulang.

## 7. Master Data

Lokasi:

- `/dashboard/master-data`

Master data adalah fondasi sistem. Pastikan data ini lengkap sebelum membuat ujian.

Urutan yang disarankan:

1. Sekolah
2. Tahun Ajaran
3. Semester
4. Kelas
5. Mata Pelajaran
6. Guru
7. Siswa
8. Assignment guru-mapel-kelas
9. Assignment siswa-kelas

## 8. Master Data Sekolah

Lokasi:

- `/dashboard/master-data/schools`

Digunakan untuk mengelola data sekolah.

Field umum:

- nama sekolah,
- NPSN,
- email,
- telepon,
- alamat,
- status aktif.

Cara penggunaan:

1. Isi form sekolah.
2. Klik simpan.
3. Gunakan toggle aktif/nonaktif jika diperlukan.

Catatan:

- Sistem saat ini single-school secara operasional, tetapi schema sudah multi-school ready.
- Jangan hard delete data sekolah.

## 9. Tahun Ajaran

Lokasi:

- `/dashboard/master-data/academic-years`

Field:

- sekolah,
- nama tahun ajaran, misalnya `2025/2026`,
- tanggal mulai,
- tanggal selesai,
- status aktif.

Cara setting tahun ajaran aktif:

1. Buat tahun ajaran.
2. Klik aktifkan.
3. Sistem akan menonaktifkan tahun ajaran lain pada scope yang sama jika logic aktifnya tersedia.

Catatan:

- Kelas dan jadwal ujian bergantung pada tahun ajaran.

## 10. Semester

Lokasi:

- `/dashboard/master-data/semesters`

Field:

- tahun ajaran,
- nama semester,
- tanggal mulai,
- tanggal selesai,
- status aktif.

Gunakan semester untuk mengelompokkan jadwal dan laporan.

## 11. Kelas

Lokasi:

- `/dashboard/master-data/classes`

Field:

- nama kelas, contoh `VII A`,
- grade level,
- sekolah,
- tahun ajaran,
- wali kelas/homeroom teacher,
- status aktif.

### 11.1 Tambah Kelas

1. Pilih sekolah.
2. Pilih tahun ajaran.
3. Isi nama kelas.
4. Isi grade level.
5. Pilih wali kelas jika ada.
6. Simpan.

### 11.2 Import Kelas CSV

1. Download template kelas.
2. Isi data sesuai format.
3. Upload file CSV.
4. Sistem akan membuat/update data kelas sesuai logic import.

## 12. Mata Pelajaran

Lokasi:

- `/dashboard/master-data/subjects`

Field:

- sekolah,
- kode mapel,
- nama mapel,
- status aktif.

Contoh:

- kode: `MTK`
- nama: `Matematika`

Catatan:

- Kode mapel disarankan unik dalam sekolah.
- Bank soal dan paket ujian bergantung pada subject/mapel.

## 13. Guru

Lokasi:

- `/dashboard/master-data/teachers`

Data guru berasal dari:

- `users`,
- `user_profiles`,
- role `teacher`.

### 13.1 Tambah Guru

1. Buka Master Data Guru.
2. Isi:
   - nama lengkap,
   - NIP,
   - email,
   - username,
   - telepon,
   - password awal.
3. Simpan.

Sistem membuat user dengan role teacher.

### 13.2 Import Guru CSV

1. Download template guru.
2. Isi data guru.
3. Upload CSV.
4. Sistem membuat user guru secara batch.

### 13.3 Assignment Guru ke Mapel/Kelas

1. Pilih guru.
2. Pilih subject/mapel.
3. Pilih kelas.
4. Pilih tahun ajaran.
5. Simpan assignment.

Assignment guru disimpan di `teacher_subjects`.

Guru hanya dapat melihat/mengelola data sesuai assignment yang diberikan.

## 14. Admin Sekolah

Lokasi:

- `/dashboard/master-data/admins`

Admin Sekolah adalah akun operasional sekolah yang membantu mengelola data dan ujian.

### 14.1 Tambah Admin Sekolah

1. Buka Master Data Admin Sekolah.
2. Isi:
   - nama lengkap,
   - email,
   - username,
   - password awal,
   - status.
3. Simpan.

Sistem akan membuat akun dengan role `admin`.

### 14.2 Edit dan Reset Password Admin Sekolah

1. Cari admin sekolah.
2. Klik Edit untuk mengubah data.
3. Gunakan Reset untuk mengganti password.
4. Gunakan Aktif/Nonaktifkan untuk mengatur akses login.

Catatan:

- Admin sekolah tidak sama dengan Super Admin.
- Batasi pembuatan admin sekolah sesuai kebijakan internal.

## 15. Proctor / Pengawas

Lokasi:

- `/dashboard/master-data/proctors`

Proctor/Pengawas adalah akun untuk monitoring pelaksanaan ujian.

### 15.1 Tambah Proctor

1. Buka Master Data Proctor/Pengawas.
2. Isi:
   - nama lengkap,
   - email,
   - username,
   - password awal,
   - status.
3. Simpan.

Sistem akan membuat akun dengan role `proctor`.

### 15.2 Edit dan Reset Password Proctor

1. Cari proctor.
2. Klik Edit.
3. Ubah data jika diperlukan.
4. Reset password jika pengawas lupa password.
5. Nonaktifkan jika proctor tidak lagi bertugas.

Catatan:

- Saat ini proctor adalah role user.
- Assignment proctor ke jadwal/kelas/ruang dapat ditambahkan pada sprint berikutnya.

## 16. Siswa

Lokasi:

- `/dashboard/master-data/students`

Data siswa berasal dari:

- `users`,
- `user_profiles`,
- role `student`.

### 14.1 Tambah Siswa

1. Buka Master Data Siswa.
2. Isi:
   - nama lengkap,
   - NIS,
   - NISN,
   - telepon,
   - email,
   - username,
   - password awal.
3. Simpan.

### 14.2 Import Siswa CSV

1. Download template siswa.
2. Isi data siswa.
3. Upload CSV.
4. Sistem membuat user siswa secara batch.

### 14.3 Assign Siswa ke Kelas

1. Pilih siswa.
2. Pilih kelas.
3. Simpan.

Assignment siswa disimpan di `class_members`.

Catatan:

- Riwayat kelas tidak ditimpa sembarangan.
- Jika siswa pindah kelas, record lama diberi `left_at`, lalu dibuat record baru.

## 17. Bank Soal

Lokasi:

- `/dashboard/question-bank`
- `/dashboard/question-bank/questions`
- `/dashboard/question-bank/categories`

Bank Soal digunakan untuk membuat dan mengelola soal.

Struktur soal:

- sekolah,
- subject/mapel,
- kategori,
- tipe soal,
- tingkat kesulitan,
- status,
- opsi jawaban untuk pilihan ganda.

## 18. Kategori Soal

Lokasi:

- `/dashboard/question-bank/categories`

### 16.1 Tambah Kategori

1. Pilih mapel.
2. Isi nama kategori.
3. Isi deskripsi jika diperlukan.
4. Simpan.

Contoh kategori:

- Aljabar,
- Geometri,
- Teks Narasi,
- Sistem Pencernaan.

### 16.2 Edit/Nonaktifkan Kategori

1. Klik edit pada kategori.
2. Ubah data.
3. Simpan.

Kategori bisa dinonaktifkan jika tidak digunakan.

## 19. Soal

Lokasi:

- `/dashboard/question-bank/questions`

### 17.1 Tambah Soal Pilihan Ganda

1. Pilih mapel.
2. Pilih kategori.
3. Pilih tipe `multiple_choice`.
4. Pilih difficulty:
   - easy,
   - medium,
   - hard.
5. Isi konten soal.
6. Isi point.
7. Isi opsi A, B, C, D.
8. Pilih satu jawaban benar.
9. Isi pembahasan jika perlu.
10. Pilih status:
    - draft,
    - published.
11. Simpan.

Aturan:

- Minimal 2 opsi.
- Tepat 1 opsi benar.
- Point harus lebih dari 0.

### 17.2 Tambah Soal Essay

1. Pilih mapel.
2. Pilih kategori.
3. Pilih tipe `essay`.
4. Isi konten soal.
5. Isi point.
6. Isi pembahasan/rubrik jika diperlukan.
7. Simpan.

Catatan:

- Soal essay tidak membuat `question_options`.
- Essay perlu koreksi manual setelah siswa submit.

### 17.3 Publish/Archive Soal

- Draft: belum siap dipakai.
- Published: bisa dipakai pada paket ujian.
- Archived: tidak digunakan lagi.

Gunakan publish hanya setelah soal diperiksa.

### 17.4 Import Soal CSV

1. Download template bank soal.
2. Isi subject code, kategori, tipe, difficulty, konten, opsi, jawaban benar.
3. Upload CSV di halaman soal.
4. Sistem akan memvalidasi dan membuat soal.

Catatan:

- Guru hanya bisa import ke mapel yang ditugaskan.

## 20. Paket Ujian

Lokasi:

- `/dashboard/exams/packages`

Paket ujian adalah kumpulan soal yang akan digunakan dalam jadwal ujian.

Field:

- sekolah,
- mapel,
- judul paket,
- deskripsi,
- durasi,
- status,
- shuffle question,
- shuffle option,
- show result,
- daftar soal.

### 18.1 Membuat Paket Ujian

1. Buka menu Exams > Paket Ujian.
2. Pilih sekolah.
3. Pilih mapel.
4. Isi judul paket.
5. Isi durasi menit.
6. Pilih soal published.
7. Atur:
   - shuffle questions,
   - shuffle options,
   - show result.
8. Simpan sebagai draft atau published.

### 18.2 Status Paket

- `draft`: belum bisa dipakai untuk jadwal aktif.
- `published`: bisa dipakai untuk jadwal.
- `archived`: tidak digunakan lagi.

### 18.3 Show Result

Jika `show_result` aktif:

- siswa dapat melihat hasil setelah submit,
- untuk essay, hasil tetap menunggu koreksi/finalisasi.

Jika `show_result` nonaktif:

- siswa tidak melihat nilai detail.

## 21. Jadwal Ujian

Lokasi:

- `/dashboard/exams/schedules`

Jadwal ujian menghubungkan paket ujian dengan kelas target dan waktu ujian.

Field:

- sekolah,
- paket ujian,
- tahun ajaran,
- semester,
- judul jadwal,
- waktu mulai,
- waktu selesai,
- status,
- token required,
- kelas target.

### 19.1 Membuat Jadwal Ujian

1. Pilih paket ujian yang sudah published.
2. Pilih tahun ajaran.
3. Pilih semester jika ada.
4. Isi judul jadwal.
5. Tentukan waktu mulai dan selesai.
6. Pilih status awal:
   - draft,
   - scheduled,
   - active.
7. Centang token required jika siswa wajib memasukkan token.
8. Pilih kelas target.
9. Simpan.

### 19.2 Sync Peserta

Setelah kelas target dipilih:

1. Klik `Sync Peserta`.
2. Sistem mengambil siswa aktif dari `class_members`.
3. Sistem membuat `exam_participants` yang belum ada.
4. Peserta lama dan attempt lama tidak dihapus.

Gunakan sync peserta jika:

- ada siswa baru di kelas,
- jadwal baru dibuat,
- siswa belum muncul di monitoring atau active exams.

### 19.3 Publish/Active Jadwal

Sebelum jadwal menjadi `scheduled` atau `active`, sistem memvalidasi:

- paket harus published,
- paket harus aktif,
- paket harus punya soal,
- kelas target harus ada,
- peserta harus tersedia.

### 19.4 Token Ujian

Jika token required aktif:

1. Klik `Token Baru`.
2. Sistem membuat token baru.
3. Berikan token kepada siswa saat ujian dimulai.

Catatan:

- Token lama tidak berlaku setelah regenerate.
- Token hanya berlaku untuk jadwal tersebut.

## 22. Alur Siswa Mengerjakan Ujian

Lokasi siswa:

- `/dashboard/student/active-exams`
- `/dashboard/student/schedules`
- `/dashboard/exam-room/[attemptId]`

### 20.1 Melihat Ujian Aktif

1. Login sebagai siswa.
2. Buka menu Active Exams.
3. Sistem menampilkan ujian yang sesuai kelas siswa dan waktu aktif.

Jika ujian tidak muncul:

- Pastikan siswa sudah assign ke kelas.
- Pastikan jadwal menarget kelas siswa.
- Pastikan peserta sudah di-sync.
- Pastikan waktu ujian sedang aktif.
- Pastikan jadwal aktif dan status sesuai.

### 20.2 Memulai Ujian

1. Klik mulai ujian.
2. Jika token required, masukkan token.
3. Sistem membuat attempt.
4. Siswa masuk ke halaman exam room.

### 20.3 Halaman Pengerjaan Soal

Halaman exam room menampilkan:

- timer hitung mundur,
- informasi ujian,
- stimulus/konten soal,
- opsi jawaban,
- navigasi sebelumnya/selanjutnya,
- daftar nomor soal,
- status soal:
  - aktif,
  - sudah dijawab,
  - belum dijawab.

Jawaban disimpan otomatis setiap memilih opsi atau mengisi essay.

### 20.4 Fullscreen dan Anti-Cheating

Saat ujian:

- siswa diarahkan masuk fullscreen,
- pindah tab/minimize akan dicatat,
- kehilangan fokus akan dicatat,
- keluar fullscreen akan dicatat,
- copy/paste/klik kanan/shortcut umum diblokir.

Aturan pelanggaran:

- pelanggaran 1: peringatan,
- pelanggaran 2: peringatan keras,
- pelanggaran 8: auto-submit.

Saat siswa klik `Saya Mengerti`, sistem mencoba masuk fullscreen kembali.

### 20.5 Submit Ujian

1. Pastikan jawaban sudah terisi.
2. Klik submit.
3. Sistem menampilkan konfirmasi.
4. Setelah submit, attempt tidak bisa dikerjakan lagi.

Jika waktu habis, sistem akan auto-submit/expire sesuai kondisi attempt.

## 23. Monitoring Ujian

Lokasi:

- `/dashboard/proctor/monitoring`
- `/dashboard/admin/monitoring`
- `/dashboard/super-admin/monitoring`
- `/dashboard/teacher/monitoring`

Monitoring digunakan oleh pengawas/admin/guru untuk memantau peserta.

### 21.1 Filter Monitoring

Filter tersedia:

- mapel,
- jadwal,
- kelas,
- status peserta.

### 21.2 Data yang Ditampilkan

Monitoring menampilkan:

- nama peserta,
- kelas,
- status attempt,
- waktu mulai,
- waktu submit,
- last save,
- jumlah jawaban,
- jumlah event anti-cheat,
- event terakhir,
- lock status,
- action.

### 21.3 Status Peserta

Status umum:

- assigned: belum mulai,
- in_progress: sedang mengerjakan,
- submitted: sudah submit,
- expired: waktu habis,
- absent: tidak hadir,
- cancelled: dibatalkan/reset.

### 21.4 Force Submit

Gunakan force submit jika:

- siswa tidak bisa submit sendiri,
- pengawas perlu mengakhiri attempt,
- terjadi kondisi teknis tertentu.

Cara:

1. Cari peserta.
2. Klik Force Submit.
3. Konfirmasi.
4. Sistem menilai jawaban tersimpan dan submit attempt.

### 21.5 Reset Attempt

Gunakan reset jika:

- siswa gagal teknis,
- attempt rusak,
- siswa perlu mulai ulang.

Cara:

1. Klik Reset.
2. Konfirmasi.
3. Attempt lama menjadi `cancelled`.
4. Peserta kembali `assigned`.
5. Siswa dapat mulai ulang.

### 21.6 Lock Attempt

Gunakan lock jika:

- siswa dicurigai bermasalah,
- pengawas ingin menghentikan sementara pengerjaan.

Saat locked:

- siswa tidak bisa menyimpan jawaban,
- siswa tidak bisa submit,
- halaman soal menjadi read-only.

### 21.7 Unlock Attempt

Gunakan unlock jika:

- siswa boleh melanjutkan ujian.

Setelah unlock:

- siswa dapat melanjutkan menjawab dan submit.

### 21.8 Mark Absent

Gunakan absent untuk peserta yang tidak hadir dan belum memulai ujian.

Cara:

1. Cari peserta dengan status belum mulai.
2. Klik Absent.
3. Konfirmasi.

## 24. Koreksi Essay

Lokasi:

- `/dashboard/teacher/grading`
- detail hasil: `/dashboard/exam-results/[attemptId]`

### 22.1 Daftar Grading

Guru melihat attempt yang sudah submitted.

Filter:

- status grading,
- mapel,
- jadwal,
- pencarian siswa.

Status grading:

- `needs_manual_grading`: perlu koreksi essay,
- `auto_scored`: otomatis dinilai,
- `finalized`: nilai final.

### 22.2 Koreksi Essay

1. Buka detail attempt.
2. Cari jawaban essay.
3. Isi skor.
4. Klik simpan.

Sistem:

- menyimpan skor essay,
- menandai jawaban tidak lagi perlu koreksi,
- menghitung ulang nilai attempt,
- mencatat audit log.

### 22.3 Finalisasi Nilai

Finalisasi dapat dilakukan jika:

- semua essay sudah dikoreksi,
- tidak ada pending manual grading.

Cara:

1. Buka detail attempt.
2. Klik Finalize.
3. Konfirmasi.

Setelah finalized:

- nilai dianggap final,
- laporan menghitung attempt tersebut dalam rata-rata finalized.

## 25. Hasil Siswa

Lokasi:

- `/dashboard/student/history`
- `/dashboard/exam-results/[attemptId]`

Siswa dapat melihat riwayat ujian setelah submit/expired.

Nilai ditampilkan jika:

- paket ujian mengaktifkan `show_result`,
- grading tidak pending.

Jika hasil belum dibuka:

- siswa melihat pesan bahwa hasil belum tersedia.

Jika essay belum selesai dikoreksi:

- siswa melihat status menunggu penilaian.

## 26. Reports/Laporan

Lokasi:

- `/dashboard/reports`
- `/dashboard/reports/exams`
- `/dashboard/reports/classes`
- `/dashboard/reports/subjects`
- `/dashboard/reports/students`

Jenis laporan:

- per ujian,
- per kelas,
- per mapel,
- per siswa.

### 24.1 Prinsip Perhitungan Nilai

Rata-rata nilai laporan memakai attempt dengan grading status `finalized`.

Attempt yang belum final tidak dihitung sebagai nilai final.

Laporan juga menampilkan:

- peserta,
- submitted,
- finalized,
- pending grading,
- expired,
- absent.

### 24.2 Filter Laporan

Filter tersedia:

- search,
- tahun ajaran,
- semester,
- jadwal,
- kelas,
- mapel,
- status attempt,
- status grading.

### 24.3 Export CSV

1. Terapkan filter.
2. Klik Export CSV.
3. File CSV akan mengikuti filter yang sama.

Export dicatat ke audit log.

Nilai non-final tidak diexport sebagai skor final.

## 27. Import/Export

Lokasi:

- `/dashboard/import-export`

Fitur:

- download template CSV,
- preview struktur CSV,
- import guru,
- import siswa,
- import kelas,
- import assignment siswa-kelas,
- import assignment guru-mapel-kelas,
- import bank soal,
- export laporan.

### 25.1 Download Template

1. Buka Import/Export.
2. Pilih template.
3. Download CSV.

Download template dicatat ke audit log.

### 25.2 Preview CSV

1. Pilih tipe template.
2. Upload CSV.
3. Sistem memvalidasi header.
4. Jika header belum lengkap, sistem menampilkan error.

### 25.3 Import Commit

Beberapa import dilakukan dari halaman modul:

- guru dari Master Data Guru,
- siswa dari Master Data Siswa,
- kelas dari Master Data Kelas,
- bank soal dari Bank Soal,
- assignment dari halaman guru/siswa.

## 28. Audit Logs

Lokasi:

- `/dashboard/admin/audit-logs`

Audit logs mencatat aktivitas penting seperti:

- perubahan user,
- perubahan role/permission,
- import data,
- perubahan master data,
- perubahan bank soal,
- paket/jadwal ujian,
- token regenerate,
- monitoring action,
- grading/finalize,
- export laporan,
- download template.

### 26.1 Filter Audit Logs

Filter:

- keyword,
- action,
- entity,
- user ID,
- limit data.

Contoh action:

- `exam_attempts.force_submit`,
- `exam_attempts.lock`,
- `exam_results.finalize`,
- `reports.export`,
- `templates.download`.

## 29. Settings dan Backup/Recovery

### 27.1 Settings

Lokasi:

- `/dashboard/super-admin/settings`

Halaman ini menampilkan:

- identitas aplikasi dari environment,
- readiness Supabase,
- service role status,
- maintenance flag,
- checklist security.

Catatan:

- Settings saat ini read-only.
- Persistence settings membutuhkan schema tambahan.

### 27.2 Backup/Recovery

Lokasi:

- `/dashboard/super-admin/backup-recovery`

Halaman ini berisi:

- readiness backup,
- checklist sebelum migration,
- runbook recovery manual.

Rekomendasi:

- Backup database sebelum migration.
- Backup sebelum simulasi besar.
- Simpan catatan waktu backup.
- Uji restore di environment aman sebelum production.

## 30. Alur Operasional Ujian dari Awal sampai Akhir

### 28.1 Persiapan Data

1. Pastikan sekolah aktif.
2. Buat tahun ajaran.
3. Buat semester.
4. Buat kelas.
5. Buat mapel.
6. Buat guru.
7. Buat siswa.
8. Assign guru ke mapel dan kelas.
9. Assign siswa ke kelas.

### 28.2 Persiapan Soal

1. Buat kategori soal.
2. Buat soal draft.
3. Review soal.
4. Publish soal.

### 28.3 Persiapan Paket

1. Buat paket ujian.
2. Pilih soal published.
3. Atur durasi.
4. Atur shuffle.
5. Atur show result.
6. Publish paket.

### 28.4 Persiapan Jadwal

1. Buat jadwal.
2. Pilih paket.
3. Pilih tahun ajaran/semester.
4. Pilih waktu.
5. Pilih kelas target.
6. Aktifkan token jika perlu.
7. Sync peserta.
8. Ubah status ke scheduled/active.

### 28.5 Pelaksanaan

1. Pengawas buka monitoring.
2. Siswa login.
3. Siswa buka active exams.
4. Siswa masukkan token.
5. Siswa mengerjakan ujian.
6. Pengawas memantau event dan progress.
7. Jika perlu, pengawas lock/unlock/reset/force submit/absent.

### 28.6 Setelah Ujian

1. Guru koreksi essay.
2. Guru finalize nilai.
3. Admin/principal buka laporan.
4. Export CSV jika diperlukan.
5. Super admin cek audit logs.

## 31. Troubleshooting

### 29.1 Siswa Tidak Melihat Ujian

Cek:

- siswa sudah punya role `student`,
- siswa status active,
- siswa sudah masuk class_members,
- jadwal menarget kelas siswa,
- peserta sudah di-sync,
- jadwal status active/scheduled sesuai waktu,
- waktu ujian sedang berlaku.

### 29.2 Token Salah

Cek:

- token terbaru pada jadwal,
- token sudah regenerate atau belum,
- siswa mengetik token tanpa spasi,
- jadwal yang dipilih benar.

### 29.3 Jawaban Tidak Tersimpan

Cek:

- koneksi internet,
- attempt masih in_progress,
- attempt tidak locked,
- waktu ujian belum habis,
- session siswa masih valid.

### 29.4 Siswa Keluar Fullscreen

Sistem akan:

- mencatat event,
- menampilkan warning,
- meminta siswa masuk fullscreen kembali.

Jika pelanggaran mencapai batas 8 kali:

- sistem auto-submit attempt.

### 29.5 Monitoring Tidak Menampilkan Peserta

Cek:

- jadwal sudah punya kelas target,
- Sync Peserta sudah dijalankan,
- siswa aktif ada di kelas,
- filter monitoring tidak terlalu sempit.

### 29.6 Nilai Tidak Muncul ke Siswa

Cek:

- `show_result` pada paket ujian,
- apakah essay masih pending,
- apakah nilai sudah finalized,
- apakah siswa membuka attempt yang benar.

### 29.7 Laporan Rata-rata Kosong

Cek:

- apakah attempt sudah finalized,
- filter tahun/semester/jadwal/kelas/mapel,
- status grading,
- apakah data masih pending manual grading.

## 32. Checklist Sebelum Simulasi Ujian

Gunakan checklist ini sebelum simulasi:

- [ ] Semua migration sudah dijalankan di Supabase.
- [ ] Role dan permission sudah benar.
- [ ] User admin/guru/siswa/proctor sudah bisa login.
- [ ] Siswa sudah assign ke kelas.
- [ ] Guru sudah assign ke mapel/kelas.
- [ ] Soal sudah published.
- [ ] Paket ujian sudah published.
- [ ] Jadwal ujian sudah dibuat.
- [ ] Peserta sudah sync.
- [ ] Token sudah dibuat jika required.
- [ ] Pengawas bisa membuka monitoring.
- [ ] Siswa bisa membuka active exams.
- [ ] Uji satu siswa mengerjakan sampai submit.
- [ ] Uji lock/unlock.
- [ ] Uji force submit.
- [ ] Uji reset attempt.
- [ ] Uji koreksi essay jika ada.
- [ ] Uji laporan dan export.
- [ ] Cek audit logs.

## 33. Checklist Sebelum Production

Sebelum production:

- [ ] Backup database.
- [ ] Jalankan lint/build.
- [ ] Pastikan environment Supabase benar.
- [ ] Pastikan service role key tersedia hanya di server.
- [ ] Pastikan migration audit logs tersedia.
- [ ] Pastikan migration lock fields tersedia.
- [ ] Uji login semua role.
- [ ] Uji RBAC menu semua role.
- [ ] Uji sync peserta.
- [ ] Uji exam room mobile dan desktop.
- [ ] Uji anti-cheating.
- [ ] Uji laporan finalized.
- [ ] Uji export CSV.
- [ ] Uji audit logs.
- [ ] Siapkan SOP jika koneksi siswa bermasalah.
- [ ] Siapkan operator yang memegang akses proctor/admin.

## 34. Catatan Batasan Saat Ini

Beberapa fitur sudah ada sebagai fondasi, tetapi belum final production enterprise:

- RLS production hardening belum menjadi fokus utama.
- Proctor assignment khusus jadwal/ruang belum ada.
- Backup otomatis belum aktif.
- Settings masih read-only.
- Audit log belum memiliki date range/detail drawer.
- Rich text/media attachment soal belum ada.
- Supabase realtime monitoring belum aktif; monitoring memakai auto-refresh.

Prioritas perbaikan berikutnya:

1. review final paket sebelum publish,
2. validasi konflik jadwal,
3. offline/retry autosave exam room,
4. proctor assignment,
5. admin grading review,
6. audit log date range,
7. ganti password mandiri.
