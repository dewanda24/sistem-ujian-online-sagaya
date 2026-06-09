import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getSuperAdminDashboardData } from "@/features/super-admin/school-management";
import { requireRole } from "@/lib/auth/require-role";

export default async function SuperAdminDashboardPage() {
  await requireRole("super_admin");
  const { summary, topSchools, recentActivities } =
    await getSuperAdminDashboardData();

  const stats = [
    {
      title: "Total Sekolah",
      value: summary.totalSchools,
      description: "Tenant terdaftar.",
      href: "/dashboard/super-admin/schools",
    },
    {
      title: "Sekolah Aktif",
      value: summary.activeSchools,
      description: "Tenant aktif.",
      href: "/dashboard/super-admin/schools?status_filter=active",
    },
    {
      title: "Sekolah Nonaktif",
      value: summary.inactiveSchools,
      description: "Tenant nonaktif.",
      href: "/dashboard/super-admin/schools?status_filter=inactive",
    },
    {
      title: "Total Guru",
      value: summary.totalTeachers,
      description: "Akun guru lintas sekolah.",
      href: "/dashboard/admin/users",
    },
    {
      title: "Total Siswa",
      value: summary.totalStudents,
      description: "Akun siswa lintas sekolah.",
      href: "/dashboard/admin/users",
    },
    {
      title: "Ujian Aktif",
      value: summary.totalActiveExams,
      description: "Jadwal aktif lintas sekolah.",
      href: "/dashboard/super-admin/monitoring",
    },
    {
      title: "Ujian Selesai",
      value: summary.totalFinishedExams,
      description: "Jadwal selesai lintas sekolah.",
      href: "/dashboard/super-admin/monitoring",
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Dashboard Platform"
        description="Ringkasan global Sagaya untuk pengelolaan tenant sekolah, monitoring ujian, dan aktivitas sistem."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <DashboardCard
              title={stat.title}
              value={String(stat.value)}
              description={stat.description}
              className="h-full transition hover:border-primary/40 hover:shadow-md"
            />
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Sekolah Paling Aktif</h2>
          <div className="mt-4 space-y-3">
            {topSchools.length > 0 ? (
              topSchools.map((school) => (
                <Link
                  key={school.id}
                  href={`/dashboard/super-admin/schools/${school.id}`}
                  className="grid gap-2 rounded-md border p-3 text-sm hover:bg-muted md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="font-medium">{school.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {school.activeExamCount} aktif,{" "}
                      {school.finishedExamCount} selesai
                    </div>
                  </div>
                  <div className="font-semibold">{school.examCount} ujian</div>
                </Link>
              ))
            ) : (
              <EmptyState
                title="Belum ada aktivitas ujian"
                description="Aktivitas sekolah akan muncul setelah jadwal ujian dibuat."
              />
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Aktivitas Terbaru</h2>
          <div className="mt-4 space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={`${activity.label}-${index}`} className="rounded-md border p-3 text-sm">
                  <div className="font-medium">{activity.label}</div>
                  <div className="text-muted-foreground">
                    {activity.description}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {activity.created_at
                      ? new Intl.DateTimeFormat("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(activity.created_at))
                      : "-"}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Belum ada aktivitas"
                description="Audit dan data baru akan tampil di sini."
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
