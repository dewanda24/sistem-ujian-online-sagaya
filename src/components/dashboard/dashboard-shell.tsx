"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Bell, User } from "lucide-react";
import Link from "next/link";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardToaster } from "@/components/dashboard/dashboard-toaster";
import { TopAppBar } from "@/components/dashboard/top-app-bar";
import { AppBottomNav } from "@/components/dashboard/app-bottom-nav";
import { getDashboardMenu } from "@/constants/dashboard-menu";
import { SessionGuard } from "@/features/auth/components/session-guard";
import type { CurrentUser } from "@/types/auth";
import type { RoleName } from "@/types/auth";
import { cn } from "@/lib/utils";

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

/** Derive a human-readable page title from pathname */
function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/student": "Beranda",
    "/dashboard/student/active-exams": "Ujian Saya",
    "/dashboard/student/schedules": "Jadwal Ujian",
    "/dashboard/student/history": "Hasil Ujian",
    "/dashboard/teacher": "Beranda",
    "/dashboard/teacher/questions": "Bank Soal",
    "/dashboard/teacher/schedules": "Jadwal Ujian",
    "/dashboard/teacher/grading": "Koreksi Esai",
    "/dashboard/teacher/reports": "Laporan",
    "/dashboard/proctor": "Beranda",
    "/dashboard/proctor/monitoring": "Monitoring",
    "/dashboard/admin": "Beranda",
    "/dashboard/admin/users": "Data Pengguna",
    "/dashboard/admin/students": "Data Siswa",
    "/dashboard/admin/teachers": "Data Guru",
    "/dashboard/admin/classes": "Data Kelas",
    "/dashboard/admin/subjects": "Mata Pelajaran",
    "/dashboard/admin/reports": "Laporan",
    "/dashboard/profile": "Profil Saya",
    "/dashboard/settings": "Pengaturan",
  };

  // Exact match
  if (map[pathname]) return map[pathname];

  // Prefix match (for dynamic routes like /dashboard/teacher/questions/[id])
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (pathname.startsWith(key + "/")) return map[key];
  }

  return "Sagaya CBT";
}

function DashboardShellContent({ children, user }: DashboardShellProps) {
  const menuItems = getDashboardMenu(user);
  const pathname = usePathname();
  const isExamRoom = pathname.startsWith("/dashboard/exam-room");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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

  const role = user.roles?.name as RoleName | undefined;
  const displayName = user.user_profiles?.full_name ?? user.username;
  const initials = displayName
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Exam room: fullscreen, no chrome
  if (isExamRoom) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <SessionGuard />
        <main className="min-h-screen p-0">{children}</main>
        <DashboardToaster />
      </div>
    );
  }

  const pageTitle = getPageTitle(pathname);

  const topBarActions = (
    <div className="flex items-center">
      <button
        type="button"
        aria-label="Notifikasi"
        onClick={() => window.dispatchEvent(new CustomEvent("sagaya-open-notifications"))}
        className="md-icon-btn relative"
      >
        <Bell className="size-6" />
        <span className="absolute top-2.5 right-2.5 flex size-2 rounded-full bg-rose-500 ring-2 ring-white" />
      </button>
      <Link
        href="/dashboard/profile"
        aria-label="Profil saya"
        className="md-icon-btn"
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-[#2563EB] text-white text-xs font-bold">
          {initials}
        </div>
      </Link>
    </div>
  );

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#F8FAFC]">
      <SessionGuard />

      {/* Desktop Sidebar — hidden on mobile */}
      <DashboardSidebar
        menuItems={menuItems}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Top App Bar */}
        <div className="lg:hidden">
          <TopAppBar
            title={pageTitle}
            showMenu={role !== "student"}
            onMenuClick={() => setMobileDrawerOpen(true)}
            actions={topBarActions}
          />
        </div>

        {/* Desktop: simple topbar strip */}
        <header className="hidden lg:flex h-[56px] items-center border-b border-[#E2E8F0] bg-white px-6 gap-4 sticky top-0 z-20 shrink-0">
          <button
            type="button"
            onClick={handleToggleCollapse}
            aria-label="Toggle sidebar"
            className="md-icon-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" />
            </svg>
          </button>
          <span className="flex-1 text-[17px] font-semibold text-[#1E293B] truncate">{pageTitle}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Notifikasi"
              onClick={() => window.dispatchEvent(new CustomEvent("sagaya-open-notifications"))}
              className="md-icon-btn relative"
            >
              <Bell className="size-5" />
              <span className="absolute top-2.5 right-2.5 flex size-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            <Link href="/dashboard/profile" className="md-icon-btn" aria-label="Profil">
              <div className="flex size-8 items-center justify-center rounded-full bg-[#2563EB] text-white text-xs font-bold">
                {initials}
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main
          className={cn(
            "min-w-0 flex-1 px-4 py-4 lg:px-8 lg:py-6",
            // Add bottom padding for bottom nav on mobile
            role && "pb-safe",
          )}
        >
          {children}
        </main>

        <DashboardToaster />
      </div>

      {/* Android-style Bottom Navigation — all roles on mobile */}
      {role && <AppBottomNav role={role} />}

      {/* Mobile Navigation Drawer (slide from left) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative h-full w-[300px] max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-250">
            <DashboardSidebar
              menuItems={menuItems}
              variant="mobile"
              onNavigate={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}


