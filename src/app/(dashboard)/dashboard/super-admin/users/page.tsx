import Link from "next/link";
import { UserCheck, UserX, KeyRound, ShieldAlert, Plus, Search, FilterX } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { StatusBadge } from "@/components/master-data/status-badge";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import {
  TableActionLink,
  TableActionSeparator,
  TableActions,
  TableActionSubmit,
} from "@/components/dashboard/table-actions";
import {
  getAdminRoleOptions,
  getAdminUsers,
  getOperationalUserRoleOptions,
  getUserGovernanceSummary,
} from "@/features/admin/queries";
import {
  deleteAdminUserAction,
  saveAdminUserAction,
  toggleAdminUserStatusAction,
} from "@/features/admin/actions";
import { UserPasswordResetModal } from "@/features/admin/components/user-password-reset-modal";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSchoolOptions } from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    role_id?: string;
    school_id?: string;
    user_status?: string;
    edit?: string;
    reset_user?: string;
    status?: string;
    message?: string;
  }>;
  basePath?: string;
};

export default async function UsersPage({
  searchParams,
  basePath = "/dashboard/super-admin/users",
}: PageProps) {
  const currentUser = await requirePermission("users.view");
  const params = await searchParams;
  const isSuperAdmin = currentUser.roles?.name === "super_admin";

  const [users, roles, operationalRoles, summary, schools] = await Promise.all([
    getAdminUsers({
      q: params.q,
      role_id: params.role_id,
      school_id: params.school_id,
      status: params.user_status,
    }),
    getAdminRoleOptions(),
    getOperationalUserRoleOptions(),
    getUserGovernanceSummary({
      school_id: params.school_id,
    }),
    isSuperAdmin ? getSchoolOptions() : Promise.resolve([]),
  ]);

  const editable = users.find((user) => user.id === params.edit);
  const resetTargetUser = params.reset_user
    ? users.find((user) => user.id === params.reset_user)
    : null;

  const hasFilters = Boolean(params.q || params.role_id || params.user_status || params.school_id);

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />

      {/* Reset Password Modal */}
      {resetTargetUser && (
        <UserPasswordResetModal
          user={{
            id: resetTargetUser.id,
            username: resetTargetUser.username,
            email: resetTargetUser.email,
            full_name: resetTargetUser.profile?.full_name,
          }}
          redirectPath={basePath}
        />
      )}

      <DashboardPageHeader
        title={isSuperAdmin ? "Direktori Pengguna Global" : "Manajemen Pengguna"}
        description={
          isSuperAdmin
            ? "Pusat akun lintas seluruh sekolah. Cari pengguna, kelola hak akses, aktifkan/nonaktifkan akun, dan reset sandi secara langsung."
            : "Direktori akun aplikasi untuk mengelola hak akses pengguna sekolah."
        }
      />

      {/* KPI Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Pengguna"
          value={String(summary.total)}
          description="Seluruh akun terdaftar di sistem"
        />
        <DashboardCard
          title="Belum Terhubung"
          value={String(summary.withoutAuth)}
          description="Belum memiliki sesi auth login"
        />
        <DashboardCard
          title="Tanpa Hak Akses"
          value={String(summary.withoutRole)}
          description="Belum ditentukan perannya"
        />
        <DashboardCard
          title="Akun Ditangguhkan"
          value={String(summary.inactive)}
          description="Status tidak aktif"
        />
      </section>

      {/* Create / Edit Form Section */}
      <FormSection
        title={editable ? `Edit Pengguna: ${editable.username}` : "Tambah Pengguna Baru"}
        description={
          editable
            ? "Perbarui informasi akun, email, peran hak akses, atau sekolah naungan pengguna."
            : "Buat akun pengguna baru langsung ke platform. Akun akan otomatis dapat masuk ke sistem."
        }
      >
        <form action={saveAdminUserAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="redirect_path" value={basePath} />
          <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
          <input
            type="hidden"
            name="auth_user_id"
            defaultValue={editable?.auth_user_id ?? ""}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              name="full_name"
              defaultValue={editable?.profile?.full_name ?? ""}
              placeholder="Contoh: Ahmad Fauzi, S.Pd."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Alamat Email <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              defaultValue={editable?.email ?? ""}
              placeholder="nama@sekolah.sch.id"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Username Login <span className="text-red-500">*</span>
            </label>
            <input
              name="username"
              defaultValue={editable?.username ?? ""}
              placeholder="username login unik"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Password {editable ? "(Opsional)" : <span className="text-red-500">*</span>}
            </label>
            <input
              name="password"
              type="password"
              placeholder={editable ? "Kosongkan jika tidak ingin mengubah sandi" : "Minimal 6 karakter"}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              required={!editable}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Peran Hak Akses <span className="text-red-500">*</span>
            </label>
            <select
              name="role_id"
              defaultValue={editable?.role_id ?? operationalRoles[0]?.id ?? ""}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            >
              {operationalRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label} ({role.name})
                </option>
              ))}
            </select>
          </div>

          {isSuperAdmin && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Institusi Sekolah Naungan
              </label>
              <select
                name="school_id"
                defaultValue={editable?.school_id ?? ""}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Tanpa sekolah (Tingkat Platform / Global)</option>
                {schools.map((school) => (
                  <option key={school.value} value={school.value}>
                    {school.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Status Akun</label>
            <select
              name="status"
              defaultValue={editable?.status ?? "active"}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="active">Aktif (Dapat masuk ke sistem)</option>
              <option value="inactive">Nonaktif (Akses ditangguhkan)</option>
            </select>
          </div>

          <div className="flex items-end justify-end gap-2 md:col-span-2 pt-2">
            {editable && (
              <Link
                href={basePath}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Batal Edit
              </Link>
            )}
            <ConfirmSubmitButton
              confirmMessage={
                editable
                  ? "Simpan perubahan informasi pengguna ini?"
                  : "Buat akun pengguna baru pada sistem?"
              }
              confirmTitle="Konfirmasi Pengguna"
              loadingText={editable ? "Menyimpan..." : "Membuat Akun..."}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {editable ? "Perbarui Pengguna" : "Tambah Pengguna"}
            </ConfirmSubmitButton>
          </div>
        </form>
      </FormSection>

      {/* Role Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <Link
          href={basePath}
          className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors shadow-xs ${
            !params.role_id
              ? "bg-primary text-primary-foreground"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Semua Peran ({summary.total})
        </Link>
        {roles.map((r) => {
          const isSelected = params.role_id === r.id;
          const roleCount = summary.byRole.find((br) => br.role === r.name)?.count ?? 0;
          return (
            <Link
              key={r.id}
              href={`${basePath}?role_id=${r.id}${params.school_id ? `&school_id=${params.school_id}` : ""}`}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors shadow-xs ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {r.label} ({roleCount})
            </Link>
          );
        })}
      </div>

      {/* Search and Secondary Filter Bar */}
      <form className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5 shadow-sm">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Cari username, email, atau nama..."
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select
          name="user_status"
          defaultValue={params.user_status ?? ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>

        {isSuperAdmin ? (
          <select
            name="school_id"
            defaultValue={params.school_id ?? ""}
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua Sekolah</option>
            {schools.map((school) => (
              <option key={school.value} value={school.value}>
                {school.label}
              </option>
            ))}
          </select>
        ) : (
          <div />
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Filter
          </button>
          {hasFilters && (
            <Link
              href={basePath}
              className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors text-muted-foreground"
              title="Reset Filter"
            >
              <FilterX className="size-4" />
            </Link>
          )}
        </div>
      </form>

      {/* User Data Table */}
      <DataTable
        columns={[
          "Pengguna",
          "Email",
          "Peran",
          "Sekolah",
          "Auth Login",
          "Status",
          "Aksi",
        ]}
        isEmpty={users.length === 0}
        stickyActionColumn={true}
        enableSearch={false}
        empty={
          <EmptyState
            title="Pengguna tidak ditemukan"
            description="Tidak ada akun pengguna yang cocok dengan kriteria pencarian saat ini."
          />
        }
      >
        {users.map((item) => {
          const hasAuth = Boolean(item.auth_user_id);
          const roleName = item.role?.name;
          const roleBadgeClass =
            roleName === "super_admin"
              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800"
              : roleName === "admin"
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
                : roleName === "teacher" || roleName === "guru"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                  : roleName === "student" || roleName === "siswa"
                    ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    : "bg-muted/60 text-muted-foreground border-border";

          return (
            <tr key={item.id} className="hover:bg-muted/40 transition-colors">
              <td className="px-3 py-3">
                <div className="font-semibold text-foreground leading-snug truncate max-w-[180px]">
                  {item.profile?.full_name ?? item.username}
                </div>
                <div className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                  @{item.username}
                </div>
              </td>
              <td className="px-3 py-3 text-xs text-muted-foreground">
                <span className="block truncate max-w-[190px]" title={item.email}>
                  {item.email}
                </span>
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${roleBadgeClass}`}>
                  {item.role?.label ?? item.role?.name ?? "-"}
                </span>
              </td>
              <td className="px-3 py-3 text-xs">
                {item.school?.name ? (
                  <span className="text-foreground font-medium block truncate max-w-[150px]" title={item.school.name}>
                    {item.school.name}
                  </span>
                ) : item.role?.name === "super_admin" ? (
                  <span className="text-primary font-semibold whitespace-nowrap">Global Platform</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">Belum diatur</span>
                )}
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                {hasAuth ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                    <UserCheck className="size-3.5" />
                    Terhubung
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
                    <UserX className="size-3.5" />
                    Belum Terhubung
                  </span>
                )}
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                <StatusBadge active={item.status === "active"} />
              </td>
              <td className="px-3 py-3 text-right">
                <TableActions>
                  <TableActionLink
                    href={`${basePath}?edit=${item.id}${
                      params.school_id ? `&school_id=${params.school_id}` : ""
                    }${params.role_id ? `&role_id=${params.role_id}` : ""}`}
                    icon="pencil"
                  >
                    Edit Profil
                  </TableActionLink>
                  <TableActionLink
                    href={`${basePath}?reset_user=${item.id}${
                      params.school_id ? `&school_id=${params.school_id}` : ""
                    }${params.role_id ? `&role_id=${params.role_id}` : ""}`}
                    icon="key-round"
                  >
                    Reset Sandi
                  </TableActionLink>
                  <TableActionSeparator />
                  <form action={toggleAdminUserStatusAction}>
                    <input type="hidden" name="redirect_path" value={basePath} />
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={item.status === "active" ? "inactive" : "active"}
                    />
                    <TableActionSubmit
                      icon="power"
                      confirmMessage={`${
                        item.status === "active" ? "Nonaktifkan" : "Aktifkan"
                      } akun ${item.profile?.full_name ?? item.username}?`}
                    >
                      {item.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                    </TableActionSubmit>
                  </form>
                  {item.role?.name !== "super_admin" && (
                    <>
                      <TableActionSeparator />
                      <form action={deleteAdminUserAction}>
                        <input type="hidden" name="redirect_path" value={basePath} />
                        <input type="hidden" name="id" value={item.id} />
                        <TableActionSubmit
                          icon="trash"
                          tone="danger"
                          confirmTitle="Hapus Pengguna Permanen"
                          confirmMessage={`Hapus akun "${item.profile?.full_name ?? item.username}" secara permanen? Data akun dan login akan dihapus.`}
                          confirmationText="HAPUS"
                        >
                          Hapus Pengguna
                        </TableActionSubmit>
                      </form>
                    </>
                  )}
                </TableActions>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
