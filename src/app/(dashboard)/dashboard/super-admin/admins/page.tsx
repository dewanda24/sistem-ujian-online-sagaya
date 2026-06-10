import { OperationalRoleUsersPage } from "@/features/admin/components/operational-role-users-page";
import { requireRole } from "@/lib/auth/require-role";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    school_id?: string;
    user_status?: string;
    edit?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function SuperAdminAdminsPage({ searchParams }: PageProps) {
  await requireRole("super_admin");
  const params = await searchParams;

  return (
    <OperationalRoleUsersPage
      title="Admin Sekolah"
      description="Kelola akun admin sekolah, reset password, status akun, dan mapping tenant sekolah."
      emptyTitle="Belum ada admin sekolah"
      emptyDescription="Tambahkan admin sekolah agar setiap tenant punya operator utama."
      redirectPath="/dashboard/super-admin/admins"
      roleNames={["admin"]}
      searchParams={params}
    />
  );
}
