import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

export function firstRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getHomeroomClasses() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select(
      "id, name, grade_level, is_active, academic_years(id, name), schools(name), class_members(id, student_id, joined_at, left_at, users(id, username, email, status, user_profiles(full_name, nis, nisn)))",
    )
    .eq("homeroom_teacher_id", user.id)
    .order("grade_level")
    .order("name");

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getTeacherAssignmentOverview() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_subjects")
    .select(
      "id, subject_id, class_id, academic_year_id, subjects(id, code, name), classes(id, name, grade_level, is_active), academic_years(id, name, is_active)",
    )
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getHomeroomScheduleSummary(classIds: string[]) {
  if (classIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data: scheduleClasses, error: scheduleClassError } = await supabase
    .from("exam_schedule_classes")
    .select("class_id, exam_schedule_id")
    .in("class_id", classIds);

  if (scheduleClassError || !scheduleClasses?.length) {
    return [];
  }

  const scheduleIds = [
    ...new Set(
      scheduleClasses
        .map((item) => item.exam_schedule_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const { data: schedules, error } = await supabase
    .from("exam_schedules")
    .select(
      "id, title, status, start_at, end_at, exam_packages(title, subjects(code, name)), exam_participants(id, class_id, status, exam_attempts(id, status, score, max_score, grading_status))",
    )
    .in("id", scheduleIds)
    .order("start_at", { ascending: false });

  if (error || !schedules) {
    return [];
  }

  return schedules.map((schedule) => ({
    ...schedule,
    classIds: scheduleClasses
      .filter((item) => item.exam_schedule_id === schedule.id)
      .map((item) => item.class_id as string),
  }));
}
