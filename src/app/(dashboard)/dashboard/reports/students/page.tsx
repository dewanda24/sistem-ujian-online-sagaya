import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable } from "@/components/master-data/data-table";
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

export default async function StudentReportsPage({ searchParams }: PageProps) {
  await requirePermission("reports.view");
  const params = await searchParams;
  const [allRows, options] = await Promise.all([
    getReportsByStudent(params),
    getReportFilterOptions(),
  ]);
  const rows = filterStudentReportRows(allRows, params);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <DashboardPageHeader
          title="Report Per Siswa"
          description="Daftar nilai individual peserta dan status grading."
        />
        <Link
          href="/api/reports/export?type=students"
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
        >
          Export CSV
        </Link>
      </div>
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-8">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari siswa, NIS, ujian, mapel"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua attempt</option>
          <option value="submitted">Submitted</option>
          <option value="expired">Expired</option>
        </select>
        <select
          name="grading_status"
          defaultValue={params.grading_status ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua grading</option>
          <option value="auto_scored">Auto scored</option>
          <option value="needs_manual_grading">Perlu koreksi</option>
          <option value="finalized">Finalized</option>
        </select>
        <select
          name="schedule_id"
          defaultValue={params.schedule_id ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua ujian</option>
          {options.schedules.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          name="class_id"
          defaultValue={params.class_id ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
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
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua mapel</option>
          {options.subjects.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          name="academic_year_id"
          defaultValue={params.academic_year_id ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua tahun</option>
          {options.academicYears.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          name="semester_id"
          defaultValue={params.semester_id ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua semester</option>
          {options.semesters.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2 md:col-span-8 md:justify-end">
          <a
            href="/dashboard/reports/students"
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            Reset
          </a>
          <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
            Filter
          </button>
        </div>
      </form>
      <DataTable
        columns={["Siswa", "NIS", "Ujian", "Mapel", "Skor", "Persen", "Status", "Grading", "Detail"]}
        isEmpty={rows.length === 0}
        empty={<EmptyState title="Belum ada data" description="Laporan muncul setelah peserta submit ujian." />}
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="px-4 py-3 font-medium">{row.studentName}</td>
            <td className="px-4 py-3">{row.nis}</td>
            <td className="px-4 py-3">{row.examTitle}</td>
            <td className="px-4 py-3">{row.subject}</td>
            <td className="px-4 py-3">
              {row.gradingStatus === "finalized"
                ? `${row.score} / ${row.maxScore}`
                : "Belum final"}
            </td>
            <td className="px-4 py-3">{row.percent.toFixed(2)}%</td>
            <td className="px-4 py-3">
              <StatusPill value={row.status} />
            </td>
            <td className="px-4 py-3">
              <StatusPill value={row.gradingStatus} />
            </td>
            <td className="px-4 py-3">
              <a
                href={`/dashboard/exam-results/${row.id}`}
                className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
              >
                Attempt
              </a>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
