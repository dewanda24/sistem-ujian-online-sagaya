import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { SearchForm } from "@/components/master-data/search-form";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  importClassesCsvAction,
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
  const activeClasses = classes.filter((item) => item.is_active).length;
  const withoutHomeroom = classes.filter(
    (item) => item.is_active && !item.homeroom_teacher_id,
  ).length;
  const withoutActiveMembers = classes.filter((item) => {
    const members = Array.isArray(item.class_members)
      ? item.class_members
      : [];

    return (
      item.is_active &&
      !members.some((member: { left_at?: string | null }) => !member.left_at)
    );
  }).length;
  const totalActiveMembers = classes.reduce((total, item) => {
    const members = Array.isArray(item.class_members)
      ? item.class_members
      : [];

    return (
      total +
      members.filter((member: { left_at?: string | null }) => !member.left_at)
        .length
    );
  }, 0);

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Kelas"
        description="Kelas terikat ke tahun ajaran. Riwayat siswa disimpan melalui class_members, bukan overwrite field kelas di user."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Total Kelas"
          value={String(classes.length)}
          description="Kelas sesuai filter saat ini."
        />
        <DashboardCard
          title="Kelas / Anggota Aktif"
          value={`${activeClasses}/${totalActiveMembers}`}
          description="Jumlah kelas aktif dan anggota aktif."
        />
        <DashboardCard
          title="Tanpa Siswa"
          value={String(withoutActiveMembers)}
          description="Kelas aktif tanpa anggota aktif."
        />
        <DashboardCard
          title="Tanpa Wali"
          value={String(withoutHomeroom)}
          description="Kelas aktif tanpa wali kelas."
        />
      </section>

      <FormSection
        title="Import Kelas CSV"
        description="Gunakan academic_year sesuai nama tahun ajaran. Wali kelas dicari dari email user role teacher."
      >
        <form
          action={importClassesCsvAction}
          className="grid gap-3 md:grid-cols-[1fr_auto_auto]"
        >
          <input
            name="file"
            type="file"
            accept=".csv,text/csv"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <Link
            href="/api/templates/classes"
            className="rounded-md border px-4 py-2 text-center text-sm hover:bg-muted"
          >
            Download Template
          </Link>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Import CSV
          </button>
        </form>
      </FormSection>

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
          const members = Array.isArray(classItem.class_members)
            ? classItem.class_members
            : [];
          const activeMembers = members.filter(
            (member: { left_at?: string | null }) => !member.left_at,
          );
          const readinessWarnings = [
            classItem.is_active && activeMembers.length === 0
              ? "Belum ada siswa aktif"
              : "",
            classItem.is_active && !classItem.homeroom_teacher_id
              ? "Wali kelas kosong"
              : "",
          ].filter(Boolean);

          return (
            <tr key={classItem.id}>
              <td className="px-4 py-3">
                <div className="font-medium">{classItem.name}</div>
                {readinessWarnings.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                      Perlu dicek
                    </span>
                    <ul className="space-y-1 text-xs text-amber-700">
                      {readinessWarnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    Ready
                  </span>
                )}
              </td>
              <td className="px-4 py-3">{classItem.grade_level}</td>
              <td className="px-4 py-3">
                {classItem.academic_years?.name ?? "-"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {homeroomProfile?.full_name ?? classItem.users?.username ?? "-"}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">{activeMembers.length} aktif</div>
                <div className="text-xs text-muted-foreground">
                  {members.length} total riwayat
                </div>
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
