"use server";

import mammoth from "mammoth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseOfficialWordTemplate,
  validateWordImportQuestion,
  type WordImportQuestion,
} from "@/features/question-bank/word-import";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { requireAuth } from "@/lib/auth/require-auth";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  requireSchoolScope,
  requireScopedSchoolId,
} from "@/lib/auth/school-scope";
import { createClient } from "@/lib/supabase/server";

export type WordImportPreviewState = {
  ok: boolean;
  message: string;
  questions: WordImportQuestion[];
  meta: {
    subject_id: string;
    category_id: string;
    difficulty: string;
  };
};

const IMPORT_WORD_PATH = "/dashboard/question-bank/import-word";
const optionLabels = ["A", "B", "C", "D"] as const;

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function previewWordImportAction(
  _previousState: WordImportPreviewState,
  formData: FormData,
): Promise<WordImportPreviewState> {
  const user = await requireAuth();
  await requirePermission("question_bank.manage");
  const subjectId = formString(formData, "subject_id");
  const categoryId = formString(formData, "category_id");
  const difficulty = formString(formData, "difficulty") || "medium";
  const file = formData.get("file");
  const emptyMeta = {
    subject_id: subjectId,
    category_id: categoryId,
    difficulty,
  };

  if (!subjectId) {
    return {
      ok: false,
      message: "Mapel wajib dipilih.",
      questions: [],
      meta: emptyMeta,
    };
  }

  const scope = await getScopedSubject(user.id, user.roles?.name, subjectId);

  if (!scope) {
    return {
      ok: false,
      message:
        "Akses mapel ditolak. Guru hanya boleh import ke mapel yang ditugaskan.",
      questions: [],
      meta: emptyMeta,
    };
  }

  if (categoryId) {
    const categoryOk = await assertCategoryMatchesSubject(
      categoryId,
      subjectId,
    );

    if (!categoryOk) {
      return {
        ok: false,
        message: "Kategori harus berasal dari mapel yang sama.",
        questions: [],
        meta: emptyMeta,
      };
    }
  }

  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      message: "File Word wajib diunggah.",
      questions: [],
      meta: emptyMeta,
    };
  }

  if (!file.name.toLowerCase().endsWith(".docx")) {
    return {
      ok: false,
      message: "File harus berformat .docx.",
      questions: [],
      meta: emptyMeta,
    };
  }

  const result = await mammoth.extractRawText({
    buffer: Buffer.from(await file.arrayBuffer()),
  });
  const questions = parseOfficialWordTemplate(result.value);

  return {
    ok: questions.some((question) => question.errors.length === 0),
    message: `Preview selesai: ${questions.length} kandidat soal ditemukan.`,
    questions,
    meta: emptyMeta,
  };
}

export async function saveWordImportAction(formData: FormData) {
  const user = await requireAuth();
  await requirePermission("question_bank.manage");
  await requirePermission("questions.create");
  const subjectId = formString(formData, "subject_id");
  const categoryId = formString(formData, "category_id");
  const difficulty = formString(formData, "difficulty") || "medium";
  const rawQuestions = formString(formData, "questions_json");
  const subject = await getScopedSubject(user.id, user.roles?.name, subjectId);

  if (!subject) {
    redirectWithMessage(false, "Akses mapel ditolak.");
  }

  if (categoryId) {
    const categoryOk = await assertCategoryMatchesSubject(
      categoryId,
      subjectId,
    );

    if (!categoryOk) {
      redirectWithMessage(
        false,
        "Kategori harus berasal dari mapel yang sama.",
      );
    }
  }

  let questions: WordImportQuestion[] = [];

  try {
    questions = JSON.parse(rawQuestions) as WordImportQuestion[];
  } catch {
    redirectWithMessage(false, "Data preview import tidak valid.");
  }

  const supabase = await createClient();
  let success = 0;
  const failedRows: Array<{ row_number: number; errors: string[] }> = [];

  for (const [index, question] of questions.entries()) {
    const questionNumber = question.number || index + 1;
    const validation = validateWordImportQuestion({
      local_id: question.local_id || `word-${index + 1}`,
      number: questionNumber,
      type: question.type === "essay" ? "essay" : "multiple_choice",
      content: question.content ?? "",
      options: {
        A: question.options?.A ?? "",
        B: question.options?.B ?? "",
        C: question.options?.C ?? "",
        D: question.options?.D ?? "",
      },
      correct_option: question.correct_option ?? "",
      explanation: question.explanation ?? "",
    });

    if (validation.errors.length > 0) {
      failedRows.push({
        row_number: questionNumber,
        errors: validation.errors,
      });
      continue;
    }

    const { data: savedQuestion, error: questionError } = await supabase
      .from("questions")
      .insert({
        school_id: subject.school_id,
        subject_id: subjectId,
        category_id: categoryId || null,
        type: question.type === "essay" ? "essay" : "multiple_choice",
        difficulty,
        content: question.content.trim(),
        explanation: question.explanation?.trim() || null,
        point: 1,
        status: "draft",
        current_version: 1,
        is_active: true,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (questionError || !savedQuestion?.id) {
      failedRows.push({
        row_number: questionNumber,
        errors: [questionError?.message ?? "Gagal menyimpan soal"],
      });
      continue;
    }

    if (question.type !== "essay") {
      const correctOption = question.correct_option as "A" | "B" | "C" | "D";
      const { error: optionError } = await supabase
        .from("question_options")
        .insert(
          optionLabels.map((label, optionIndex) => ({
            question_id: savedQuestion.id,
            option_label: label,
            option_text: question.options[label].trim(),
            is_correct: correctOption === label,
            order_number: optionIndex + 1,
          })),
        );

      if (optionError) {
        failedRows.push({
          row_number: questionNumber,
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
      ? "\n\nSoal gagal: " +
        failedRows
          .map((item) => `Soal ${item.row_number}: ${item.errors.join("; ")}`)
          .join("\n")
      : "";

  await logAuditEvent({
    userId: user.id,
    action: "questions.import_word",
    entityType: "questions",
    payload: {
      subject_id: subjectId,
      category_id: categoryId || null,
      difficulty,
      success_count: success,
      failed_count: failed,
      total_rows: questions.length,
      failed_rows: failedRows,
    },
  });

  revalidatePath("/dashboard/question-bank/questions");
  redirectWithMessage(
    failed === 0,
    `Import Word selesai: ${success} berhasil disimpan sebagai draft, ${failed} gagal.${failedDetails}`,
  );
}

async function getScopedSubject(
  userId: string,
  roleName: string | undefined,
  subjectId: string,
) {
  const supabase = await createClient();

  if (!subjectId) {
    return null;
  }

  if (roleName === "teacher") {
    const { data } = await supabase
      .from("teacher_subjects")
      .select("subjects(id, school_id)")
      .eq("teacher_id", userId)
      .eq("subject_id", subjectId)
      .maybeSingle();
    const subject = Array.isArray(data?.subjects)
      ? data?.subjects[0]
      : data?.subjects;

    return subject?.id
      ? { id: subject.id as string, school_id: subject.school_id as string }
      : null;
  }

  let query = supabase
    .from("subjects")
    .select("id, school_id")
    .eq("id", subjectId);

  if (roleName !== "super_admin") {
    const scope = await requireSchoolScope();
    query = query.eq("school_id", requireScopedSchoolId(scope));
  }

  const { data } = await query.maybeSingle();

  return data?.id
    ? { id: data.id as string, school_id: data.school_id as string }
    : null;
}

async function assertCategoryMatchesSubject(
  categoryId: string,
  subjectId: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("question_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("subject_id", subjectId)
    .is("deleted_at", null)
    .maybeSingle();

  return Boolean(data?.id);
}

function redirectWithMessage(ok: boolean, message: string): never {
  const params = new URLSearchParams({
    notice: ok ? "success" : "error",
    message,
  });

  redirect(`${IMPORT_WORD_PATH}?${params.toString()}`);
}
