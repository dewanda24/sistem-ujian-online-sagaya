import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { getReportsBySubject } from "@/features/reports/queries";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function SubjectReportsPage() {
  await requirePermission("reports.view");
  const rows = await getReportsBySubject();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Report Per Mapel"
        description="Agregasi nilai peserta berdasarkan mata pelajaran."
      />
      <DataTable
        columns={["Kode", "Mapel", "Attempts", "Rata-rata %"]}
        isEmpty={rows.length === 0}
        empty={<EmptyState title="Belum ada data" description="Laporan muncul setelah peserta submit ujian." />}
      >
        {rows.map((row) => (
          <tr key={`${row.code}-${row.name}`}>
            <td className="px-4 py-3 font-medium">{row.code}</td>
            <td className="px-4 py-3">{row.name}</td>
            <td className="px-4 py-3">{row.count}</td>
            <td className="px-4 py-3">{row.averagePercent.toFixed(2)}%</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
