import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { requirePermission } from "@/lib/auth/require-permission";

const modules = [
  {
    title: "Tahun Ajaran",
    href: "/dashboard/master-data/academic-years",
    description: "Kelola tahun ajaran dan semester aktif.",
  },
  {
    title: "Siswa",
    href: "/dashboard/master-data/students",
    description: "Data siswa dan kelas aktif.",
  },
  {
    title: "Guru",
    href: "/dashboard/master-data/teachers",
    description: "Data guru, mapel, dan pengawas ujian.",
  },
  {
    title: "Kelas",
    href: "/dashboard/master-data/classes",
    description: "Kelas per tahun ajaran, wali kelas, dan jumlah anggota.",
  },
  {
    title: "Mata Pelajaran",
    href: "/dashboard/master-data/subjects",
    description: "Kode dan nama mata pelajaran untuk CBT.",
  },
] satisfies Array<{
  title: string;
  href: string;
  description: string;
}>;

export default async function MasterDataPage() {
  await requirePermission("master_data.view");

  return (
    <div>
      <DashboardPageHeader
        title="Master Data"
        description="Fondasi data akademik untuk CBT sekolah: tahun ajaran, siswa, guru, kelas, dan mapel."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
