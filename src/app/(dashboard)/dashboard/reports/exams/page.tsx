import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { getReportsByExam } from "@/features/reports/queries";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function ExamReportsPage() {
  await requirePermission("reports.view");
  const rows = await getReportsByExam();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Report Per Ujian"
        description="Agregasi hasil berdasarkan jadwal ujian."
      />
      <DataTable
        columns={["Ujian", "Attempts", "Submitted", "Expired", "Rata-rata", "Rata-rata %"]}
        isEmpty={rows.length === 0}
        empty={<EmptyState title="Belum ada data" description="Laporan muncul setelah peserta submit ujian." />}
      >
        {rows.map((row) => (
          <tr key={row.title}>
            <td className="px-4 py-3 font-medium">{row.title}</td>
            <td className="px-4 py-3">{row.count}</td>
            <td className="px-4 py-3">{row.submitted}</td>
            <td className="px-4 py-3">{row.expired}</td>
            <td className="px-4 py-3">{row.averageScore.toFixed(2)}</td>
            <td className="px-4 py-3">{row.averagePercent.toFixed(2)}%</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
