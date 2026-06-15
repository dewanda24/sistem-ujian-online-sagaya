import { Pencil, Power } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SubmitButton } from "@/components/dashboard/submit-button";
import {
  TableActionLink,
  TableActions,
  TableActionSubmit,
} from "@/components/dashboard/table-actions";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { SearchForm } from "@/components/master-data/search-form";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  saveSemesterAction,
  toggleSemesterAction,
} from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getAcademicYearOptions,
  getSemesters,
} from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    edit?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function SemestersPage({ searchParams }: PageProps) {
  await requirePermission("semesters.view");
  const params = await searchParams;
  const [semesters, academicYears] = await Promise.all([
    getSemesters(params.q),
    getAcademicYearOptions(),
  ]);
  const editable = semesters.find((item) => item.id === params.edit);

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Semester"
        description="Kelola semester dalam tahun ajaran. Saat satu semester aktif, semester aktif lain pada sekolah yang sama dinonaktifkan."
      />

      <FormSection
        title={editable ? "Edit Semester" : "Tambah Semester"}
        description="Semester menjadi periode aktif untuk jadwal dan ujian."
      >
        <form action={saveSemesterAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
          <select
            name="academic_year_id"
            defaultValue={
              editable?.academic_year_id ?? academicYears[0]?.value ?? ""
            }
            className="rounded-md border px-3 py-2 text-sm"
            required
          >
            {academicYears.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
          <input
            name="name"
            defaultValue={editable?.name ?? ""}
            placeholder="Ganjil"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="code"
            defaultValue={editable?.code ?? ""}
            placeholder="odd"
            className="rounded-md border px-3 py-2 text-sm"
            required
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
            <SubmitButton loadingText={editable ? "Memperbarui..." : "Menyimpan..."}>
              Simpan Semester
            </SubmitButton>
          </div>
        </form>
      </FormSection>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-base font-semibold">Daftar Semester</h2>
        <SearchForm placeholder="Cari semester" defaultValue={params.q} />
      </div>

      <DataTable
        columns={["Semester", "Kode", "Tahun Ajaran", "Status", "Aksi"]}
        isEmpty={semesters.length === 0}
        empty={
          <EmptyState
            title="Belum ada semester"
            description="Tambahkan semester untuk mengatur periode akademik aktif."
            actionHref="/dashboard/master-data/semesters"
            actionLabel="Tambah Semester"
          />
        }
      >
        {semesters.map((semester) => (
          <tr key={semester.id}>
            <td className="px-4 py-3 font-medium">{semester.name}</td>
            <td className="px-4 py-3 text-muted-foreground">
              {semester.code ?? "-"}
            </td>
            <td className="px-4 py-3">
              {semester.academic_years?.name ?? "-"}
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={Boolean(semester.is_active)} />
            </td>
            <td className="px-4 py-3">
              <TableActions>
                <TableActionLink
                  href={`/dashboard/master-data/semesters?edit=${semester.id}`}
                  icon={Pencil}
                >
                  Edit
                </TableActionLink>
                <form action={toggleSemesterAction}>
                  <input type="hidden" name="id" value={semester.id} />
                  <input
                    type="hidden"
                    name="academic_year_id"
                    value={semester.academic_year_id}
                  />
                  <input
                    type="hidden"
                    name="is_active"
                    value={semester.is_active ? "false" : "true"}
                  />
                  <TableActionSubmit
                    icon={Power}
                    confirmMessage={`${semester.is_active ? "Nonaktifkan" : "Aktifkan"} semester ${semester.name}?`}
                  >
                    {semester.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </TableActionSubmit>
                </form>
              </TableActions>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
