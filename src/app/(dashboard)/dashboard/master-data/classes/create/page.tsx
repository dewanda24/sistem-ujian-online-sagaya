import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ClassForm } from "@/features/master-data/components/class-form";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getAcademicYearOptions,
  getSchoolOptions,
  getTeacherOptions,
} from "@/lib/master-data/queries";

export default async function CreateClassPage() {
  await requirePermission("classes.manage");
  const [schools, academicYears, teachers] = await Promise.all([
    getSchoolOptions(),
    getAcademicYearOptions(),
    getTeacherOptions(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <DashboardPageHeader title="Tambah Kelas" description="Isi data dasar kelas." />
      <ClassForm schools={schools} academicYears={academicYears} teachers={teachers} />
    </div>
  );
}
