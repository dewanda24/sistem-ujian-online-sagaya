import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { updateRolePermissionAction } from "@/features/admin/actions";
import { getPermissionMatrix } from "@/features/admin/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function PermissionsPage({ searchParams }: PageProps) {
  await requirePermission("roles.manage");
  const params = await searchParams;
  const { roles, permissions, matrix } = await getPermissionMatrix();

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Permissions"
        description="Review permission code, module, action, dan mapping role permission."
      />

      <DataTable
        columns={["Permission", "Module", "Action", ...roles.map((role) => role.label)]}
        isEmpty={permissions.length === 0}
        empty={
          <EmptyState
            title="Permission belum tersedia"
            description="Seed permission perlu dijalankan sebelum matrix RBAC bisa ditampilkan."
          />
        }
      >
        {permissions.map((permission) => (
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
                      Full
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
                      <button
                        type="submit"
                        className={
                          enabled
                            ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                            : "rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {enabled ? "On" : "Off"}
                      </button>
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
