"use client";

import Link from "next/link";
import { useState, type ComponentType } from "react";
import {
  Activity,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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

const rootDashboards = new Set([
  "/dashboard",
  "/dashboard/teacher",
  "/dashboard/admin",
  "/dashboard/student",
  "/dashboard/proctor",
  "/dashboard/principal",
  "/dashboard/super-admin",
]);

function isLeafItemActive(
  itemHref: string,
  pathname: string,
  currentHref: string,
  activePaths: string[] = [],
): boolean {
  const cleanHref = itemHref.split("?")[0];

  // Root dashboards only match exactly
  if (rootDashboards.has(cleanHref)) {
    return pathname === cleanHref || currentHref === itemHref;
  }

  if (pathname === cleanHref || currentHref === itemHref) {
    return true;
  }

  if (pathname.startsWith(cleanHref + "/")) {
    return true;
  }

  return activePaths.some((activePath) => {
    const cleanActive = activePath.split("?")[0];
    return activePath.includes("?")
      ? currentHref === activePath
      : pathname === cleanActive || pathname.startsWith(cleanActive + "/");
  });
}

function hasAnyActiveChild(
  children: DashboardMenuItem[] | undefined,
  pathname: string,
  currentHref: string,
): boolean {
  if (!children || children.length === 0) return false;
  return children.some((child) =>
    isLeafItemActive(child.href, pathname, currentHref, child.activePaths) ||
    hasAnyActiveChild(child.children, pathname, currentHref)
  );
}

export function DashboardSidebar({
  menuItems,
  onNavigate,
  variant = "desktop",
  isCollapsed = false,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const currentHref = queryString ? `${pathname}?${queryString}` : pathname;

  // Track accordion open/close state for items with children
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of menuItems) {
      if (item.children?.length) {
        initial[item.href] = hasAnyActiveChild(item.children, pathname, currentHref);
      }
    }
    return initial;
  });

  const toggleSubmenu = (href: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  const isMini = variant === "desktop" && isCollapsed;

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-[#E2E8F0] bg-white transition-all duration-300 ease-in-out select-none",
        variant === "desktop" ? "hidden lg:flex shrink-0" : "w-full",
        variant === "desktop" && (isMini ? "w-[72px]" : "w-[280px]"),
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-[#E2E8F0] transition-all duration-300",
          isMini ? "justify-center px-2" : "justify-between px-5",
        )}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn("flex items-center gap-3 min-w-0 group", isMini && "justify-center")}
          title="Sistem Ujian Online Sagaya"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 font-bold text-white shadow-xs transition-transform group-hover:scale-105">
            S
          </div>
          {!isMini && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-[#0F172A]">
                Sagaya CBT
              </p>
              <p className="truncate text-xs font-medium text-[#64748B]">
                Sistem Ujian Online
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-3 [scrollbar-width:thin]">
        {menuItems.map((item) => {
          const Icon = icons[item.icon];
          const hasChildren = Boolean(item.children?.length);
          const isDirectActive = isLeafItemActive(
            item.href,
            pathname,
            currentHref,
            item.activePaths,
          );
          const childActive = hasAnyActiveChild(item.children, pathname, currentHref);
          const isSubmenuOpen = openSubmenus[item.href] ?? childActive;

          if (isMini) {
            // Mini icon-only mode
            return (
              <div key={item.href} className="relative group/mini flex justify-center">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={item.label}
                  aria-label={item.label}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl transition-all duration-150 active:scale-95",
                    isDirectActive || childActive
                      ? "bg-[#2563EB] text-white shadow-xs"
                      : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                </Link>
                {/* Tooltip on hover in mini mode */}
                <div className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 z-50 hidden rounded-md bg-[#0F172A] px-2.5 py-1 text-xs font-medium text-white shadow-lg whitespace-nowrap group-hover/mini:block">
                  {item.label}
                </div>
              </div>
            );
          }

          // Full sidebar mode
          return (
            <div key={item.href} className="space-y-1">
              <div className="flex items-center gap-1">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={item.description ?? item.label}
                  aria-label={item.label}
                  className={cn(
                    "flex h-10 flex-1 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-150 select-none active:scale-[0.98]",
                    // If directly active leaf: solid blue
                    isDirectActive && !hasChildren && "bg-[#2563EB] text-white shadow-xs font-semibold",
                    // If parent with active child: subtle clean highlight
                    childActive && hasChildren && "bg-slate-100/80 text-[#0F172A] font-semibold border border-slate-200/60",
                    // If direct active parent without child active
                    isDirectActive && hasChildren && !childActive && "bg-[#2563EB] text-white shadow-xs font-semibold",
                    // Default inactive
                    !isDirectActive && !childActive && "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>

                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggleSubmenu(item.href)}
                    aria-label={`Toggle ${item.label}`}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl transition-all duration-150 hover:bg-[#F1F5F9] active:scale-90",
                      childActive ? "text-[#2563EB]" : "text-[#64748B]",
                    )}
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform duration-200",
                        isSubmenuOpen ? "rotate-180" : "rotate-0",
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Submenu Accordion */}
              {hasChildren && isSubmenuOpen ? (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-3 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                  {item.children?.map((child) => {
                    const ChildIcon = icons[child.icon];
                    const isChildActive = isLeafItemActive(
                      child.href,
                      pathname,
                      currentHref,
                      child.activePaths,
                    );

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium transition-all duration-150 active:scale-[0.98]",
                          isChildActive
                            ? "bg-[#2563EB] text-white shadow-xs font-semibold"
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

      {/* Desktop Collapse Toggle Footer */}
      {variant === "desktop" && onToggleCollapse && (
        <div className="border-t border-[#E2E8F0] p-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isMini ? "Perlebar Sidebar" : "Perkecil Sidebar (Mini)"}
            aria-label="Toggle sidebar"
            className={cn(
              "flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white text-xs font-medium text-[#64748B] shadow-xs transition-all duration-150 hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95",
              isMini && "px-0",
            )}
          >
            {isMini ? (
              <ChevronsRight className="size-4 shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="size-4 shrink-0" />
                <span className="truncate">Sembunyikan Sidebar</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
