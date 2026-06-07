import { notFound } from "next/navigation";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { StudentForm } from "@/features/master-data/components/student-form";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getClassOptions,
  getStudentClassHistory,
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

export default async function EditStudentPage({ params }: PageProps) {
  await requirePermission("students.manage");
  const { id } = await params;
  const [students, classes, classHistory] = await Promise.all([
    getUsersByRole("student"),
    getClassOptions(),
    getStudentClassHistory(id),
  ]);
  const student = students.find((item) => item.id === id);

  if (!student) {
    notFound();
  }

  const profile = getProfile(student);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <DashboardPageHeader
        title="Edit Siswa"
        description={profile?.full_name ?? student.username}
      />
      <StudentForm student={student} classes={classes} classHistory={classHistory} />
    </div>
  );
}
