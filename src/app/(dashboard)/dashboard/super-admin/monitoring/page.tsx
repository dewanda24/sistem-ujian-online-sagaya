import MonitoringPage from "@/app/(dashboard)/dashboard/proctor/monitoring/page";
import { requireRole } from "@/lib/auth/require-role";

type PageProps = {
  searchParams: Promise<{
    schedule_id?: string;
    class_id?: string;
    subject_id?: string;
    status?: string;
    notice?: string;
    message?: string;
  }>;
};

export default async function SuperAdminMonitoringPage(props: PageProps) {
  await requireRole("super_admin");

  return <MonitoringPage {...props} basePath="/dashboard/super-admin/monitoring" />;
}
