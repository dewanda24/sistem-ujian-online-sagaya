import { notFound } from "next/navigation";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ClassForm } from "@/features/master-data/components/class-form";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getAcademicYearOptions,
  getClasses,
  getSchoolOptions,
  getTeacherOptions,
} from "@/lib/master-data/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditClassPage({ params }: PageProps) {
  await requirePermission("classes.manage");
  const { id } = await params;
  const [classes, schools, academicYears, teachers] = await Promise.all([
    getClasses(),
    getSchoolOptions(),
    getAcademicYearOptions(),
    getTeacherOptions(),
  ]);
  const classItem = classes.find((item) => item.id === id);

  if (!classItem) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <DashboardPageHeader title="Edit Kelas" description={classItem.name} />
      <ClassForm classItem={classItem} schools={schools} academicYears={academicYears} teachers={teachers} />
    </div>
  );
}
