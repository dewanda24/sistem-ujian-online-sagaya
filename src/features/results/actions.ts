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
