export type TemplateType =
  | "students"
  | "teachers"
  | "questions"
  | "classes"
  | "student-class-assignments"
  | "teacher-subject-assignments";

type TemplateColumn = {
  key: string;
  example: string;
};

type TemplateDefinition = {
  filename: string;
  title: string;
  description: string;
  columns: TemplateColumn[];
};

export const importTemplates: Record<TemplateType, TemplateDefinition> = {
  students: {
    filename: "template-siswa.csv",
    title: "Template Siswa",
    description: "Kolom dasar untuk menyiapkan data siswa sebelum diimport.",
    columns: [
      { key: "full_name", example: "Budi Santoso" },
      { key: "email", example: "budi.santoso@siswa.test" },
      { key: "username", example: "budi.santoso" },
      { key: "password", example: "Siswa12345" },
      { key: "nis", example: "20260001" },
      { key: "nisn", example: "0123456789" },
      { key: "phone", example: "081234567890" },
      { key: "class_name", example: "VII A" },
      { key: "status", example: "active" },
    ],
  },
  teachers: {
    filename: "template-guru.csv",
    title: "Template Guru",
    description: "Kolom dasar untuk menyiapkan data guru dan akun login.",
    columns: [
      { key: "full_name", example: "Ibu Rina" },
      { key: "email", example: "rina.guru@sagaya.test" },
      { key: "username", example: "rina.guru" },
      { key: "password", example: "Guru12345" },
      { key: "nip", example: "198701012020122001" },
      { key: "phone", example: "081234567891" },
      { key: "status", example: "active" },
    ],
  },
  questions: {
    filename: "template-bank-soal.csv",
    title: "Template Bank Soal",
    description: "Kolom untuk menyiapkan soal pilihan ganda dan esai.",
    columns: [
      { key: "subject_code", example: "MTK" },
      { key: "category", example: "Bilangan Bulat" },
      { key: "difficulty", example: "medium" },
      { key: "question_type", example: "multiple_choice" },
      { key: "question_text", example: "Hasil dari 12 + 8 adalah ..." },
      { key: "option_a", example: "18" },
      { key: "option_b", example: "20" },
      { key: "option_c", example: "22" },
      { key: "option_d", example: "24" },
      { key: "option_e", example: "26" },
      { key: "correct_answer", example: "B" },
      { key: "explanation", example: "12 + 8 = 20" },
      { key: "points", example: "1" },
    ],
  },
  classes: {
    filename: "template-kelas.csv",
    title: "Template Kelas",
    description: "Kolom untuk menyiapkan kelas pada tahun ajaran aktif.",
    columns: [
      { key: "class_name", example: "VII A" },
      { key: "grade", example: "7" },
      { key: "homeroom_teacher", example: "rina.guru@sagaya.test" },
      { key: "academic_year", example: "2025/2026" },
    ],
  },
  "student-class-assignments": {
    filename: "template-assignment-siswa-kelas.csv",
    title: "Template Penugasan Siswa Kelas",
    description: "Kolom untuk menempatkan siswa ke kelas.",
    columns: [
      { key: "student_email", example: "budi.santoso@siswa.test" },
      { key: "class_name", example: "VII A" },
      { key: "academic_year", example: "2025/2026" },
      { key: "joined_at", example: "2026-07-15" },
    ],
  },
  "teacher-subject-assignments": {
    filename: "template-assignment-guru-mapel-kelas.csv",
    title: "Template Penugasan Guru Mapel Kelas",
    description: "Kolom untuk menugaskan guru ke mapel, kelas, dan tahun ajaran.",
    columns: [
      { key: "teacher_email", example: "rina.guru@sagaya.test" },
      { key: "subject_code", example: "MTK" },
      { key: "class_name", example: "VII A" },
      { key: "academic_year", example: "2025/2026" },
    ],
  },
};

export function getTemplate(type: string) {
  return importTemplates[type as TemplateType] ?? null;
}

export function templateToCsv(type: TemplateType) {
  const template = importTemplates[type];
  const headers = template.columns.map((column) => column.key);
  const examples = template.columns.map((column) => column.example);

  return toCsv([headers, examples]);
}

export function toCsv(rows: string[][]) {
  return rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}
