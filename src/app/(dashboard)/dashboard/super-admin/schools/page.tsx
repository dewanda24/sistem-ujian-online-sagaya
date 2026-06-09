import Link from "next/link";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { StatusBadge } from "@/components/master-data/status-badge";
import { getSuperAdminSchoolRows } from "@/features/super-admin/school-management";
import { toggleSchoolAction } from "@/lib/actions/master-data-actions";

type PageProps = {
  searchParams: Promise<{
    q?: string;
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
  });
  const activeCount = schools.filter((school) => school.is_active).length;
  const inactiveCount = schools.length - activeCount;

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Manajemen Sekolah"
        description="Kelola tenant sekolah, status layanan, dan ringkasan aktivitas lintas platform Sagaya."
      />
      <div className="flex justify-end">
        <Link
          href="/dashboard/super-admin/schools/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Tambah Sekolah
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Total Sekolah"
          value={String(schools.length)}
          description="Tenant sekolah terdaftar di platform."
        />
        <DashboardCard
          title="Sekolah Aktif"
          value={String(activeCount)}
          description="Sekolah yang dapat menjalankan layanan."
        />
        <DashboardCard
          title="Sekolah Nonaktif"
          value={String(inactiveCount)}
          description="Sekolah yang sedang ditangguhkan."
        />
      </div>

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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Filter
        </button>
      </form>

      <DataTable
        columns={[
          "Nama Sekolah",
          "NPSN",
          "Jenjang",
          "Status",
          "Admin",
          "Guru",
          "Siswa",
          "Ujian",
          "Tanggal Dibuat",
          "Aksi",
        ]}
        isEmpty={schools.length === 0}
        searchPlaceholder="Cari di tabel sekolah"
        empty={
          <EmptyState
            title="Belum ada sekolah"
            description="Tambahkan sekolah pertama untuk mulai mengelola tenant platform."
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
            <td className="px-4 py-3">{school.npsn || "-"}</td>
            <td className="px-4 py-3">{school.education_level || "-"}</td>
            <td className="px-4 py-3">
              <StatusBadge active={Boolean(school.is_active)} />
            </td>
            <td className="px-4 py-3">{school.stats.adminCount}</td>
            <td className="px-4 py-3">{school.stats.teacherCount}</td>
            <td className="px-4 py-3">{school.stats.studentCount}</td>
            <td className="px-4 py-3">{school.stats.examCount}</td>
            <td className="px-4 py-3">
              {school.created_at
                ? new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                  }).format(new Date(school.created_at))
                : "-"}
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/super-admin/schools/${school.id}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Detail
                </Link>
                <Link
                  href={`/dashboard/super-admin/schools/${school.id}?edit=1`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Edit
                </Link>
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
                  <ConfirmSubmitButton
                    confirmMessage={`${
                      school.is_active ? "Nonaktifkan" : "Aktifkan"
                    } ${school.name}?`}
                  >
                    {school.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </ConfirmSubmitButton>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
