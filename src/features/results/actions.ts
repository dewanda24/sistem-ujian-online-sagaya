"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { firstRelation } from "@/features/results/queries";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { hasPermission } from "@/lib/auth/has-permission";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  assertSameSchool,
  requireSchoolScope,
} from "@/lib/auth/school-scope";
import { calculateAndPersistAttemptScore } from "@/lib/scoring/exam-scoring";
import { createClient } from "@/lib/supabase/server";
import {
  finalizeAttemptSchema,
  gradeEssayAnswerSchema,
} from "@/lib/validations/grading";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function formBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on" || value === "1";
}

function redirectToResult(attemptId: string, ok: boolean, message: string, returnTo?: string): never {
  const params = new URLSearchParams({
    notice: ok ? "success" : "error",
    message,
  });

  if (returnTo) {
    redirect(`${returnTo}&${params.toString()}`);
  }

  redirect(`/dashboard/exam-results/${attemptId}?${params.toString()}`);
}

export async function gradeEssayAnswerAction(formData: FormData) {
  const user = await requirePermission("grading.manage");
  const returnTo = formString(formData, "return_to");
  const parsed = gradeEssayAnswerSchema.safeParse({
    attempt_id: formString(formData, "attempt_id"),
    answer_id: formString(formData, "answer_id"),
    awarded_score: formString(formData, "awarded_score"),
    max_score: formString(formData, "max_score"),
    teacher_note: formString(formData, "teacher_note") || null,
  });

  if (!parsed.success) {
    redirectToResult(
      formString(formData, "attempt_id"),
      false,
      parsed.error.issues[0]?.message ?? "Skor essay tidak valid.",
      returnTo
    );
  }

  const canGrade = await canManageAttempt(parsed.data.attempt_id, user);

  if (!canGrade) {
    redirectToResult(parsed.data.attempt_id, false, "Akses grading ditolak.", returnTo);
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    awarded_score: parsed.data.awarded_score,
    max_score: parsed.data.max_score,
    is_correct: null,
    needs_manual_grading: false,
    graded_by: user.id,
    graded_at: now,
  };

  if (parsed.data.teacher_note !== undefined) {
    updatePayload.teacher_note = parsed.data.teacher_note;
  }

  let { error } = await supabase
    .from("exam_answers")
    .update(updatePayload)
    .eq("id", parsed.data.answer_id)
    .eq("exam_attempt_id", parsed.data.attempt_id);

  if (error && (error.message?.includes("graded_by") || error.message?.includes("graded_at") || error.message?.includes("teacher_note"))) {
    delete updatePayload.graded_by;
    delete updatePayload.graded_at;
    delete updatePayload.teacher_note;
    const retry = await supabase
      .from("exam_answers")
      .update(updatePayload)
      .eq("id", parsed.data.answer_id)
      .eq("exam_attempt_id", parsed.data.attempt_id);
    error = retry.error;
  }

  if (error) {
    redirectToResult(parsed.data.attempt_id, false, error.message, returnTo);
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
      teacher_note: parsed.data.teacher_note,
    },
  });
  revalidatePath(`/dashboard/exam-results/${parsed.data.attempt_id}`);
  revalidatePath("/dashboard/teacher/grading");
  if (returnTo?.includes("/dashboard/teacher/grading/rapid")) {
    revalidatePath("/dashboard/teacher/grading/rapid");
  }
  redirectToResult(parsed.data.attempt_id, true, "Skor essay tersimpan.", returnTo);
}

export async function finalizeAttemptAction(formData: FormData) {
  const user = await requirePermission("exam_results.finalize");
  const returnTo = formString(formData, "return_to");
  const parsed = finalizeAttemptSchema.safeParse({
    attempt_id: formString(formData, "attempt_id"),
  });

  if (!parsed.success) {
    redirectToResult(
      formString(formData, "attempt_id"),
      false,
      parsed.error.issues[0]?.message ?? "Pengerjaan ujian tidak valid.",
      returnTo
    );
  }

  const canFinalize = await canManageAttempt(parsed.data.attempt_id, user);

  if (!canFinalize) {
    redirectToResult(parsed.data.attempt_id, false, "Akses finalize ditolak.", returnTo);
  }

  const result = await calculateAndPersistAttemptScore(parsed.data.attempt_id, {
    finalize: true,
  });

  if (!result.ok) {
    redirectToResult(parsed.data.attempt_id, false, result.message, returnTo);
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
  redirectToResult(parsed.data.attempt_id, true, "Nilai ujian difinalisasi.", returnTo);
}

export async function bulkFinalizeAttemptsAction(formData: FormData) {
  const user = await requirePermission("exam_results.finalize");
  const returnTo = formString(formData, "return_to") || "/dashboard/teacher/grading";
  const rawIds = formData.getAll("attempt_ids").map(String).filter(Boolean);
  const scheduleId = formString(formData, "schedule_id");
  const finalizeAll = formBoolean(formData, "finalize_all");

  let attemptIds = rawIds;

  if (finalizeAll && scheduleId) {
    const supabase = await createClient();
    const { data: attempts } = await supabase
      .from("exam_attempts")
      .select("id")
      .eq("exam_schedule_id", scheduleId)
      .neq("grading_status", "finalized");
    if (attempts) {
      attemptIds = attempts.map((a) => a.id);
    }
  }

  if (attemptIds.length === 0) {
    const url = new URL(returnTo, "http://localhost");
    url.searchParams.set("notice", "error");
    url.searchParams.set("message", "Tidak ada pengerjaan siswa yang dipilih untuk difinalisasi.");
    redirect(`${url.pathname}${url.search}`);
  }

  let successCount = 0;
  let failedCount = 0;

  for (const attemptId of attemptIds) {
    const canManage = await canManageAttempt(attemptId, user);
    if (!canManage) {
      failedCount++;
      continue;
    }

    const result = await calculateAndPersistAttemptScore(attemptId, { finalize: true });
    if (result.ok) {
      successCount++;
      revalidatePath(`/dashboard/exam-results/${attemptId}`);
    } else {
      failedCount++;
    }
  }

  revalidatePath("/dashboard/teacher/grading");
  revalidatePath("/dashboard/reports/students");

  await logAuditEvent({
    userId: user.id,
    action: "exam_attempts.bulk_finalize",
    entityType: "exam_attempts",
    entityId: scheduleId ?? attemptIds[0],
    payload: {
      total: attemptIds.length,
      successCount,
      failedCount,
    },
  });

  const message =
    failedCount > 0
      ? `Berhasil memfinalisasi ${successCount} nilai siswa (${failedCount} gagal).`
      : `Berhasil memfinalisasi ${successCount} nilai siswa sekaligus.`;

  const url = new URL(returnTo, "http://localhost");
  url.searchParams.set("notice", successCount > 0 ? "success" : "error");
  url.searchParams.set("message", message);
  redirect(`${url.pathname}${url.search}`);
}

async function canManageAttempt(
  attemptId: string,
  user: Awaited<ReturnType<typeof requirePermission>>,
) {
  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select(
      "id, exam_schedules(school_id, exam_packages(subject_id))",
    )
    .eq("id", attemptId)
    .maybeSingle();

  const schedule = firstRelation(attempt?.exam_schedules);
  const examPackage = firstRelation(schedule?.exam_packages);
  const subjectId = examPackage?.subject_id;

  if (hasPermission(user, "exam_results.recap") && user.roles?.name !== "teacher") {
    const scope = await requireSchoolScope();
    assertSameSchool(scope, schedule?.school_id);

    return true;
  }

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
