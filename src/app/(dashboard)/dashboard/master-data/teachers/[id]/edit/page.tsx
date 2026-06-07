import { notFound } from "next/navigation";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { TeacherForm } from "@/features/master-data/components/teacher-form";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getAcademicYearOptions,
  getClassOptions,
  getSubjectOptions,
  getTeacherAssignments,
  getUsersByRole,
} from "@/lib/master-data/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getProfile(user: {
  user_profiles?:
    | { full_name?: string | null }
    | Array<{ full_name?: string | null }>
    | null;
}) {
  return Array.isArray(user.user_profiles) ? user.user_profiles[0] : user.user_profiles;
}

export default async function EditTeacherPage({ params }: PageProps) {
  await requirePermission("teachers.manage");
  const { id } = await params;
  const [teachers, subjects, classes, academicYears, assignments] = await Promise.all([
    getUsersByRole("teacher"),
    getSubjectOptions(),
    getClassOptions(),
    getAcademicYearOptions(),
    getTeacherAssignments(id),
  ]);
  const teacher = teachers.find((item) => item.id === id);

  if (!teacher) {
    notFound();
  }

  const profile = getProfile(teacher);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <DashboardPageHeader title="Edit Guru" description={profile?.full_name ?? teacher.username} />
      <TeacherForm teacher={teacher} subjects={subjects} classes={classes} academicYears={academicYears} assignments={assignments} />
    </div>
  );
}
