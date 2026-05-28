import { RoleDashboardView } from "@/features/dashboard/components/role-dashboard-view";
import { requireRole } from "@/lib/auth/require-role";

export default async function ProctorDashboardPage() {
  const user = await requireRole("proctor");

  return <RoleDashboardView role="proctor" user={user} />;
}
