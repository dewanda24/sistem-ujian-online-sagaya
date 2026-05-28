"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { DashboardMenuItem } from "@/constants/dashboard-menu";
import { cn } from "@/lib/utils";

interface MobileDashboardNavProps {
  menuItems: DashboardMenuItem[];
}

export function MobileDashboardNav({ menuItems }: MobileDashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto border-b bg-background px-4 py-2 lg:hidden">
      {menuItems.flatMap((item) => [item, ...(item.children ?? [])]).map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

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
