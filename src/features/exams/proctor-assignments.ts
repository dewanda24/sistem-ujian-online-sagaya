import { getExamSchedules } from "@/features/exams/queries";
import { createClient } from "@/lib/supabase/server";
import { getTeacherOptions, type SelectOption } from "@/lib/master-data/queries";
import {
  requireSchoolScope,
  requireScopedSchoolId,
} from "@/lib/auth/school-scope";

export type ProctorAssignmentRow = {
  id: string;
  scheduleId: string;
  scheduleTitle: string;
  scheduleStatus: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  isActive: boolean;
  assignedAt: string;
  notes: string;
};

export async function getProctorAssignmentPageData() {
  const [schedules, teachers, assignments] = await Promise.all([
    getProctorScheduleOptions(),
    getTeacherOptions(),
    getProctorAssignments(),
  ]);

  return {
    schedules,
    teachers,
    assignments,
  };
}

async function getProctorScheduleOptions(): Promise<SelectOption[]> {
  const schedules = await getExamSchedules({});

  return schedules
    .filter((schedule) => schedule.status !== "archived")
    .map((schedule) => ({
      value: schedule.id as string,
      label: `${schedule.title ?? "Jadwal ujian"} - ${
        schedule.status === "scheduled" ? "ready" : schedule.status
      }`,
    }));
}

async function getProctorAssignments(): Promise<ProctorAssignmentRow[]> {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("exam_proctors")
    .select(
      "id, exam_schedule_id, teacher_id, is_active, assigned_at, notes, exam_schedules(title, status, school_id), users!exam_proctors_teacher_id_fkey(email, username, user_profiles(full_name))",
    )
    .order("assigned_at", { ascending: false });

  if (!scope.isSuperAdmin) {
    query = query.eq("school_id", requireScopedSchoolId(scope));
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((assignment) => {
    const schedule = firstRelation(assignment.exam_schedules);
    const teacher = firstRelation(assignment.users);
    const profile = firstRelation(teacher?.user_profiles);

    return {
      id: assignment.id as string,
      scheduleId: assignment.exam_schedule_id as string,
      scheduleTitle: schedule?.title ?? "Jadwal ujian",
      scheduleStatus: schedule?.status ?? "-",
      teacherId: assignment.teacher_id as string,
      teacherName: profile?.full_name ?? teacher?.username ?? "Guru",
      teacherEmail: teacher?.email ?? "",
      isActive: Boolean(assignment.is_active),
      assignedAt: assignment.assigned_at as string,
      notes: assignment.notes ?? "",
    };
  });
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
