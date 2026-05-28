import { RoleDashboardView } from "@/features/dashboard/components/role-dashboard-view";
import { requireRole } from "@/lib/auth/require-role";

export default async function TeacherDashboardPage() {
  const user = await requireRole("teacher");

  return <RoleDashboardView role="teacher" user={user} />;
}
