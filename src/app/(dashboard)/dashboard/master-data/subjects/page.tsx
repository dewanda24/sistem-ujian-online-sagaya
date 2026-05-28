import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { SearchForm } from "@/components/master-data/search-form";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  saveSubjectAction,
  toggleSubjectAction,
} from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSchoolOptions, getSubjects } from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    edit?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function SubjectsPage({ searchParams }: PageProps) {
  await requirePermission("subjects.view");
  const params = await searchParams;
  const [subjects, schools] = await Promise.all([
    getSubjects(params.q),
    getSchoolOptions(),
  ]);
  const editable = subjects.find((subject) => subject.id === params.edit);

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Mata Pelajaran"
        description="Kelola subject code dan nama mata pelajaran sebagai referensi bank soal dan ujian."
      />

      <FormSection
        title={editable ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
        description="Kode mata pelajaran wajib agar integrasi question bank lebih stabil."
      >
        <form action={saveSubjectAction} className="grid gap-4 md:grid-cols-2">
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
            name="code"
            defaultValue={editable?.code ?? ""}
            placeholder="MTK"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="name"
            defaultValue={editable?.name ?? ""}
            placeholder="Matematika"
            className="rounded-md border px-3 py-2 text-sm md:col-span-2"
            required
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={editable?.is_active ?? true}
            />
            Aktif
          </label>
          <div className="flex justify-end md:col-span-2">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Simpan Mata Pelajaran
            </button>
          </div>
        </form>
      </FormSection>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-base font-semibold">Daftar Mata Pelajaran</h2>
        <SearchForm placeholder="Cari mata pelajaran" defaultValue={params.q} />
      </div>

      <DataTable
        columns={["Kode", "Nama", "Sekolah", "Status", "Aksi"]}
        isEmpty={subjects.length === 0}
        empty={
          <EmptyState
            title="Belum ada mata pelajaran"
            description="Tambahkan subject sebelum membuat assignment guru dan bank soal."
          />
        }
      >
        {subjects.map((subject) => (
          <tr key={subject.id}>
            <td className="px-4 py-3 font-medium">{subject.code}</td>
            <td className="px-4 py-3">{subject.name}</td>
            <td className="px-4 py-3 text-muted-foreground">
              {subject.schools?.name ?? "-"}
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={Boolean(subject.is_active)} />
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <a
                  href={`/dashboard/master-data/subjects?edit=${subject.id}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Edit
                </a>
                <form action={toggleSubjectAction}>
                  <input type="hidden" name="id" value={subject.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={subject.is_active ? "false" : "true"}
                  />
                  <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                    {subject.is_active ? "Nonaktifkan" : "Aktifkan"}
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
