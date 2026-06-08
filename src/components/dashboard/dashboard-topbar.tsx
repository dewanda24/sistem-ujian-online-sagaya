import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";

import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { LogoutButton } from "@/features/auth/components/logout-button";
import type { CurrentUser } from "@/types/auth";

interface DashboardTopbarProps {
  user: CurrentUser;
  onOpenSidebar?: () => void;
}

export function DashboardTopbar({ user, onOpenSidebar }: DashboardTopbarProps) {
  const displayName = user.user_profiles?.full_name ?? user.username;
  const initials = displayName
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] lg:hidden"
            aria-label="Buka menu"
          >
            <Menu className="size-4" />
          </button>
          <DashboardBreadcrumb />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="hidden size-9 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] sm:inline-flex"
            aria-label="Cari"
          >
            <Search className="size-4" />
          </button>
          <button
            type="button"
            className="hidden size-9 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] sm:inline-flex"
            aria-label="Notifikasi"
          >
            <Bell className="size-4" />
          </button>
          <div className="hidden sm:block">
            <RoleBadge user={user} />
          </div>
          <Link
            href="/dashboard/profile"
            className="hidden items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-[#F8FAFC] md:flex"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#2563EB] text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="max-w-40">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-[#64748B]">
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
