import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { getAuditLogs } from "@/features/admin/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    action?: string;
    entity_type?: string;
    user_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: string;
  }>;
  basePath?: string;
};

function formatPayload(value: unknown) {
  if (!value) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function formatShortPayload(value: unknown) {
  const text = formatPayload(value);

  if (text.length <= 120) {
    return text;
  }

  return `${text.slice(0, 120)}...`;
}

export default async function AuditLogsPage({
  searchParams,
  basePath = "/dashboard/admin/audit-logs",
}: PageProps) {
  await requirePermission("audit_logs.view");
  const params = await searchParams;
  const auditLogs = await getAuditLogs({
    q: params.q,
    action: params.action,
    entity_type: params.entity_type,
    user_id: params.user_id,
    date_from: params.date_from,
    date_to: params.date_to,
    limit: params.limit,
  });
  const actionOptions = Array.from(
    new Set(auditLogs.rows.map((item) => item.action).filter(Boolean)),
  ).sort((a, b) => String(a).localeCompare(String(b)));
  const entityOptions = Array.from(
    new Set(auditLogs.rows.map((item) => item.entity_type).filter(Boolean)),
  ).sort((a, b) => String(a).localeCompare(String(b)));
  const uniqueUsers = new Set(
    auditLogs.rows.map((item) => item.user_id).filter(Boolean),
  ).size;
  const latestEvent = auditLogs.rows[0]?.created_at
    ? new Date(auditLogs.rows[0].created_at).toLocaleString("id-ID")
    : "-";

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Audit Logs"
        description="Lihat jejak aktivitas sistem dan perubahan data sensitif."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Kejadian"
          value={String(auditLogs.rows.length)}
          description="Jumlah event sesuai filter."
        />
        <DashboardCard
          title="Aksi"
          value={String(actionOptions.length)}
          description="Jenis aksi pada hasil saat ini."
        />
        <DashboardCard
          title="Pengguna"
          value={String(uniqueUsers)}
          description="Pengguna unik yang tercatat."
        />
        <DashboardCard
          title="Kejadian Terbaru"
          value={latestEvent}
          description="Aktivitas terbaru pada hasil filter."
        />
      </section>

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-6">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari aksi, data, atau catatan"
          className="rounded-md border px-3 py-2 text-sm md:col-span-2"
        />
        <input
          name="action"
          list="audit-action-options"
          defaultValue={params.action ?? ""}
          placeholder="Aksi"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <datalist id="audit-action-options">
          {actionOptions.map((action) => (
            <option key={action} value={String(action)} />
          ))}
        </datalist>
        <input
          name="entity_type"
          list="audit-entity-options"
          defaultValue={params.entity_type ?? ""}
          placeholder="Data"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <datalist id="audit-entity-options">
          {entityOptions.map((entity) => (
            <option key={entity} value={String(entity)} />
          ))}
        </datalist>
        <input
          name="user_id"
          defaultValue={params.user_id ?? ""}
          placeholder="ID Pengguna"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <select
          name="limit"
          defaultValue={params.limit ?? "100"}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="50">50 data</option>
          <option value="100">100 data</option>
          <option value="200">200 data</option>
            <option value="300">300 data</option>
          </select>
        <input
          name="date_from"
          type="date"
          defaultValue={params.date_from ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
          aria-label="Tanggal mulai"
        />
        <input
          name="date_to"
          type="date"
          defaultValue={params.date_to ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
          aria-label="Tanggal akhir"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-6">
          <p className="text-xs text-muted-foreground">
            Menampilkan {auditLogs.rows.length} event audit terbaru sesuai filter.
          </p>
          <div className="flex gap-2">
            <a
              download="audit-logs-export.json"
              href={`data:application/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(auditLogs.rows, null, 2),
              )}`}
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              Unduh
            </a>
            <a
              href={basePath}
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              Reset
            </a>
            <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
              Filter
            </button>
          </div>
        </div>
      </form>

      <DataTable
        columns={["Waktu", "Aksi", "Data", "Record", "Pengguna", "Catatan"]}
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
            <td className="px-4 py-3">{item.entity_type ?? "-"}</td>
            <td className="px-4 py-3 font-mono text-xs">
              {item.entity_id ?? "-"}
            </td>
            <td className="px-4 py-3 font-mono text-xs">
              {item.user_id ?? "-"}
            </td>
            <td className="max-w-sm px-4 py-3 text-xs">
              <details className="group">
                <summary className="cursor-pointer truncate text-muted-foreground group-open:mb-2">
                  {formatShortPayload(item.payload)}
                </summary>
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-[11px] leading-5">
                  {formatPayload(item.payload)}
                </pre>
              </details>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
