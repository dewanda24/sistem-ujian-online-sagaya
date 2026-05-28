import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable } from "@/components/master-data/data-table";
import { getReportsByStudent } from "@/features/reports/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    grading_status?: string;
  }>;
};

export default async function StudentReportsPage({ searchParams }: PageProps) {
  await requirePermission("reports.view");
  const params = await searchParams;
  const rows = (await getReportsByStudent()).filter((row) => {
    const keyword = params.q?.toLowerCase().trim();
    const matchesKeyword = keyword
      ? [row.studentName, row.nis, row.examTitle, row.subject]
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      : true;
    const matchesStatus = params.status ? row.status === params.status : true;
    const matchesGrading = params.grading_status
      ? row.gradingStatus === params.grading_status
      : true;

    return matchesKeyword && matchesStatus && matchesGrading;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <DashboardPageHeader
          title="Report Per Siswa"
          description="Daftar nilai individual peserta dan status grading."
        />
        <a
          href="/api/reports/export"
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
        >
          Export CSV
        </a>
      </div>
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
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
        <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Filter
        </button>
      </form>
      <DataTable
        columns={["Siswa", "NIS", "Ujian", "Mapel", "Skor", "Persen", "Status", "Grading"]}
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
              {row.score} / {row.maxScore}
            </td>
            <td className="px-4 py-3">{row.percent.toFixed(2)}%</td>
            <td className="px-4 py-3">
              <StatusPill value={row.status} />
            </td>
            <td className="px-4 py-3">
              <StatusPill value={row.gradingStatus} />
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
