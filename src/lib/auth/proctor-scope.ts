import { createClient } from "@/lib/supabase/server";

export async function getActiveProctorScheduleIds(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_proctors")
    .select("exam_schedule_id")
    .eq("teacher_id", userId)
    .eq("is_active", true);

  return (data ?? [])
    .map((item) => item.exam_schedule_id as string | null)
    .filter((scheduleId): scheduleId is string => Boolean(scheduleId));
}

export async function hasActiveProctorAssignment(
  userId: string,
  scheduleId?: string | null,
) {
  if (!scheduleId) {
    return false;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_proctors")
    .select("id")
    .eq("exam_schedule_id", scheduleId)
    .eq("teacher_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

export async function hasAnyActiveProctorAssignment(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_proctors")
    .select("id")
    .eq("teacher_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

export async function getTeacherSubjectIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_subjects")
    .select("subject_id")
    .eq("teacher_id", userId);

  return (data ?? [])
    .map((item) => item.subject_id as string | null)
    .filter((id): id is string => Boolean(id));
}

export async function hasTeacherMonitoringAccess(
  userId: string,
  scheduleId?: string | null,
): Promise<boolean> {
  // 1. If assigned as proctor for this schedule (or any schedule if scheduleId not provided)
  if (scheduleId) {
    const isProctor = await hasActiveProctorAssignment(userId, scheduleId);
    if (isProctor) return true;
  } else {
    const hasAnyProctor = await hasAnyActiveProctorAssignment(userId);
    if (hasAnyProctor) return true;
  }

  // 2. Check if schedule belongs to teacher's subjects or was created by teacher
  const teacherSubjectIds = await getTeacherSubjectIds(userId);
  if (teacherSubjectIds.length === 0) {
    return false;
  }

  const supabase = await createClient();

  if (scheduleId) {
    const { data: schedule } = await supabase
      .from("exam_schedules")
      .select("id, created_by, exam_packages(subject_id)")
      .eq("id", scheduleId)
      .maybeSingle();

    if (!schedule) return false;
    if (schedule.created_by === userId) return true;

    const pkg = Array.isArray(schedule.exam_packages)
      ? schedule.exam_packages[0]
      : schedule.exam_packages;
    return Boolean(pkg?.subject_id && teacherSubjectIds.includes(pkg.subject_id));
  }

  // If no scheduleId specified: check if there is any active/scheduled/finished exam for their subjects
  const { data: anySchedule } = await supabase
    .from("exam_schedules")
    .select("id, exam_packages!inner(subject_id)")
    .is("deleted_at", null)
    .in("status", ["scheduled", "active", "finished"])
    .in("exam_packages.subject_id", teacherSubjectIds)
    .limit(1)
    .maybeSingle();

  return Boolean(anySchedule);
}
