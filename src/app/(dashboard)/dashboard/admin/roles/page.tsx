import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { updateRoleLabelAction } from "@/features/admin/actions";
import { getAdminRoles } from "@/features/admin/queries";
import { hasPermission } from "@/lib/auth/has-permission";
import { requireAuth } from "@/lib/auth/require-auth";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function RolesPage({ searchParams }: PageProps) {
  await requirePermission("roles.view");
  const user = await requireAuth();
  const params = await searchParams;
  const roles = await getAdminRoles();
  const canManage = hasPermission(user, "roles.manage");
  const totalUsers = roles.reduce((total, role) => total + role.userCount, 0);
  const emptyRoles = roles.filter((role) => role.userCount === 0).length;
  const highestPermissionRole = [...roles].sort(
    (a, b) => b.permissionCount - a.permissionCount,
  )[0];

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Roles"
        description="Pantau role aplikasi, jumlah user, dan jumlah permission. Struktur role tidak dihapus dari UI ini."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Total Roles"
          value={String(roles.length)}
          description="Role aktif di sistem RBAC."
        />
        <DashboardCard
          title="Total Users"
          value={String(totalUsers)}
          description="User yang sudah terikat ke role."
        />
        <DashboardCard
          title="Role Kosong"
          value={String(emptyRoles)}
          description="Role tanpa user aktif/internal."
        />
        <DashboardCard
          title="Permission Terbanyak"
          value={highestPermissionRole?.label ?? "-"}
          description={`${highestPermissionRole?.permissionCount ?? 0} permission`}
        />
      </section>

      <DataTable
        columns={["Role", "Label", "Users", "Permissions", "Aksi"]}
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
            <td className="px-4 py-3 font-medium">
              <form action={updateRoleLabelAction} className="flex gap-2">
                <input type="hidden" name="id" value={role.id} />
                <input
                  name="label"
                  defaultValue={role.label}
                  disabled={!canManage}
                  className="min-w-40 rounded-md border px-3 py-1.5 text-sm disabled:opacity-70"
                />
                <button
                  disabled={!canManage}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Simpan
                </button>
              </form>
            </td>
            <td className="px-4 py-3">{role.userCount}</td>
            <td className="px-4 py-3">{role.permissionCount}</td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
              Permission matrix ada di halaman Permissions
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
