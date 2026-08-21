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
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <DashboardPageHeader
          title="Pemantauan Ujian (Live Monitoring)"
          description="Pantau progres pengerjaan siswa, status online, dan reset sesi perangkat secara realtime."
        />
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={returnTo}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <RefreshCw className="size-3.5" />
            <span>Muat Ulang</span>
          </a>
          <a
            href="/api/monitoring/export"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <span>Unduh Data</span>
          </a>
        </div>
      </div>

      <MonitoringAutoRefresh intervalSeconds={15} />

      {/* METRIC SUMMARY CARDS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Peserta</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">Terdaftar pada jadwal ini</div>
        </div>
        <div className="rounded-2xl border border-blue-200/90 bg-blue-50/50 p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Online & Aktif</div>
          <div className="mt-1 text-2xl font-black text-blue-900">{stats.online}</div>
          <div className="mt-0.5 text-[11px] text-blue-600 font-medium">Sedang mengerjakan soal</div>
        </div>
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Selesai Submit</div>
          <div className="mt-1 text-2xl font-black text-emerald-900">{stats.submitted}</div>
          <div className="mt-0.5 text-[11px] text-emerald-600 font-medium">Jawaban sudah dikumpulkan</div>
        </div>
        <div className={`rounded-2xl border p-4 shadow-2xs ${
          stats.problem > 0
            ? "border-rose-200/90 bg-rose-50/60"
            : "border-slate-200/90 bg-white"
        }`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider ${
            stats.problem > 0 ? "text-rose-700" : "text-slate-500"
          }`}>
            Butuh Bantuan / Masalah
          </div>
          <div className={`mt-1 text-2xl font-black ${
            stats.problem > 0 ? "text-rose-900" : "text-slate-900"
          }`}>
            {stats.problem}
          </div>
          <div className={`mt-0.5 text-[11px] font-medium ${
            stats.problem > 0 ? "text-rose-600" : "text-slate-500"
          }`}>
            {stats.problem > 0 ? "Terkunci / ganti perangkat" : "Tidak ada kendala"}
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <form className="grid gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs md:grid-cols-6">
        <select
          name="schedule_id"
          defaultValue={selectedScheduleId ?? ""}
          className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium md:col-span-2"
        >
          {schedules.map((schedule) => {
            const examPackage = firstRelation(schedule.exam_packages);
            const subject = firstRelation(examPackage?.subjects);

            return (
              <option key={schedule.id} value={schedule.id}>
                {schedule.title} ({subject?.code ?? "Mapel"})
              </option>
            );
          })}
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
        >
          <option value="">Semua Status</option>
          <option value="assigned">Belum Mulai</option>
          <option value="in_progress">Sedang Ujian</option>
          <option value="submitted">Selesai</option>
          <option value="expired">Keluar</option>
          <option value="absent">Tidak Hadir</option>
        </select>
        <select
          name="class_id"
          defaultValue={params.class_id ?? ""}
          className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
        >
          <option value="">Semua Kelas</option>
          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name}
            </option>
          ))}
        </select>
        <select
          name="issue"
          defaultValue={params.issue ?? ""}
          className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
        >
          <option value="">Semua Kondisi</option>
          <option value="problem">Hanya Bermasalah</option>
        </select>
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari nama siswa / NIS..."
          className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium md:col-span-1"
        />
        <div className="flex items-center justify-end gap-2 md:col-span-6 pt-1 border-t border-slate-100">
          <a
            href={basePath}
            className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            Bersihkan Filter
          </a>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            Terapkan Filter
          </button>
        </div>
      </form>

      {!selectedScheduleId ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          Belum ada jadwal yang dapat dimonitor.
        </div>
      ) : null}

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
