import Link from "next/link";
import { Activity, FileText } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { requirePermission } from "@/lib/auth/require-permission";

const modules = [
  {
    title: "Hasil Ujian",
    description: "Pantau submit, nilai, status grading, dan detail jawaban siswa.",
    href: "/dashboard/reports/students",
    icon: FileText,
  },
  {
    title: "Rekap Nilai",
    description: "Lihat rekap nilai siswa per tahun ajaran, kelas, mapel, dan jadwal.",
    href: "/dashboard/reports/classes",
    icon: Activity,
  },
  {
    title: "Kartu Login Siswa",
    description: "Unduh kartu login siswa per kelas atau semua kelas.",
    href: "/dashboard/reports/login-cards",
    icon: FileText,
  },
];

export default async function ReportsPage() {
  const user = await requirePermission("reports.view");
  const visibleModules =
    user.roles?.name === "teacher"
      ? modules.filter((module) => module.href !== "/dashboard/reports/login-cards")
      : modules;

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Nilai"
        description="Akses ringkas untuk hasil ujian dan rekap nilai siswa."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {visibleModules.map((module) => {
          const Icon = module.icon;

          return (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm hover:border-[#2563EB]/40 hover:bg-[#F8FAFC]"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="line-clamp-1 font-semibold text-[#0F172A]">
                    {module.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-[#64748B]">
                    {module.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
