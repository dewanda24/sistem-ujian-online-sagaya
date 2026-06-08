"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardToaster } from "@/components/dashboard/dashboard-toaster";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { getDashboardMenu } from "@/constants/dashboard-menu";
import type { CurrentUser } from "@/types/auth";

interface DashboardShellProps {
  children: ReactNode;
  user: CurrentUser;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <DashboardShellContent key={pathname} user={user}>
      {children}
    </DashboardShellContent>
  );
}

function DashboardShellContent({ children, user }: DashboardShellProps) {
  const menuItems = getDashboardMenu(user);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#F8FAFC]">
      <DashboardSidebar menuItems={menuItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar user={user} onOpenSidebar={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
        <DashboardToaster />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-[#0F172A]/45"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[280px] max-w-[85vw] shadow-xl">
            <DashboardSidebar
              menuItems={menuItems}
              variant="mobile"
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
