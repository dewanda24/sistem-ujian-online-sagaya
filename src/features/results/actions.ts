"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { firstRelation } from "@/features/results/queries";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { hasPermission } from "@/lib/auth/has-permission";
import { requirePermission } from "@/lib/auth/require-permission";
import { calculateAndPersistAttemptScore } from "@/lib/scoring/exam-scoring";
import { createClient } from "@/lib/supabase/server";
import {
  finalizeAttemptSchema,
  gradeEssayAnswerSchema,
} from "@/lib/validations/grading";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function redirectToResult(attemptId: string, ok: boolean, message: string): never {
  const params = new URLSearchParams({
    notice: ok ? "success" : "error",
    message,
  });

  redirect(`/dashboard/exam-results/${attemptId}?${params.toString()}`);
}

export async function gradeEssayAnswerAction(formData: FormData) {
  const user = await requirePermission("grading.manage");
  const parsed = gradeEssayAnswerSchema.safeParse({
    attempt_id: formString(formData, "attempt_id"),
    answer_id: formString(formData, "answer_id"),
    awarded_score: formString(formData, "awarded_score"),
    max_score: formString(formData, "max_score"),
  });

  if (!parsed.success) {
    redirectToResult(
      formString(formData, "attempt_id"),
      false,
      parsed.error.issues[0]?.message ?? "Skor essay tidak valid.",
    );
  }

  const canGrade = await canManageAttempt(parsed.data.attempt_id, user);

  if (!canGrade) {
    redirectToResult(parsed.data.attempt_id, false, "Akses grading ditolak.");
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("exam_answers")
    .update({
      awarded_score: parsed.data.awarded_score,
      max_score: parsed.data.max_score,
      is_correct: null,
      needs_manual_grading: false,
      graded_by: user.id,
      graded_at: now,
    })
    .eq("id", parsed.data.answer_id)
    .eq("exam_attempt_id", parsed.data.attempt_id);

  if (error) {
    redirectToResult(parsed.data.attempt_id, false, error.message);
  }

  await calculateAndPersistAttemptScore(parsed.data.attempt_id);
  await logAuditEvent({
    userId: user.id,
    action: "exam_answers.grade_essay",
    entityType: "exam_answers",
    entityId: parsed.data.answer_id,
    payload: {
      attempt_id: parsed.data.attempt_id,
      awarded_score: parsed.data.awarded_score,
      max_score: parsed.data.max_score,
    },
  });
  revalidatePath(`/dashboard/exam-results/${parsed.data.attempt_id}`);
  revalidatePath("/dashboard/teacher/grading");
  redirectToResult(parsed.data.attempt_id, true, "Skor essay tersimpan.");
}

export async function finalizeAttemptAction(formData: FormData) {
  const user = await requirePermission("exam_results.finalize");
  const parsed = finalizeAttemptSchema.safeParse({
    attempt_id: formString(formData, "attempt_id"),
  });

  if (!parsed.success) {
    redirectToResult(
      formString(formData, "attempt_id"),
      false,
      parsed.error.issues[0]?.message ?? "Attempt tidak valid.",
    );
  }

  const canFinalize = await canManageAttempt(parsed.data.attempt_id, user);

  if (!canFinalize) {
    redirectToResult(parsed.data.attempt_id, false, "Akses finalize ditolak.");
  }

  const result = await calculateAndPersistAttemptScore(parsed.data.attempt_id, {
    finalize: true,
  });

  if (!result.ok) {
    redirectToResult(parsed.data.attempt_id, false, result.message);
  }

  revalidatePath(`/dashboard/exam-results/${parsed.data.attempt_id}`);
  revalidatePath("/dashboard/teacher/grading");
  revalidatePath("/dashboard/student/history");
  await logAuditEvent({
    userId: user.id,
    action: "exam_results.finalize",
    entityType: "exam_attempts",
    entityId: parsed.data.attempt_id,
    payload: {
      score: result.autoScore + result.essayScore,
      max_score: result.maxScore,
      grading_status: result.gradingStatus,
    },
  });
  redirectToResult(parsed.data.attempt_id, true, "Nilai ujian difinalisasi.");
}

async function canManageAttempt(
  attemptId: string,
  user: Awaited<ReturnType<typeof requirePermission>>,
) {
  if (hasPermission(user, "exam_results.recap") && user.roles?.name !== "teacher") {
    return true;
  }

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select(
      "id, exam_schedules(exam_packages(subject_id))",
    )
    .eq("id", attemptId)
    .maybeSingle();

  const schedule = firstRelation(attempt?.exam_schedules);
  const examPackage = firstRelation(schedule?.exam_packages);
  const subjectId = examPackage?.subject_id;

  if (!subjectId) {
    return false;
  }

  if (user.roles?.name !== "teacher") {
    return true;
  }

  const { data: assignment } = await supabase
    .from("teacher_subjects")
    .select("id")
    .eq("teacher_id", user.id)
    .eq("subject_id", subjectId)
    .limit(1)
    .maybeSingle();

  return Boolean(assignment?.id);
}
