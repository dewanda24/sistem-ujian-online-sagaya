"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  assertSameSchool,
  requireSchoolScope,
} from "@/lib/auth/school-scope";
import { createClient } from "@/lib/supabase/server";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function redirectTo(result: { ok: boolean; message: string }): never {
  const params = new URLSearchParams({
    notice: result.ok ? "success" : "error",
    message: result.message,
  });

  redirect(`/dashboard/exams/proctors?${params.toString()}`);
}

export async function assignTeacherProctorAction(formData: FormData) {
  const user = await requirePermission("exam_schedules.manage");
  const scheduleId = formString(formData, "schedule_id");
  const teacherId = formString(formData, "teacher_id");
  const notes = formString(formData, "notes").trim();

  if (!scheduleId || !teacherId) {
    redirectTo({
      ok: false,
      message: "Pilih jadwal dan guru pengawas terlebih dahulu.",
    });
  }

  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const [{ data: schedule }, { data: teacher }] = await Promise.all([
    supabase
      .from("exam_schedules")
      .select("id, school_id, title")
      .eq("id", scheduleId)
      .maybeSingle(),
    supabase
      .from("users")
      .select("id, school_id, roles(name)")
      .eq("id", teacherId)
      .maybeSingle(),
  ]);

  assertSameSchool(scope, schedule?.school_id);
  assertSameSchool(scope, teacher?.school_id);

  const teacherRole = Array.isArray(teacher?.roles)
    ? teacher?.roles[0]
    : teacher?.roles;

  if (!schedule || !teacher || teacherRole?.name !== "teacher") {
    redirectTo({
      ok: false,
      message: "Jadwal atau guru pengawas tidak valid.",
    });
  }

  const { error } = await supabase.from("exam_proctors").upsert(
    {
      exam_schedule_id: scheduleId,
      teacher_id: teacherId,
      school_id: schedule.school_id,
      assigned_by: user.id,
      assigned_at: new Date().toISOString(),
      is_active: true,
      notes: notes || null,
    },
    {
      onConflict: "exam_schedule_id,teacher_id",
    },
  );

  if (!error) {
    await logAuditEvent({
      userId: user.id,
      action: "exam_proctors.assign",
      entityType: "exam_proctors",
      entityId: scheduleId,
      payload: {
        exam_schedule_id: scheduleId,
        teacher_id: teacherId,
        schedule_title: schedule.title,
      },
    });
  }

  revalidateProctorPaths();
  redirectTo({
    ok: !error,
    message: error ? error.message : "Guru berhasil ditugaskan sebagai pengawas.",
  });
}

export async function toggleTeacherProctorAction(formData: FormData) {
  const user = await requirePermission("exam_schedules.manage");
  const assignmentId = formString(formData, "id");
  const isActive = formString(formData, "is_active") === "true";

  if (!assignmentId) {
    redirectTo({
      ok: false,
      message: "Penugasan pengawas tidak valid.",
    });
  }

  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("exam_proctors")
    .select("id, school_id, exam_schedule_id, teacher_id")
    .eq("id", assignmentId)
    .maybeSingle();

  assertSameSchool(scope, assignment?.school_id);

  if (!assignment) {
    redirectTo({
      ok: false,
      message: "Penugasan pengawas tidak ditemukan.",
    });
  }

  const { error } = await supabase
    .from("exam_proctors")
    .update({ is_active: isActive })
    .eq("id", assignmentId);

  if (!error) {
    await logAuditEvent({
      userId: user.id,
      action: isActive ? "exam_proctors.activate" : "exam_proctors.deactivate",
      entityType: "exam_proctors",
      entityId: assignmentId,
      payload: {
        exam_schedule_id: assignment.exam_schedule_id,
        teacher_id: assignment.teacher_id,
      },
    });
  }

  revalidateProctorPaths();
  redirectTo({
    ok: !error,
    message: error
      ? error.message
      : isActive
        ? "Penugasan pengawas diaktifkan."
        : "Penugasan pengawas dinonaktifkan.",
  });
}

export async function deleteTeacherProctorAction(formData: FormData) {
  const user = await requirePermission("exam_schedules.manage");
  const assignmentId = formString(formData, "id");

  if (!assignmentId) {
    redirectTo({
      ok: false,
      message: "Penugasan pengawas tidak valid.",
    });
  }

  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("exam_proctors")
    .select("id, school_id, exam_schedule_id, teacher_id")
    .eq("id", assignmentId)
    .maybeSingle();

  assertSameSchool(scope, assignment?.school_id);

  if (!assignment) {
    redirectTo({
      ok: false,
      message: "Penugasan pengawas tidak ditemukan.",
    });
  }

  const { error } = await supabase
    .from("exam_proctors")
    .delete()
    .eq("id", assignmentId);

  if (!error) {
    await logAuditEvent({
      userId: user.id,
      action: "exam_proctors.delete",
      entityType: "exam_proctors",
      entityId: assignmentId,
      payload: {
        exam_schedule_id: assignment.exam_schedule_id,
        teacher_id: assignment.teacher_id,
      },
    });
  }

  revalidateProctorPaths();
  redirectTo({
    ok: !error,
    message: error ? error.message : "Penugasan pengawas berhasil dihapus.",
  });
}

function revalidateProctorPaths() {
  revalidatePath("/dashboard/exams/proctors");
  revalidatePath("/dashboard/exams/schedules");
  revalidatePath("/dashboard/teacher/monitoring");
  revalidatePath("/dashboard/proctor/monitoring");
  revalidatePath("/dashboard/admin/monitoring");
}
