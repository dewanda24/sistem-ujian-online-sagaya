import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { TeacherForm } from "@/features/master-data/components/teacher-form";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getAcademicYearOptions,
  getClassOptions,
  getSubjectOptions,
} from "@/lib/master-data/queries";

export default async function CreateTeacherPage() {
  await requirePermission("teachers.manage");
  const [subjects, classes, academicYears] = await Promise.all([
    getSubjectOptions(),
    getClassOptions(),
    getAcademicYearOptions(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <DashboardPageHeader title="Tambah Guru" description="Isi data dasar guru." />
      <TeacherForm subjects={subjects} classes={classes} academicYears={academicYears} />
    </div>
  );
}
