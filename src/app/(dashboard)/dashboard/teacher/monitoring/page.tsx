import MonitoringPage from "@/app/(dashboard)/dashboard/proctor/monitoring/page";
import { requireRole } from "@/lib/auth/require-role";

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
  await requireRole("teacher");

  return (
    <MonitoringPage
      {...props}
      basePath="/dashboard/teacher/monitoring"
      scope="teacher"
    />
  );
}
