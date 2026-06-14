"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import {
  DEMO_MUTATION_BLOCKED_MESSAGE,
  isDemoUser,
} from "@/lib/auth/demo-mode";
import { hasPermission } from "@/lib/auth/has-permission";
import { hasActiveProctorAssignment } from "@/lib/auth/proctor-scope";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  assertSameSchool,
  requireSchoolScope,
} from "@/lib/auth/school-scope";
import { calculateAndPersistAttemptScore } from "@/lib/scoring/exam-scoring";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/types/auth";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function redirectBack(formData: FormData, ok: boolean, message: string): never {
  const fallback = "/dashboard/proctor/monitoring";
  const returnTo = formString(formData, "return_to") || fallback;
  const [path, query = ""] = returnTo.split("?");
  const params = new URLSearchParams(query);

  params.set("notice", ok ? "success" : "error");
  params.set("message", message);

  redirect(`${path}?${params.toString()}`);
}

async function requireMonitoringControlForAttempt(
  formData: FormData,
  attemptId: string,
) {
  const user = await requireAuth();

  if (!hasPermission(user, "exam_monitoring.view")) {
    redirectBack(formData, false, "Akses monitoring ujian ditolak.");
  }

  if (!(await canControlAttempt(attemptId, user))) {
    redirectBack(formData, false, "Akses kontrol pengerjaan ujian ditolak.");
  }

  return user;
}

async function requireMonitoringControlForSchedule(
  formData: FormData,
  scheduleId: string,
) {
  const user = await requireAuth();

  if (!hasPermission(user, "exam_monitoring.view")) {
    redirectBack(formData, false, "Akses monitoring ujian ditolak.");
  }

  if (!(await canControlSchedule(scheduleId, user))) {
    redirectBack(formData, false, "Akses kontrol peserta ujian ditolak.");
  }

  return user;
}

async function canControlAttempt(attemptId: string, user: CurrentUser) {
  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select(
      "id, exam_schedule_id, exam_schedules(school_id)",
    )
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt) {
    return false;
  }

  return canControlSchedule(attempt.exam_schedule_id as string, user);
}

async function canControlSchedule(scheduleId: string, user: CurrentUser) {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const { data: schedule } = await supabase
    .from("exam_schedules")
    .select("school_id")
    .eq("id", scheduleId)
    .maybeSingle();

  if (!schedule) {
    return false;
  }

  assertSameSchool(scope, schedule.school_id);

  if (
    hasPermission(user, "exam_sessions.control") &&
    ["super_admin", "admin"].includes(user.roles?.name ?? "")
  ) {
    return true;
  }

  if (!["teacher", "proctor"].includes(user.roles?.name ?? "")) {
    return false;
  }

  return hasActiveProctorAssignment(user.id, scheduleId);
}

export async function forceSubmitAttemptAction(formData: FormData) {
  const attemptId = formString(formData, "attempt_id");

  if (!attemptId) {
    redirectBack(formData, false, "Pengerjaan ujian tidak valid.");
  }

  const user = await requireMonitoringControlForAttempt(formData, attemptId);
  if (isDemoUser(user)) {
    redirectBack(formData, false, DEMO_MUTATION_BLOCKED_MESSAGE);
  }

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select(
      "id, exam_participant_id, exam_schedule_id, status, exam_schedules(exam_package_id)",
    )
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt) {
    redirectBack(formData, false, "Pengerjaan ujian tidak ditemukan.");
  }

  if (attempt.status === "submitted") {
    redirectBack(formData, false, "Pengerjaan ujian sudah dikumpulkan.");
  }

  if (attempt.status === "cancelled") {
    redirectBack(formData, false, "Pengerjaan ujian sudah dibatalkan.");
  }

  const schedule = Array.isArray(attempt.exam_schedules)
    ? attempt.exam_schedules[0]
    : attempt.exam_schedules;
  const packageId = schedule?.exam_package_id;
  const scoring = await calculateAndPersistAttemptScore(attempt.id, { packageId });

  if (!scoring.ok) {
    redirectBack(formData, false, scoring.message);
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("exam_attempts")
    .update({
      status: "submitted",
      submitted_at: now,
      last_saved_at: now,
      score: scoring.autoScore + scoring.essayScore,
      auto_score: scoring.autoScore,
      essay_score: scoring.hasEssay ? scoring.essayScore : null,
      max_score: scoring.maxScore,
      total_questions: scoring.totalQuestions,
      answered_questions: scoring.answeredQuestions,
      correct_answers: scoring.correctAnswers,
      grading_status: scoring.gradingStatus,
    })
    .eq("id", attempt.id);

  if (error) {
    redirectBack(formData, false, error.message);
  }

  await supabase
    .from("exam_participants")
    .update({
      status: "submitted",
      submitted_at: now,
    })
    .eq("id", attempt.exam_participant_id);

  await logAuditEvent({
    userId: user.id,
    action: "exam_attempts.force_submit",
    entityType: "exam_attempts",
    entityId: attempt.id,
    payload: {
      previous_status: attempt.status,
      exam_schedule_id: attempt.exam_schedule_id,
      answered_questions: scoring.answeredQuestions,
      total_questions: scoring.totalQuestions,
    },
  });

  revalidatePath("/dashboard/proctor/monitoring");
  revalidatePath("/dashboard/admin/monitoring");
  revalidatePath("/dashboard/super-admin/monitoring");
  revalidatePath("/dashboard/teacher/monitoring");
  redirectBack(formData, true, "Pengerjaan ujian berhasil diselesaikan.");
}

export async function resetAttemptAction(formData: FormData) {
  const attemptId = formString(formData, "attempt_id");

  if (!attemptId) {
    redirectBack(formData, false, "Pengerjaan ujian tidak valid.");
  }

  const user = await requireMonitoringControlForAttempt(formData, attemptId);
  if (isDemoUser(user)) {
    redirectBack(formData, false, DEMO_MUTATION_BLOCKED_MESSAGE);
  }

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, exam_participant_id, exam_schedule_id, status")
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt) {
    redirectBack(formData, false, "Pengerjaan ujian tidak ditemukan.");
  }

  if (attempt.status === "cancelled") {
    redirectBack(formData, false, "Pengerjaan ujian sudah pernah direset.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("exam_attempts")
    .update({
      status: "cancelled",
      submitted_at: null,
      last_saved_at: now,
    })
    .eq("id", attempt.id);

  if (error) {
    redirectBack(formData, false, error.message);
  }

  await supabase
    .from("exam_participants")
    .update({
      status: "assigned",
      started_at: null,
      submitted_at: null,
    })
    .eq("id", attempt.exam_participant_id);

  await logAuditEvent({
    userId: user.id,
    action: "exam_attempts.reset",
    entityType: "exam_attempts",
    entityId: attempt.id,
    payload: {
      previous_status: attempt.status,
      exam_schedule_id: attempt.exam_schedule_id,
      exam_participant_id: attempt.exam_participant_id,
    },
  });

  revalidatePath("/dashboard/proctor/monitoring");
  revalidatePath("/dashboard/admin/monitoring");
  revalidatePath("/dashboard/super-admin/monitoring");
  revalidatePath("/dashboard/teacher/monitoring");
  redirectBack(formData, true, "Pengerjaan ujian berhasil direset. Siswa bisa mulai ulang.");
}

export async function lockAttemptAction(formData: FormData) {
  const attemptId = formString(formData, "attempt_id");
  const reason =
    formString(formData, "lock_reason").trim() || "Dikunci oleh pengawas.";

  if (!attemptId) {
    redirectBack(formData, false, "Pengerjaan ujian tidak valid.");
  }

  const user = await requireMonitoringControlForAttempt(formData, attemptId);
  if (isDemoUser(user)) {
    redirectBack(formData, false, DEMO_MUTATION_BLOCKED_MESSAGE);
  }

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, exam_schedule_id, status, locked_at")
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt) {
    redirectBack(formData, false, "Pengerjaan ujian tidak ditemukan.");
  }

  if (attempt.status !== "in_progress") {
    redirectBack(formData, false, "Hanya pengerjaan aktif yang bisa dikunci.");
  }

  if (attempt.locked_at) {
    redirectBack(formData, false, "Pengerjaan ujian sudah terkunci.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("exam_attempts")
    .update({
      locked_at: now,
      locked_by: user.id,
      lock_reason: reason,
      last_saved_at: now,
    })
    .eq("id", attempt.id);

  if (error) {
    redirectBack(formData, false, error.message);
  }

  await logAuditEvent({
    userId: user.id,
    action: "exam_attempts.lock",
    entityType: "exam_attempts",
    entityId: attempt.id,
    payload: {
      exam_schedule_id: attempt.exam_schedule_id,
      reason,
    },
  });

  revalidatePath("/dashboard/proctor/monitoring");
  revalidatePath("/dashboard/admin/monitoring");
  revalidatePath("/dashboard/super-admin/monitoring");
  revalidatePath("/dashboard/teacher/monitoring");
  redirectBack(formData, true, "Pengerjaan ujian berhasil dikunci.");
}

export async function unlockAttemptAction(formData: FormData) {
  const attemptId = formString(formData, "attempt_id");

  if (!attemptId) {
    redirectBack(formData, false, "Pengerjaan ujian tidak valid.");
  }

  const user = await requireMonitoringControlForAttempt(formData, attemptId);
  if (isDemoUser(user)) {
    redirectBack(formData, false, DEMO_MUTATION_BLOCKED_MESSAGE);
  }

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, exam_schedule_id, status, locked_at, locked_by, lock_reason")
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt) {
    redirectBack(formData, false, "Pengerjaan ujian tidak ditemukan.");
  }

  if (!attempt.locked_at) {
    redirectBack(formData, false, "Pengerjaan ujian tidak sedang terkunci.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("exam_attempts")
    .update({
      locked_at: null,
      locked_by: null,
      lock_reason: null,
      last_saved_at: now,
    })
    .eq("id", attempt.id);

  if (error) {
    redirectBack(formData, false, error.message);
  }

  await logAuditEvent({
    userId: user.id,
    action: "exam_attempts.unlock",
    entityType: "exam_attempts",
    entityId: attempt.id,
    payload: {
      exam_schedule_id: attempt.exam_schedule_id,
      previous_locked_at: attempt.locked_at,
      previous_locked_by: attempt.locked_by,
      previous_lock_reason: attempt.lock_reason,
    },
  });

  revalidatePath("/dashboard/proctor/monitoring");
  revalidatePath("/dashboard/admin/monitoring");
  revalidatePath("/dashboard/super-admin/monitoring");
  revalidatePath("/dashboard/teacher/monitoring");
  redirectBack(formData, true, "Pengerjaan ujian berhasil dibuka kembali.");
}

export async function markParticipantAbsentAction(formData: FormData) {
  const participantId = formString(formData, "participant_id");

  if (!participantId) {
    redirectBack(formData, false, "Peserta tidak valid.");
  }

  const supabase = await createClient();
  const { data: participant } = await supabase
    .from("exam_participants")
    .select(
      "id, exam_schedule_id, student_id, status, exam_attempts(id, status)",
    )
    .eq("id", participantId)
    .maybeSingle();

  if (!participant) {
    redirectBack(formData, false, "Peserta tidak ditemukan.");
  }

  const user = await requireMonitoringControlForSchedule(
    formData,
    participant.exam_schedule_id as string,
  );
  if (isDemoUser(user)) {
    redirectBack(formData, false, DEMO_MUTATION_BLOCKED_MESSAGE);
  }

  const attempts = participant.exam_attempts ?? [];
  const hasStartedAttempt = attempts.some(
    (attempt: { status?: string | null }) =>
      attempt.status === "in_progress" || attempt.status === "submitted",
  );

  if (hasStartedAttempt) {
    redirectBack(
      formData,
      false,
      "Peserta sudah mulai atau submit ujian, tidak bisa ditandai absent.",
    );
  }

  const { error } = await supabase
    .from("exam_participants")
    .update({
      status: "absent",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", participant.id);

  if (error) {
    redirectBack(formData, false, error.message);
  }

  await logAuditEvent({
    userId: user.id,
    action: "exam_participants.mark_absent",
    entityType: "exam_participants",
    entityId: participant.id,
    payload: {
      exam_schedule_id: participant.exam_schedule_id,
      student_id: participant.student_id,
      previous_status: participant.status,
    },
  });

  revalidatePath("/dashboard/proctor/monitoring");
  revalidatePath("/dashboard/admin/monitoring");
  revalidatePath("/dashboard/super-admin/monitoring");
  revalidatePath("/dashboard/teacher/monitoring");
  redirectBack(formData, true, "Peserta ditandai tidak hadir.");
}
