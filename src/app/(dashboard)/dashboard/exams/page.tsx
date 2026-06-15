import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { requirePermission } from "@/lib/auth/require-permission";
import { getExamPackages, getExamSchedules } from "@/features/exams/queries";

const modules = [
  {
    title: "Paket Ujian",
    href: "/dashboard/exams/packages",
    description: "Susun paket soal dan aturan pengerjaan ujian.",
  },
  {
    title: "Jadwal Ujian",
    href: "/dashboard/exams/schedules",
    description: "Atur waktu, peserta, durasi, dan status publikasi ujian.",
  },
];

const quickActions = [
  {
    label: "Buat Paket Ujian",
    href: "/dashboard/exams/packages/create",
  },
  {
    label: "Buat Jadwal Ujian",
    href: "/dashboard/exams/schedules/create",
  },
  {
    label: "Cek Kesiapan Ujian",
    href: "/dashboard/exams/schedules",
  },
];

export default async function ExamsPage() {
  await requirePermission("exams.view");
  const [packages, schedules] = await Promise.all([
    getExamPackages({}),
    getExamSchedules({}),
  ]);
  const now = new Date();
  const stats = [
    {
      title: "Paket Ujian",
      value: packages.length,
      description: "Paket yang tersedia untuk penjadwalan.",
    },
    {
      title: "Jadwal Draft",
      value: schedules.filter((schedule) => schedule.status === "draft").length,
      description: "Jadwal yang masih disiapkan.",
    },
    {
      title: "Jadwal Terbit",
      value: schedules.filter((schedule) => schedule.status === "scheduled").length,
      description: "Jadwal yang sudah diterbitkan.",
    },
    {
      title: "Jadwal Mendatang",
      value: schedules.filter((schedule) => {
        const startAt = schedule.start_at ? new Date(schedule.start_at) : null;

        return schedule.status === "scheduled" && Boolean(startAt && startAt >= now);
      }).length,
      description: "Jadwal yang akan dimulai.",
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Kelola Ujian"
        description="Siapkan paket, jadwal, dan peserta ujian sekolah."
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
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-[#0F172A]">Aksi Cepat</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm font-semibold text-[#0F172A] hover:border-[#2563EB] hover:bg-[#F8FAFC]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
