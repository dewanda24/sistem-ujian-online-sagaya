import Link from "next/link";
import { Building2, Plus, Users, GraduationCap, BookOpen, Activity, Search, FilterX } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  TableActionLink,
  TableActions,
  TableActionSubmit,
} from "@/components/dashboard/table-actions";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { StatusBadge } from "@/components/master-data/status-badge";
import { getSuperAdminSchoolRows } from "@/features/super-admin/school-management";
import { toggleSchoolAction } from "@/lib/actions/master-data-actions";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    level_filter?: string;
    status_filter?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function SuperAdminSchoolsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const schools = await getSuperAdminSchoolRows({
    q: params.q,
    status: params.status_filter,
    education_level: params.level_filter,
  });

  const activeCount = schools.filter((school) => school.is_active).length;
  const inactiveCount = schools.length - activeCount;
  const totalStudents = schools.reduce((acc, s) => acc + s.stats.studentCount, 0);
  const totalTeachers = schools.reduce((acc, s) => acc + s.stats.teacherCount, 0);
  const totalExams = schools.reduce((acc, s) => acc + s.stats.examCount, 0);
  const activeExams = schools.reduce((acc, s) => acc + s.stats.activeExamCount, 0);

  const hasFilters = Boolean(params.q || params.level_filter || params.status_filter);

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <DashboardPageHeader
          title="Manajemen Sekolah"
          description="Pusat tata kelola institusi sekolah, kuota pengguna, status lisensi CBT, dan agregasi data lintas platform."
        />
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/dashboard/super-admin/import-export"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors shadow-sm"
          >
            Impor Massal Sekolah
          </Link>
          <Link
            href="/dashboard/super-admin/schools/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="size-4" />
            Tambah Sekolah
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DashboardCard
          title="Total Sekolah"
          value={String(schools.length)}
          description={`${activeCount} aktif, ${inactiveCount} nonaktif`}
        />
        <DashboardCard
          title="Total Siswa"
          value={totalStudents.toLocaleString("id-ID")}
          description="Siswa terdaftar di platform"
        />
        <DashboardCard
          title="Total Guru"
          value={totalTeachers.toLocaleString("id-ID")}
          description="Tenaga pengajar terdaftar"
        />
        <DashboardCard
          title="Jadwal Ujian"
          value={totalExams.toLocaleString("id-ID")}
          description={`${activeExams} sedang berlangsung`}
        />
        <DashboardCard
          title="Tingkat Kesiapan"
          value={`${schools.filter((s) => s.readiness.status === "ready").length} Siap`}
          description={`${schools.filter((s) => s.readiness.status !== "ready").length} perlu perhatian`}
        />
      </div>

      {/* Filter Toolbar */}
      <form className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5 shadow-sm">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Cari nama sekolah, NPSN, kota, atau provinsi..."
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select
          name="level_filter"
          defaultValue={params.level_filter ?? ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Semua Jenjang</option>
          <option value="SD/MI">SD / MI</option>
          <option value="SMP/MTs">SMP / MTs</option>
          <option value="SMA/MA">SMA / MA</option>
          <option value="SMK">SMK</option>
          <option value="Lainnya">Lainnya</option>
        </select>

        <select
          name="status_filter"
          defaultValue={params.status_filter ?? ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Terapkan
          </button>
          {hasFilters && (
            <Link
              href="/dashboard/super-admin/schools"
              className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors text-muted-foreground"
              title="Reset Filter"
            >
              <FilterX className="size-4" />
            </Link>
          )}
        </div>
      </form>

      {/* Main Data Table */}
      <DataTable
        columns={[
          "Nama Sekolah & Lokasi",
          "NPSN",
          "Jenjang",
          "Status",
          "Admin",
          "Guru",
          "Siswa",
          "Ujian CBT",
          "Kesiapan",
          "Aksi",
        ]}
        isEmpty={schools.length === 0}
        searchPlaceholder="Cari data sekolah..."
        empty={
          <EmptyState
            title="Tidak ada data sekolah"
            description={
              hasFilters
                ? "Tidak ada sekolah yang cocok dengan kriteria filter yang diterapkan."
                : "Belum ada sekolah yang terdaftar. Tambahkan sekolah pertama untuk memulai."
            }
          />
        }
      >
        {schools.map((school) => {
          const readinessBadge =
            school.readiness.status === "ready"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
              : school.readiness.status === "attention"
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800";

          const readinessLabel =
            school.readiness.status === "ready"
              ? "Siap CBT"
              : school.readiness.status === "attention"
                ? "Perhatian"
                : "Belum Siap";

          return (
            <tr key={school.id} className="hover:bg-muted/40 transition-colors">
              <td className="px-4 py-3.5">
                <Link
                  href={`/dashboard/super-admin/schools/${school.id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors block"
                >
                  {school.name}
                </Link>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {[school.city, school.province].filter(Boolean).join(", ") || "Lokasi belum diatur"}
                </div>
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                {school.npsn || "-"}
              </td>
              <td className="px-4 py-3.5">
                <span className="inline-flex items-center rounded-md border bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {school.education_level || "Umum"}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge active={Boolean(school.is_active)} />
              </td>
              <td className="px-4 py-3.5 text-center text-xs font-medium">
                {school.stats.adminCount}
              </td>
              <td className="px-4 py-3.5 text-center text-xs font-medium">
                {school.stats.teacherCount}
              </td>
              <td className="px-4 py-3.5 text-center text-xs font-medium">
                {school.stats.studentCount}
              </td>
              <td className="px-4 py-3.5 text-center text-xs">
                <span className="font-semibold text-foreground">{school.stats.examCount}</span>
                {school.stats.activeExamCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 px-1.5 py-0.2 text-[10px] font-bold">
                    {school.stats.activeExamCount} Live
                  </span>
                )}
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${readinessBadge}`}
                >
                  {readinessLabel}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <TableActions>
                  <TableActionLink
                    href={`/dashboard/super-admin/schools/${school.id}`}
                    icon="eye"
                  >
                    Detail & Setup
                  </TableActionLink>
                  <TableActionLink
                    href={`/dashboard/super-admin/schools/${school.id}?edit=1`}
                    icon="pencil"
                  >
                    Edit Profil
                  </TableActionLink>
                  <TableActionLink
                    href={`/dashboard/super-admin/monitoring?school_id=${school.id}`}
                    icon="screen-share"
                  >
                    Monitor CBT
                  </TableActionLink>
                  <form action={toggleSchoolAction}>
                    <input
                      type="hidden"
                      name="redirect_path"
                      value="/dashboard/super-admin/schools"
                    />
                    <input type="hidden" name="id" value={school.id} />
                    <input
                      type="hidden"
                      name="is_active"
                      value={school.is_active ? "false" : "true"}
                    />
                    <TableActionSubmit
                      icon="power"
                      confirmMessage={`${
                        school.is_active ? "Nonaktifkan sementara layanan untuk" : "Aktifkan kembali layanan untuk"
                      } ${school.name}?`}
                    >
                      {school.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </TableActionSubmit>
                  </form>
                </TableActions>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
