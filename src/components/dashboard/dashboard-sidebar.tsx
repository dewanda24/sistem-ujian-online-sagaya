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
import { usePathname } from "next/navigation";

import type {
  DashboardIconName,
  DashboardMenuItem,
} from "@/constants/dashboard-menu";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  menuItems: DashboardMenuItem[];
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

export function DashboardSidebar({ menuItems }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r bg-background lg:block">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/dashboard" className="min-w-0">
          <p className="truncate text-sm font-semibold">Sistem Ujian Online</p>
          <p className="truncate text-xs text-muted-foreground">
            RBAC Dashboard
          </p>
        </Link>
      </div>

      <nav className="space-y-1 p-3">
        {menuItems.map((item) => {
          const Icon = icons[item.icon];
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
              {item.children?.length ? (
                <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                  {item.children.map((child) => {
                    const ChildIcon = icons[child.icon];
                    const childActive =
                      pathname === child.href || pathname.startsWith(child.href);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex h-9 items-center gap-2 rounded-md px-3 text-sm transition",
                          childActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
