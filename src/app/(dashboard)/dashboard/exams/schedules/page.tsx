import Link from "next/link";
import { Plus, UserCheck } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { ExamScheduleTable } from "@/features/exams/components/exam-schedule-table";
import { getExamReadinessSummary } from "@/features/exams/exam-readiness.service";
import {
  getExamPackageOptions,
  getExamSchedules,
} from "@/features/exams/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    package_id?: string;
    date_from?: string;
    date_to?: string;
    readiness?: string;
    notice?: string;
    message?: string;
  }>;
};

function monitoringBasePath(role?: string | null) {
  if (role === "super_admin") return "/dashboard/super-admin/monitoring";
  if (role === "teacher") return "/dashboard/teacher/monitoring";
  return "/dashboard/admin/monitoring";
}

export default async function ExamSchedulesPage({ searchParams }: PageProps) {
  const user = await requirePermission("exam_schedules.view");
  const params = await searchParams;
  const filters = {
    q: params.q,
    status: params.status,
    package_id: params.package_id,
    date_from: params.date_from,
    date_to: params.date_to,
  };
  const [packages, schedules, readiness] = await Promise.all([
    getExamPackageOptions(),
    getExamSchedules(filters),
    getExamReadinessSummary(),
  ]);
  const readinessBySchedule = Object.fromEntries(
    readiness.schedules.map((item) => [item.scheduleId, item.readiness]),
  );
  const visibleSchedules = schedules.filter((schedule) => {
    const scheduleReadiness = readinessBySchedule[schedule.id as string];

    if (!params.readiness || !scheduleReadiness) {
      return true;
    }

    if (params.readiness === "problem") {
      return scheduleReadiness.status !== "ready";
    }

    return scheduleReadiness.status === params.readiness;
  });

  return (
    <div className="space-y-5">
      <ActionToast status={params.notice} message={params.message} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <DashboardPageHeader
          title="Jadwal Ujian"
          description="Kelola jadwal ujian, waktu pelaksanaan, peserta, token, dan monitoring dalam tampilan yang ringkas."
        />
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/exams/proctors"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]"
          >
            <UserCheck className="size-4" />
            Penugasan Pengawas
          </Link>
          <Link
            href="/dashboard/exams/schedules/create"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#1D4ED8]"
          >
            <Plus className="size-4" />
            Buat Jadwal
          </Link>
        </div>
      </div>

      <form className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-6">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari jadwal"
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm md:col-span-2"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        >
          <option value="">Semua status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Ready</option>
          <option value="active">Aktif</option>
          <option value="finished">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
          <option value="archived">Archived</option>
        </select>
        <select
          name="package_id"
          defaultValue={params.package_id ?? ""}
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        >
          <option value="">Semua paket</option>
          {packages.map((examPackage) => (
            <option key={examPackage.value} value={examPackage.value}>
              {examPackage.label}
            </option>
          ))}
        </select>
        <input
          name="date_from"
          type="date"
          defaultValue={params.date_from ?? ""}
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          aria-label="Tanggal mulai"
        />
        <input
          name="date_to"
          type="date"
          defaultValue={params.date_to ?? ""}
          className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
          aria-label="Tanggal akhir"
        />
        <div className="flex justify-end gap-2 md:col-span-6">
          <Link
            href="/dashboard/exams/schedules"
            className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm hover:bg-[#F8FAFC]"
          >
            Reset
          </Link>
          <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]">
            Filter
          </button>
        </div>
      </form>

      <section className="grid gap-3 md:grid-cols-3">
        <ReadinessMetric
          title="Jadwal Siap"
          value={`${readiness.readyScheduleCount}/${readiness.scheduleCount}`}
          description="Jadwal dengan paket, kelas, peserta, pengawas, dan waktu valid."
        />
        <ReadinessMetric
          title="Paket Siap"
          value={`${readiness.readyPackageCount}/${readiness.packageCount}`}
          description="Paket yang siap dipakai untuk penjadwalan."
        />
        <ReadinessMetric
          title="Masalah Ujian"
          value={String(readiness.issues.length)}
          description={readiness.issues[0]?.title ?? "Tidak ada masalah readiness."}
          href={readiness.issues[0]?.href}
        />
      </section>

      <ExamScheduleTable
        schedules={visibleSchedules}
        readinessBySchedule={readinessBySchedule}
        monitoringBasePath={monitoringBasePath(user.roles?.name)}
      />
    </div>
  );
}

function ReadinessMetric({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: string;
  description: string;
  href?: string;
}) {
  const content = (
    <div className="h-full rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-[#64748B]">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-[#0F172A]">{value}</p>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#64748B]">
        {description}
      </p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
