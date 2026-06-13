import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { getReportFilterOptions, getReportsBySubject } from "@/features/reports/queries";
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
  subjectId?: string,
  extra?: Record<string, string>,
) {
  const drillParams = new URLSearchParams();

  for (const key of ["schedule_id", "class_id", "academic_year_id", "semester_id"] as const) {
    if (params[key]) drillParams.set(key, params[key]);
  }

  if (subjectId) drillParams.set("subject_id", subjectId);

  for (const [key, value] of Object.entries(extra ?? {})) {
    drillParams.set(key, value);
  }

  return `/dashboard/reports/students?${drillParams.toString()}`;
}

export default async function SubjectReportsPage({ searchParams }: PageProps) {
  await requirePermission("reports.view");
  const params = await searchParams;
  const [rows, options] = await Promise.all([
    getReportsBySubject(params),
    getReportFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Laporan Per Mapel"
        description="Agregasi nilai peserta berdasarkan mata pelajaran."
      />
      <div className="flex justify-end">
        <Link
          href="/api/reports/export?type=subjects"
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
        >
          Unduh CSV
        </Link>
      </div>
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-7">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Cari mapel, ujian, kelas" className="rounded-md border px-3 py-2 text-sm" />
        <select name="subject_id" defaultValue={params.subject_id ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">Semua mapel</option>
          {options.subjects.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select name="schedule_id" defaultValue={params.schedule_id ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">Semua ujian</option>
          {options.schedules.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select name="class_id" defaultValue={params.class_id ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">Semua kelas</option>
          {options.classes.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select name="academic_year_id" defaultValue={params.academic_year_id ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">Semua tahun</option>
          {options.academicYears.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select name="semester_id" defaultValue={params.semester_id ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">Semua semester</option>
          {options.semesters.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Filter</button>
      </form>
      <DataTable
        columns={["Kode", "Mapel", "Peserta", "Sudah Dikumpulkan", "Nilai Final", "Menunggu Koreksi", "Tidak Hadir", "Rata-rata %", "Detail"]}
        isEmpty={rows.length === 0}
        empty={<EmptyState title="Belum ada data" description="Laporan muncul setelah peserta mengumpulkan ujian." />}
      >
        {rows.map((row) => (
          <tr key={`${row.code}-${row.name}`}>
            <td className="px-4 py-3 font-medium">{row.code}</td>
            <td className="px-4 py-3">{row.name}</td>
            <td className="px-4 py-3">{row.count}</td>
            <td className="px-4 py-3">{row.submitted}</td>
            <td className="px-4 py-3">{row.finalized}</td>
            <td className="px-4 py-3">
              {row.pending > 0 && row.subjectId ? (
                <a className="font-medium text-primary hover:underline" href={buildStudentReportHref(params, row.subjectId, { grading_status: "needs_manual_grading" })}>
                  {row.pending}
                </a>
              ) : (
                row.pending
              )}
            </td>
            <td className="px-4 py-3">{row.absent}</td>
            <td className="px-4 py-3">{row.averagePercent.toFixed(2)}%</td>
            <td className="px-4 py-3">
              {row.subjectId ? (
                <a
                  href={buildStudentReportHref(params, row.subjectId)}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Siswa
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
