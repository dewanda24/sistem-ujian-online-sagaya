import Link from "next/link";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  getAdminRoleOptions,
  getAdminUsers,
  getOperationalUserRoleOptions,
  getUserGovernanceSummary,
} from "@/features/admin/queries";
import {
  saveAdminUserAction,
  toggleAdminUserStatusAction,
} from "@/features/admin/actions";
import { requirePermission } from "@/lib/auth/require-permission";
import { hasPermission } from "@/lib/auth/has-permission";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    role_id?: string;
    user_status?: string;
    edit?: string;
    status?: string;
    message?: string;
  }>;
  basePath?: string;
};

const roleBadgeColors: Record<string, string> = {
  teacher: "bg-blue-50 text-blue-700 ring-blue-600/20",
  student: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  proctor: "bg-purple-50 text-purple-700 ring-purple-600/20",
  principal: "bg-amber-50 text-amber-700 ring-amber-600/20",
  admin: "bg-slate-100 text-slate-700 ring-slate-600/20",
};

export default async function SchoolUsersPage({
  searchParams,
  basePath = "/dashboard/master-data/users",
}: PageProps) {
  const currentUser = await requirePermission("users.view");
  const canManageUsers = hasPermission(currentUser, "users.update");
  const canCreateUsers = hasPermission(currentUser, "users.create");
  const params = await searchParams;

  const [users, roles, operationalRoles, summary] = await Promise.all([
    getAdminUsers({
      q: params.q,
      role_id: params.role_id,
      status: params.user_status,
    }),
    getAdminRoleOptions(),
    getOperationalUserRoleOptions(),
    getUserGovernanceSummary(),
  ]);

  // Operational roles allowed for school-level creation (principal, proctor)
  const schoolCreatableRoles = operationalRoles.filter(
    (role) => role.name === "principal" || role.name === "proctor",
  );

  const editable = params.edit
    ? users.find((user) => user.id === params.edit)
    : undefined;

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />

      <DashboardPageHeader
        title="Direktori Pengguna Sekolah"
        description="Pantau seluruh personil sekolah (Guru, Siswa, Pengawas Ujian, Kepala Sekolah) dalam satu direktori terpusat dengan aksi cepat reset password."
      />

      {/* Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Total Pengguna"
          value={String(summary.total)}
          description="Seluruh akun terdaftar di sekolah ini."
        />
        <DashboardCard
          title="Akun Nonaktif"
          value={String(summary.inactive)}
          description="Akun yang sedang dinonaktifkan."
        />
        <DashboardCard
          title="Distribusi Peran"
          description="Komposisi akun aktif sekolah saat ini."
        >
          <div className="flex flex-wrap gap-1.5 pt-1">
            {summary.byRole.map((item) => (
              <span
                key={item.role}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                  roleBadgeColors[item.role] ?? "bg-slate-100 text-slate-700 ring-slate-600/20",
                )}
              >
                {item.label}: <strong>{item.count}</strong>
              </span>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard
          title="Kelola Spesifik"
          description="Tautan cepat ke data induk masing-masing."
        >
          <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold pt-1">
            <Link
              href="/dashboard/master-data/teachers"
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center hover:bg-slate-100 transition"
            >
              Data Guru
            </Link>
            <Link
              href="/dashboard/master-data/students"
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center hover:bg-slate-100 transition"
            >
              Data Siswa
            </Link>
            <Link
              href="/dashboard/exams/proctors"
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center hover:bg-slate-100 transition"
            >
              Pengawas
            </Link>
            <Link
              href="/dashboard/reports/login-cards"
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center hover:bg-slate-100 transition"
            >
              Kartu Login
            </Link>
          </div>
        </DashboardCard>
      </section>

      {/* Create / Edit Operational Account (Principal / Proctor) Form */}
      {canCreateUsers && schoolCreatableRoles.length > 0 ? (
        <FormSection
          title={
            editable
              ? `Edit Akun ${editable.role?.label ?? "Pengguna"}`
              : "Tambah Akun Operasional (Kepala Sekolah / Pengawas)"
          }
          description="Form ini digunakan untuk mendaftarkan akun Kepala Sekolah (Principal) atau Pengawas Khusus. Guru dan Siswa dikelola melalui modul Data Sekolah masing-masing."
        >
          <form action={saveAdminUserAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="redirect_path" value={basePath} />
            <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
            <input
              type="hidden"
              name="auth_user_id"
              defaultValue={editable?.auth_user_id ?? ""}
            />

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Nama Lengkap
              </label>
              <input
                name="full_name"
                defaultValue={editable?.profile?.full_name ?? ""}
                placeholder="Contoh: Drs. H. Ahmad Sudrajat, M.Pd"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Email
              </label>
              <input
                name="email"
                type="email"
                defaultValue={editable?.email ?? ""}
                placeholder="email@sekolah.sch.id"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Username
              </label>
              <input
                name="username"
                defaultValue={editable?.username ?? ""}
                placeholder="username_login"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Password {editable ? "(Opsional)" : ""}
              </label>
              <input
                name="password"
                type="password"
                placeholder={
                  editable
                    ? "Kosongkan jika tidak ingin mengubah password"
                    : "Password awal login"
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                required={!editable}
                minLength={6}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Peran Pengguna
              </label>
              <select
                name="role_id"
                defaultValue={editable?.role_id ?? schoolCreatableRoles[0]?.id ?? ""}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                required
              >
                {schoolCreatableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label} ({role.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Status Akun
              </label>
              <select
                name="status"
                defaultValue={editable?.status ?? "active"}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 md:col-span-2 pt-2">
              {editable ? (
                <Link
                  href={basePath}
                  className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </Link>
              ) : null}
              <ConfirmSubmitButton
                confirmMessage={
                  editable
                    ? "Simpan perubahan data akun pengguna?"
                    : "Buat akun operasional baru untuk sekolah ini?"
                }
                confirmTitle="Konfirmasi Akun"
                loadingText={editable ? "Memperbarui..." : "Menyimpan..."}
                className="rounded-xl px-4 py-2 text-xs font-semibold"
              >
                {editable ? "Simpan Perubahan" : "Tambah Akun"}
              </ConfirmSubmitButton>
            </div>
          </form>
        </FormSection>
      ) : null}

      {/* Filter Bar */}
      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:grid-cols-4">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari nama, username, atau email..."
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none sm:col-span-2"
        />
        <select
          name="role_id"
          defaultValue={params.role_id ?? ""}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
        >
          <option value="">Semua Peran</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <select
            name="user_status"
            defaultValue={params.user_status ?? ""}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Users Table */}
      <DataTable
        columns={[
          "Nama & Akun",
          "Email",
          "Peran",
          "Status",
          "Aksi Cepat",
        ]}
        isEmpty={users.length === 0}
        empty={
          <EmptyState
            title="Tidak ada pengguna ditemukan"
            description="Coba ubah kata kunci pencarian atau bersihkan filter peran."
          />
        }
      >
        {users.map((item) => {
          const roleName = item.role?.name ?? "";
          const isTeacherOrStudent = roleName === "teacher" || roleName === "student";

          return (
            <tr key={item.id} className="transition hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-900 text-xs">
                  {item.profile?.full_name ?? item.username}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  @{item.username}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 font-medium">
                {item.email}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                    roleBadgeColors[roleName] ?? "bg-slate-100 text-slate-700 ring-slate-600/20",
                  )}
                >
                  {item.role?.label ?? roleName}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge active={item.status === "active"} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Master Data Link for Teachers / Students */}
                  {isTeacherOrStudent ? (
                    <Link
                      href={
                        roleName === "teacher"
                          ? `/dashboard/master-data/teachers?edit=${item.id}`
                          : `/dashboard/master-data/students?edit=${item.id}`
                      }
                      className="inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      title="Edit data akademik lengkap di Master Data"
                    >
                      Detail
                    </Link>
                  ) : canManageUsers ? (
                    <Link
                      href={`${basePath}?edit=${item.id}`}
                      className="inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Edit
                    </Link>
                  ) : null}

                  {/* Toggle Status Form */}
                  {canManageUsers && roleName !== "admin" ? (
                    <form action={toggleAdminUserStatusAction}>
                      <input type="hidden" name="redirect_path" value={basePath} />
                      <input type="hidden" name="id" value={item.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={item.status === "active" ? "inactive" : "active"}
                      />
                      <ConfirmSubmitButton
                        confirmMessage={`${
                          item.status === "active" ? "Nonaktifkan" : "Aktifkan"
                        } akun @${item.username}?`}
                        variant={item.status === "active" ? "outline" : "default"}
                        className="h-7 px-2.5 text-xs font-semibold"
                      >
                        {item.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                      </ConfirmSubmitButton>
                    </form>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
