import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { SchoolOnboardingWizard } from "@/features/super-admin/components/school-onboarding-wizard";
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DashboardPageHeader
          title="Onboarding Sekolah Baru"
          description="Daftarkan profil sekolah dan buatkan akun administrator utama secara bersamaan dalam satu alur terpadu."
        />
        <Link
          href="/dashboard/super-admin/schools"
          className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Kembali ke Daftar Sekolah
        </Link>
      </div>

      <SchoolOnboardingWizard />
    </div>
  );
}
