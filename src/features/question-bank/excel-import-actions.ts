"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";

import {
  normalizeExcelImportRows,
  validateExcelImportRow,
  type ExcelImportRow,
} from "@/features/question-bank/excel-import";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { requireAuth } from "@/lib/auth/require-auth";
import { requirePermission } from "@/lib/auth/require-permission";
import { createClient } from "@/lib/supabase/server";

export type ExcelImportPreviewState = {
  ok: boolean;
  message: string;
  rows: ExcelImportRow[];
};

const IMPORT_EXCEL_PATH = "/dashboard/question-bank/import-excel";
const optionLabels = ["A", "B", "C", "D"] as const;

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function previewExcelImportAction(
  _previousState: ExcelImportPreviewState,
  formData: FormData,
): Promise<ExcelImportPreviewState> {
  const user = await requireAuth();
  await requirePermission("question_bank.manage");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      message: "File Excel/CSV wajib diunggah.",
      rows: [],
    };
  }

  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx")) {
    return {
      ok: false,
      message: "File harus berformat .csv atau .xlsx.",
      rows: [],
    };
  }

  const subjectMap = await getImportSubjectMap(user.id, user.roles?.name);
  const records = await parseSpreadsheetFile(file);
  const rows = normalizeExcelImportRows(records, new Set(subjectMap.keys()));
  const validCount = rows.filter((row) => row.errors.length === 0).length;

  return {
    ok: validCount > 0,
    message: `Preview selesai: ${rows.length} baris, ${validCount} valid.`,
    rows,
  };
}

export async function saveExcelImportAction(formData: FormData) {
  const user = await requireAuth();
  await requirePermission("question_bank.manage");
  await requirePermission("questions.create");
  const rawRows = formString(formData, "rows_json");
  const subjectMap = await getImportSubjectMap(user.id, user.roles?.name);
  let rows: ExcelImportRow[] = [];

  try {
    rows = JSON.parse(rawRows) as ExcelImportRow[];
  } catch {
    redirectWithMessage(false, "Data preview import tidak valid.");
  }

  const supabase = await createClient();
  let success = 0;
  const failedRows: Array<{ row_number: number; errors: string[] }> = [];

  for (const row of rows) {
    const validation = validateExcelImportRow(row, new Set(subjectMap.keys()));
    const subject = subjectMap.get(row.subject_code);
    const rowNumber = row.row_number || rows.indexOf(row) + 2; // +2 because row 1 is header

    // Collect validation errors
    const errors = [...validation.errors];
    if (!subject && row.subject_code) {
      errors.push(`Mapel dengan kode "${row.subject_code}" tidak ditemukan`);
    }

    if (errors.length > 0) {
      failedRows.push({ row_number: rowNumber, errors });
      continue;
    }

    const categoryId = await getOrCreateImportCategory({
      schoolId: subject.school_id,
      subjectId: subject.id,
      name: row.category,
      userId: user.id,
    });

    if (!categoryId) {
      failedRows.push({
        row_number: rowNumber,
        errors: ["Gagal membuat/memilih kategori"],
      });
      continue;
    }

    const stimulusId = await getOrCreateImportStimulus({
      schoolId: subject.school_id,
      subjectId: subject.id,
      title: row.stimulus_title,
      content: row.stimulus_content,
      userId: user.id,
    });
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({
        school_id: subject.school_id,
        subject_id: subject.id,
        category_id: categoryId,
        stimulus_id: stimulusId,
        type: row.type,
        difficulty: row.difficulty || "medium",
        content: row.content,
        explanation: row.explanation || null,
        point: Number(row.point || 1),
        status: "draft",
        current_version: 1,
        is_active: true,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (questionError || !question?.id) {
      failedRows.push({
        row_number: rowNumber,
        errors: [questionError?.message ?? "Gagal menyimpan soal"],
      });
      continue;
    }

    if (row.type === "multiple_choice") {
      const options = {
        A: row.option_a,
        B: row.option_b,
        C: row.option_c,
        D: row.option_d,
      };
      const { error: optionError } = await supabase
        .from("question_options")
        .insert(
          optionLabels.map((label, index) => ({
            question_id: question.id,
            option_label: label,
            option_text: options[label],
            is_correct: row.correct_answer === label,
            order_number: index + 1,
          })),
        );

      if (optionError) {
        failedRows.push({
          row_number: rowNumber,
          errors: [optionError.message ?? "Gagal menyimpan pilihan jawaban"],
        });
        continue;
      }
    }

    success += 1;
  }

  const failed = failedRows.length;
  const failedDetails =
    failedRows.length > 0
      ? "\n\nBaris gagal: " +
        failedRows
          .map((item) => `Baris ${item.row_number}: ${item.errors.join("; ")}`)
          .join("\n")
      : "";

  await logAuditEvent({
    userId: user.id,
    action: "questions.import_excel",
    entityType: "questions",
    payload: {
      success_count: success,
      failed_count: failed,
      total_rows: rows.length,
      failed_rows: failedRows,
    },
  });

  revalidatePath("/dashboard/question-bank/questions");
  redirectWithMessage(
    failed === 0,
    `Import Excel selesai: ${success} berhasil disimpan sebagai draft, ${failed} gagal.${failedDetails}`,
  );
}

async function parseSpreadsheetFile(file: File) {
  const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), {
    type: "buffer",
  });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : null;

  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
}

async function getImportSubjectMap(userId: string, roleName?: string) {
  const supabase = await createClient();

  if (roleName === "teacher") {
    const { data } = await supabase
      .from("teacher_subjects")
      .select("subjects(id, code, name, school_id)")
      .eq("teacher_id", userId);
    const subjectMap = new Map<string, { id: string; school_id: string }>();

    for (const assignment of data ?? []) {
      const subject = Array.isArray(assignment.subjects)
        ? assignment.subjects[0]
        : assignment.subjects;

      if (subject?.code && subject.id && subject.school_id) {
        subjectMap.set(String(subject.code).toUpperCase(), {
          id: subject.id as string,
          school_id: subject.school_id as string,
        });
      }
    }

    return subjectMap;
  }

  const { data } = await supabase
    .from("subjects")
    .select("id, code, school_id")
    .eq("is_active", true);
  const subjectMap = new Map<string, { id: string; school_id: string }>();

  for (const subject of data ?? []) {
    if (subject.code && subject.id && subject.school_id) {
      subjectMap.set(String(subject.code).toUpperCase(), {
        id: subject.id as string,
        school_id: subject.school_id as string,
      });
    }
  }

  return subjectMap;
}

async function getOrCreateImportCategory({
  schoolId,
  subjectId,
  name,
  userId,
}: {
  schoolId: string;
  subjectId: string;
  name: string;
  userId: string;
}) {
  const supabase = await createClient();
  const trimmedName = name.trim();

  if (!trimmedName) {
    return null;
  }

  const { data: existing } = await supabase
    .from("question_categories")
    .select("id")
    .eq("school_id", schoolId)
    .eq("subject_id", subjectId)
    .ilike("name", trimmedName)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing?.id) {
    return existing.id as string;
  }

  const { data: category } = await supabase
    .from("question_categories")
    .insert({
      school_id: schoolId,
      subject_id: subjectId,
      name: trimmedName,
      description: "",
      is_active: true,
      created_by: userId,
    })
    .select("id")
    .single();

  return category?.id ?? null;
}

async function getOrCreateImportStimulus({
  schoolId,
  subjectId,
  title,
  content,
  userId,
}: {
  schoolId: string;
  subjectId: string;
  title: string;
  content: string;
  userId: string;
}) {
  const supabase = await createClient();
  const trimmedTitle = title.trim() || content.trim().slice(0, 80);
  const trimmedContent = content.trim();

  if (!trimmedTitle && !trimmedContent) {
    return null;
  }

  const { data: existing } = await supabase
    .from("question_stimuli")
    .select("id")
    .eq("school_id", schoolId)
    .eq("subject_id", subjectId)
    .ilike("title", trimmedTitle)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing?.id) {
    return existing.id as string;
  }

  const { data: stimulus } = await supabase
    .from("question_stimuli")
    .insert({
      school_id: schoolId,
      subject_id: subjectId,
      title: trimmedTitle || "Stimulus import",
      content: trimmedContent || null,
      is_active: true,
      created_by: userId,
    })
    .select("id")
    .single();

  return stimulus?.id ?? null;
}

function redirectWithMessage(ok: boolean, message: string): never {
  const params = new URLSearchParams({
    notice: ok ? "success" : "error",
    message,
  });

  redirect(`${IMPORT_EXCEL_PATH}?${params.toString()}`);
}
