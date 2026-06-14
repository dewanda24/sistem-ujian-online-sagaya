"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { DashboardMenuItem } from "@/constants/dashboard-menu";
import { cn } from "@/lib/utils";

interface MobileDashboardNavProps {
  menuItems: DashboardMenuItem[];
}

export function MobileDashboardNav({ menuItems }: MobileDashboardNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const currentHref = queryString ? `${pathname}?${queryString}` : pathname;

  return (
    <nav className="flex gap-2 overflow-x-auto border-b bg-background px-4 py-2 lg:hidden">
      {menuItems.flatMap((item) => [item, ...(item.children ?? [])]).map((item) => {
        const hrefPath = item.href.split("?")[0];
        const activePathMatch = item.activePaths?.some((activePath) => {
          const path = activePath.split("?")[0];

          return activePath.includes("?")
            ? currentHref === activePath
            : pathname === path || pathname.startsWith(path);
        });
        const active =
          currentHref === item.href ||
          pathname === hrefPath ||
          (hrefPath !== "/dashboard" && pathname.startsWith(hrefPath)) ||
          Boolean(activePathMatch);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-sm font-medium",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
