import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/types/auth";

type MonitoringScope = "all" | "teacher";

export async function getMonitoringSchedules(options?: {
  scope?: MonitoringScope;
  user?: CurrentUser;
  subject_id?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_schedules")
    .select(
      "id, title, status, start_at, end_at, created_by, exam_packages(title, subject_id, subjects(code, name))",
    )
    .is("deleted_at", null)
    .in("status", ["scheduled", "active", "finished"])
    .order("start_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  let schedules = data;

  if (options?.scope === "teacher" && options.user?.id) {
    const subjectIds = await getTeacherSubjectIds(options.user.id);

    schedules = schedules.filter((schedule) => {
      const examPackage = firstRelation(schedule.exam_packages);

      return (
        schedule.created_by === options.user?.id ||
        Boolean(
          examPackage?.subject_id &&
            subjectIds.includes(examPackage.subject_id as string),
        )
      );
    });
  }

  if (options?.subject_id) {
    schedules = schedules.filter((schedule) => {
      const examPackage = firstRelation(schedule.exam_packages);

      return examPackage?.subject_id === options.subject_id;
    });
  }

  return schedules;
}

async function getTeacherSubjectIds(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_subjects")
    .select("subject_id")
    .eq("teacher_id", teacherId);

  if (error || !data) {
    return [];
  }

  return data
    .map((item) => item.subject_id as string | null)
    .filter((subjectId): subjectId is string => Boolean(subjectId));
}

export type MonitoringFilters = {
  status?: string;
  class_id?: string;
};

export async function getScheduleMonitoring(
  scheduleId?: string,
  filters: MonitoringFilters = {},
) {
  if (!scheduleId) {
    return [];
  }

  const supabase = await createClient();
  let query = supabase
    .from("exam_participants")
    .select(
      "*, users(id, username, email, user_profiles(full_name, nis)), classes(name), exam_attempts(id, status, started_at, submitted_at, last_saved_at, locked_at, locked_by, lock_reason, exam_answers(id), exam_events(id, event_type, created_at))",
    )
    .eq("exam_schedule_id", scheduleId)
    .order("created_at", { ascending: true });

  if (filters.class_id) {
    query = query.eq("class_id", filters.class_id);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getMonitoringClasses(scheduleId?: string) {
  if (!scheduleId) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_schedule_classes")
    .select("classes(id, name)")
    .eq("exam_schedule_id", scheduleId);

  if (error || !data) {
    return [];
  }

  return data
    .map((item) => firstRelation(item.classes))
    .filter((item): item is { id: string; name: string } => Boolean(item?.id));
}

export async function getMonitoringSubjectOptions(options?: {
  scope?: MonitoringScope;
  user?: CurrentUser;
}) {
  const schedules = await getMonitoringSchedules(options);
  const subjectMap = new Map<string, { id: string; code: string; name: string }>();

  for (const schedule of schedules) {
    const examPackage = firstRelation(schedule.exam_packages);
    const subject = firstRelation(examPackage?.subjects);

    if (examPackage?.subject_id && subject?.code && subject?.name) {
      subjectMap.set(examPackage.subject_id as string, {
        id: examPackage.subject_id as string,
        code: subject.code as string,
        name: subject.name as string,
      });
    }
  }

  return Array.from(subjectMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export async function getProctorScheduleOverview() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_schedules")
    .select(
      "id, title, status, start_at, end_at, token_required, access_token, exam_packages(title, subjects(code, name)), exam_schedule_classes(classes(id, name)), exam_participants(id, status, class_id, exam_attempts(id, status, locked_at, exam_events(id, event_type, created_at)))",
    )
    .is("deleted_at", null)
    .in("status", ["scheduled", "active", "finished"])
    .order("start_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getProctorOperationalSummary() {
  const schedules = await getProctorScheduleOverview();
  const now = new Date();
  const activeSchedules = schedules.filter((schedule) => schedule.status === "active");
  const upcomingSchedules = schedules.filter((schedule) => {
    const startAt = schedule.start_at ? new Date(schedule.start_at) : null;

    return schedule.status === "scheduled" && Boolean(startAt && startAt >= now);
  });
  const participants = schedules.flatMap(
    (schedule) => schedule.exam_participants ?? [],
  );
  const attempts = participants.flatMap((participant) => {
    const attempt = firstRelation(participant.exam_attempts);

    return attempt ? [attempt] : [];
  });
  const events = attempts.flatMap((attempt) => attempt.exam_events ?? []);

  return {
    schedules,
    activeSchedules,
    upcomingSchedules,
    participants,
    attempts,
    events,
    submitted: attempts.filter((attempt) => attempt.status === "submitted").length,
    inProgress: attempts.filter((attempt) => attempt.status === "in_progress").length,
    locked: attempts.filter((attempt) => Boolean(attempt.locked_at)).length,
    absent: participants.filter((participant) => participant.status === "absent").length,
    tokenRequired: schedules.filter((schedule) => schedule.token_required).length,
  };
}

export function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
