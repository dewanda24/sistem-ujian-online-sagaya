import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { getAuditLogs } from "@/features/admin/queries";
import { requirePermission } from "@/lib/auth/require-permission";

function formatMetadata(value: unknown) {
  if (!value) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

export default async function AuditLogsPage() {
  await requirePermission("audit_logs.view");
  const auditLogs = await getAuditLogs();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Audit Logs"
        description="Lihat jejak aktivitas sistem dan perubahan data sensitif."
      />

      <DataTable
        columns={["Waktu", "Action", "Table", "Record", "User", "Metadata"]}
        isEmpty={auditLogs.rows.length === 0}
        empty={
          <EmptyState
            title={
              auditLogs.unavailable
                ? "Audit log belum tersedia"
                : "Belum ada aktivitas audit"
            }
            description={
              auditLogs.message ||
              "Aktivitas audit akan muncul setelah modul logging mencatat event."
            }
          />
        }
      >
        {auditLogs.rows.map((item, index) => (
          <tr key={item.id ?? index}>
            <td className="px-4 py-3 text-xs">
              {item.created_at
                ? new Date(item.created_at).toLocaleString("id-ID")
                : "-"}
            </td>
            <td className="px-4 py-3 font-medium">{item.action ?? "-"}</td>
            <td className="px-4 py-3">{item.table_name ?? "-"}</td>
            <td className="px-4 py-3 font-mono text-xs">
              {item.record_id ?? "-"}
            </td>
            <td className="px-4 py-3 font-mono text-xs">
              {item.user_id ?? "-"}
            </td>
            <td className="max-w-xs truncate px-4 py-3 text-xs">
              {formatMetadata(item.metadata)}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
