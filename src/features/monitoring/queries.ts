import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/auth/has-permission";
import {
  assertSameSchool,
  requireSchoolScope,
  requireScopedSchoolId,
} from "@/lib/auth/school-scope";
import type { CurrentUser } from "@/types/auth";

export type MonitoringScope = "all" | "teacher";

export async function getMonitoringSchedules(options?: {
  scope?: MonitoringScope;
  user?: CurrentUser;
  subject_id?: string;
}) {
  const schoolScope = await requireSchoolScope();
  const scopedSchoolId = requireScopedSchoolId(schoolScope);
  const supabase = await createClient();
  let query = supabase
    .from("exam_schedules")
    .select(
      "id, title, status, start_at, end_at, created_by, exam_packages(title, subject_id, subjects(code, name))",
    )
    .is("deleted_at", null)
    .in("status", ["scheduled", "active", "finished"])
    .order("start_at", { ascending: false });

  if (scopedSchoolId) {
    query = query.eq("school_id", scopedSchoolId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  let schedules = data;

  if (options?.scope === "teacher" && options.user?.id) {
    const [subjectIds, assignedScheduleIds] = await Promise.all([
      getTeacherSubjectIds(options.user.id),
      getTeacherProctorScheduleIds(options.user.id),
    ]);

    schedules = schedules.filter((schedule) => {
      const examPackage = firstRelation(schedule.exam_packages);

      return (
        schedule.created_by === options.user?.id ||
        assignedScheduleIds.includes(schedule.id as string) ||
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

async function getTeacherProctorScheduleIds(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_proctors")
    .select("exam_schedule_id")
    .eq("teacher_id", teacherId)
    .eq("is_active", true);

  if (error || !data) {
    return [];
  }

  return data
    .map((item) => item.exam_schedule_id as string | null)
    .filter((scheduleId): scheduleId is string => Boolean(scheduleId));
}

export type MonitoringFilters = {
  status?: string;
  class_id?: string;
};

export async function getScheduleMonitoring(
  scheduleId?: string,
  filters: MonitoringFilters = {},
  options?: {
    scope?: MonitoringScope;
    user?: CurrentUser;
  },
) {
  if (!scheduleId) {
    return [];
  }

  await assertMonitoringScheduleInScope(scheduleId, options);

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

export async function getMonitoringClasses(
  scheduleId?: string,
  options?: {
    scope?: MonitoringScope;
    user?: CurrentUser;
  },
) {
  if (!scheduleId) {
    return [];
  }

  await assertMonitoringScheduleInScope(scheduleId, options);

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
  const schoolScope = await requireSchoolScope();
  const scopedSchoolId = requireScopedSchoolId(schoolScope);
  const supabase = await createClient();
  let query = supabase
    .from("exam_schedules")
    .select(
      "id, title, status, start_at, end_at, token_required, access_token, exam_packages(title, subjects(code, name)), exam_schedule_classes(classes(id, name)), exam_participants(id, status, class_id, exam_attempts(id, status, locked_at, exam_events(id, event_type, created_at)))",
    )
    .is("deleted_at", null)
    .in("status", ["scheduled", "active", "finished"])
    .order("start_at", { ascending: true });

  if (scopedSchoolId) {
    query = query.eq("school_id", scopedSchoolId);
  }

  const { data, error } = await query;

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

export async function canControlMonitoringSchedule(
  user: CurrentUser,
  scheduleId?: string,
) {
  if (!scheduleId) {
    return false;
  }

  if (hasPermission(user, "exam_sessions.control")) {
    return true;
  }

  if (user.roles?.name !== "teacher") {
    return false;
  }

  return hasActiveTeacherProctorAssignment(scheduleId, user.id);
}

async function assertMonitoringScheduleInScope(
  scheduleId: string,
  options?: {
    scope?: MonitoringScope;
    user?: CurrentUser;
  },
) {
  const schoolScope = await requireSchoolScope();
  const supabase = await createClient();
  const { data: schedule } = await supabase
    .from("exam_schedules")
    .select("school_id")
    .eq("id", scheduleId)
    .maybeSingle();

  assertSameSchool(schoolScope, schedule?.school_id);

  if (options?.scope === "teacher" && options.user?.roles?.name === "teacher") {
    const allowed = await canTeacherAccessMonitoringSchedule(
      scheduleId,
      options.user,
    );

    if (!allowed) {
      assertSameSchool(schoolScope, null);
    }
  }
}

async function canTeacherAccessMonitoringSchedule(
  scheduleId: string,
  user: CurrentUser,
) {
  const supabase = await createClient();
  const { data: schedule } = await supabase
    .from("exam_schedules")
    .select("created_by, exam_packages(subject_id)")
    .eq("id", scheduleId)
    .maybeSingle();

  if (!schedule) {
    return false;
  }

  if (schedule.created_by === user.id) {
    return true;
  }

  const { data: proctorAssignment } = await supabase
    .from("exam_proctors")
    .select("id")
    .eq("exam_schedule_id", scheduleId)
    .eq("teacher_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (proctorAssignment) {
    return true;
  }

  const examPackage = firstRelation(schedule.exam_packages);

  if (!examPackage?.subject_id) {
    return false;
  }

  const { data: subjectAssignment } = await supabase
    .from("teacher_subjects")
    .select("id")
    .eq("teacher_id", user.id)
    .eq("subject_id", examPackage.subject_id)
    .limit(1)
    .maybeSingle();

  return Boolean(subjectAssignment);
}

async function hasActiveTeacherProctorAssignment(
  scheduleId: string,
  teacherId: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_proctors")
    .select("id")
    .eq("exam_schedule_id", scheduleId)
    .eq("teacher_id", teacherId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}
