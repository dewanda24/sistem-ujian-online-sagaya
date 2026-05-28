import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { getAdminRoles } from "@/features/admin/queries";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function RolesPage() {
  await requirePermission("roles.view");
  const roles = await getAdminRoles();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Roles"
        description="Pantau role aplikasi, jumlah user, dan jumlah permission tanpa mengubah struktur database RBAC."
      />

      <DataTable
        columns={["Role", "Label", "Users", "Permissions"]}
        isEmpty={roles.length === 0}
        empty={
          <EmptyState
            title="Role belum tersedia"
            description="Seed role perlu dijalankan sebelum RBAC bisa digunakan."
          />
        }
      >
        {roles.map((role) => (
          <tr key={role.id}>
            <td className="px-4 py-3 font-mono text-xs">{role.name}</td>
            <td className="px-4 py-3 font-medium">{role.label}</td>
            <td className="px-4 py-3">{role.userCount}</td>
            <td className="px-4 py-3">{role.permissionCount}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
