"use client";

import Link from "next/link";
import { AlertTriangle, Building2, LogOut, ExternalLink } from "lucide-react";
import { exitSchoolImpersonationAction } from "@/features/super-admin/impersonation-actions";

type TenantImpersonationBannerProps = {
  school: {
    id: string;
    name: string;
    education_level?: string | null;
  };
};

export function TenantImpersonationBanner({
  school,
}: TenantImpersonationBannerProps) {
  return (
    <aside
      aria-label="Mode Peninjauan Sekolah"
      className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-500/10 px-4 py-2 text-xs text-amber-950 backdrop-blur-md dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200 lg:px-8"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase shadow-sm animate-pulse">
          <AlertTriangle className="size-3.5" />
          Mode Peninjauan
        </span>
        <div className="flex items-center gap-1.5 font-medium">
          <Building2 className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Anda sedang mengelola data sebagai admin:</span>
          <strong className="font-semibold underline decoration-amber-400 underline-offset-2">
            {school.name}
          </strong>
          {school.education_level && (
            <span className="rounded bg-amber-200/70 px-1.5 py-0.2 text-[10px] text-amber-900 font-semibold dark:bg-amber-800/60 dark:text-amber-100">
              {school.education_level.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 font-medium">
        <Link
          href={`/dashboard/super-admin/schools/${school.id}`}
          className="inline-flex items-center gap-1 rounded border border-amber-300 bg-white/70 px-2.5 py-1 text-[11px] text-amber-900 transition hover:bg-white dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/80"
        >
          <ExternalLink className="size-3" />
          Profil Sekolah
        </Link>
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-1 rounded border border-amber-300 bg-white/70 px-2.5 py-1 text-[11px] text-amber-900 transition hover:bg-white dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/80"
        >
          Beranda Admin
        </Link>
        <form action={exitSchoolImpersonationAction} className="inline">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded bg-amber-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-95"
          >
            <LogOut className="size-3.5" />
            Keluar Peninjauan
          </button>
        </form>
      </div>
    </aside>
  );
}
