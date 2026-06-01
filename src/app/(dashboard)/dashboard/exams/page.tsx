import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { requirePermission } from "@/lib/auth/require-permission";

const modules = [
  {
    title: "Paket Ujian",
    href: "/dashboard/exams/packages",
    description:
      "Susun paket ujian dari soal published sesuai mapel dan scope guru.",
  },
  {
    title: "Jadwal Ujian",
    href: "/dashboard/exams/schedules",
    description:
      "Atur jadwal ujian, tahun ajaran, semester, dan target kelas peserta.",
  },
  {
    title: "Kartu Ujian",
    href: "/dashboard/exams/cards",
    description:
      "Preview, filter, dan cetak kartu ujian peserta dari dashboard khusus.",
  },
];

export default async function ExamsPage() {
  await requirePermission("exams.view");

  return (
    <div>
      <DashboardPageHeader
        title="Exams"
        description="Fondasi paket dan jadwal ujian. Token, ruang ujian, autosave, scoring, dan monitoring masuk sprint berikutnya."
      />
      <div className="grid gap-4 md:grid-cols-3">
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
