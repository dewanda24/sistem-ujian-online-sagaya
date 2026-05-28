"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDashboardMenu } from "@/constants/dashboard-menu";
import type { CurrentUser } from "@/types/auth";

interface DashboardSidebarProps {
  user: CurrentUser;
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const menus = getDashboardMenu(user);

  return (
    <aside className="w-64 border-r bg-background">
      <div className="border-b p-4">
        <h1 className="text-lg font-bold">Sistem Ujian</h1>
      </div>

      <nav className="space-y-1 p-2">
        {menus.map((menu) => {
          const active =
            pathname === menu.href ||
            (menu.href !== "/dashboard" && pathname.startsWith(menu.href));

          return (
            <div key={menu.href}>
              <Link
                href={menu.href}
                className={`block rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {menu.label}
              </Link>
              {menu.children?.length ? (
                <div className="ml-3 mt-1 space-y-1 border-l pl-3">
                  {menu.children.map((child) => {
                    const childActive =
                      pathname === child.href || pathname.startsWith(child.href);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block rounded-md px-3 py-2 text-sm transition ${
                          childActive ? "bg-muted font-medium" : "hover:bg-muted"
                        }`}
                      >
                        {child.label}
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
