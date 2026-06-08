import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { StudentForm } from "@/features/master-data/components/student-form";
import { requirePermission } from "@/lib/auth/require-permission";
import { getClassOptions } from "@/lib/master-data/queries";

export default async function CreateStudentPage() {
  await requirePermission("students.manage");
  const classes = await getClassOptions();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <DashboardPageHeader
        title="Tambah Siswa"
        description="Isi data dasar siswa dan simpan. Penempatan kelas dapat dilakukan setelah siswa dibuat."
      />
      <StudentForm classes={classes} />
    </div>
  );
}
