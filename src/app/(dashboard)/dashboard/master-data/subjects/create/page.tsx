import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { SubjectForm } from "@/features/master-data/components/subject-form";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSchoolOptions } from "@/lib/master-data/queries";

export default async function CreateSubjectPage() {
  await requirePermission("subjects.manage");
  const schools = await getSchoolOptions();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <DashboardPageHeader title="Tambah Mata Pelajaran" description="Isi kode dan nama mata pelajaran." />
      <SubjectForm schools={schools} />
    </div>
  );
}
