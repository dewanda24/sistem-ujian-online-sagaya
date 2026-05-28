import { createClient } from "@/lib/supabase/server";

export async function getMonitoringSchedules() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_schedules")
    .select("id, title, status, start_at, end_at, exam_packages(title, subjects(code, name))")
    .is("deleted_at", null)
    .in("status", ["scheduled", "active", "finished"])
    .order("start_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getScheduleMonitoring(scheduleId?: string) {
  if (!scheduleId) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_participants")
    .select(
      "*, users(id, username, email, user_profiles(full_name, nis)), classes(name), exam_attempts(id, status, started_at, submitted_at, last_saved_at, exam_answers(id), exam_events(id, event_type, created_at))",
    )
    .eq("exam_schedule_id", scheduleId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

export function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
