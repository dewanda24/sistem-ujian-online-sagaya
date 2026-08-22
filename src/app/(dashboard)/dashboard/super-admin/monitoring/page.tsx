import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  getLiveSuperAdminMonitoringData,
  getSchoolOptionsForSuperAdmin,
} from "@/features/super-admin/advanced";
import { LiveMonitoringRefresher } from "@/features/super-admin/components/live-monitoring-refresher";
import {
  getSuperAdminDashboardData,
  getSuperAdminSchoolRows,
} from "@/features/super-admin/school-management";
import { requireRole } from "@/lib/auth/require-role";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status_filter?: string;
    school_id?: string;
    exam_q?: string;
  }>;
};

export default async function SuperAdminMonitoringPage({
  searchParams,
}: PageProps) {
  await requireRole("super_admin");
  const params = await searchParams;
  const [schools, dashboard, live, schoolOptions] = await Promise.all([
    getSuperAdminSchoolRows({
      q: params.q,
      status: params.status_filter,
    }),
    getSuperAdminDashboardData(),
    getLiveSuperAdminMonitoringData({
      q: params.exam_q,
      school_id: params.school_id,
    }),
    getSchoolOptionsForSuperAdmin(),
  ]);
  const activeSchools = schools.filter((school) => school.is_active).length;
  const inactiveSchools = schools.length - activeSchools;
  const teacherCount = schools.reduce(
    (total, school) => total + school.stats.teacherCount,
    0,
  );
  const studentCount = schools.reduce(
    (total, school) => total + school.stats.studentCount,
    0,
  );
  const examCount = schools.reduce(
    (total, school) => total + school.stats.examCount,
    0,
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Pemantauan Sistem & Ujian Live"
        description="Pantau lalu lintas ujian CBT real-time lintas sekolah, peserta online, gangguan sesi, dan status sekolah."
      />

      {/* Auto-Refresh Controller */}
      <LiveMonitoringRefresher />

      <section className="grid gap-4 md:grid-cols-5">
        <DashboardCard
          title="Sekolah Aktif"
          value={String(activeSchools)}
          description="Dapat menyelenggarakan ujian."
        />
        <DashboardCard
          title="Sekolah Nonaktif"
          value={String(inactiveSchools)}
          description="Layanan ditangguhkan."
        />
        <DashboardCard
          title="Total Guru"
          value={String(teacherCount)}
          description="Guru lintas sekolah."
        />
        <DashboardCard
          title="Total Siswa"
          value={String(studentCount)}
          description="Siswa lintas sekolah."
        />
        <DashboardCard
          title="Total Jadwal"
          value={String(examCount)}
          description="Jadwal ujian terdaftar."
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Pemantauan Ujian Langsung (Live CBT Stream)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Data sesi pengerjaan ujian real-time di seluruh sekolah.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <DashboardCard
            title="Ujian Berjalan"
            value={String(live.summary.runningExams)}
            description="Jadwal aktif saat ini."
          />
          <DashboardCard
            title="Peserta Online"
            value={String(live.summary.onlineParticipants)}
            description="Aktif 5 menit terakhir."
          />
          <DashboardCard
            title="Peserta Terkunci"
            value={String(live.summary.problematicParticipants)}
            description="Melanggar layar / expired."
          />
          <DashboardCard
            title="Gagal Mengumpulkan"
            value={String(live.summary.failedSubmits)}
            description="Waktu habis atau dibatalkan."
          />
          <DashboardCard
            title="Kejadian Error"
            value={String(live.summary.systemErrors)}
            description="Event kendala teknis."
          />
        </div>

        {/* Live Filter Form */}
        <form className="grid gap-3 rounded-lg border bg-card p-3.5 sm:grid-cols-3">
          <input
            name="exam_q"
            defaultValue={params.exam_q ?? ""}
            placeholder="Cari judul ujian..."
            className="rounded-md border border-input bg-background px-3 py-1.5 text-xs"
          />
          <select
            name="school_id"
            defaultValue={params.school_id ?? ""}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-xs"
          >
            <option value="">Semua Sekolah</option>
            {schoolOptions.map((school) => (
              <option key={school.value} value={school.value}>
                {school.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              Filter Ujian
            </button>
            <Link
              href="/dashboard/super-admin/monitoring"
              className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Reset
            </Link>
          </div>
        </form>

        <DataTable
          columns={[
            "Sekolah",
            "Ujian",
            "Status",
            "Peserta Terdaftar",
            "Online (5m)",
            "Terkunci/Bermasalah",
            "Gagal Submit",
            "Error",
          ]}
          isEmpty={live.rows.length === 0}
          empty={
            <EmptyState
              title={
                live.unavailable
                  ? "Pemantauan langsung belum tersedia"
                  : "Tidak ada ujian berjalan"
              }
              description={
                live.unavailable
                  ? "Data jadwal, pengerjaan, atau kejadian belum dapat dibaca."
                  : "Ujian aktif lintas sekolah akan muncul secara otomatis di sini."
              }
            />
          }
        >
          {live.rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3 font-medium text-foreground">{row.schoolName}</td>
              <td className="px-4 py-3">
                <div className="font-medium">{row.title}</div>
                <div className="text-xs text-muted-foreground">
                  {row.start_at
                    ? new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(row.start_at))
                    : "-"}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.status === "active" || row.status === "in_progress"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {row.status === "active" ? "Aktif" : row.status}
                </span>
              </td>
              <td className="px-4 py-3 font-semibold">{row.participantCount}</td>
              <td className="px-4 py-3">
                <span className="font-semibold text-emerald-600">{row.onlineParticipants}</span>
              </td>
              <td className="px-4 py-3">
                <span className={row.problematicParticipants > 0 ? "font-semibold text-red-600" : "text-muted-foreground"}>
                  {row.problematicParticipants}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={row.failedSubmits > 0 ? "font-semibold text-amber-600" : "text-muted-foreground"}>
                  {row.failedSubmits}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={row.systemErrors > 0 ? "font-semibold text-red-600" : "text-muted-foreground"}>
                  {row.systemErrors}
                </span>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari sekolah, NPSN, kota, provinsi"
          className="rounded-md border px-3 py-2 text-sm md:col-span-2"
        />
        <select
          name="status_filter"
          defaultValue={params.status_filter ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
        </select>
        <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Filter
        </button>
      </form>

      <DataTable
        columns={[
          "Sekolah",
          "Status",
          "Admin",
          "Guru",
          "Siswa",
          "Ujian",
          "Aktif",
          "Selesai",
          "Aksi",
        ]}
        isEmpty={schools.length === 0}
        empty={
          <EmptyState
            title="Belum ada sekolah"
            description="Pemantauan sekolah akan muncul setelah sekolah dibuat."
          />
        }
      >
        {schools.map((school) => (
          <tr key={school.id}>
            <td className="px-4 py-3">
              <div className="font-medium">{school.name}</div>
              <div className="text-xs text-muted-foreground">
                {[school.city, school.province].filter(Boolean).join(", ") || "-"}
              </div>
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={Boolean(school.is_active)} />
            </td>
            <td className="px-4 py-3">{school.stats.adminCount}</td>
            <td className="px-4 py-3">{school.stats.teacherCount}</td>
            <td className="px-4 py-3">{school.stats.studentCount}</td>
            <td className="px-4 py-3">{school.stats.examCount}</td>
            <td className="px-4 py-3">{school.stats.activeExamCount}</td>
            <td className="px-4 py-3">{school.stats.finishedExamCount}</td>
            <td className="px-4 py-3">
              <Link
                href={`/dashboard/super-admin/schools/${school.id}`}
                className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
              >
                Detail
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>

      <DashboardCard
        title="Aktivitas Sistem"
        description="Aktivitas terbaru dari sekolah, ujian, dan audit log."
      >
        <div className="space-y-3">
          {dashboard.recentActivities.length > 0 ? (
            dashboard.recentActivities.map((activity, index) => (
              <div key={`${activity.label}-${index}`} className="rounded-md border p-3 text-sm">
                <div className="font-medium">{activity.label}</div>
                <div className="text-muted-foreground">{activity.description}</div>
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
              description="Aktivitas sistem akan muncul setelah data platform bergerak."
            />
          )}
        </div>
      </DashboardCard>
    </div>
  );
}
