import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ReportResultTable } from "@/features/reports/components/report-result-table";
import {
  filterStudentReportRows,
  getReportFilterOptions,
  getReportsByStudent,
} from "@/features/reports/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    grading_status?: string;
    schedule_id?: string;
    class_id?: string;
    subject_id?: string;
    academic_year_id?: string;
    semester_id?: string;
  }>;
};

function buildExportHref(params: Awaited<PageProps["searchParams"]>) {
  const exportParams = new URLSearchParams({ type: "students" });

  for (const [key, value] of Object.entries(params)) {
    if (value) exportParams.set(key, value);
  }

  return `/api/reports/export?${exportParams.toString()}`;
}

export default async function ClassReportsPage({ searchParams }: PageProps) {
  await requirePermission("reports.view");
  const params = await searchParams;
  const [allRows, options] = await Promise.all([
    getReportsByStudent(params),
    getReportFilterOptions(),
  ]);
  const rows = filterStudentReportRows(allRows, params);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <DashboardPageHeader
          title="Rekap Nilai"
          description="Rekap nilai siswa berdasarkan tahun ajaran, kelas, mapel, dan jadwal."
        />
        <Link
          href={buildExportHref(params)}
          className="inline-flex rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#0F172A] shadow-sm hover:bg-[#F8FAFC]"
        >
          Export CSV
        </Link>
      </div>

      <form className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm md:grid-cols-[1fr_1fr_1fr_1.3fr_auto]">
        <select
          name="academic_year_id"
          defaultValue={params.academic_year_id ?? ""}
          className="min-w-0 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        >
          <option value="">Semua tahun ajaran</option>
          {options.academicYears.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          name="class_id"
          defaultValue={params.class_id ?? ""}
          className="min-w-0 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        >
          <option value="">Semua kelas</option>
          {options.classes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          name="subject_id"
          defaultValue={params.subject_id ?? ""}
          className="min-w-0 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        >
          <option value="">Semua mapel</option>
          {options.subjects.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          name="schedule_id"
          defaultValue={params.schedule_id ?? ""}
          className="min-w-0 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        >
          <option value="">Semua jadwal</option>
          {options.schedules.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Link
            href="/dashboard/reports/classes"
            className="inline-flex items-center rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC]"
          >
            Reset
          </Link>
          <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Filter
          </button>
        </div>
      </form>

      <ReportResultTable rows={rows} mode="recap" />
    </div>
  );
}
