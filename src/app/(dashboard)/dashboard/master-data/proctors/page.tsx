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
      title="Proctor / Pengawas"
      description="Kelola akun pengawas ujian. Penugasan pengawas ke jadwal atau ruang dapat ditambahkan pada tahap berikutnya."
      emptyTitle="Belum ada proctor"
      emptyDescription="Tambahkan akun proctor agar pengawas dapat membuka monitoring ujian."
      redirectPath="/dashboard/master-data/proctors"
      roleNames={["proctor"]}
      searchParams={params}
    />
  );
}
