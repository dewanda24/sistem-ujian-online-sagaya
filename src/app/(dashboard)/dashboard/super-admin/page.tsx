import { RoleDashboardView } from "@/features/dashboard/components/role-dashboard-view";
import { requireRole } from "@/lib/auth/require-role";

export default async function SuperAdminDashboardPage() {
  const user = await requireRole("super_admin");

  return <RoleDashboardView role="super_admin" user={user} />;
}
