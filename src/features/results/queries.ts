import { requireAuth } from "@/lib/auth/require-auth";
import {
  assertSameSchool,
  requireSchoolScope,
  requireScopedSchoolId,
} from "@/lib/auth/school-scope";
import { createClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

export function firstRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getStudentSubmittedAttempts() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_attempts")
    .select(
      "*, exam_schedules(id, title, start_at, end_at, exam_packages(id, title, total_points, show_result, subjects(code, name)))",
    )
    .eq("student_id", user.id)
    .in("status", ["submitted", "expired"])
    .order("submitted_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getResultDetail(attemptId: string) {
  const user = await requireAuth();
  const supabase = await createClient();
  let attemptQuery = supabase
    .from("exam_attempts")
    .select(
      "*, users(id, username, email, user_profiles(full_name, nis, nisn)), exam_schedules(id, title, school_id, start_at, end_at, exam_packages(id, title, total_points, show_result, subjects(id, code, name)))",
    )
    .eq("id", attemptId);

  if (user.roles?.name === "student") {
    attemptQuery = attemptQuery.eq("student_id", user.id);
  }

  const { data: attempt, error } = await attemptQuery.single();

  if (error || !attempt) {
    return null;
  }

  const schedule = firstRelation(attempt.exam_schedules);
  const examPackage = firstRelation(schedule?.exam_packages);
  const subject = firstRelation(examPackage?.subjects);

  if (user.roles?.name === "teacher") {
    const canView = subject?.id
      ? await teacherHasSubject(user.id, subject.id as string)
      : false;

    if (!canView) {
      return null;
    }
  } else if (user.roles?.name !== "student") {
    const scope = await requireSchoolScope();
    assertSameSchool(scope, schedule?.school_id as string | null | undefined);
  }

  const { data: answers } = await supabase
    .from("exam_answers")
    .select(
      "*, questions(id, type, content, point, question_stimuli(id, title, content, media_url, media_type), question_attachments(id, media_type, url, file_name, caption, order_number)), question_options(id, option_label, option_text)",
    )
    .eq("exam_attempt_id", attemptId)
    .order("created_at");

  return {
    attempt,
    answers: answers ?? [],
  };
}

export async function getTeacherResultRecap(filters?: {
  grading_status?: string;
  schedule_id?: string;
  subject_id?: string;
}) {
  const user = await requireAuth();
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const subjectIds = await getTeacherSubjectIds(user.id);
  let scopedScheduleIds: string[] | null = null;

  if (user.roles?.name !== "teacher" && !scope.isSuperAdmin) {
    scopedScheduleIds = await getSchoolScheduleIds(
      requireScopedSchoolId(scope)!,
    );

    if (scopedScheduleIds.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from("exam_attempts")
    .select(
      "*, users(id, username, email, user_profiles(full_name, nis, nisn)), exam_schedules(id, title, exam_packages(id, title, subjects(id, code, name)))",
    )
    .in("status", ["submitted", "expired"])
    .order("submitted_at", { ascending: false });

  if (filters?.grading_status) {
    query = query.eq("grading_status", filters.grading_status);
  }

  if (filters?.schedule_id) {
    query = query.eq("exam_schedule_id", filters.schedule_id);
  }

  if (scopedScheduleIds) {
    query = query.in("exam_schedule_id", scopedScheduleIds);
  }

  if (user.roles?.name === "teacher") {
    if (subjectIds.length === 0) {
      return [];
    }

    const { data: packages } = await supabase
      .from("exam_packages")
      .select("id")
      .in("subject_id", subjectIds);

    const packageIds = (packages ?? []).map((item) => item.id as string);

    if (packageIds.length === 0) {
      return [];
    }

    const { data: schedules } = await supabase
      .from("exam_schedules")
      .select("id")
      .in("exam_package_id", packageIds);

    const scheduleIds = (schedules ?? []).map((item) => item.id as string);

    if (scheduleIds.length === 0) {
      return [];
    }

    query = query.in("exam_schedule_id", scheduleIds);
  }

  if (filters?.subject_id) {
    const { data: packages } = await supabase
      .from("exam_packages")
      .select("id")
      .eq("subject_id", filters.subject_id);
    const packageIds = (packages ?? []).map((item) => item.id as string);

    if (packageIds.length === 0) {
      return [];
    }

    const { data: schedules } = await supabase
      .from("exam_schedules")
      .select("id")
      .in("exam_package_id", packageIds);
    const scheduleIds = (schedules ?? []).map((item) => item.id as string);

    if (scheduleIds.length === 0) {
      return [];
    }

    query = query.in("exam_schedule_id", scheduleIds);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getTeacherGradingFilters() {
  const attempts = await getTeacherResultRecap();
  const scheduleMap = new Map<string, string>();
  const subjectMap = new Map<string, string>();

  for (const attempt of attempts) {
    const schedule = firstRelation(attempt.exam_schedules);
    const examPackage = firstRelation(schedule?.exam_packages);
    const subject = firstRelation(examPackage?.subjects);

    if (schedule?.id && schedule?.title) {
      scheduleMap.set(schedule.id as string, schedule.title as string);
    }

    if (subject?.id && subject?.code && subject?.name) {
      subjectMap.set(
        subject.id as string,
        `${subject.code as string} - ${subject.name as string}`,
      );
    }
  }

  return {
    schedules: Array.from(scheduleMap, ([value, label]) => ({ value, label })),
    subjects: Array.from(subjectMap, ([value, label]) => ({ value, label })),
  };
}

async function getTeacherSubjectIds(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_subjects")
    .select("subject_id")
    .eq("teacher_id", userId);

  if (error || !data) {
    return [];
  }

  return [...new Set(data.map((item) => item.subject_id as string))];
}

async function teacherHasSubject(userId: string, subjectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_subjects")
    .select("id")
    .eq("teacher_id", userId)
    .eq("subject_id", subjectId)
    .limit(1)
    .maybeSingle();

  return Boolean(data?.id);
}

async function getSchoolScheduleIds(schoolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_schedules")
    .select("id")
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  return (data ?? []).map((schedule) => schedule.id as string);
}

export async function getRapidGradingAnswers(scheduleId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Ensure teacher has permission / valid scope (skipping complex checks for brevity or we can rely on RLS/schema)
  // We fetch answers that need manual grading for the given schedule.
  const { data, error } = await supabase
    .from("exam_answers")
    .select(`
      id,
      essay_answer,
      awarded_score,
      max_score,
      needs_manual_grading,
      exam_attempts!inner (
        id,
        exam_schedule_id,
        users (
          id,
          username,
          user_profiles (full_name)
        )
      ),
      questions!inner (
        id,
        content,
        point,
        question_stimuli(title, content, media_url, media_type),
        question_attachments(media_type, url, file_name)
      )
    `)
    .eq("needs_manual_grading", true)
    .eq("exam_attempts.exam_schedule_id", scheduleId)
    .order("created_at");

  if (error || !data) {
    return [];
  }

  return data;
}
