export type TemplateType = "students" | "teachers" | "questions" | "classes";

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
    description: "Kolom dasar untuk staging data siswa sebelum input/import.",
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
    description: "Kolom dasar untuk staging data guru dan akun auth.",
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
    description: "Kolom staging soal pilihan ganda dan esai.",
    columns: [
      { key: "subject_code", example: "MTK" },
      { key: "category_name", example: "Bilangan Bulat" },
      { key: "type", example: "multiple_choice" },
      { key: "difficulty", example: "medium" },
      { key: "content", example: "Hasil dari 12 + 8 adalah ..." },
      { key: "option_a", example: "18" },
      { key: "option_b", example: "20" },
      { key: "option_c", example: "22" },
      { key: "option_d", example: "24" },
      { key: "correct_option", example: "B" },
      { key: "explanation", example: "12 + 8 = 20" },
      { key: "point", example: "1" },
      { key: "status", example: "draft" },
    ],
  },
  classes: {
    filename: "template-kelas.csv",
    title: "Template Kelas",
    description: "Kolom staging kelas untuk tahun ajaran aktif.",
    columns: [
      { key: "name", example: "VII A" },
      { key: "grade_level", example: "7" },
      { key: "academic_year", example: "2025/2026" },
      { key: "homeroom_teacher_email", example: "rina.guru@sagaya.test" },
      { key: "is_active", example: "true" },
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
