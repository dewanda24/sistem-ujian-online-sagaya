import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { SearchForm } from "@/components/master-data/search-form";
import { saveTeacherAssignmentAction } from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getAcademicYearOptions,
  getAllTeacherAssignments,
  getClassOptions,
  getSubjectOptions,
  getTeacherOptions,
} from "@/lib/master-data/queries";

type Relation<T> = T | T[] | null | undefined;

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    message?: string;
  }>;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function TeacherAssignmentsPage({
  searchParams,
}: PageProps) {
  await requirePermission("teachers.manage");
  const params = await searchParams;
  const [teachers, subjects, classes, academicYears, assignments] =
    await Promise.all([
      getTeacherOptions(),
      getSubjectOptions(),
      getClassOptions(),
      getAcademicYearOptions(),
      getAllTeacherAssignments(params.q),
    ]);

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Penugasan Guru"
        description="Atur relasi Guru, Mata Pelajaran, dan Kelas agar alur akademik sekolah jelas."
      />

      <FormSection
        title="Tambah Penugasan Guru"
        description="Pilih guru, mata pelajaran, kelas, dan tahun ajaran."
      >
        <form
          action={saveTeacherAssignmentAction}
          className="grid gap-3 md:grid-cols-5"
        >
          <select
            name="teacher_id"
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
            required
          >
            <option value="">Pilih Guru</option>
            {teachers.map((teacher) => (
              <option key={teacher.value} value={teacher.value}>
                {teacher.label}
              </option>
            ))}
          </select>
          <select
            name="subject_id"
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
            required
          >
            <option value="">Pilih Mata Pelajaran</option>
            {subjects.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </select>
          <select
            name="class_id"
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
            required
          >
            <option value="">Pilih Kelas</option>
            {classes.map((classItem) => (
              <option key={classItem.value} value={classItem.value}>
                {classItem.label}
              </option>
            ))}
          </select>
          <select
            name="academic_year_id"
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
            required
          >
            <option value="">Pilih Tahun Ajaran</option>
            {academicYears.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
          <SubmitButton loadingText="Menyimpan...">
            Simpan Penugasan
          </SubmitButton>
        </form>
      </FormSection>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-base font-semibold">Daftar Penugasan Guru</h2>
        <SearchForm
          placeholder="Cari guru, mata pelajaran, kelas"
          defaultValue={params.q}
        />
      </div>

      <DataTable
        columns={["Guru", "Mata Pelajaran", "Kelas", "Tahun Ajaran"]}
        isEmpty={assignments.length === 0}
        empty={
          <EmptyState
            title="Belum ada penugasan guru"
            description="Tambahkan penugasan agar guru memiliki mata pelajaran dan kelas mengajar."
            actionHref="/dashboard/master-data/teacher-assignments"
            actionLabel="Tambah Penugasan"
          />
        }
      >
        {assignments.map((assignment) => {
          const teacher = firstRelation(assignment.users);
          const profile = firstRelation(teacher?.user_profiles);
          const subject = firstRelation(assignment.subjects);
          const classItem = firstRelation(assignment.classes);
          const academicYear = firstRelation(assignment.academic_years);

          return (
            <tr key={assignment.id}>
              <td className="px-4 py-3">
                <div className="font-medium">
                  {profile?.full_name ?? teacher?.username ?? "-"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {teacher?.email ?? "-"}
                </div>
              </td>
              <td className="px-4 py-3">
                {subject ? `${subject.code} - ${subject.name}` : "-"}
              </td>
              <td className="px-4 py-3">{classItem?.name ?? "-"}</td>
              <td className="px-4 py-3">{academicYear?.name ?? "-"}</td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
