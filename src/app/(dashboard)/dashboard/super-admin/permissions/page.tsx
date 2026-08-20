import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { updateRolePermissionAction } from "@/features/admin/actions";
import { getPermissionMatrix } from "@/features/admin/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    module?: string;
    q?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function PermissionsPage({ searchParams }: PageProps) {
  await requirePermission("roles.manage");
  const params = await searchParams;
  const { roles, permissions, matrix } = await getPermissionMatrix();
  const modules = Array.from(
    new Set(permissions.map((permission) => permission.module)),
  ).sort((a, b) => a.localeCompare(b));
  const filteredPermissions = permissions.filter((permission) => {
    const moduleMatches = params.module
      ? permission.module === params.module
      : true;
    const keyword = params.q?.trim().toLowerCase();
    const keywordMatches = keyword
      ? [permission.code, permission.module, permission.action]
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      : true;

    return moduleMatches && keywordMatches;
  });
  const assignmentCount = Object.values(matrix).reduce(
    (total, permissionSet) => total + permissionSet.size,
    0,
  );

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Izin Akses"
        description="Tinjau kode izin, modul, aksi, dan pengaturan hak akses tiap peran."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Izin Akses"
          value={String(permissions.length)}
          description="Total kode izin yang tersedia."
        />
        <DashboardCard
          title="Modul"
          value={String(modules.length)}
          description="Kelompok fitur dalam sistem."
        />
        <DashboardCard
          title="Peran"
          value={String(roles.length)}
          description="Peran yang tampil di tabel."
        />
        <DashboardCard
          title="Penugasan Izin"
          value={String(assignmentCount)}
          description="Pengaturan izin yang sudah tersimpan."
        />
      </section>

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari izin, modul, atau aksi"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <select
          name="module"
          defaultValue={params.module ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua modul</option>
          {modules.map((module) => (
            <option key={module} value={module}>
              {module}
            </option>
          ))}
        </select>
        <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Filter
        </button>
      </form>

      <DataTable
        columns={["Izin", "Modul", "Aksi", ...roles.map((role) => role.label)]}
        isEmpty={filteredPermissions.length === 0}
        empty={
          <EmptyState
            title="Izin akses belum tersedia"
            description="Izin akses belum tersedia atau tidak cocok dengan filter."
          />
        }
      >
        {filteredPermissions.map((permission) => (
          <tr key={permission.id}>
            <td className="px-4 py-3 font-mono text-xs">{permission.code}</td>
            <td className="px-4 py-3">{permission.module}</td>
            <td className="px-4 py-3">{permission.action}</td>
            {roles.map((role) => {
              const enabled = matrix[role.id]?.has(permission.id) ?? false;

              return (
                <td key={role.id} className="px-4 py-3">
                  {role.name === "super_admin" ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                      Penuh
                    </span>
                  ) : (
                    <form action={updateRolePermissionAction}>
                      <input type="hidden" name="role_id" value={role.id} />
                      <input
                        type="hidden"
                        name="permission_id"
                        value={permission.id}
                      />
                      <input
                        type="hidden"
                        name="enabled"
                        value={enabled ? "false" : "true"}
                      />
                      <ConfirmSubmitButton
                        confirmMessage={`${enabled ? "Cabut" : "Berikan"} izin ${permission.code} untuk peran ${role.label}?`}
                        confirmTitle="Konfirmasi Izin Akses"
                        className={
                          enabled
                            ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                            : "rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {enabled ? "Aktif" : "Nonaktif"}
                      </ConfirmSubmitButton>
                    </form>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
