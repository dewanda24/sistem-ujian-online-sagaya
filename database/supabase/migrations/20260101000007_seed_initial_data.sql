-- ==============================================================================
-- CANONICAL MIGRATION 07: SEED INITIAL ROLES, PERMISSIONS & PLATFORM SETTINGS
-- Seeds baseline system roles, comprehensive permission matrix, role-permission
-- mappings, and global platform defaults.
-- ==============================================================================

-- 1. BASELINE ROLES
insert into public.roles (name, label, description)
values
  ('super_admin', 'Super Administrator', 'Akses penuh platform lintas sekolah dan konfigurasi sistem.'),
  ('admin', 'Administrator Sekolah', 'Pengelola operasional sekolah, data master, akun, dan ujian.'),
  ('teacher', 'Guru Pengajar', 'Penyusun butir bank soal, perakit naskah ujian, dan penilai esai.'),
  ('student', 'Siswa / Peserta', 'Peserta ujian CBT dengan akses pengerjaan dan hasil nilai.'),
  ('proctor', 'Pengawas Ujian', 'Pengawas sesi ujian, monitoring pengerjaan, dan reset login/sesi siswa.'),
  ('principal', 'Kepala Sekolah', 'Pemantau operasional sekolah dan peninjau rekap laporan hasil ujian.')
on conflict (name) do update
set
  label = excluded.label,
  description = excluded.description;

-- 2. SYSTEM PERMISSIONS
insert into public.permissions (code, module, action, description)
values
  -- Dashboard
  ('dashboard.view', 'dashboard', 'view', 'Melihat dashboard utama sesuai role'),

  -- Schools
  ('schools.view', 'schools', 'view', 'Melihat data sekolah'),
  ('schools.create', 'schools', 'create', 'Mendaftarkan sekolah baru'),
  ('schools.update', 'schools', 'update', 'Memperbarui informasi sekolah'),
  ('schools.delete', 'schools', 'delete', 'Menghapus data sekolah'),
  ('schools.manage', 'schools', 'manage', 'Mengelola sekolah secara penuh'),

  -- Users & Roles
  ('users.view', 'users', 'view', 'Melihat daftar pengguna'),
  ('users.create', 'users', 'create', 'Membuat akun pengguna baru'),
  ('users.update', 'users', 'update', 'Memperbarui profil atau akun pengguna'),
  ('users.delete', 'users', 'delete', 'Menghapus pengguna'),
  ('users.manage', 'users', 'manage', 'Mengelola pengguna secara penuh'),
  ('roles.manage', 'roles', 'manage', 'Mengatur peran dan hak akses'),

  -- Academic Master Data
  ('master_data.view', 'master_data', 'view', 'Melihat modul master data akademik'),
  ('academic_years.view', 'academic_years', 'view', 'Melihat tahun ajaran'),
  ('academic_years.manage', 'academic_years', 'manage', 'Mengelola tahun ajaran'),
  ('semesters.view', 'semesters', 'view', 'Melihat semester'),
  ('semesters.manage', 'semesters', 'manage', 'Mengelola semester'),
  ('classes.view', 'classes', 'view', 'Melihat daftar kelas'),
  ('classes.manage', 'classes', 'manage', 'Mengelola rombel dan anggota kelas'),
  ('subjects.view', 'subjects', 'view', 'Melihat mata pelajaran'),
  ('subjects.manage', 'subjects', 'manage', 'Mengelola mata pelajaran'),
  ('teachers.view', 'teachers', 'view', 'Melihat daftar guru'),
  ('teachers.manage', 'teachers', 'manage', 'Mengelola guru dan penugasan mapel'),
  ('students.view', 'students', 'view', 'Melihat daftar siswa'),
  ('students.manage', 'students', 'manage', 'Mengelola data siswa'),

  -- Question Bank
  ('question_bank.view', 'question_bank', 'view', 'Melihat bank soal'),
  ('question_bank.manage', 'question_bank', 'manage', 'Mengelola bank soal secara menyeluruh'),
  ('question_bank.export', 'question_bank', 'export', 'Mengekspor bank soal ke format dokumen'),
  ('questions.create', 'questions', 'create', 'Membuat butir soal baru'),
  ('questions.update', 'questions', 'update', 'Mengedit butir soal'),
  ('questions.publish', 'questions', 'publish', 'Mempublikasikan butir soal'),
  ('questions.archive', 'questions', 'archive', 'Mengarsipkan butir soal'),
  ('question_categories.view', 'question_categories', 'view', 'Melihat kategori soal'),
  ('question_categories.manage', 'question_categories', 'manage', 'Mengelola kategori soal'),

  -- Exam Management & Delivery
  ('exams.view', 'exams', 'view', 'Melihat menu ujian'),
  ('exam_packages.view', 'exam_packages', 'view', 'Melihat paket naskah ujian'),
  ('exam_packages.manage', 'exam_packages', 'manage', 'Membuat dan mengelola paket ujian'),
  ('exam_packages.archive', 'exam_packages', 'archive', 'Mengarsipkan paket ujian'),
  ('exam_schedules.view', 'exam_schedules', 'view', 'Melihat jadwal pelaksanaan ujian'),
  ('exam_schedules.manage', 'exam_schedules', 'manage', 'Mengatur jadwal ujian dan peserta'),
  ('exam_schedules.archive', 'exam_schedules', 'archive', 'Mengarsipkan jadwal ujian'),
  ('exam_tokens.manage', 'exam_tokens', 'manage', 'Merilis dan mereset token ujian'),
  ('exam_monitoring.view', 'exam_monitoring', 'view', 'Memantau live monitoring ujian'),
  ('exam_sessions.control', 'exam_sessions', 'control', 'Mengontrol sesi ujian siswa (reset, submit paksa)'),

  -- Student Exam Execution
  ('active_exams.view', 'active_exams', 'view', 'Melihat daftar ujian yang dapat dikerjakan siswa'),
  ('exam_room.access', 'exam_room', 'access', 'Masuk ke ruang ujian CBT'),
  ('exam_attempts.start', 'exam_attempts', 'start', 'Memulai pengerjaan ujian'),
  ('exam_answers.save', 'exam_answers', 'save', 'Menyimpan jawaban butir soal'),
  ('exam_attempts.submit', 'exam_attempts', 'submit', 'Menyelesaikan dan mengirim ujian'),

  -- Grading, Results & Reports
  ('grading.view', 'grading', 'view', 'Melihat daftar jawaban esai untuk dikoreksi'),
  ('grading.manage', 'grading', 'manage', 'Menilai dan memberi feedback jawaban esai'),
  ('exam_results.view', 'exam_results', 'view', 'Melihat hasil dan nilai ujian'),
  ('exam_results.finalize', 'exam_results', 'finalize', 'Finalisasi nilai ujian'),
  ('exam_results.recap', 'exam_results', 'recap', 'Rekapitulasi nilai per kelas dan mapel'),
  ('reports.view', 'reports', 'view', 'Melihat laporan statistik ujian'),
  ('reports.export', 'reports', 'export', 'Mengekspor laporan nilai (Excel/PDF)'),

  -- System & Utilities
  ('import_export.view', 'import_export', 'view', 'Mengakses modul import dan export data'),
  ('audit_logs.view', 'audit_logs', 'view', 'Melihat riwayat aktivitas dan audit log sistem'),
  ('system_settings.manage', 'system_settings', 'manage', 'Mengonfigurasi pengaturan global platform')
on conflict (code) do update
set
  module = excluded.module,
  action = excluded.action,
  description = excluded.description;

-- 3. MAP PERMISSIONS TO ROLES
-- Helper CTE to insert mappings cleanly
with role_perm_matrix(role_name, permission_code) as (
  values
    -- Super Admin: gets all system permissions
    ('super_admin', 'dashboard.view'),
    ('super_admin', 'schools.view'),
    ('super_admin', 'schools.create'),
    ('super_admin', 'schools.update'),
    ('super_admin', 'schools.delete'),
    ('super_admin', 'schools.manage'),
    ('super_admin', 'users.view'),
    ('super_admin', 'users.create'),
    ('super_admin', 'users.update'),
    ('super_admin', 'users.delete'),
    ('super_admin', 'users.manage'),
    ('super_admin', 'roles.manage'),
    ('super_admin', 'master_data.view'),
    ('super_admin', 'academic_years.view'),
    ('super_admin', 'academic_years.manage'),
    ('super_admin', 'semesters.view'),
    ('super_admin', 'semesters.manage'),
    ('super_admin', 'classes.view'),
    ('super_admin', 'classes.manage'),
    ('super_admin', 'subjects.view'),
    ('super_admin', 'subjects.manage'),
    ('super_admin', 'teachers.view'),
    ('super_admin', 'teachers.manage'),
    ('super_admin', 'students.view'),
    ('super_admin', 'students.manage'),
    ('super_admin', 'question_bank.view'),
    ('super_admin', 'question_bank.manage'),
    ('super_admin', 'question_bank.export'),
    ('super_admin', 'questions.create'),
    ('super_admin', 'questions.update'),
    ('super_admin', 'questions.publish'),
    ('super_admin', 'questions.archive'),
    ('super_admin', 'question_categories.view'),
    ('super_admin', 'question_categories.manage'),
    ('super_admin', 'exams.view'),
    ('super_admin', 'exam_packages.view'),
    ('super_admin', 'exam_packages.manage'),
    ('super_admin', 'exam_packages.archive'),
    ('super_admin', 'exam_schedules.view'),
    ('super_admin', 'exam_schedules.manage'),
    ('super_admin', 'exam_schedules.archive'),
    ('super_admin', 'exam_tokens.manage'),
    ('super_admin', 'exam_monitoring.view'),
    ('super_admin', 'exam_sessions.control'),
    ('super_admin', 'grading.view'),
    ('super_admin', 'grading.manage'),
    ('super_admin', 'exam_results.view'),
    ('super_admin', 'exam_results.finalize'),
    ('super_admin', 'exam_results.recap'),
    ('super_admin', 'reports.view'),
    ('super_admin', 'reports.export'),
    ('super_admin', 'import_export.view'),
    ('super_admin', 'audit_logs.view'),
    ('super_admin', 'system_settings.manage'),

    -- School Admin
    ('admin', 'dashboard.view'),
    ('admin', 'schools.view'),
    ('admin', 'users.view'),
    ('admin', 'users.create'),
    ('admin', 'users.update'),
    ('admin', 'users.delete'),
    ('admin', 'master_data.view'),
    ('admin', 'academic_years.view'),
    ('admin', 'academic_years.manage'),
    ('admin', 'semesters.view'),
    ('admin', 'semesters.manage'),
    ('admin', 'classes.view'),
    ('admin', 'classes.manage'),
    ('admin', 'subjects.view'),
    ('admin', 'subjects.manage'),
    ('admin', 'teachers.view'),
    ('admin', 'teachers.manage'),
    ('admin', 'students.view'),
    ('admin', 'students.manage'),
    ('admin', 'question_bank.view'),
    ('admin', 'question_bank.export'),
    ('admin', 'question_categories.view'),
    ('admin', 'exams.view'),
    ('admin', 'exam_packages.view'),
    ('admin', 'exam_packages.manage'),
    ('admin', 'exam_packages.archive'),
    ('admin', 'exam_schedules.view'),
    ('admin', 'exam_schedules.manage'),
    ('admin', 'exam_schedules.archive'),
    ('admin', 'exam_tokens.manage'),
    ('admin', 'exam_monitoring.view'),
    ('admin', 'exam_sessions.control'),
    ('admin', 'reports.view'),
    ('admin', 'reports.export'),
    ('admin', 'import_export.view'),
    ('admin', 'audit_logs.view'),

    -- Teacher
    ('teacher', 'dashboard.view'),
    ('teacher', 'question_bank.view'),
    ('teacher', 'question_bank.manage'),
    ('teacher', 'question_bank.export'),
    ('teacher', 'questions.create'),
    ('teacher', 'questions.update'),
    ('teacher', 'questions.publish'),
    ('teacher', 'questions.archive'),
    ('teacher', 'question_categories.view'),
    ('teacher', 'question_categories.manage'),
    ('teacher', 'exams.view'),
    ('teacher', 'exam_packages.view'),
    ('teacher', 'exam_packages.manage'),
    ('teacher', 'exam_packages.archive'),
    ('teacher', 'exam_schedules.view'),
    ('teacher', 'exam_schedules.manage'),
    ('teacher', 'exam_schedules.archive'),
    ('teacher', 'exam_tokens.manage'),
    ('teacher', 'exam_monitoring.view'),
    ('teacher', 'grading.view'),
    ('teacher', 'grading.manage'),
    ('teacher', 'exam_results.view'),
    ('teacher', 'exam_results.finalize'),
    ('teacher', 'exam_results.recap'),
    ('teacher', 'reports.view'),
    ('teacher', 'reports.export'),

    -- Student
    ('student', 'dashboard.view'),
    ('student', 'active_exams.view'),
    ('student', 'exam_room.access'),
    ('student', 'exam_attempts.start'),
    ('student', 'exam_answers.save'),
    ('student', 'exam_attempts.submit'),
    ('student', 'exam_results.view'),

    -- Proctor
    ('proctor', 'dashboard.view'),
    ('proctor', 'exam_monitoring.view'),
    ('proctor', 'exam_sessions.control'),

    -- Principal
    ('principal', 'dashboard.view'),
    ('principal', 'exam_results.view'),
    ('principal', 'reports.view'),
    ('principal', 'reports.export')
)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from role_perm_matrix rpm
join public.roles r on r.name = rpm.role_name
join public.permissions p on p.code = rpm.permission_code
on conflict (role_id, permission_id) do nothing;

-- 4. DEFAULT SYSTEM SETTINGS
insert into public.system_settings (key, value, description)
values
  (
    'platform',
    jsonb_build_object(
      'app_name', 'Sistem Ujian Online Sagaya',
      'logo_url', '',
      'theme', 'default',
      'maintenance_mode', false
    ),
    'Identitas dan mode platform global.'
  ),
  (
    'cbt_defaults',
    jsonb_build_object(
      'autosave_interval_seconds', 30,
      'default_token_required', true,
      'shuffle_questions', true,
      'shuffle_options', true,
      'fullscreen_violation_limit', 3
    ),
    'Konfigurasi CBT default lintas sekolah.'
  )
on conflict (key) do nothing;
