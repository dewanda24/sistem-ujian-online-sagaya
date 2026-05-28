import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { getReportsByClass } from "@/features/reports/queries";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function ClassReportsPage() {
  await requirePermission("reports.view");
  const rows = await getReportsByClass();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Report Per Kelas"
        description="Ringkasan completion dan rata-rata nilai per kelas."
      />
      <DataTable
        columns={["Kelas", "Attempts", "Submitted", "Completion", "Rata-rata %"]}
        isEmpty={rows.length === 0}
        empty={<EmptyState title="Belum ada data" description="Laporan muncul setelah peserta submit ujian." />}
      >
        {rows.map((row) => (
          <tr key={row.name}>
            <td className="px-4 py-3 font-medium">{row.name}</td>
            <td className="px-4 py-3">{row.count}</td>
            <td className="px-4 py-3">{row.submitted}</td>
            <td className="px-4 py-3">
              {row.count > 0 ? ((row.submitted / row.count) * 100).toFixed(2) : "0.00"}%
            </td>
            <td className="px-4 py-3">{row.averagePercent.toFixed(2)}%</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
