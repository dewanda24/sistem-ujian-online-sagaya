export const OPERATIONAL_RESET_CONFIRMATION = "RESET OPERASIONAL";

export const operationalResetDeletedTables = [
  "exam_events",
  "exam_answers",
  "exam_attempts",
  "exam_participants",
  "exam_schedule_classes",
  "exam_schedules",
  "exam_package_questions",
  "exam_packages",
  "teacher_subjects",
  "student_classes",
  "class_members",
  "classes",
  "semesters",
  "academic_years",
  "user_profiles (akun operasional)",
  "users (role admin, principal, teacher, student, proctor)",
] as const;

export const operationalResetRetainedTables = [
  "users role super_admin",
  "roles",
  "permissions",
  "role_permissions",
  "schools (dipertahankan karena menjadi foreign key Bank Soal)",
  "subjects (dipertahankan karena menjadi foreign key Bank Soal)",
  "question_categories",
  "questions",
  "question_options",
  "question_stimuli",
  "question_attachments",
  "question_versions",
  "audit_logs",
  "konfigurasi/env sistem",
  "template import/export",
] as const;

export type ResetTableSummary = {
  table: string;
  deleted: number;
  skipped?: boolean;
  note?: string;
};

export type OperationalResetSummary = {
  tables: ResetTableSummary[];
  operationalUsersDeleted: number;
  authUsersDeleted: number;
  retained: string[];
};
