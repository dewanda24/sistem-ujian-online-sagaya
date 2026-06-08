export const OPERATIONAL_RESET_CONFIRMATION = "RESET DATA TERPILIH";

export type OperationalResetScope =
  | "exams"
  | "assignments"
  | "students"
  | "question_bank"
  | "master_data"
  | "operational_users"
  | "audit_logs";

export type OperationalResetScopeDefinition = {
  id: OperationalResetScope;
  label: string;
  description: string;
  tables: string[];
  dangerous?: boolean;
};

export const operationalResetScopes: OperationalResetScopeDefinition[] = [
  {
    id: "exams",
    label: "Ujian & hasil",
    description:
      "Paket ujian, jadwal, token, peserta ujian, pengerjaan, jawaban, kejadian, dan nilai.",
    tables: [
      "exam_events",
      "exam_answers",
      "exam_attempts",
      "exam_participants",
      "exam_schedule_classes",
      "exam_schedules",
      "exam_package_questions",
      "exam_packages",
    ],
  },
  {
    id: "assignments",
    label: "Penugasan guru/siswa",
    description:
      "Penugasan guru-mapel-kelas dan riwayat penempatan siswa ke kelas.",
    tables: ["teacher_subjects", "student_classes", "class_members"],
  },
  {
    id: "students",
    label: "Data siswa",
    description:
      "Akun siswa, profil siswa, akun login siswa, penempatan kelas, peserta ujian, pengerjaan, jawaban, kejadian, dan nilai siswa.",
    tables: [
      "exam_events (milik siswa)",
      "exam_answers (milik siswa)",
      "exam_attempts (milik siswa)",
      "exam_participants (milik siswa)",
      "student_classes (milik siswa)",
      "class_members (milik siswa)",
      "user_profiles (akun siswa)",
      "users (akun siswa)",
      "auth.users (akun siswa)",
    ],
    dangerous: true,
  },
  {
    id: "question_bank",
    label: "Bank Soal",
    description:
      "Kategori, stimulus, soal, opsi jawaban, lampiran, dan versi soal.",
    tables: [
      "question_attachments",
      "question_versions",
      "question_options",
      "questions",
      "question_stimuli",
      "question_categories",
    ],
    dangerous: true,
  },
  {
    id: "master_data",
    label: "Master sekolah & akademik",
    description:
      "Sekolah, mapel, kelas, semester, dan tahun ajaran. Data terkait seperti ujian, penugasan, dan Bank Soal ikut dibersihkan otomatis.",
    tables: ["classes", "semesters", "academic_years", "subjects", "schools"],
    dangerous: true,
  },
  {
    id: "operational_users",
    label: "Akun operasional",
    description:
      "Akun admin sekolah, kepala sekolah, guru, siswa, dan pengawas. Akun Super Admin tetap aman.",
    tables: [
      "user_profiles (akun non-Super Admin)",
      "users (akun non-Super Admin)",
      "auth.users (akun non-Super Admin)",
    ],
    dangerous: true,
  },
  {
    id: "audit_logs",
    label: "Catatan Aktivitas",
    description: "Riwayat aktivitas sistem.",
    tables: ["audit_logs"],
  },
];

export const operationalResetRetainedTables = [
  "akun Super Admin",
  "auth.users akun Super Admin",
  "user_profiles akun Super Admin",
  "hak akses",
  "izin akses",
  "relasi hak akses",
  "konfigurasi/env sistem",
  "template import/unduh",
] as const;

export type ResetTableSummary = {
  table: string;
  deleted: number;
  skipped?: boolean;
  note?: string;
};

export type OperationalResetSummary = {
  scopes: OperationalResetScope[];
  tables: ResetTableSummary[];
  operationalUsersDeleted: number;
  authUsersDeleted: number;
  retained: string[];
};
