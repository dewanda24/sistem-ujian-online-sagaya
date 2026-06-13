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
