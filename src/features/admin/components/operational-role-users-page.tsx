import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  resetAdminUserPasswordAction,
  saveAdminUserAction,
  toggleAdminUserStatusAction,
} from "@/features/admin/actions";
import {
  getAdminUsers,
  getRoleOptionsByNames,
} from "@/features/admin/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type OperationalRoleUsersPageProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  roleNames: string[];
  redirectPath: string;
  searchParams: {
    q?: string;
    user_status?: string;
    edit?: string;
    status?: string;
    message?: string;
  };
};

export async function OperationalRoleUsersPage({
  title,
  description,
  emptyTitle,
  emptyDescription,
  roleNames,
  redirectPath,
  searchParams,
}: OperationalRoleUsersPageProps) {
  await requirePermission("users.view");
  const [users, roles] = await Promise.all([
    getAdminUsers({
      q: searchParams.q,
      status: searchParams.user_status,
      role_names: roleNames,
    }),
    getRoleOptionsByNames(roleNames),
  ]);
  const editable = users.find((user) => user.id === searchParams.edit);
  const defaultRole = editable?.role ?? roles[0];

  return (
    <div className="space-y-6">
      <ActionToast status={searchParams.status} message={searchParams.message} />
      <DashboardPageHeader title={title} description={description} />

      <FormSection
        title={editable ? `Edit ${title}` : `Tambah ${title}`}
        description="Akun dibuat di Supabase Auth dan dipetakan ke user internal sesuai role operasional."
      >
        <form action={saveAdminUserAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="redirect_path" value={redirectPath} />
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
          {roles.length === 1 ? (
            <>
              <input type="hidden" name="role_id" value={roles[0]?.id ?? ""} />
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                {roles[0]?.label ?? title}
              </div>
            </>
          ) : (
            <select
              name="role_id"
              defaultValue={defaultRole?.id ?? roles[0]?.id ?? ""}
              className="rounded-md border px-3 py-2 text-sm"
              required
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label} ({role.name})
                </option>
              ))}
            </select>
          )}
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
                  ? "Simpan perubahan akun operasional, termasuk role/status bila diubah?"
                  : "Tambah akun operasional baru?"
              }
              confirmTitle="Konfirmasi User"
              variant="default"
              className="px-4 py-2 text-sm"
            >
              {editable ? "Update" : "Tambah"}
            </ConfirmSubmitButton>
          </div>
        </form>
      </FormSection>

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3">
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Cari nama, username, atau email"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <select
          name="user_status"
          defaultValue={searchParams.user_status ?? ""}
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
        columns={["Nama", "Email", "Role", "Auth User", "Status", "Aksi"]}
        isEmpty={users.length === 0}
        empty={
          <EmptyState title={emptyTitle} description={emptyDescription} />
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
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <a
                  href={`${redirectPath}?edit=${item.id}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Edit
                </a>
                <form action={toggleAdminUserStatusAction}>
                  <input type="hidden" name="redirect_path" value={redirectPath} />
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
                <form action={resetAdminUserPasswordAction} className="flex gap-2">
                  <input type="hidden" name="redirect_path" value={redirectPath} />
                  <input type="hidden" name="id" value={item.id} />
                  <input
                    name="password"
                    type="password"
                    placeholder="Password baru"
                    className="w-36 rounded-md border px-2 py-1 text-xs"
                    required
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
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
