"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  Activity,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Database,
  Download,
  FileClock,
  FileText,
  GraduationCap,
  HardDrive,
  History,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import type {
  DashboardIconName,
  DashboardMenuItem,
} from "@/constants/dashboard-menu";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  menuItems: DashboardMenuItem[];
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}

const icons: Record<DashboardIconName, ComponentType<{ className?: string }>> = {
  activity: Activity,
  "book-open": BookOpen,
  "building-2": Building2,
  "calendar-days": CalendarDays,
  "clipboard-check": ClipboardCheck,
  database: Database,
  download: Download,
  "file-clock": FileClock,
  "file-text": FileText,
  "graduation-cap": GraduationCap,
  history: History,
  "layout-dashboard": LayoutDashboard,
  "list-checks": ListChecks,
  "lock-keyhole": LockKeyhole,
  "scroll-text": ScrollText,
  settings: Settings,
  "hard-drive": HardDrive,
  "shield-check": ShieldCheck,
  users: Users,
};

function isRouteActive(
  pathname: string,
  currentHref: string,
  href: string,
  children?: DashboardMenuItem[],
): boolean {
  const hrefPath = href.split("?")[0];

  if (href.includes("?")) {
    return currentHref === href;
  }

  return (
    pathname === hrefPath ||
    (hrefPath !== "/dashboard" && pathname.startsWith(hrefPath)) ||
    Boolean(children?.some((child) => isRouteActive(pathname, currentHref, child.href)))
  );
}

export function DashboardSidebar({
  menuItems,
  onNavigate,
  variant = "desktop",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const currentHref = queryString ? `${pathname}?${queryString}` : pathname;

  return (
    <aside
      className={cn(
        "h-full w-[280px] shrink-0 border-r border-[#E2E8F0] bg-white",
        variant === "desktop" && "hidden lg:block",
      )}
    >
      <div className="flex h-16 items-center border-b border-[#E2E8F0] px-5">
        <Link href="/dashboard" className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#0F172A]">
            Sistem Ujian Online
          </p>
          <p className="truncate text-xs text-[#64748B]">
            Dashboard Sekolah
          </p>
        </Link>
      </div>

      <nav className="h-[calc(100%-4rem)] space-y-1 overflow-y-auto p-3">
        {menuItems.map((item) => {
          const Icon = icons[item.icon];
          const active = isRouteActive(pathname, currentHref, item.href, item.children);

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                  active
                    ? "bg-[#2563EB] text-white"
                    : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
              {item.children?.length ? (
                <div className="ml-4 mt-1 space-y-1 border-l border-[#E2E8F0] pl-3">
                  {item.children.map((child) => {
                    const ChildIcon = icons[child.icon];
                    const childActive = isRouteActive(pathname, currentHref, child.href);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex h-9 items-center gap-2 rounded-xl px-3 text-sm transition",
                          childActive
                            ? "bg-[#F8FAFC] text-[#0F172A] ring-1 ring-[#E2E8F0]"
                            : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
                        )}
                      >
                        <ChildIcon className="size-3.5 shrink-0" />
                        <span className="truncate">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
