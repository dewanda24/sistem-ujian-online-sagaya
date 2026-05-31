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
  saveTeacherAction,
  saveTeacherAssignmentAction,
  toggleUserStatusAction,
} from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getAcademicYearOptions,
  getClassOptions,
  getSubjectOptions,
  getTeacherAssignmentCounts,
  getTeacherAssignments,
  getUsersByRole,
} from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    edit?: string;
    status?: string;
    message?: string;
  }>;
};

function getProfile(user: {
  user_profiles?:
    | {
        full_name?: string;
        nip?: string;
        phone?: string;
      }
    | Array<{
        full_name?: string;
        nip?: string;
        phone?: string;
      }>;
}) {
  return Array.isArray(user.user_profiles)
    ? user.user_profiles[0]
    : user.user_profiles;
}

export default async function TeachersPage({ searchParams }: PageProps) {
  await requirePermission("teachers.view");
  const params = await searchParams;
  const [teachers, subjects, classes, academicYears] = await Promise.all([
    getUsersByRole("teacher", params.q),
    getSubjectOptions(),
    getClassOptions(),
    getAcademicYearOptions(),
  ]);
  const assignmentCounts = await getTeacherAssignmentCounts(
    teachers.map((teacher) => teacher.id),
  );
  const editable = teachers.find((teacher) => teacher.id === params.edit);
  const editableProfile = editable ? getProfile(editable) : null;
  const assignments = editable ? await getTeacherAssignments(editable.id) : [];
  const activeTeachers = teachers.filter(
    (teacher) => teacher.status === "active",
  ).length;
  const withoutAssignments = teachers.filter(
    (teacher) =>
      teacher.status === "active" &&
      (assignmentCounts.get(teacher.id) ?? 0) === 0,
  ).length;
  const totalAssignments = Array.from(assignmentCounts.values()).reduce(
    (total, count) => total + count,
    0,
  );

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Guru"
        description="Kelola akun guru dan assignment guru ke mata pelajaran, kelas, dan tahun ajaran melalui teacher_subjects."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Total Guru"
          value={String(teachers.length)}
          description="Guru sesuai filter saat ini."
        />
        <DashboardCard
          title="Guru Aktif"
          value={String(activeTeachers)}
          description="Akun guru dengan status active."
        />
        <DashboardCard
          title="Tanpa Assignment"
          value={String(withoutAssignments)}
          description="Guru aktif tanpa mapel/kelas."
        />
        <DashboardCard
          title="Total Assignment"
          value={String(totalAssignments)}
          description="Relasi teacher_subjects."
        />
      </section>

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Import & Export</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Semua fitur import dan export data telah dipindahkan ke dashboard
            khusus untuk manajemen yang lebih terpusat dan terstruktur.
          </p>
        </div>
        <Link
          href="/dashboard/import-export"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Buka Dashboard Import/Export
        </Link>
      </div>

      <FormSection
        title={editable ? "Edit Guru" : "Tambah Guru"}
        description="Pembuatan user auth membutuhkan SUPABASE_SERVICE_ROLE_KEY di environment server."
      >
        <form action={saveTeacherAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
          <input
            name="full_name"
            defaultValue={editableProfile?.full_name ?? ""}
            placeholder="Nama lengkap"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="nip"
            defaultValue={editableProfile?.nip ?? ""}
            placeholder="NIP"
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            name="email"
            defaultValue={editable?.email ?? ""}
            placeholder="Email"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="username"
            defaultValue={editable?.username ?? ""}
            placeholder="Username"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="phone"
            defaultValue={editableProfile?.phone ?? ""}
            placeholder="Telepon"
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            name="password"
            type="password"
            placeholder={
              editable ? "Kosongkan jika tidak diubah" : "Password awal"
            }
            className="rounded-md border px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={editable?.status ?? "active"}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex justify-end md:col-span-2">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Simpan Guru
            </button>
          </div>
        </form>
      </FormSection>

      <FormSection
        title="Assignment Guru"
        description="Guru dapat memiliki banyak assignment mata pelajaran untuk kelas dan tahun ajaran berbeda."
      >
        <form
          action={saveTeacherAssignmentAction}
          className="grid gap-4 md:grid-cols-4"
        >
          <select
            name="teacher_id"
            defaultValue={editable?.id ?? teachers[0]?.id ?? ""}
            className="rounded-md border px-3 py-2 text-sm"
            required
          >
            {teachers.map((teacher) => {
              const profile = getProfile(teacher);

              return (
                <option key={teacher.id} value={teacher.id}>
                  {profile?.full_name ?? teacher.username}
                </option>
              );
            })}
          </select>
          <select
            name="subject_id"
            className="rounded-md border px-3 py-2 text-sm"
            required
          >
            {subjects.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </select>
          <select
            name="class_id"
            className="rounded-md border px-3 py-2 text-sm"
            required
          >
            {classes.map((classItem) => (
              <option key={classItem.value} value={classItem.value}>
                {classItem.label}
              </option>
            ))}
          </select>
          <select
            name="academic_year_id"
            className="rounded-md border px-3 py-2 text-sm"
            required
          >
            {academicYears.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
          <div className="md:col-span-4">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Tambah Assignment
            </button>
          </div>
        </form>
        {editable ? (
          <div className="mt-4 rounded-md border">
            <div className="border-b px-3 py-2 text-sm font-medium">
              Assignment {editableProfile?.full_name ?? editable.username}
            </div>
            <div className="divide-y">
              {assignments.length ? (
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="grid gap-2 px-3 py-2 text-sm md:grid-cols-3"
                  >
                    <span>
                      {assignment.subjects?.code} - {assignment.subjects?.name}
                    </span>
                    <span>{assignment.classes?.name ?? "-"}</span>
                    <span>{assignment.academic_years?.name ?? "-"}</span>
                  </div>
                ))
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  Belum ada assignment untuk guru ini.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </FormSection>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-base font-semibold">Daftar Guru</h2>
        <SearchForm placeholder="Cari guru" defaultValue={params.q} />
      </div>

      <DataTable
        columns={["Nama", "NIP", "Email", "Assignment", "Status", "Aksi"]}
        isEmpty={teachers.length === 0}
        empty={
          <EmptyState
            title="Belum ada guru"
            description="Tambahkan guru sebelum membuat assignment mengajar."
          />
        }
      >
        {teachers.map((teacher) => {
          const profile = getProfile(teacher);
          const assignmentCount = assignmentCounts.get(teacher.id) ?? 0;
          const needsAssignment =
            teacher.status === "active" && assignmentCount === 0;

          return (
            <tr key={teacher.id}>
              <td className="px-4 py-3">
                <div className="font-medium">
                  {profile?.full_name ?? teacher.username}
                </div>
                {needsAssignment ? (
                  <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                    Belum ada assignment
                  </span>
                ) : (
                  <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    Ready
                  </span>
                )}
              </td>
              <td className="px-4 py-3">{profile?.nip ?? "-"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {teacher.email}
              </td>
              <td className="px-4 py-3">{assignmentCount}</td>
              <td className="px-4 py-3">
                <StatusBadge active={teacher.status === "active"} />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <a
                    href={`/dashboard/master-data/teachers?edit=${teacher.id}`}
                    className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Edit
                  </a>
                  <form action={toggleUserStatusAction}>
                    <input type="hidden" name="target" value="teachers" />
                    <input type="hidden" name="id" value={teacher.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={
                        teacher.status === "active" ? "inactive" : "active"
                      }
                    />
                    <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                      {teacher.status === "active" ? "Nonaktifkan" : "Aktifkan"}
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
