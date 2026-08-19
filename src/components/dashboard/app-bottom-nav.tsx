"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  ClipboardList,
  FileText,
  Home,
  Monitor,
  PenLine,
  Settings,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoleName } from "@/types/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconFilled?: React.ComponentType<{ className?: string }>;
  /** Extra hrefs that count as "active" for this tab */
  aliases?: string[];
  exact?: boolean;
}

const navConfig: Record<RoleName, NavItem[]> = {
  student: [
    { label: "Beranda", href: "/dashboard/student", icon: Home, exact: true },
    { label: "Ujian", href: "/dashboard/student/active-exams", icon: FileText, aliases: ["/dashboard/student/schedules"] },
    { label: "Hasil", href: "/dashboard/student/history", icon: Award },
    { label: "Profil", href: "/dashboard/profile", icon: User },
  ],
  teacher: [
    { label: "Beranda", href: "/dashboard/teacher", icon: Home, exact: true },
    { label: "Bank Soal", href: "/dashboard/teacher/questions", icon: BookOpen },
    { label: "Jadwal", href: "/dashboard/teacher/schedules", icon: ClipboardList },
    { label: "Koreksi", href: "/dashboard/teacher/grading", icon: PenLine },
    { label: "Profil", href: "/dashboard/profile", icon: User },
  ],
  proctor: [
    { label: "Beranda", href: "/dashboard/proctor", icon: Home, exact: true },
    { label: "Monitor", href: "/dashboard/proctor/monitoring", icon: Monitor },
    { label: "Profil", href: "/dashboard/profile", icon: User },
  ],
  admin: [
    { label: "Beranda", href: "/dashboard/admin", icon: Home, exact: true },
    { label: "Data", href: "/dashboard/admin/users", icon: Users },
    { label: "Laporan", href: "/dashboard/admin/reports", icon: FileText },
    { label: "Profil", href: "/dashboard/profile", icon: User },
  ],
  principal: [
    { label: "Beranda", href: "/dashboard/principal", icon: Home, exact: true },
    { label: "Laporan", href: "/dashboard/principal/reports", icon: FileText },
    { label: "Profil", href: "/dashboard/profile", icon: User },
  ],
  super_admin: [
    { label: "Beranda", href: "/dashboard/super-admin", icon: Home, exact: true },
    { label: "Sekolah", href: "/dashboard/super-admin/schools", icon: Settings },
    { label: "Profil", href: "/dashboard/profile", icon: User },
  ],
};

interface AppBottomNavProps {
  role: RoleName;
}

export function AppBottomNav({ role }: AppBottomNavProps) {
  const pathname = usePathname();
  const items = navConfig[role] ?? navConfig.student;

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] safe-bottom lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch justify-around h-[56px]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) ||
              Boolean(item.aliases?.some((a) => pathname.startsWith(a)));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-[3px] relative ripple select-none",
                "min-w-0 px-1 transition-colors duration-150",
                isActive ? "text-[#2563EB]" : "text-[#64748B]",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active indicator bar at top */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] rounded-b-full bg-[#2563EB]" />
              )}

              {/* Icon container — 32px visual, 48px touch area handled by parent flex */}
              <span
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-2xl transition-colors duration-150",
                  isActive && "bg-[#DBEAFE]",
                )}
              >
                <Icon className="size-[22px]" />
              </span>

              {/* Label */}
              <span
                className={cn(
                  "text-[11px] leading-none font-medium truncate max-w-full",
                  isActive && "font-semibold",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
