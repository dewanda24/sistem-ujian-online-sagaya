import Link from "next/link";
import { Activity, Download, FileText } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { getReportSummary } from "@/features/reports/queries";
import { requirePermission } from "@/lib/auth/require-permission";

const modules = [
  {
    title: "Hasil Ujian",
    description: "Lihat nilai siswa dan rekap hasil ujian.",
    href: "/dashboard/reports/students",
    icon: FileText,
  },
  {
    title: "Analitik",
    description: "Pantau distribusi nilai, tingkat kelulusan, dan analisis soal.",
    href: "/dashboard/reports/classes",
    icon: Activity,
  },
  {
    title: "Ekspor Laporan",
    description: "Unduh laporan hasil ujian sesuai kebutuhan sekolah.",
    href: "/dashboard/reports",
    icon: Download,
  },
];

export default async function ReportsPage() {
  const user = await requirePermission("reports.view");
  const summary = await getReportSummary();
  const visibleModules =
    user.roles?.name === "teacher"
      ? modules.filter((module) => module.title !== "Ekspor Laporan")
      : modules;
  const stats = [
    {
      title: "Ujian Selesai",
      value: summary.submitted,
      description: "Pengerjaan ujian yang sudah dikumpulkan.",
    },
    {
      title: "Rata-rata Nilai",
      value: `${summary.averagePercent.toFixed(2)}%`,
      description: "Rata-rata dari nilai yang sudah final.",
    },
    {
      title: "Peserta Lulus",
      value: summary.passed,
      description: "Peserta dengan nilai final minimal 75%.",
    },
    {
      title: "Peserta Belum Lulus",
      value: summary.notPassed,
      description: "Peserta dengan nilai final di bawah 75%.",
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Hasil & Laporan"
        description="Analisis hasil ujian dan unduh laporan sekolah."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <DashboardCard
            key={stat.title}
            title={stat.title}
            value={String(stat.value)}
            description={stat.description}
          />
        ))}
      </div>
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
