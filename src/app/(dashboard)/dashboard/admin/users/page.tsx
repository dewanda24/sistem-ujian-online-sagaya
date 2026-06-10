import Link from "next/link";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { StatusBadge } from "@/components/master-data/status-badge";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  getAdminRoleOptions,
  getAdminUsers,
  getOperationalUserRoleOptions,
  getUserGovernanceSummary,
} from "@/features/admin/queries";
import {
  resetAdminUserPasswordAction,
  saveAdminUserAction,
  toggleAdminUserStatusAction,
} from "@/features/admin/actions";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSchoolOptions } from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    role_id?: string;
    school_id?: string;
    user_status?: string;
    edit?: string;
    status?: string;
    message?: string;
  }>;
  basePath?: string;
};

export default async function UsersPage({
  searchParams,
  basePath = "/dashboard/admin/users",
}: PageProps) {
  const currentUser = await requirePermission("users.view");
  const params = await searchParams;
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
    currentUser.roles?.name === "super_admin"
      ? getSchoolOptions()
      : Promise.resolve([]),
  ]);
  const editable = users.find((user) => user.id === params.edit);

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title={currentUser.roles?.name === "super_admin" ? "User Global" : "Users"}
        description={
          currentUser.roles?.name === "super_admin"
            ? "Lihat semua user lintas sekolah, filter role/status/sekolah, reset password, dan aktif/nonaktifkan akun."
            : "Direktori akun dan governance user aplikasi. CRUD spesifik guru, siswa, admin sekolah, dan proctor diarahkan ke Master Data agar struktur operasional tetap rapi."
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Total Users"
          value={String(summary.total)}
          description="Semua akun internal yang terdaftar."
        />
        <DashboardCard
          title="Tanpa Auth"
          value={String(summary.withoutAuth)}
          description="Belum tersambung ke Supabase Auth."
        />
        <DashboardCard
          title="Tanpa Role"
          value={String(summary.withoutRole)}
          description="Berisiko gagal akses dashboard."
        />
        <DashboardCard
          title="Inactive"
          value={String(summary.inactive)}
          description="Akun nonaktif atau status tidak active."
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          title="Role Distribution"
          description="Ringkasan jumlah akun per role untuk audit cepat."
        >
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {summary.byRole.map((item) => (
              <div
                key={item.role}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <span className="truncate">
                  {item.label}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({item.role})
                  </span>
                </span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard
          title="CRUD Operasional"
          description="Gunakan jalur Master Data untuk role yang punya konteks akademik atau operasional khusus."
        >
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <QuickLink href="/dashboard/master-data/admins" label="Admin Sekolah" />
            <QuickLink href="/dashboard/master-data/proctors" label="Proctor" />
            <QuickLink href="/dashboard/master-data/teachers" label="Guru" />
            <QuickLink href="/dashboard/master-data/students" label="Siswa" />
          </div>
        </DashboardCard>
      </section>

      <FormSection
        title={editable ? "Edit User Operasional Umum" : "Tambah User Operasional Umum"}
        description="Form ini tetap tersedia untuk akun umum. Role guru, siswa, admin sekolah, dan proctor sebaiknya dikelola dari Master Data masing-masing."
      >
        <form action={saveAdminUserAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="redirect_path" value={basePath} />
          <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
          <input
            type="hidden"
            name="auth_user_id"
            defaultValue={editable?.auth_user_id ?? ""}
          />
          <input
            name="full_name"
            defaultValue={editable?.profile?.full_name ?? ""}
            placeholder="Nama lengkap"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="email"
            type="email"
            defaultValue={editable?.email ?? ""}
            placeholder="Email"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="username"
            defaultValue={editable?.username ?? ""}
            placeholder="Username"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="password"
            type="password"
            placeholder={editable ? "Kosongkan jika tidak diubah" : "Password awal"}
            className="rounded-md border px-3 py-2 text-sm"
            required={!editable}
          />
          <select
            name="role_id"
            defaultValue={editable?.role_id ?? operationalRoles[0]?.id ?? ""}
            className="rounded-md border px-3 py-2 text-sm"
            required
          >
            {operationalRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label} ({role.name})
              </option>
            ))}
          </select>
          {currentUser.roles?.name === "super_admin" ? (
            <select
              name="school_id"
              defaultValue={editable?.school_id ?? ""}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Tanpa sekolah</option>
              {schools.map((school) => (
                <option key={school.value} value={school.value}>
                  {school.label}
                </option>
              ))}
            </select>
          ) : null}
          <select
            name="status"
            defaultValue={editable?.status ?? "active"}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex justify-end md:col-span-2">
            <ConfirmSubmitButton
              confirmMessage={
                editable
                  ? "Simpan perubahan user, termasuk role/status bila diubah?"
                  : "Tambah user operasional baru?"
              }
              confirmTitle="Konfirmasi User"
              loadingText={editable ? "Memperbarui..." : "Menyimpan..."}
              variant="default"
              className="px-4 py-2 text-sm"
            >
              {editable ? "Update User" : "Tambah User"}
            </ConfirmSubmitButton>
          </div>
        </form>
      </FormSection>

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-5">
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
        {currentUser.roles?.name === "super_admin" ? (
          <select
            name="school_id"
            defaultValue={params.school_id ?? ""}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Semua sekolah</option>
            {schools.map((school) => (
              <option key={school.value} value={school.value}>
                {school.label}
              </option>
            ))}
          </select>
        ) : null}
        <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Filter
        </button>
      </form>

      <DataTable
        columns={[
          "Nama",
          "Email",
          "Role",
          "Sekolah",
          "Auth User",
          "Status",
          "Aksi",
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
              <SchoolScopeCell
                roleName={item.role?.name}
                schoolName={item.school?.name}
              />
            </td>
            <td className="px-4 py-3">
              <span className="font-mono text-xs">
                {item.auth_user_id ?? "-"}
              </span>
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={item.status === "active"} />
            </td>
            <td className="px-4 py-3">
              {item.role?.name === "teacher" || item.role?.name === "student" ? (
                <span className="text-xs text-muted-foreground">
                  Kelola di Master Data
                </span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`${basePath}?edit=${item.id}${
                      params.school_id ? `&school_id=${params.school_id}` : ""
                    }`}
                    className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Edit
                  </a>
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
                      } akun ${item.profile?.full_name ?? item.username}?`}
                    >
                      {item.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                    </ConfirmSubmitButton>
                  </form>
                  <form
                    action={resetAdminUserPasswordAction}
                    className="flex flex-wrap gap-2"
                  >
                    <input type="hidden" name="redirect_path" value={basePath} />
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      name="password"
                      type="password"
                      placeholder="Password baru"
                      className="w-32 rounded-md border px-2 py-1.5 text-xs"
                      required
                      minLength={6}
                    />
                    <ConfirmSubmitButton
                      confirmMessage={`Reset password untuk ${item.profile?.full_name ?? item.username}?`}
                      confirmationText="RESET"
                      variant="danger"
                    >
                      Reset
                    </ConfirmSubmitButton>
                  </form>
                </div>
              )}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md border px-3 py-2 font-medium transition hover:bg-muted"
    >
      {label}
    </Link>
  );
}

function SchoolScopeCell({
  roleName,
  schoolName,
}: {
  roleName?: string;
  schoolName?: string | null;
}) {
  if (schoolName) {
    return <span className="text-sm">{schoolName}</span>;
  }

  if (roleName === "admin") {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
        Belum diset
      </span>
    );
  }

  return <span className="text-sm text-muted-foreground">-</span>;
}
