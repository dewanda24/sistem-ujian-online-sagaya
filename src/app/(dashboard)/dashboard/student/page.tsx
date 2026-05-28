import { RoleDashboardView } from "@/features/dashboard/components/role-dashboard-view";
import { requireRole } from "@/lib/auth/require-role";

export default async function StudentDashboardPage() {
  const user = await requireRole("student");

  return <RoleDashboardView role="student" user={user} />;
}
