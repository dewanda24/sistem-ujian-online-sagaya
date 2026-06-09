import { notFound } from "next/navigation";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { SubjectForm } from "@/features/master-data/components/subject-form";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSchoolOptions, getSubjects } from "@/lib/master-data/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSubjectPage({ params }: PageProps) {
  await requirePermission("subjects.manage");
  const { id } = await params;
  const [subjects, schools] = await Promise.all([getSubjects(), getSchoolOptions()]);
  const subject = subjects.find((item) => item.id === id);

  if (!subject) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <DashboardPageHeader title="Edit Mata Pelajaran" description={subject.name} />
      <SubjectForm subject={subject} schools={schools} />
    </div>
  );
}
