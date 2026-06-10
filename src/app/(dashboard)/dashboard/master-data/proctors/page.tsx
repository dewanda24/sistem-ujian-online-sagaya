import { OperationalRoleUsersPage } from "@/features/admin/components/operational-role-users-page";

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

export default async function MasterDataProctorsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <OperationalRoleUsersPage
      title="Pengawas Khusus"
      description="Kelola akun pengawas non-guru seperti operator lab, panitia CBT, teknisi, atau pengawas eksternal."
      emptyTitle="Belum ada pengawas khusus"
      emptyDescription="Tambahkan akun pengawas khusus hanya jika sekolah membutuhkan pengawas non-guru."
      redirectPath="/dashboard/master-data/proctors"
      roleNames={["proctor"]}
      searchParams={params}
    />
  );
}
