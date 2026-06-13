import { NextResponse } from "next/server";

import {
  firstRelation,
  getMonitoringSchedules,
  getScheduleMonitoring,
} from "@/features/monitoring/queries";
import { toCsv } from "@/features/reports/queries";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { requirePermission } from "@/lib/auth/require-permission";

export async function GET(request: Request) {
  const user = await requirePermission("exam_monitoring.view");
  const url = new URL(request.url);
  const filters = {
    schedule_id: url.searchParams.get("schedule_id") || undefined,
    class_id: url.searchParams.get("class_id") || undefined,
    subject_id: url.searchParams.get("subject_id") || undefined,
    status: url.searchParams.get("status") || undefined,
  };
  const scope =
    user.roles?.name === "teacher" || user.roles?.name === "proctor"
      ? "teacher"
      : "all";
  const schedules = await getMonitoringSchedules({
    scope,
    user,
    subject_id: filters.subject_id,
  });
  const exportSchedules = filters.schedule_id
    ? schedules.filter((schedule) => schedule.id === filters.schedule_id)
    : schedules;

  if (filters.schedule_id && exportSchedules.length === 0) {
    return NextResponse.json({ error: "Jadwal tidak ditemukan" }, { status: 404 });
  }

  const rows = (
    await Promise.all(
      exportSchedules.map(async (schedule) => {
        const participants = await getScheduleMonitoring(schedule.id as string, {
          class_id: filters.class_id,
          status: filters.status,
        }, { scope, user });
        const examPackage = firstRelation(schedule.exam_packages);
        const subject = firstRelation(examPackage?.subjects);

        return participants.map((participant) => {
          const student = firstRelation(participant.users);
          const profile = firstRelation(student?.user_profiles);
          const classItem = firstRelation(participant.classes);
          const attempt = firstRelation(participant.exam_attempts);
          const events = attempt?.exam_events ?? [];
          const lastEvent = [...events].sort((a, b) =>
            String(b.created_at).localeCompare(String(a.created_at)),
          )[0];

          return {
            jadwal: String(schedule.title ?? ""),
            mapel: `${subject?.code ?? ""} ${subject?.name ?? ""}`.trim(),
            kelas: String(classItem?.name ?? ""),
            siswa: String(profile?.full_name ?? student?.username ?? ""),
            nis: String(profile?.nis ?? ""),
            email: String(student?.email ?? ""),
            status_peserta: String(participant.status ?? ""),
            status_attempt: String(attempt?.status ?? ""),
            mulai: String(attempt?.started_at ?? participant.started_at ?? ""),
            submit: String(attempt?.submitted_at ?? participant.submitted_at ?? ""),
            last_save: String(attempt?.last_saved_at ?? ""),
            locked: attempt?.locked_at ? "yes" : "no",
            lock_reason: String(attempt?.lock_reason ?? ""),
            jawaban: attempt?.exam_answers?.length ?? 0,
            event: events.length,
            last_event: String(lastEvent?.event_type ?? ""),
            last_event_at: String(lastEvent?.created_at ?? ""),
          };
        });
      }),
    )
  ).flat();

  await logAuditEvent({
    userId: user.id,
    action: "monitoring.export",
    entityType: "exam_monitoring",
    payload: {
      filters,
      row_count: rows.length,
    },
  });

  const csv = toCsv(rows);
  const filename = filters.schedule_id
    ? "monitoring-progress-jadwal.csv"
    : "monitoring-progress-semua-jadwal.csv";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
