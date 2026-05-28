import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { CurrentUser } from "@/types/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: CurrentUser;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
