import { notFound } from "next/navigation";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AcademicYearForm } from "@/features/master-data/components/academic-year-form";
import { requirePermission } from "@/lib/auth/require-permission";
import { getAcademicYears, getSchoolOptions } from "@/lib/master-data/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAcademicYearPage({ params }: PageProps) {
  await requirePermission("academic_years.manage");
  const { id } = await params;
  const [academicYears, schools] = await Promise.all([getAcademicYears(), getSchoolOptions()]);
  const academicYear = academicYears.find((item) => item.id === id);

  if (!academicYear) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <DashboardPageHeader title="Edit Tahun Ajaran" description={academicYear.name} />
      <AcademicYearForm academicYear={academicYear} schools={schools} />
    </div>
  );
}
