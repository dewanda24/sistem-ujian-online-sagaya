import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import {
  forceSubmitAttemptAction,
  lockAttemptAction,
  markParticipantAbsentAction,
  resetAttemptAction,
  unlockAttemptAction,
} from "@/features/monitoring/actions";
import { MonitoringActionButton } from "@/features/monitoring/components/monitoring-action-button";
import { MonitoringAutoRefresh } from "@/features/monitoring/components/monitoring-auto-refresh";
import {
  firstRelation,
  getMonitoringClasses,
  getMonitoringSchedules,
  getMonitoringSubjectOptions,
  getScheduleMonitoring,
} from "@/features/monitoring/queries";
import { hasPermission } from "@/lib/auth/has-permission";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    schedule_id?: string;
    class_id?: string;
    subject_id?: string;
    status?: string;
    notice?: string;
    message?: string;
  }>;
  scope?: "all" | "teacher";
  basePath?: string;
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

export default async function MonitoringPage({
  searchParams,
  scope = "all",
  basePath = "/dashboard/proctor/monitoring",
}: PageProps) {
  const user = await requirePermission("exam_monitoring.view");
  const params = await searchParams;
  const returnTo = buildReturnTo(basePath, params);
  const [schedules, subjectOptions] = await Promise.all([
    getMonitoringSchedules({
      scope,
      user,
      subject_id: params.subject_id,
    }),
    getMonitoringSubjectOptions({ scope, user }),
  ]);
  const selectedScheduleId = params.schedule_id ?? schedules[0]?.id;
  const [participants, classes] = await Promise.all([
    getScheduleMonitoring(selectedScheduleId, {
      class_id: params.class_id,
      status: params.status,
    }),
    getMonitoringClasses(selectedScheduleId),
  ]);
  const stats = participants.reduce(
    (summary, participant) => {
      const attempt = firstRelation(participant.exam_attempts);
      const status = attempt?.status ?? participant.status ?? "assigned";

      summary.total += 1;
      summary.byStatus[status] = (summary.byStatus[status] ?? 0) + 1;
      summary.events += attempt?.exam_events?.length ?? 0;

      return summary;
    },
    { total: 0, events: 0, byStatus: {} as Record<string, number> },
  );
  const canControlSessions = hasPermission(user, "exam_sessions.control");
  const submittedCount = stats.byStatus.submitted ?? 0;
  const inProgressCount = stats.byStatus.in_progress ?? 0;
  const assignedCount = stats.byStatus.assigned ?? 0;
  const absentCount = stats.byStatus.absent ?? 0;
  const lockedCount = participants.filter((participant) => {
    const attempt = firstRelation(participant.exam_attempts);

    return Boolean(attempt?.locked_at);
  }).length;
  const progressPercent =
    stats.total > 0 ? Math.round((submittedCount / stats.total) * 100) : 0;
  const scopeLabel =
    basePath.includes("/admin/")
      ? "Admin Sekolah"
      : basePath.includes("/super-admin/")
        ? "Super Admin"
        : basePath.includes("/teacher/")
          ? "Guru"
          : "Proctor";

  return (
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />
      <DashboardPageHeader
        title="Exam Monitoring"
        description={`${scopeLabel}: pantau peserta, status attempt, waktu pengerjaan, jawaban tersimpan, dan event anti-cheat.`}
      />

      <MonitoringAutoRefresh intervalSeconds={15} />

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
        <select
          name="subject_id"
          defaultValue={params.subject_id ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua mapel</option>
          {subjectOptions.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.code} - {subject.name}
            </option>
          ))}
        </select>
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
        <select
          name="class_id"
          defaultValue={params.class_id ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua kelas</option>
          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua status</option>
          <option value="assigned">Belum mulai</option>
          <option value="in_progress">Sedang mengerjakan</option>
          <option value="submitted">Sudah submit</option>
          <option value="expired">Expired</option>
          <option value="absent">Tidak hadir</option>
        </select>
        <a
          href={basePath}
          className="rounded-md border px-4 py-2 text-center text-sm hover:bg-muted"
        >
          Reset
        </a>
        <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Tampilkan
        </button>
      </form>

      {!selectedScheduleId ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Belum ada jadwal yang dapat dimonitor. Pastikan jadwal sudah scheduled
          atau active dan peserta sudah disinkronkan.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        <MonitoringStat label="Peserta" value={stats.total} />
        <MonitoringStat label="Belum Mulai" value={assignedCount} />
        <MonitoringStat label="In Progress" value={inProgressCount} />
        <MonitoringStat label="Submitted" value={submittedCount} />
        <MonitoringStat label="Expired" value={stats.byStatus.expired ?? 0} />
        <MonitoringStat label="Absent" value={absentCount} />
        <MonitoringStat label="Locked" value={lockedCount} />
        <MonitoringStat label="Event" value={stats.events} />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="font-medium">Progress Submit</span>
          <span className="text-muted-foreground">
            {submittedCount}/{stats.total} peserta ({progressPercent}%)
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <a
          href="/dashboard/import-export"
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
        >
          Buka Import/Export
        </a>
      </div>

      <DataTable
        columns={[
          "Peserta",
          "Kelas",
          "Status",
          "Lock",
          "Mulai",
          "Submit",
          "Last Save",
          "Jawaban",
          "Event",
          "Last Event",
          "Aksi",
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
                {attempt?.locked_at ? (
                  <div>
                    <StatusPill value="locked" />
                    <div className="mt-1 max-w-40 truncate text-xs text-muted-foreground">
                      {attempt.lock_reason ?? "Dikunci"}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
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
              <td className="px-4 py-3">
                {attempt?.id && canControlSessions ? (
                  <details className="relative">
                    <summary className="w-28 cursor-pointer rounded-md border px-3 py-1.5 text-center text-xs font-medium hover:bg-muted">
                      Aksi
                    </summary>
                    <div className="absolute right-0 z-20 mt-2 w-44 space-y-2 rounded-lg border bg-card p-2 shadow-lg">
                      <form action={forceSubmitAttemptAction}>
                        <input type="hidden" name="attempt_id" value={attempt.id} />
                        <input type="hidden" name="return_to" value={returnTo} />
                        <MonitoringActionButton
                          className="w-full"
                          disabled={
                            attempt.status === "submitted" ||
                            attempt.status === "cancelled"
                          }
                          confirmMessage="Force submit attempt siswa ini? Jawaban yang tersimpan akan dinilai."
                        >
                          Force Submit
                        </MonitoringActionButton>
                      </form>
                      {attempt.locked_at ? (
                        <form action={unlockAttemptAction}>
                          <input type="hidden" name="attempt_id" value={attempt.id} />
                          <input type="hidden" name="return_to" value={returnTo} />
                          <MonitoringActionButton
                            className="w-full"
                            confirmMessage="Buka lock attempt siswa ini? Siswa bisa lanjut mengerjakan."
                          >
                            Unlock
                          </MonitoringActionButton>
                        </form>
                      ) : (
                        <form action={lockAttemptAction}>
                          <input type="hidden" name="attempt_id" value={attempt.id} />
                          <input type="hidden" name="return_to" value={returnTo} />
                          <input
                            type="hidden"
                            name="lock_reason"
                            value="Dikunci dari monitoring ujian."
                          />
                          <MonitoringActionButton
                            className="w-full"
                            disabled={attempt.status !== "in_progress"}
                            confirmMessage="Kunci attempt siswa ini? Siswa tidak bisa menyimpan jawaban atau submit sampai dibuka."
                          >
                            Lock
                          </MonitoringActionButton>
                        </form>
                      )}
                      <form action={resetAttemptAction}>
                        <input type="hidden" name="attempt_id" value={attempt.id} />
                        <input type="hidden" name="return_to" value={returnTo} />
                        <MonitoringActionButton
                          className="w-full"
                          variant="danger"
                          disabled={attempt.status === "cancelled"}
                          confirmMessage="Reset attempt siswa ini? Attempt lama ditandai cancelled dan siswa bisa mulai ulang."
                        >
                          Reset
                        </MonitoringActionButton>
                      </form>
                    </div>
                  </details>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {canControlSessions &&
                    !attempt?.id &&
                    participant.status !== "absent" ? (
                      <form action={markParticipantAbsentAction}>
                        <input
                          type="hidden"
                          name="participant_id"
                          value={participant.id}
                        />
                        <input type="hidden" name="return_to" value={returnTo} />
                        <MonitoringActionButton
                          variant="danger"
                          confirmMessage="Tandai peserta ini tidak hadir?"
                        >
                          Absent
                        </MonitoringActionButton>
                      </form>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {attempt?.id ? "Read-only" : "Belum mulai"}
                    </span>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}

function buildReturnTo(
  basePath: string,
  params: Awaited<PageProps["searchParams"]>,
) {
  const query = new URLSearchParams();

  for (const key of ["schedule_id", "class_id", "subject_id", "status"] as const) {
    if (params[key]) {
      query.set(key, params[key]);
    }
  }

  return `${basePath}${query.size ? `?${query.toString()}` : ""}`;
}

function MonitoringStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
