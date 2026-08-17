"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, FileText, Home, User } from "lucide-react";

export function StudentBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Beranda",
      href: "/dashboard/student",
      icon: Home,
      exact: true,
    },
    {
      label: "Ujian Saya",
      href: "/dashboard/student/active-exams",
      icon: FileText,
      aliases: ["/dashboard/student/schedules"],
    },
    {
      label: "Hasil",
      href: "/dashboard/student/history",
      icon: Award,
    },
    {
      label: "Profil",
      href: "/dashboard/profile",
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Siswa"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) ||
              Boolean(item.aliases?.some((alias) => pathname.startsWith(alias)));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex min-w-16 flex-col items-center justify-center rounded-2xl py-1.5 px-3 transition-all duration-150 active:scale-90 ${
                isActive ? "text-blue-600 font-extrabold" : "text-slate-500 font-medium hover:text-slate-900"
              }`}
            >
              <div
                className={`relative flex size-8 items-center justify-center rounded-xl transition-all ${
                  isActive ? "bg-blue-50 text-blue-600" : "text-slate-500 group-hover:bg-slate-50"
                }`}
              >
                <Icon className="size-5" />
                {isActive && (
                  <span className="absolute -bottom-1 size-1 rounded-full bg-blue-600" />
                )}
              </div>
              <span className="mt-1 text-[11px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
