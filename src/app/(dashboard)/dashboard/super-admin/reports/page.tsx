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
        description="Statistik sistem, laporan per sekolah, dan akses export data global."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Sekolah"
          value={String(summary.totalSchools)}
          description={`${summary.activeSchools} aktif, ${summary.inactiveSchools} nonaktif.`}
        />
        <DashboardCard
          title="User Operasional"
          value={String(summary.totalAdmins + summary.totalTeachers + summary.totalStudents)}
          description="Admin sekolah, guru, dan siswa."
        />
        <DashboardCard
          title="Ujian"
          value={String(summary.totalExams)}
          description={`${summary.totalActiveExams} aktif, ${summary.totalFinishedExams} selesai.`}
        />
        <DashboardCard
          title="Export"
          value="CSV"
          description="Export tersedia melalui endpoint laporan dan data."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Export Sekolah"
          description="Unduh ringkasan sekolah dari pusat export global."
        >
          <Link
            href="/api/super-admin/export/schools?format=xlsx"
            className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Unduh Excel
          </Link>
        </DashboardCard>
        <DashboardCard
          title="Export User"
          description="Gunakan User Global untuk filter sekolah, role, dan status."
        >
          <Link
            href="/api/super-admin/export/users?format=xlsx"
            className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Unduh Excel
          </Link>
        </DashboardCard>
        <DashboardCard
          title="Export Laporan"
          description="Endpoint laporan operasional tetap tersedia."
        >
          <Link
            href="/api/super-admin/export/reports?format=xlsx"
            className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Unduh Excel
          </Link>
        </DashboardCard>
      </section>

      <DataTable
        columns={[
          "Sekolah",
          "Status",
          "Admin",
          "Guru",
          "Siswa",
          "Ujian",
          "Ujian Aktif",
          "Ujian Selesai",
        ]}
        isEmpty={schools.length === 0}
        empty={
          <EmptyState
            title="Belum ada laporan sekolah"
            description="Laporan per sekolah akan muncul setelah tenant dibuat."
          />
        }
      >
        {schools.map((school) => (
          <tr key={school.id}>
            <td className="px-4 py-3">
              <div className="font-medium">{school.name}</div>
              <div className="text-xs text-muted-foreground">
                {school.npsn || "-"}
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
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
