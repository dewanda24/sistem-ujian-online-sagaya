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

const actionLabels: Record<string, string> = {
  "questions.create": "Soal dibuat",
  "questions.update": "Soal diperbarui",
  "questions.status_update": "Status soal diubah",
  "questions.bulk_update": "Soal diperbarui massal",
  "question_categories.create": "Kategori dibuat",
  "question_categories.update": "Kategori diperbarui",
  "question_categories.archive": "Kategori diarsipkan",
  "question_stimuli.create": "Stimulus dibuat",
  "question_stimuli.update": "Stimulus diperbarui",
  "question_stimuli.archive": "Stimulus diarsipkan",
};

const entityLabels: Record<string, string> = {
  questions: "Soal",
  question_categories: "Kategori",
  question_stimuli: "Stimulus",
};

function formatAuditAction(action?: string | null) {
  if (!action) return "-";

  return actionLabels[action] ?? action.replaceAll("_", " ").replaceAll(".", " ");
}

function formatEntityType(entityType?: string | null) {
  if (!entityType) return "-";

  return entityLabels[entityType] ?? entityType.replaceAll("_", " ");
}

function summarizePayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "-";
  }

  const payload = value as Record<string, unknown>;
  const parts = [
    typeof payload.type === "string" ? `Tipe: ${payload.type}` : null,
    typeof payload.difficulty === "string" ? `Level: ${payload.difficulty}` : null,
    typeof payload.status === "string" ? `Status: ${payload.status}` : null,
    typeof payload.is_active === "boolean"
      ? payload.is_active
        ? "Aktif"
        : "Nonaktif"
      : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" - ") : "Perubahan tersimpan";
}

import { AuditLogDetailButton } from "@/features/super-admin/components/audit-log-detail-modal";

export default async function AuditLogsPage({
  searchParams,
  basePath = "/dashboard/super-admin/audit-logs",
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
        title="Audit Logs & Jejak Keamanan"
        description="Lihat jejak aktivitas sensitif seluruh sistem, identitas pengguna, dan detail payload perubahan."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Kejadian Tercatat"
          value={String(auditLogs.rows.length)}
          description="Jumlah event sesuai filter."
        />
        <DashboardCard
          title="Pengguna Aktif"
          value={String(uniqueUsers)}
          description="Pengguna unik yang melakukan aktivitas."
        />
        <DashboardCard
          title="Aktivitas Terkini"
          value={latestEvent}
          description="Waktu rekaman log terbaru."
        />
      </section>

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-5">
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
        <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-5">
          <p className="text-xs text-muted-foreground">
            Menampilkan {auditLogs.rows.length} event audit terbaru sesuai filter.
          </p>
          <div className="flex gap-2">
            <a
              download="audit-logs-export.json"
              href={`data:application/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(auditLogs.rows, null, 2),
              )}`}
              className="rounded-md border px-3.5 py-2 text-xs font-medium hover:bg-muted"
            >
              Unduh JSON
            </a>
            <a
              href={basePath}
              className="rounded-md border px-3.5 py-2 text-xs font-medium hover:bg-muted"
            >
              Reset
            </a>
            <button className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              Filter Log
            </button>
          </div>
        </div>
      </form>

      <DataTable
        columns={["Waktu", "Aktivitas", "Data", "Pengguna", "Ringkasan", "Aksi"]}
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
            <td className="px-4 py-3 font-medium">
              {formatAuditAction(item.action)}
            </td>
            <td className="px-4 py-3">{formatEntityType(item.entity_type)}</td>
            <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-28">
              {item.user_id ?? "-"}
            </td>
            <td className="max-w-md px-4 py-3 text-xs text-muted-foreground">
              {summarizePayload(item.payload)}
            </td>
            <td className="px-4 py-3">
              <AuditLogDetailButton item={item} />
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
