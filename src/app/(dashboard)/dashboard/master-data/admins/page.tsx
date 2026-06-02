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

export default async function MasterDataAdminsPage({ searchParams }: PageProps) {
  await requireRole("super_admin");
  const params = await searchParams;

  return (
    <OperationalRoleUsersPage
      title="Admin Sekolah"
      description="Kelola akun admin sekolah sebagai bagian dari master data operasional."
      emptyTitle="Belum ada admin sekolah"
      emptyDescription="Tambahkan admin sekolah untuk membantu operasional data dan ujian."
      redirectPath="/dashboard/master-data/admins"
      roleNames={["admin"]}
      searchParams={params}
    />
  );
}
