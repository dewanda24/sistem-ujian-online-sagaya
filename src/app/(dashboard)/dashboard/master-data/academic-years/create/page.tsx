import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AcademicYearForm } from "@/features/master-data/components/academic-year-form";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSchoolOptions } from "@/lib/master-data/queries";

export default async function CreateAcademicYearPage() {
  await requirePermission("academic_years.manage");
  const schools = await getSchoolOptions();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <DashboardPageHeader title="Tambah Tahun Ajaran" description="Buat tahun ajaran baru." />
      <AcademicYearForm schools={schools} />
    </div>
  );
}
