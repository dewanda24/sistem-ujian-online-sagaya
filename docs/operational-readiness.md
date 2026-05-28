# Operational Readiness Checklist

Gunakan checklist ini sebelum simulasi atau pelaksanaan ujian.

## Data Awal

- Sekolah aktif sudah ada.
- Tahun ajaran aktif sudah ada.
- Semester aktif sudah ada.
- Kelas aktif sudah ada.
- Guru dan siswa berstatus active.
- Siswa sudah masuk `class_members` kelas aktif.
- Guru sudah punya assignment di `teacher_subjects`.

## Bank Soal

- Kategori soal sudah dibuat.
- Soal sudah memiliki status `published`.
- Pilihan ganda memiliki tepat satu jawaban benar.
- Essay memiliki poin yang sesuai kebutuhan koreksi manual.

## Paket dan Jadwal

- Paket ujian sudah `published`.
- Jadwal ujian sudah memilih kelas target.
- `start_at` dan `end_at` sesuai waktu pelaksanaan.
- Status jadwal `active` atau `scheduled`.
- Token dibuat jika `token_required` aktif.

## Pelaksanaan

- Student login dan membuka `Active Exams`.
- Jika token required, token dibagikan oleh operator/proktor.
- Proctor membuka `Exam Monitoring`.
- Monitoring dicek berkala dengan refresh halaman.
- Event anti-cheat dipakai sebagai sinyal audit, belum sebagai auto-block.

## Setelah Ujian

- Student submit ujian atau attempt expired otomatis saat melewati waktu.
- Pilihan ganda masuk auto score.
- Essay masuk `needs_manual_grading`.
- Guru membuka `Grading`, memberi skor essay, lalu finalize.
- Kepala sekolah/admin membuka `Reports`.
- Export CSV diambil dari report siswa jika diperlukan.

## Catatan Produksi

- Jalankan semua migration SQL di Supabase sebelum demo.
- Pastikan `.env.local` hanya ada di server/developer machine.
- Jangan expose service role key ke browser.
- Backup data sebelum reset jadwal atau simulasi besar.
