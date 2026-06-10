import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { getSuperAdminDashboardData } from "@/features/super-admin/school-management";
import { requireRole } from "@/lib/auth/require-role";

export default async function SuperAdminDashboardPage() {
  await requireRole("super_admin");
  const { summary, topSchools, recentActivities } =
    await getSuperAdminDashboardData();

  const stats = [
    {
      title: "Sekolah",
      value: summary.totalSchools,
      description: "Tenant terdaftar.",
      href: "/dashboard/super-admin/schools",
    },
    {
      title: "Admin Sekolah",
      value: summary.totalAdmins,
      description: "Operator tenant.",
      href: "/dashboard/super-admin/admins",
    },
    {
      title: "Guru",
      value: summary.totalTeachers,
      description: "Akun guru lintas sekolah.",
      href: "/dashboard/super-admin/users",
    },
    {
      title: "Siswa",
      value: summary.totalStudents,
      description: "Akun siswa lintas sekolah.",
      href: "/dashboard/super-admin/users",
    },
    {
      title: "Ujian",
      value: summary.totalExams,
      description: `${summary.totalActiveExams} aktif, ${summary.totalFinishedExams} selesai.`,
      href: "/dashboard/super-admin/monitoring",
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Dashboard Pusat"
        description="Ringkasan global Sagaya untuk pengelolaan tenant sekolah, monitoring ujian, dan aktivitas sistem."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
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

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Status Sistem</h2>
            <p className="text-sm text-muted-foreground">
              Pemeriksaan cepat kesiapan data pusat platform.
            </p>
          </div>
          <StatusPill
            value={
              Object.values(summary.systemStatus).every(Boolean)
                ? "ready"
                : "pending"
            }
          />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SystemStatusItem
            label="Tenant Sekolah"
            ready={summary.systemStatus.schoolsReady}
          />
          <SystemStatusItem
            label="Admin Sekolah"
            ready={summary.systemStatus.adminsReady}
          />
          <SystemStatusItem
            label="Data Ujian"
            ready={summary.systemStatus.examsReady}
          />
          <SystemStatusItem
            label="Audit Log"
            ready={summary.systemStatus.auditReady}
          />
        </div>
      </section>
    </div>
  );
}

function SystemStatusItem({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
      <span className="truncate text-muted-foreground">{label}</span>
      <StatusPill value={ready ? "ready" : "pending"} />
    </div>
  );
}
