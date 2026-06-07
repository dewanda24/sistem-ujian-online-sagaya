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

function getSummary(rows: Awaited<ReturnType<typeof getReportsByStudent>>) {
  const submitted = rows.filter((row) => row.status === "submitted").length;
  const finalized = rows.filter((row) => row.gradingStatus === "finalized");
  const average =
    finalized.length > 0
      ? finalized.reduce((total, row) => total + row.percent, 0) / finalized.length
      : 0;
  const highest =
    finalized.length > 0
      ? Math.max(...finalized.map((row) => Math.round(row.percent)))
      : 0;

  return {
    participants: rows.length,
    submitted,
    average: Math.round(average),
    highest,
  };
}

export default async function StudentReportsPage({ searchParams }: PageProps) {
  await requirePermission("reports.view");
  const params = await searchParams;
  const [allRows, options] = await Promise.all([
    getReportsByStudent(params),
    getReportFilterOptions(),
  ]);
  const rows = filterStudentReportRows(allRows, params);
  const summary = getSummary(rows);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <DashboardPageHeader
          title="Hasil Ujian"
          description="Lihat status submit, nilai siswa, dan hasil yang perlu dikoreksi."
        />
        <Link
          href={buildExportHref(params)}
          className="inline-flex rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#0F172A] shadow-sm hover:bg-[#F8FAFC]"
        >
          Export CSV
        </Link>
      </div>

      <form className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm md:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto]">
        <select
          name="schedule_id"
          defaultValue={params.schedule_id ?? ""}
          className="min-w-0 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        >
          <option value="">Semua jadwal ujian</option>
          {options.schedules.map((option) => (
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
          name="status"
          defaultValue={params.status ?? ""}
          className="min-w-0 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        >
          <option value="">Semua status</option>
          <option value="submitted">Submit</option>
          <option value="expired">Expired</option>
        </select>
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari nama siswa"
          className="min-w-0 rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <Link
            href="/dashboard/reports/students"
            className="inline-flex items-center rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC]"
          >
            Reset
          </Link>
          <button className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Filter
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-medium text-[#0F172A] shadow-sm">
        Peserta {summary.participants} · Submit {summary.submitted} · Rata-rata{" "}
        {summary.average} · Tertinggi {summary.highest}
      </div>

      <ReportResultTable rows={rows} />
    </div>
  );
}
