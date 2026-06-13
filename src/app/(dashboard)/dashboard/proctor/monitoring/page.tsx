import { RefreshCw } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { MonitoringAutoRefresh } from "@/features/monitoring/components/monitoring-auto-refresh";
import { MonitoringParticipantTable } from "@/features/monitoring/components/monitoring-participant-table";
import {
  firstRelation,
  canControlMonitoringSchedule,
  getMonitoringClasses,
  getMonitoringSchedules,
  getScheduleMonitoring,
} from "@/features/monitoring/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    schedule_id?: string;
    class_id?: string;
    status?: string;
    issue?: string;
    q?: string;
    notice?: string;
    message?: string;
  }>;
  scope?: "all" | "teacher";
  basePath?: string;
};

export default async function MonitoringPage({
  searchParams,
  scope = "all",
  basePath = "/dashboard/proctor/monitoring",
}: PageProps) {
  const user = await requirePermission("exam_monitoring.view");
  const effectiveScope =
    user.roles?.name === "proctor" || user.roles?.name === "teacher"
      ? "teacher"
      : scope;
  const params = await searchParams;
  const returnTo = buildReturnTo(basePath, params);
  const schedules = await getMonitoringSchedules({
    scope: effectiveScope,
    user,
  });
  const selectedScheduleId = params.schedule_id ?? schedules[0]?.id;
  const [participants, classes] = await Promise.all([
    getScheduleMonitoring(selectedScheduleId, {
      class_id: params.class_id,
      status: params.status,
    }, {
      scope: effectiveScope,
      user,
    }),
    getMonitoringClasses(selectedScheduleId, {
      scope: effectiveScope,
      user,
    }),
  ]);
  const visibleParticipants =
    params.issue === "problem"
      ? participants.filter((participant) => isProblemParticipant(participant))
      : participants;
  const stats = participants.reduce(
    (summary, participant) => {
      const attempt = firstRelation(participant.exam_attempts);
      const status = attempt?.status ?? participant.status ?? "assigned";
      const online = isAttemptOnline(attempt);

      summary.total += 1;
      if (online) summary.online += 1;
      if (status === "in_progress") summary.inProgress += 1;
      if (status === "submitted") summary.submitted += 1;
      if (isProblemParticipant(participant)) summary.problem += 1;

      return summary;
    },
    { total: 0, online: 0, inProgress: 0, submitted: 0, problem: 0 },
  );
  const canControlSessions = await canControlMonitoringSchedule(
    user,
    selectedScheduleId,
  );

  return (
    <div className="space-y-5">
      <ActionToast status={params.notice} message={params.message} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <DashboardPageHeader
          title="Pemantauan Ujian"
          description="Pantau status peserta, progres pengerjaan, dan kejadian selama ujian."
        />
        <div className="flex flex-wrap gap-2">
          <a
            href={returnTo}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]"
          >
            <RefreshCw className="size-4" />
            Muat Ulang
          </a>
          <a
            href="/api/monitoring/export"
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]"
          >
            Unduh Data
          </a>
        </div>
      </div>

      <MonitoringAutoRefresh intervalSeconds={15} />

      <form className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-6">
        <select
          name="schedule_id"
          defaultValue={selectedScheduleId ?? ""}
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm md:col-span-2"
        >
          {schedules.map((schedule) => {
            const examPackage = firstRelation(schedule.exam_packages);
            const subject = firstRelation(examPackage?.subjects);

            return (
              <option key={schedule.id} value={schedule.id}>
                {schedule.title} - {subject?.code ?? "Mapel"}
              </option>
            );
          })}
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        >
          <option value="">Semua status</option>
          <option value="assigned">Belum Mulai</option>
          <option value="in_progress">Sedang Ujian</option>
          <option value="submitted">Selesai</option>
          <option value="expired">Keluar</option>
          <option value="absent">Tidak hadir</option>
        </select>
        <select
          name="class_id"
          defaultValue={params.class_id ?? ""}
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        >
          <option value="">Semua kelas</option>
          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name}
            </option>
          ))}
        </select>
        <select
          name="issue"
          defaultValue={params.issue ?? ""}
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        >
          <option value="">Semua kondisi</option>
          <option value="problem">Hanya bermasalah</option>
        </select>
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari nama siswa"
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm md:col-span-2"
        />
        <div className="flex justify-end gap-2 md:col-span-6">
          <a
            href={basePath}
            className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm hover:bg-[#F8FAFC]"
          >
            Bersihkan Filter
          </a>
          <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]">
            Tampilkan
          </button>
        </div>
      </form>

      {!selectedScheduleId ? (
        <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-sm text-[#92400E]">
          Belum ada jadwal yang dapat dimonitor.
        </div>
      ) : null}

      <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#64748B] shadow-sm">
        <span className="font-medium text-[#0F172A]">Total {stats.total}</span>
        <span className="mx-2">-</span>
        <span>Online {stats.online}</span>
        <span className="mx-2">-</span>
        <span>Selesai {stats.submitted}</span>
        <span className="mx-2">-</span>
        <span className={stats.problem > 0 ? "font-medium text-[#EF4444]" : ""}>
          Bermasalah {stats.problem}
        </span>
      </div>

      <MonitoringParticipantTable
        participants={visibleParticipants}
        canControlSessions={canControlSessions}
        returnTo={returnTo}
        searchQuery={params.q}
      />
    </div>
  );
}

function isAttemptOnline(attempt: { status?: string | null; last_activity_at?: string | null } | null) {
  if (attempt?.status !== "in_progress" || !attempt.last_activity_at) {
    return false;
  }

  return Date.now() - new Date(attempt.last_activity_at).getTime() <= 5 * 60 * 1000;
}

function isProblemParticipant(participant: {
  status?: string | null;
  exam_attempts?:
    | {
        status?: string | null;
        locked_at?: string | null;
        last_activity_at?: string | null;
        exam_events?: Array<{ event_type?: string | null }> | null;
      }
    | Array<{
        status?: string | null;
        locked_at?: string | null;
        last_activity_at?: string | null;
        exam_events?: Array<{ event_type?: string | null }> | null;
      }>
    | null;
}) {
  const attempt = firstRelation(participant.exam_attempts);
  const status = attempt?.status ?? participant.status;
  const events = attempt?.exam_events ?? [];

  return (
    Boolean(attempt?.locked_at) ||
    status === "expired" ||
    countEvents(events, "failed_submit") > 0 ||
    countViolationEvents(events) >= 3 ||
    isLatestEvent(events, ["offline", "disconnected"]) ||
    (status === "in_progress" && !isAttemptOnline(attempt))
  );
}

function countEvents(
  events: Array<{ event_type?: string | null }>,
  eventType: string,
) {
  return events.filter((event) => event.event_type === eventType).length;
}

function countViolationEvents(events: Array<{ event_type?: string | null }>) {
  const violationTypes = new Set([
    "tab_blur",
    "visibility_hidden",
    "copy_attempt",
    "paste_attempt",
    "fullscreen_exit",
    "before_unload",
  ]);

  return events.filter((event) =>
    event.event_type ? violationTypes.has(event.event_type) : false,
  ).length;
}

function isLatestEvent(
  events: Array<{ event_type?: string | null; created_at?: string | null }>,
  eventTypes: string[],
) {
  const latestEvent = events
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime(),
    )[0];

  return latestEvent?.event_type
    ? eventTypes.includes(latestEvent.event_type)
    : false;
}

function buildReturnTo(
  basePath: string,
  params: Awaited<PageProps["searchParams"]>,
) {
  const query = new URLSearchParams();

  for (const key of ["schedule_id", "class_id", "status", "issue", "q"] as const) {
    if (params[key]) {
      query.set(key, params[key]);
    }
  }

  return `${basePath}${query.size ? `?${query.toString()}` : ""}`;
}
