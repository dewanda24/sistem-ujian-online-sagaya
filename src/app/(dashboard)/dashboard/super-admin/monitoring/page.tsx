import MonitoringPage from "@/app/(dashboard)/dashboard/proctor/monitoring/page";
import { requireRole } from "@/lib/auth/require-role";

type PageProps = {
  searchParams: Promise<{
    schedule_id?: string;
  }>;
};

export default async function SuperAdminMonitoringPage(props: PageProps) {
  await requireRole("super_admin");

  return <MonitoringPage {...props} />;
}
