import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { requirePermission } from "@/lib/auth/require-permission";

const modules = [
  {
    title: "Sekolah",
    href: "/dashboard/master-data/schools",
    description: "Single-school saat ini, multi-school ready lewat school_id.",
  },
  {
    title: "Tahun Ajaran",
    href: "/dashboard/master-data/academic-years",
    description: "Kelola tahun ajaran aktif per sekolah.",
  },
  {
    title: "Semester",
    href: "/dashboard/master-data/semesters",
    description: "Kelola semester aktif dalam tahun ajaran.",
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
  {
    title: "Guru",
    href: "/dashboard/master-data/teachers",
    description: "Data guru dan assignment mapel-kelas.",
  },
  {
    title: "Admin Sekolah",
    href: "/dashboard/master-data/admins",
    description: "Akun admin operasional sekolah.",
  },
  {
    title: "Proctor / Pengawas",
    href: "/dashboard/master-data/proctors",
    description: "Akun pengawas untuk monitoring pelaksanaan ujian.",
  },
  {
    title: "Siswa",
    href: "/dashboard/master-data/students",
    description: "Data siswa dan riwayat class_members.",
  },
];

export default async function MasterDataPage() {
  await requirePermission("master_data.view");

  return (
    <div>
      <DashboardPageHeader
        title="Master Data"
        description="Fondasi data akademik untuk CBT sekolah: sekolah, periode akademik, kelas, mata pelajaran, guru, dan siswa."
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
