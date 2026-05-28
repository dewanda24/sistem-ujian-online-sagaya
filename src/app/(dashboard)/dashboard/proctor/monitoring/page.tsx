import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable } from "@/components/master-data/data-table";
import {
  firstRelation,
  getMonitoringSchedules,
  getScheduleMonitoring,
} from "@/features/monitoring/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    schedule_id?: string;
  }>;
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function MonitoringPage({ searchParams }: PageProps) {
  await requirePermission("exam_monitoring.view");
  const params = await searchParams;
  const schedules = await getMonitoringSchedules();
  const selectedScheduleId = params.schedule_id ?? schedules[0]?.id;
  const participants = await getScheduleMonitoring(selectedScheduleId);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Exam Monitoring"
        description="Pantau peserta, status attempt, waktu pengerjaan, dan jumlah jawaban tersimpan. Refresh halaman untuk update terbaru."
      />

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_auto]">
        <select
          name="schedule_id"
          defaultValue={selectedScheduleId ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          {schedules.map((schedule) => {
            const examPackage = firstRelation(schedule.exam_packages);
            const subject = firstRelation(examPackage?.subjects);

            return (
              <option key={schedule.id} value={schedule.id}>
                {schedule.title} - {subject?.code ?? "Mapel"} - {schedule.status}
              </option>
            );
          })}
        </select>
        <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Tampilkan
        </button>
      </form>

      <DataTable
        columns={[
          "Peserta",
          "Kelas",
          "Status",
          "Mulai",
          "Submit",
          "Last Save",
          "Jawaban",
          "Event",
          "Last Event",
        ]}
        isEmpty={participants.length === 0}
        empty={
          <EmptyState
            title="Tidak ada peserta"
            description="Peserta akan tampil setelah siswa masuk ke ujian atau jadwal memiliki peserta."
          />
        }
      >
        {participants.map((participant) => {
          const user = firstRelation(participant.users);
          const profile = firstRelation(user?.user_profiles);
          const classItem = firstRelation(participant.classes);
          const attempt = firstRelation(participant.exam_attempts);
          const answerCount = attempt?.exam_answers?.length ?? 0;
          const events = attempt?.exam_events ?? [];
          const lastEvent = [...events].sort((a, b) =>
            String(b.created_at).localeCompare(String(a.created_at)),
          )[0];

          return (
            <tr key={participant.id}>
              <td className="px-4 py-3">
                <div className="font-medium">
                  {profile?.full_name ?? user?.username ?? "-"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {profile?.nis ?? user?.email ?? ""}
                </div>
              </td>
              <td className="px-4 py-3">{classItem?.name ?? "-"}</td>
              <td className="px-4 py-3">
                <StatusPill value={attempt?.status ?? participant.status} />
              </td>
              <td className="px-4 py-3">
                {formatDateTime(attempt?.started_at ?? participant.started_at)}
              </td>
              <td className="px-4 py-3">
                {formatDateTime(attempt?.submitted_at ?? participant.submitted_at)}
              </td>
              <td className="px-4 py-3">
                {formatDateTime(attempt?.last_saved_at)}
              </td>
              <td className="px-4 py-3">{answerCount}</td>
              <td className="px-4 py-3">{events.length}</td>
              <td className="px-4 py-3">
                {lastEvent ? (
                  <div>
                    <div>{lastEvent.event_type}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(lastEvent.created_at)}
                    </div>
                  </div>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
