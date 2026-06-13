import MonitoringPage from "@/app/(dashboard)/dashboard/proctor/monitoring/page";
import { hasAnyActiveProctorAssignment } from "@/lib/auth/proctor-scope";
import { requireRole } from "@/lib/auth/require-role";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    schedule_id?: string;
    class_id?: string;
    subject_id?: string;
    status?: string;
    issue?: string;
    q?: string;
    notice?: string;
    message?: string;
  }>;
};

export default async function TeacherMonitoringPage(props: PageProps) {
  const user = await requireRole("teacher");

  if (!(await hasAnyActiveProctorAssignment(user.id))) {
    redirect("/dashboard/forbidden");
  }

  return (
    <MonitoringPage
      {...props}
      basePath="/dashboard/teacher/monitoring"
      scope="teacher"
    />
  );
}
