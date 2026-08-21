import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { getReportFilterOptions, getReportsByExam } from "@/features/reports/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    schedule_id?: string;
    class_id?: string;
    subject_id?: string;
    academic_year_id?: string;
    semester_id?: string;
  }>;
};

function buildStudentReportHref(
  params: Awaited<PageProps["searchParams"]>,
  scheduleId?: string,
  extra?: Record<string, string>,
) {
  const drillParams = new URLSearchParams();

  for (const key of ["class_id", "subject_id", "academic_year_id", "semester_id"] as const) {
    if (params[key]) drillParams.set(key, params[key]);
  }

  if (scheduleId) drillParams.set("schedule_id", scheduleId);

  for (const [key, value] of Object.entries(extra ?? {})) {
    drillParams.set(key, value);
  }

  return `/dashboard/reports/students?${drillParams.toString()}`;
}

export default async function ExamReportsPage({ searchParams }: PageProps) {
  await requirePermission("reports.view");
  const params = await searchParams;
  const [rows, options] = await Promise.all([
    getReportsByExam(params),
    getReportFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DashboardPageHeader
          title="Laporan & Rekap Nilai Ujian"
          description="Statistik komprehensif hasil ujian per jadwal, nilai rata-rata, dan status kelulusan peserta."
        />
        <div className="flex items-center gap-2">
          <Link
            href="/api/reports/export?type=exams"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <span>Unduh CSV / Excel</span>
          </Link>
        </div>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs md:grid-cols-7">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari ujian, kelas, mapel..."
          className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
        />
        <select name="schedule_id" defaultValue={params.schedule_id ?? ""} className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium">
          <option value="">Semua Ujian</option>
          {options.schedules.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select name="class_id" defaultValue={params.class_id ?? ""} className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium">
          <option value="">Semua Kelas</option>
          {options.classes.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select name="subject_id" defaultValue={params.subject_id ?? ""} className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium">
          <option value="">Semua Mapel</option>
          {options.subjects.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select name="academic_year_id" defaultValue={params.academic_year_id ?? ""} className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium">
          <option value="">Semua Tahun</option>
          {options.academicYears.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select name="semester_id" defaultValue={params.semester_id ?? ""} className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium">
          <option value="">Semua Semester</option>
          {options.semesters.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button type="submit" className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition">
          Filter
        </button>
      </form>
      <DataTable
        columns={["Ujian", "Peserta", "Sudah Dikumpulkan", "Nilai Final", "Menunggu Koreksi", "Waktu Habis", "Tidak Hadir", "Rata-rata", "Rata-rata %", "Aksi"]}
        isEmpty={rows.length === 0}
        empty={<EmptyState title="Belum ada data" description="Laporan muncul setelah peserta mengumpulkan ujian." />}
      >
        {rows.map((row) => (
          <tr key={row.title} className="hover:bg-slate-50/70 transition">
            <td className="px-4 py-3 font-semibold text-slate-900 text-xs">{row.title}</td>
            <td className="px-4 py-3 text-xs text-slate-700 font-medium">{row.count}</td>
            <td className="px-4 py-3 text-xs text-emerald-700 font-bold">{row.submitted}</td>
            <td className="px-4 py-3 text-xs text-blue-700 font-bold">{row.finalized}</td>
            <td className="px-4 py-3 text-xs">
              {row.pending > 0 && row.scheduleId ? (
                <a className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded hover:underline" href={buildStudentReportHref(params, row.scheduleId, { grading_status: "needs_manual_grading" })}>
                  {row.pending} butuh koreksi
                </a>
              ) : (
                <span className="text-slate-400 font-medium">0</span>
              )}
            </td>
            <td className="px-4 py-3 text-xs text-slate-500 font-medium">{row.expired}</td>
            <td className="px-4 py-3 text-xs text-slate-500 font-medium">{row.absent}</td>
            <td className="px-4 py-3 text-xs font-black text-slate-900">{row.averageScore.toFixed(1)}</td>
            <td className="px-4 py-3 text-xs font-bold text-blue-700">{row.averagePercent.toFixed(1)}%</td>
            <td className="px-4 py-3 text-xs">
              {row.scheduleId ? (
                <a
                  href={buildStudentReportHref(params, row.scheduleId)}
                  className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 transition"
                >
                  Detail Siswa
                </a>
              ) : (
                "-"
              )}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
