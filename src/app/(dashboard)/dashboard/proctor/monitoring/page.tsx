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
  const params = await searchParams;
  const returnTo = buildReturnTo(basePath, params);
  const schedules = await getMonitoringSchedules({
    scope,
    user,
  });
  const selectedScheduleId = params.schedule_id ?? schedules[0]?.id;
  const [participants, classes] = await Promise.all([
    getScheduleMonitoring(selectedScheduleId, {
      class_id: params.class_id,
      status: params.status,
    }, {
      scope,
      user,
    }),
    getMonitoringClasses(selectedScheduleId, {
      scope,
      user,
    }),
  ]);
  const stats = participants.reduce(
    (summary, participant) => {
      const attempt = firstRelation(participant.exam_attempts);
      const status = attempt?.status ?? participant.status ?? "assigned";
      const eventCount = attempt?.exam_events?.length ?? 0;
      const locked = Boolean(attempt?.locked_at);

      summary.total += 1;
      if (status === "in_progress") summary.inProgress += 1;
      if (status === "submitted") summary.submitted += 1;
      if (eventCount >= 3 || locked || status === "expired") summary.problem += 1;

      return summary;
    },
    { total: 0, inProgress: 0, submitted: 0, problem: 0 },
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
          title="Pengawasan Ujian"
          description="Pantau status peserta, progres pengerjaan, dan kejadian selama ujian."
        />
        <div className="flex flex-wrap gap-2">
          <a
            href={returnTo}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]"
          >
            <RefreshCw className="size-4" />
            Refresh
          </a>
          <a
            href="/api/monitoring/export"
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]"
          >
            Export
          </a>
        </div>
      </div>

      <MonitoringAutoRefresh intervalSeconds={15} />

      <form className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-5">
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
          <option value="in_progress">Mengerjakan</option>
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
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari nama siswa"
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        />
        <div className="flex justify-end gap-2 md:col-span-5">
          <a
            href={basePath}
            className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm hover:bg-[#F8FAFC]"
          >
            Reset
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
        <span>Online {stats.inProgress}</span>
        <span className="mx-2">-</span>
        <span>Selesai {stats.submitted}</span>
        <span className="mx-2">-</span>
        <span className={stats.problem > 0 ? "font-medium text-[#EF4444]" : ""}>
          Bermasalah {stats.problem}
        </span>
      </div>

      <MonitoringParticipantTable
        participants={participants}
        canControlSessions={canControlSessions}
        returnTo={returnTo}
        searchQuery={params.q}
      />
    </div>
  );
}

function buildReturnTo(
  basePath: string,
  params: Awaited<PageProps["searchParams"]>,
) {
  const query = new URLSearchParams();

  for (const key of ["schedule_id", "class_id", "status", "q"] as const) {
    if (params[key]) {
      query.set(key, params[key]);
    }
  }

  return `${basePath}${query.size ? `?${query.toString()}` : ""}`;
}
