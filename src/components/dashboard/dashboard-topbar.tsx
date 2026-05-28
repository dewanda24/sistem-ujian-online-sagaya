import Link from "next/link";
import { Bell, Search } from "lucide-react";

import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { LogoutButton } from "@/features/auth/components/logout-button";
import type { CurrentUser } from "@/types/auth";

interface DashboardTopbarProps {
  user: CurrentUser;
}

export function DashboardTopbar({ user }: DashboardTopbarProps) {
  const displayName = user.user_profiles?.full_name ?? user.username;
  const initials = displayName
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="min-w-0">
          <DashboardBreadcrumb />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="hidden size-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
            aria-label="Search"
          >
            <Search className="size-4" />
          </button>
          <button
            type="button"
            className="hidden size-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
          </button>
          <RoleBadge user={user} />
          <Link
            href="/dashboard/profile"
            className="hidden items-center gap-3 rounded-md px-2 py-1 transition hover:bg-muted md:flex"
          >
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="max-w-40">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
