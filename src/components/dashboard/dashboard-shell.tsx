"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardToaster } from "@/components/dashboard/dashboard-toaster";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { StudentBottomNav } from "@/components/dashboard/student-bottom-nav";
import { getDashboardMenu } from "@/constants/dashboard-menu";
import { SessionGuard } from "@/features/auth/components/session-guard";
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

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("sidebar-toggle", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("sidebar-toggle", callback);
  };
}

function getSidebarSnapshot() {
  try {
    return localStorage.getItem("sagaya_sidebar_collapsed") === "true";
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

function DashboardShellContent({ children, user }: DashboardShellProps) {
  const menuItems = getDashboardMenu(user);
  const pathname = usePathname();
  const isExamRoom = pathname.startsWith("/dashboard/exam-room");
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCollapsed = useSyncExternalStore(
    subscribe,
    getSidebarSnapshot,
    getServerSnapshot,
  );

  const handleToggleCollapse = () => {
    try {
      const next = !isCollapsed;
      localStorage.setItem("sagaya_sidebar_collapsed", String(next));
      window.dispatchEvent(new Event("sidebar-toggle"));
    } catch {
      // Ignore
    }
  };

  if (isExamRoom) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <SessionGuard />
        <main className="min-h-screen p-0">
          {children}
        </main>
        <DashboardToaster />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#F8FAFC]">
      <SessionGuard />
      <DashboardSidebar
        menuItems={menuItems}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div className="flex min-w-0 flex-1 flex-col transition-all duration-300">
        <DashboardTopbar
          user={user}
          isSidebarCollapsed={isCollapsed}
          onToggleSidebarCollapse={handleToggleCollapse}
          onOpenSidebar={() => setMobileOpen(true)}
        />
        <main
          className={
            isExamRoom
              ? "min-w-0 flex-1 px-3 py-3 lg:px-6 lg:py-4"
              : user.roles?.name === "student"
                ? "min-w-0 flex-1 px-4 pt-4 pb-24 lg:px-8 lg:py-6"
                : "min-w-0 flex-1 px-4 py-6 lg:px-8"
          }
        >
          {children}
        </main>
        {user.roles?.name === "student" && !isExamRoom ? (
          <StudentBottomNav />
        ) : null}
        <DashboardToaster />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[280px] max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-250">
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
