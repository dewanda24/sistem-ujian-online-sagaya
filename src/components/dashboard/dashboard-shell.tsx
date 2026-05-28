import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardToaster } from "@/components/dashboard/dashboard-toaster";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { MobileDashboardNav } from "@/components/dashboard/mobile-dashboard-nav";
import { getDashboardMenu } from "@/constants/dashboard-menu";
import type { CurrentUser } from "@/types/auth";

interface DashboardShellProps {
  children: ReactNode;
  user: CurrentUser;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const menuItems = getDashboardMenu(user);

  return (
    <div className="flex min-h-screen bg-muted/35">
      <DashboardSidebar menuItems={menuItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar user={user} />
        <MobileDashboardNav menuItems={menuItems} />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        <DashboardToaster />
      </div>
    </div>
  );
}
