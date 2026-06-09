import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { FormSection } from "@/components/master-data/form-section";
import { SchoolForm } from "@/features/super-admin/components/school-form";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireRole } from "@/lib/auth/require-role";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function NewSuperAdminSchoolPage({
  searchParams,
}: PageProps) {
  await requireRole("super_admin");
  await requirePermission("schools.manage");
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Tambah Sekolah"
        description="Daftarkan tenant sekolah baru beserta profil, kontak, dan status aktif platform."
      />
      <Link
        href="/dashboard/super-admin/schools"
        className="inline-flex rounded-md border px-3 py-2 text-sm hover:bg-muted"
      >
        Kembali ke Daftar Sekolah
      </Link>
      <FormSection
        title="Profil Sekolah"
        description="Nama wajib diisi, NPSN harus unik, dan email harus valid bila diisi."
      >
        <SchoolForm redirectPath="/dashboard/super-admin/schools/new" />
      </FormSection>
    </div>
  );
}
