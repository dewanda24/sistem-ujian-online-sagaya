export type ExcelImportQuestionType = "multiple_choice" | "essay";

export type ExcelImportRow = {
  local_id: string;
  row_number: number;
  subject_code: string;
  category: string;
  type: ExcelImportQuestionType;
  difficulty: string;
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  point: string;
  stimulus_title: string;
  stimulus_content: string;
  errors: string[];
  warnings: string[];
};

export const excelImportColumns = [
  "subject_code",
  "category",
  "type",
  "difficulty",
  "content",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_answer",
  "explanation",
  "point",
  "stimulus_title",
  "stimulus_content",
] as const;

export type ExcelImportColumn = (typeof excelImportColumns)[number];

const optionLabels = ["A", "B", "C", "D"] as const;

export function normalizeExcelImportRows(
  rows: Record<string, unknown>[],
  subjectCodes: Set<string>,
) {
  return rows.map((row, index) => {
    const type: ExcelImportQuestionType = normalizeCell(row.type).toLowerCase() === "essay"
      ? "essay"
      : "multiple_choice";
    const baseRow = {
      local_id: `excel-${index + 2}`,
      row_number: index + 2,
      subject_code: normalizeCell(row.subject_code).toUpperCase(),
      category: normalizeCell(row.category || row.category_name),
      type,
      difficulty: normalizeDifficulty(normalizeCell(row.difficulty)),
      content: normalizeCell(row.content),
      option_a: normalizeCell(row.option_a),
      option_b: normalizeCell(row.option_b),
      option_c: normalizeCell(row.option_c),
      option_d: normalizeCell(row.option_d),
      correct_answer: normalizeCell(row.correct_answer || row.correct_option).toUpperCase(),
      explanation: normalizeCell(row.explanation),
      point: normalizeCell(row.point) || "1",
      stimulus_title: normalizeCell(row.stimulus_title),
      stimulus_content: normalizeCell(row.stimulus_content),
    };
    const validation = validateExcelImportRow(baseRow, subjectCodes);

    return {
      ...baseRow,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  });
}

export function validateExcelImportRow(
  row: Omit<ExcelImportRow, "errors" | "warnings">,
  subjectCodes: Set<string>,
) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!row.subject_code) {
    errors.push("Mapel tidak ditemukan");
  } else if (!subjectCodes.has(row.subject_code)) {
    errors.push("Mapel tidak ditemukan");
  }

  if (!row.category.trim()) {
    errors.push("Kategori kosong");
  }

  if (!row.content.trim()) {
    errors.push("Konten kosong");
  }

  if (!Number(row.point) || Number(row.point) <= 0) {
    errors.push("Poin harus lebih dari 0");
  }

  if (row.type === "multiple_choice") {
    const options = {
      A: row.option_a,
      B: row.option_b,
      C: row.option_c,
      D: row.option_d,
    };

    for (const label of optionLabels) {
      if (!options[label].trim()) {
        errors.push(`Opsi ${label} kurang`);
      }
    }

    if (!optionLabels.includes(row.correct_answer as "A" | "B" | "C" | "D")) {
      errors.push("Jawaban benar tidak valid");
    } else if (!options[row.correct_answer as "A" | "B" | "C" | "D"].trim()) {
      errors.push("Opsi jawaban benar kosong");
    }
  }

  if (row.stimulus_content && !row.stimulus_title) {
    warnings.push("Stimulus punya isi tetapi judul kosong; judul akan dibuat otomatis.");
  }

  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

export function normalizeCell(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeDifficulty(value: string) {
  return ["easy", "medium", "hard"].includes(value.toLowerCase())
    ? value.toLowerCase()
    : "medium";
}
