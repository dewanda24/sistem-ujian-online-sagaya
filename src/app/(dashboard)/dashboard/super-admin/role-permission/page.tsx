import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DataTable } from "@/components/master-data/data-table";
import { getAdminRoles } from "@/features/admin/queries";
import { requireRole } from "@/lib/auth/require-role";

const coreRoles = ["super_admin", "admin", "teacher", "student"];

export default async function SuperAdminRolePermissionPage() {
  await requireRole("super_admin");
  const roles = await getAdminRoles();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Peran & Izin"
        description="Pusat ringkas untuk peran inti, hak akses penuh Super Admin, dan matriks izin."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Akses Super Admin"
          value="Penuh"
          description="Super Admin tetap memiliki akses penuh di matriks aplikasi."
        />
        <DashboardCard
          title="Peran Inti"
          value={String(coreRoles.length)}
          description="Peran inti ditandai sebagai tidak boleh dihapus."
        />
        <DashboardCard
          title="Pengawas Khusus"
          value="Tetap Ada"
          description="Peran pengawas khusus dipertahankan untuk akun pengawas non-guru."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <DashboardCard
          title="Kelola Peran"
          description="Ubah label peran dan lihat jumlah pengguna/izin."
        >
          <Link
            href="/dashboard/admin/roles"
            className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Buka Peran
          </Link>
        </DashboardCard>
        <DashboardCard
          title="Kelola Izin"
          description="Tinjau dan ubah matriks izin akses tiap peran."
        >
          <Link
            href="/dashboard/admin/permissions"
            className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Buka Izin
          </Link>
        </DashboardCard>
      </section>

      <DataTable columns={["Peran", "Label", "Pengguna", "Izin", "Proteksi"]}>
        {roles.map((role) => (
          <tr key={role.id}>
            <td className="px-4 py-3 font-mono text-xs">{role.name}</td>
            <td className="px-4 py-3 font-medium">{role.label}</td>
            <td className="px-4 py-3">{role.userCount}</td>
            <td className="px-4 py-3">{role.permissionCount}</td>
            <td className="px-4 py-3">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                {coreRoles.includes(role.name) ? "Peran inti" : "Peran operasional"}
              </span>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
