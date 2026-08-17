"use client";

import Link from "next/link";
import { Bell, CalendarDays, FileCheck2, GraduationCap } from "lucide-react";

interface StudentQuickActionsProps {
  activeCount?: number;
  upcomingCount?: number;
  historyCount?: number;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
}

export function StudentQuickActions({
  activeCount = 0,
  upcomingCount = 0,
  historyCount = 0,
  unreadNotificationCount = 0,
  onOpenNotifications,
}: StudentQuickActionsProps) {
  const actions = [
    {
      label: "Ujian Saya",
      href: "/dashboard/student/active-exams",
      icon: GraduationCap,
      badge: activeCount > 0 ? activeCount : null,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50/80 hover:bg-blue-100/80 border-blue-200/60",
    },
    {
      label: "Jadwal",
      href: "/dashboard/student/schedules",
      icon: CalendarDays,
      badge: upcomingCount > 0 ? upcomingCount : null,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50/80 hover:bg-indigo-100/80 border-indigo-200/60",
    },
    {
      label: "Riwayat",
      href: "/dashboard/student/history",
      icon: FileCheck2,
      badge: historyCount > 0 ? historyCount : null,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50/80 hover:bg-emerald-100/80 border-emerald-200/60",
    },
    {
      label: "Pengumuman",
      href: "#pengumuman",
      onClick: (e: React.MouseEvent) => {
        if (onOpenNotifications) {
          e.preventDefault();
          onOpenNotifications();
        }
      },
      icon: Bell,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : null,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50/80 hover:bg-amber-100/80 border-amber-200/60",
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
          Quick Actions
        </h3>
      </div>

      <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
        {actions.map((item) => {
          const Icon = item.icon;
          const content = (
            <div className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 text-center shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95">
              <div
                className={`relative flex size-11 sm:size-12 items-center justify-center rounded-2xl border transition-transform group-hover:scale-105 ${item.bgColor} ${item.iconColor}`}
              >
                <Icon className="size-5 sm:size-6" />
                {item.badge !== null && (
                  <span className="absolute -top-1.5 -right-1.5 flex size-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="mt-2 text-[11px] sm:text-xs font-bold text-slate-700 group-hover:text-slate-950 truncate max-w-full">
                {item.label}
              </span>
            </div>
          );

          if (item.onClick) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="w-full text-left"
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={item.label} href={item.href} className="w-full">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
