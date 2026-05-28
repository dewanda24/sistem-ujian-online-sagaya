import { RoleDashboardView } from "@/features/dashboard/components/role-dashboard-view";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminDashboardPage() {
  const user = await requireRole("admin");

  return <RoleDashboardView role="admin" user={user} />;
}
