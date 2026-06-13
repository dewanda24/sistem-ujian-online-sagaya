"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { hasPermission } from "@/lib/auth/has-permission";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  assertSameSchool,
  requireSchoolScope,
} from "@/lib/auth/school-scope";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/types/auth";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function redirectBack(formData: FormData, ok: boolean, message: string): never {
  const fallback = "/dashboard/recovery-center";
  const returnTo = formString(formData, "return_to") || fallback;
  const [path, query = ""] = returnTo.split("?");
  const params = new URLSearchParams(query);

  params.set("notice", ok ? "success" : "error");
  params.set("message", message);

  redirect(`${path}?${params.toString()}`);
}

async function canControlAttempt(attemptId: string, user: CurrentUser) {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, exam_schedule_id, exam_schedules(school_id)")
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt) {
    return false;
  }

  const schedule = Array.isArray(attempt.exam_schedules)
    ? attempt.exam_schedules[0]
    : attempt.exam_schedules;

  assertSameSchool(scope, schedule?.school_id);

  if (hasPermission(user, "exam_sessions.control")) {
    return true;
  }

  if (user.roles?.name !== "teacher") {
    return false;
  }

  const { data: assignment } = await supabase
    .from("exam_proctors")
    .select("id")
    .eq("exam_schedule_id", attempt.exam_schedule_id)
    .eq("teacher_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return Boolean(assignment);
}

export async function releaseActiveSessionAction(formData: FormData) {
  const attemptId = formString(formData, "attempt_id");

  if (!attemptId) {
    redirectBack(formData, false, "Attempt tidak valid.");
  }

  const user = await requireAuth();

  if (!hasPermission(user, "exam_monitoring.view")) {
    redirectBack(formData, false, "Akses Recovery Center ditolak.");
  }

  if (!(await canControlAttempt(attemptId, user))) {
    redirectBack(formData, false, "Akses release session ditolak.");
  }

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select(
      "id, exam_schedule_id, status, active_session_id, active_session_seen_at",
    )
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt) {
    redirectBack(formData, false, "Attempt tidak ditemukan.");
  }

  if (attempt.status !== "in_progress") {
    redirectBack(formData, false, "Hanya attempt aktif yang bisa release session.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("exam_attempts")
    .update({
      active_session_id: null,
      active_session_seen_at: null,
      last_activity_at: now,
    })
    .eq("id", attempt.id);

  if (error) {
    redirectBack(formData, false, error.message);
  }

  await logAuditEvent({
    userId: user.id,
    action: "exam_attempts.release_session",
    entityType: "exam_attempts",
    entityId: attempt.id,
    payload: {
      exam_schedule_id: attempt.exam_schedule_id,
      previous_active_session_id: attempt.active_session_id,
      previous_active_session_seen_at: attempt.active_session_seen_at,
    },
  });

  revalidatePath("/dashboard/recovery-center");
  revalidatePath("/dashboard/proctor/monitoring");
  revalidatePath("/dashboard/admin/monitoring");
  revalidatePath("/dashboard/super-admin/monitoring");
  revalidatePath("/dashboard/teacher/monitoring");
  redirectBack(formData, true, "Session aktif berhasil dilepas.");
}

export async function retryRecoveryAction(formData: FormData) {
  const attemptId = formString(formData, "attempt_id");

  if (!attemptId) {
    redirectBack(formData, false, "Attempt tidak valid.");
  }

  const user = await requireAuth();

  if (!hasPermission(user, "exam_monitoring.view")) {
    redirectBack(formData, false, "Akses Recovery Center ditolak.");
  }

  if (!(await canControlAttempt(attemptId, user))) {
    redirectBack(formData, false, "Akses retry recovery ditolak.");
  }

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, exam_schedule_id, status, last_activity_at, last_saved_at")
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt) {
    redirectBack(formData, false, "Attempt tidak ditemukan.");
  }

  await logAuditEvent({
    userId: user.id,
    action: "exam_attempts.retry_recovery",
    entityType: "exam_attempts",
    entityId: attempt.id,
    payload: {
      exam_schedule_id: attempt.exam_schedule_id,
      status: attempt.status,
      last_activity_at: attempt.last_activity_at,
      last_saved_at: attempt.last_saved_at,
      note: "Operator meminta siswa retry submit dari Recovery Center.",
    },
  });

  revalidatePath("/dashboard/recovery-center");
  redirectBack(
    formData,
    true,
    "Retry recovery dicatat. Minta siswa submit ulang dari ruang ujian.",
  );
}
