import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { SearchForm } from "@/components/master-data/search-form";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  saveAcademicYearAction,
  toggleAcademicYearAction,
} from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getAcademicYears,
  getSchoolOptions,
} from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    edit?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function AcademicYearsPage({ searchParams }: PageProps) {
  await requirePermission("academic_years.view");
  const params = await searchParams;
  const [academicYears, schools] = await Promise.all([
    getAcademicYears(params.q),
    getSchoolOptions(),
  ]);
  const editable = academicYears.find((item) => item.id === params.edit);

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Tahun Ajaran"
        description="Kelola tahun ajaran per sekolah. Saat satu tahun ajaran diaktifkan, tahun ajaran lain pada sekolah yang sama otomatis dinonaktifkan."
      />

      <FormSection
        title={editable ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran"}
        description="Gunakan format seperti 2025/2026 agar konsisten."
      >
        <form action={saveAcademicYearAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
          <select
            name="school_id"
            defaultValue={editable?.school_id ?? schools[0]?.value ?? ""}
            className="rounded-md border px-3 py-2 text-sm"
            required
          >
            {schools.map((school) => (
              <option key={school.value} value={school.value}>
                {school.label}
              </option>
            ))}
          </select>
          <input
            name="name"
            defaultValue={editable?.name ?? ""}
            placeholder="2025/2026"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="starts_at"
            type="date"
            defaultValue={editable?.start_date ?? ""}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            name="ends_at"
            type="date"
            defaultValue={editable?.end_date ?? ""}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={editable?.is_active ?? false}
            />
            Jadikan aktif
          </label>
          <div className="flex justify-end md:col-span-2">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Simpan Tahun Ajaran
            </button>
          </div>
        </form>
      </FormSection>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-base font-semibold">Daftar Tahun Ajaran</h2>
        <SearchForm placeholder="Cari tahun ajaran" defaultValue={params.q} />
      </div>

      <DataTable
        columns={["Nama", "Sekolah", "Periode", "Status", "Aksi"]}
        isEmpty={academicYears.length === 0}
        empty={
          <EmptyState
            title="Belum ada tahun ajaran"
            description="Tambahkan tahun ajaran sebelum membuat kelas dan semester."
          />
        }
      >
        {academicYears.map((academicYear) => (
          <tr key={academicYear.id}>
            <td className="px-4 py-3 font-medium">{academicYear.name}</td>
            <td className="px-4 py-3">{academicYear.schools?.name ?? "-"}</td>
            <td className="px-4 py-3 text-muted-foreground">
              {academicYear.start_date || "-"} - {academicYear.end_date || "-"}
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={Boolean(academicYear.is_active)} />
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <a
                  href={`/dashboard/master-data/academic-years?edit=${academicYear.id}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Edit
                </a>
                <form action={toggleAcademicYearAction}>
                  <input type="hidden" name="id" value={academicYear.id} />
                  <input
                    type="hidden"
                    name="school_id"
                    value={academicYear.school_id}
                  />
                  <input
                    type="hidden"
                    name="is_active"
                    value={academicYear.is_active ? "false" : "true"}
                  />
                  <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                    {academicYear.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
