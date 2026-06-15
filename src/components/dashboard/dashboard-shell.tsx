"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardToaster } from "@/components/dashboard/dashboard-toaster";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
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

function DashboardShellContent({ children, user }: DashboardShellProps) {
  const menuItems = getDashboardMenu(user);
  const pathname = usePathname();
  const isExamRoom = pathname.startsWith("/dashboard/exam-room");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#F8FAFC]">
      <SessionGuard />
      <DashboardSidebar menuItems={menuItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar user={user} onOpenSidebar={() => setMobileOpen(true)} />
        {user.is_demo_user ? <DemoModeBanner /> : null}
        <main
          className={
            isExamRoom
              ? "min-w-0 flex-1 px-3 py-3 lg:px-8 lg:py-6"
              : "min-w-0 flex-1 px-4 py-6 lg:px-8"
          }
        >
          {children}
        </main>
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

function DemoModeBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 lg:px-8">
      <div className="flex items-start gap-3 text-sm">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="font-bold">Mode demo aktif</p>
          <p className="mt-0.5 leading-6">
            Data contoh dapat digunakan untuk eksplorasi. Aksi berisiko seperti
            reset, arsip, dan penghapusan dibatasi agar demo tetap stabil.
          </p>
        </div>
      </div>
    </div>
  );
}
