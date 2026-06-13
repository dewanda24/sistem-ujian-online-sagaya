import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { StatusBadge } from "@/components/master-data/status-badge";
import { getLiveSuperAdminMonitoringData } from "@/features/super-admin/advanced";
import {
  getSuperAdminDashboardData,
  getSuperAdminSchoolRows,
} from "@/features/super-admin/school-management";
import { requireRole } from "@/lib/auth/require-role";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status_filter?: string;
  }>;
};

export default async function SuperAdminMonitoringPage({
  searchParams,
}: PageProps) {
  await requireRole("super_admin");
  const params = await searchParams;
  const [schools, dashboard, live] = await Promise.all([
    getSuperAdminSchoolRows({
      q: params.q,
      status: params.status_filter,
    }),
    getSuperAdminDashboardData(),
    getLiveSuperAdminMonitoringData(),
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
        title="Pemantauan Sekolah"
        description="Pantau status sekolah, jumlah pengguna, aktivitas ujian, dan aktivitas sistem."
      />

      <section className="grid gap-4 md:grid-cols-5">
        <DashboardCard
          title="Sekolah Aktif"
          value={String(activeSchools)}
          description="Sekolah yang dapat menggunakan layanan."
        />
        <DashboardCard
          title="Sekolah Nonaktif"
          value={String(inactiveSchools)}
          description="Sekolah yang sedang ditangguhkan."
        />
        <DashboardCard
          title="Guru"
          value={String(teacherCount)}
          description="Guru lintas sekolah."
        />
        <DashboardCard
          title="Siswa"
          value={String(studentCount)}
          description="Siswa lintas sekolah."
        />
        <DashboardCard
          title="Ujian"
          value={String(examCount)}
          description="Jadwal ujian lintas sekolah."
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Pemantauan Ujian Langsung</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tampilan baca saja untuk bantuan lintas sekolah. Kontrol peserta tetap dilakukan oleh petugas operasional.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          <DashboardCard
            title="Ujian Berjalan"
            value={String(live.summary.runningExams)}
            description="Jadwal yang sedang aktif."
          />
          <DashboardCard
            title="Peserta Online"
            value={String(live.summary.onlineParticipants)}
            description="Terhubung dalam 5 menit terakhir."
          />
          <DashboardCard
            title="Peserta Bermasalah"
            value={String(live.summary.problematicParticipants)}
            description="Waktu habis atau dikunci."
          />
          <DashboardCard
            title="Gagal Mengumpulkan"
            value={String(live.summary.failedSubmits)}
            description="Pengerjaan waktu habis atau dibatalkan."
          />
          <DashboardCard
            title="Error Sistem"
            value={String(live.summary.systemErrors)}
            description="Kejadian bermasalah."
          />
        </div>
        <DataTable
          columns={[
            "Sekolah",
            "Ujian",
            "Status",
            "Peserta",
            "Online",
            "Bermasalah",
            "Gagal Mengumpulkan",
            "Error",
            "Kejadian",
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
                  : "Ujian aktif lintas sekolah akan muncul di sini."
              }
            />
          }
        >
          {live.rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">{row.schoolName}</td>
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
              <td className="px-4 py-3">{row.status}</td>
              <td className="px-4 py-3">{row.participantCount}</td>
              <td className="px-4 py-3">{row.onlineParticipants}</td>
              <td className="px-4 py-3">{row.problematicParticipants}</td>
              <td className="px-4 py-3">{row.failedSubmits}</td>
              <td className="px-4 py-3">{row.systemErrors}</td>
              <td className="px-4 py-3">{row.eventCount}</td>
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
