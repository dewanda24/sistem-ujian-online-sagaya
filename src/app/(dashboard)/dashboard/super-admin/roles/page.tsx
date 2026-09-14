import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { updateRoleLabelAction } from "@/features/admin/actions";
import { getAdminRoles } from "@/features/admin/queries";
import { hasPermission } from "@/lib/auth/has-permission";
import { requireAuth } from "@/lib/auth/require-auth";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireRole } from "@/lib/auth/require-role";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function RolesPage({ searchParams }: PageProps) {
  await requireRole("super_admin");
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
        title="Peran"
        description="Pantau peran aplikasi, jumlah pengguna, dan jumlah izin. Struktur peran tidak dihapus dari halaman ini."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Total Peran"
          value={String(roles.length)}
          description="Peran aktif di sistem akses."
        />
        <DashboardCard
          title="Total Pengguna"
          value={String(totalUsers)}
          description="Pengguna yang sudah terikat ke peran."
        />
        <DashboardCard
          title="Peran Kosong"
          value={String(emptyRoles)}
          description="Peran tanpa pengguna aktif/internal."
        />
        <DashboardCard
          title="Izin Terbanyak"
          value={highestPermissionRole?.label ?? "-"}
          description={`${highestPermissionRole?.permissionCount ?? 0} izin`}
        />
      </section>

      <DataTable
        columns={["Peran", "Label", "Pengguna", "Izin", "Aksi"]}
        isEmpty={roles.length === 0}
        stickyActionColumn={false}
        empty={
          <EmptyState
            title="Peran belum tersedia"
            description="Data peran perlu disiapkan sebelum akses pengguna bisa digunakan."
          />
        }
      >
        {roles.map((role) => (
          <tr key={role.id} className="hover:bg-muted/40 transition-colors">
            <td className="px-3 py-3">
              <span className="inline-flex items-center rounded-md border bg-muted/60 px-2 py-0.5 font-mono text-xs font-semibold">
                {role.name}
              </span>
            </td>
            <td className="px-3 py-3 font-medium">
              <form action={updateRoleLabelAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={role.id} />
                <input
                  name="label"
                  defaultValue={role.label}
                  disabled={!canManage}
                  className="min-w-40 rounded-lg border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary/20 disabled:opacity-70"
                />
                <ConfirmSubmitButton
                  disabled={!canManage}
                  confirmMessage={`Simpan perubahan label peran ${role.name}?`}
                  confirmTitle="Konfirmasi Peran"
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  Simpan
                </ConfirmSubmitButton>
              </form>
            </td>
            <td className="px-3 py-3 text-xs">
              <span className="font-semibold text-foreground">{role.userCount}</span>{" "}
              <span className="text-muted-foreground">pengguna</span>
            </td>
            <td className="px-3 py-3 text-xs">
              <span className="font-semibold text-foreground">{role.permissionCount}</span>{" "}
              <span className="text-muted-foreground">izin</span>
            </td>
            <td className="px-3 py-3 text-xs">
              <Link
                href="/dashboard/super-admin/permissions"
                className="text-xs font-medium text-primary hover:underline"
              >
                Matriks Izin →
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
