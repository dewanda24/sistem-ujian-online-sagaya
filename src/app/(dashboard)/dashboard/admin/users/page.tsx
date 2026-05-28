import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { StatusBadge } from "@/components/master-data/status-badge";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getAdminRoleOptions, getAdminUsers } from "@/features/admin/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    role_id?: string;
    user_status?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function UsersPage({ searchParams }: PageProps) {
  await requirePermission("users.view");
  const params = await searchParams;
  const [users, roles] = await Promise.all([
    getAdminUsers({
      q: params.q,
      role_id: params.role_id,
      status: params.user_status,
    }),
    getAdminRoleOptions(),
  ]);

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Users"
        description="Pantau akun aplikasi, status pengguna, dan mapping auth user ke profil internal. CRUD guru dan siswa dikelola dari Master Data."
      />

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari username atau email"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <select
          name="role_id"
          defaultValue={params.role_id ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua role</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </select>
        <select
          name="user_status"
          defaultValue={params.user_status ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Filter
        </button>
      </form>

      <DataTable
        columns={[
          "Nama",
          "Email",
          "Role",
          "Auth User",
          "Status",
        ]}
        isEmpty={users.length === 0}
        empty={
          <EmptyState
            title="User belum ditemukan"
            description="Data user akan muncul setelah akun aplikasi dibuat."
          />
        }
      >
        {users.map((item) => (
          <tr key={item.id}>
            <td className="px-4 py-3">
              <div className="font-medium">
                {item.profile?.full_name ?? item.username}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.username}
              </div>
            </td>
            <td className="px-4 py-3">{item.email}</td>
            <td className="px-4 py-3">
              <div className="font-medium">{item.role?.label ?? "-"}</div>
              <div className="text-xs text-muted-foreground">
                {item.role?.name ?? "-"}
              </div>
            </td>
            <td className="px-4 py-3">
              <span className="font-mono text-xs">
                {item.auth_user_id ?? "-"}
              </span>
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={item.status === "active"} />
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
