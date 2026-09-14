import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { StatusBadge } from "@/components/master-data/status-badge";
import { getSuperAdminGlobalReportData } from "@/features/super-admin/school-management";
import { requireRole } from "@/lib/auth/require-role";

export default async function SuperAdminReportsPage() {
  await requireRole("super_admin");
  const { summary, schools } = await getSuperAdminGlobalReportData();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Laporan Global"
        description="Statistik sistem, laporan per sekolah, dan akses unduh data global."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Sekolah"
          value={String(summary.totalSchools)}
          description={`${summary.activeSchools} aktif, ${summary.inactiveSchools} nonaktif.`}
        />
        <DashboardCard
          title="Pengguna Operasional"
          value={String(summary.totalAdmins + summary.totalTeachers + summary.totalStudents)}
          description="Admin sekolah, guru, dan siswa."
        />
        <DashboardCard
          title="Ujian"
          value={String(summary.totalExams)}
          description={`${summary.totalActiveExams} aktif, ${summary.totalFinishedExams} selesai.`}
        />
        <DashboardCard
          title="Unduh Data"
          value="CSV"
          description="Unduh data tersedia untuk laporan dan data utama."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Unduh Data Sekolah"
          description="Unduh ringkasan sekolah dari pusat unduh data global."
        >
          <Link
            href="/api/super-admin/export/schools?format=xlsx"
            className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Unduh Excel
          </Link>
        </DashboardCard>
        <DashboardCard
          title="Unduh Data Pengguna"
          description="Gunakan Pengguna Global untuk filter sekolah, peran, dan status."
        >
          <Link
            href="/api/super-admin/export/users?format=xlsx"
            className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Unduh Excel
          </Link>
        </DashboardCard>
        <DashboardCard
          title="Unduh Laporan"
          description="Laporan operasional tetap tersedia untuk diunduh."
        >
          <Link
            href="/api/super-admin/export/reports?format=xlsx"
            className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Unduh Excel
          </Link>
        </DashboardCard>
      </section>

      {/* Bagian Analitik Komparatif & Performa Antar Sekolah */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Analitik Komparatif Antar Sekolah</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Komparasi efisiensi operasional, kapasitas peserta, dan tingkat penyelesaian ujian antar sekolah terdaftar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sekolah Teraktif
            </p>
            <p className="mt-2 text-xl font-bold truncate">
              {[...schools].sort((a, b) => b.stats.examCount - a.stats.examCount)[0]?.name ?? "-"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {[...schools].sort((a, b) => b.stats.examCount - a.stats.examCount)[0]?.stats.examCount ?? 0} total jadwal ujian terdaftar.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Siswa Terbanyak
            </p>
            <p className="mt-2 text-xl font-bold truncate">
              {[...schools].sort((a, b) => b.stats.studentCount - a.stats.studentCount)[0]?.name ?? "-"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {[...schools].sort((a, b) => b.stats.studentCount - a.stats.studentCount)[0]?.stats.studentCount ?? 0} siswa terdaftar di platform.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Kesiapan CBT Platform
            </p>
            <p className="mt-2 text-xl font-bold text-emerald-600">
              {schools.filter((s) => s.readiness.status === "ready").length} / {schools.length} Sekolah
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Memiliki setup lengkap (admin, guru, siswa, kelas, mapel, jadwal).
            </p>
          </div>
        </div>

        <DataTable
          columns={[
            "Sekolah & Jenjang",
            "Kesiapan CBT",
            "Admin",
            "Guru",
            "Siswa",
            "Rasio Siswa/Guru",
            "Ujian (Aktif/Selesai)",
            "Penyelesaian (%)",
            "Aksi",
          ]}
          isEmpty={schools.length === 0}
          stickyActionColumn={false}
          empty={
            <EmptyState
              title="Belum ada laporan sekolah"
              description="Laporan komparatif akan muncul setelah sekolah ditambahkan."
            />
          }
        >
          {schools.map((school) => {
            const completionRate =
              school.stats.examCount > 0
                ? Math.round((school.stats.finishedExamCount / school.stats.examCount) * 100)
                : 0;
            const studentTeacherRatio =
              school.stats.teacherCount > 0
                ? `${(school.stats.studentCount / school.stats.teacherCount).toFixed(1)} : 1`
                : "-";

            return (
              <tr key={school.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{school.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {school.education_level || "Umum"} {school.npsn ? `• NPSN: ${school.npsn}` : ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      school.readiness.status === "ready"
                        ? "bg-emerald-100 text-emerald-800"
                        : school.readiness.status === "attention"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {school.readiness.status === "ready"
                      ? "Siap CBT"
                      : school.readiness.status === "attention"
                        ? "Perlu Cek"
                        : "Belum Siap"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{school.stats.adminCount}</td>
                <td className="px-4 py-3 text-center">{school.stats.teacherCount}</td>
                <td className="px-4 py-3 text-center font-medium">{school.stats.studentCount}</td>
                <td className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                  {studentTeacherRatio}
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-foreground">{school.stats.examCount}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({school.stats.activeExamCount} aktif / {school.stats.finishedExamCount} selesai)
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, completionRate)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold">{completionRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/super-admin/schools/${school.id}`}
                    className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    Detail
                  </Link>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </section>
    </div>
  );
}
