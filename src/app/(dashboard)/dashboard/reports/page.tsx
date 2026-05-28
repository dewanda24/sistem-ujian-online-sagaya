import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { requirePermission } from "@/lib/auth/require-permission";

const modules = [
  {
    title: "Per Ujian",
    href: "/dashboard/reports/exams",
    description: "Rata-rata nilai, completion, submitted, dan expired per ujian.",
  },
  {
    title: "Per Kelas",
    href: "/dashboard/reports/classes",
    description: "Ringkasan performa peserta berdasarkan kelas.",
  },
  {
    title: "Per Mapel",
    href: "/dashboard/reports/subjects",
    description: "Agregasi hasil ujian berdasarkan mata pelajaran.",
  },
  {
    title: "Per Siswa",
    href: "/dashboard/reports/students",
    description: "Daftar nilai individual peserta dan status grading.",
  },
];

export default async function ReportsPage() {
  await requirePermission("reports.view");

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Reports"
        description="Fondasi laporan CBT untuk kepala sekolah, admin, dan guru."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => (
          <Link key={module.href} href={module.href}>
            <DashboardCard
              title={module.title}
              description={module.description}
              className="h-full transition hover:border-primary/40 hover:shadow-md"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
