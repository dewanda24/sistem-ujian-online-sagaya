import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { SearchForm } from "@/components/master-data/search-form";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  saveClassAction,
  toggleClassAction,
} from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getAcademicYearOptions,
  getClasses,
  getSchoolOptions,
  getTeacherOptions,
} from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    edit?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function ClassesPage({ searchParams }: PageProps) {
  await requirePermission("classes.view");
  const params = await searchParams;
  const [classes, schools, academicYears, teachers] = await Promise.all([
    getClasses(params.q),
    getSchoolOptions(),
    getAcademicYearOptions(),
    getTeacherOptions(),
  ]);
  const editable = classes.find((item) => item.id === params.edit);

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Kelas"
        description="Kelas terikat ke tahun ajaran. Riwayat siswa disimpan melalui class_members, bukan overwrite field kelas di user."
      />

      <FormSection
        title={editable ? "Edit Kelas" : "Tambah Kelas"}
        description="Wali kelas bersifat opsional dan dapat diisi dari user role teacher."
      >
        <form action={saveClassAction} className="grid gap-4 md:grid-cols-2">
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
            placeholder="VII A"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="grade_level"
            type="number"
            min="1"
            max="12"
            defaultValue={editable?.grade_level ?? 7}
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <select
            name="homeroom_teacher_id"
            defaultValue={editable?.homeroom_teacher_id ?? ""}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Tanpa wali kelas</option>
            {teachers.map((teacher) => (
              <option key={teacher.value} value={teacher.value}>
                {teacher.label}
              </option>
            ))}
          </select>
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
              Simpan Kelas
            </button>
          </div>
        </form>
      </FormSection>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-base font-semibold">Daftar Kelas</h2>
        <SearchForm placeholder="Cari kelas" defaultValue={params.q} />
      </div>

      <DataTable
        columns={[
          "Kelas",
          "Tingkat",
          "Tahun Ajaran",
          "Wali Kelas",
          "Anggota",
          "Status",
          "Aksi",
        ]}
        isEmpty={classes.length === 0}
        empty={
          <EmptyState
            title="Belum ada kelas"
            description="Tambahkan kelas sebelum memasukkan siswa ke class_members."
          />
        }
      >
        {classes.map((classItem) => {
          const homeroomProfile = Array.isArray(classItem.users?.user_profiles)
            ? classItem.users?.user_profiles[0]
            : classItem.users?.user_profiles;

          return (
            <tr key={classItem.id}>
              <td className="px-4 py-3 font-medium">{classItem.name}</td>
              <td className="px-4 py-3">{classItem.grade_level}</td>
              <td className="px-4 py-3">
                {classItem.academic_years?.name ?? "-"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {homeroomProfile?.full_name ?? classItem.users?.username ?? "-"}
              </td>
              <td className="px-4 py-3">
                {Array.isArray(classItem.class_members)
                  ? classItem.class_members.length
                  : 0}
              </td>
              <td className="px-4 py-3">
                <StatusBadge active={Boolean(classItem.is_active)} />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <a
                    href={`/dashboard/master-data/classes?edit=${classItem.id}`}
                    className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Edit
                  </a>
                  <form action={toggleClassAction}>
                    <input type="hidden" name="id" value={classItem.id} />
                    <input
                      type="hidden"
                      name="is_active"
                      value={classItem.is_active ? "false" : "true"}
                    />
                    <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                      {classItem.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
