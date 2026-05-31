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
  importStudentsCsvAction,
  saveClassMemberAction,
  saveStudentAction,
  toggleUserStatusAction,
} from "@/lib/actions/master-data-actions";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getClassOptions,
  getStudentActiveClassCounts,
  getStudentClassHistory,
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
        nis?: string;
        nisn?: string;
        phone?: string;
      }
    | Array<{
        full_name?: string;
        nis?: string;
        nisn?: string;
        phone?: string;
      }>;
}) {
  return Array.isArray(user.user_profiles)
    ? user.user_profiles[0]
    : user.user_profiles;
}

export default async function StudentsPage({ searchParams }: PageProps) {
  await requirePermission("students.view");
  const params = await searchParams;
  const [students, classes] = await Promise.all([
    getUsersByRole("student", params.q),
    getClassOptions(),
  ]);
  const activeClassCounts = await getStudentActiveClassCounts(
    students.map((student) => student.id),
  );
  const editable = students.find((student) => student.id === params.edit);
  const editableProfile = editable ? getProfile(editable) : null;
  const classHistory = editable
    ? await getStudentClassHistory(editable.id)
    : [];
  const activeStudents = students.filter(
    (student) => student.status === "active",
  ).length;
  const withoutActiveClass = students.filter(
    (student) =>
      student.status === "active" &&
      (activeClassCounts.get(student.id) ?? 0) === 0,
  ).length;
  const multipleActiveClass = students.filter(
    (student) => (activeClassCounts.get(student.id) ?? 0) > 1,
  ).length;

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Siswa"
        description="Kelola akun siswa dan riwayat kelas melalui class_members. Assignment kelas baru tidak menghapus riwayat lama."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Total Siswa"
          value={String(students.length)}
          description="Siswa sesuai filter saat ini."
        />
        <DashboardCard
          title="Siswa Aktif"
          value={String(activeStudents)}
          description="Akun siswa dengan status active."
        />
        <DashboardCard
          title="Tanpa Kelas Aktif"
          value={String(withoutActiveClass)}
          description="Siswa aktif belum punya class_members aktif."
        />
        <DashboardCard
          title="Kelas Aktif Ganda"
          value={String(multipleActiveClass)}
          description="Siswa dengan lebih dari satu kelas aktif."
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
        title={editable ? "Edit Siswa" : "Tambah Siswa"}
        description="Pembuatan user auth membutuhkan SUPABASE_SERVICE_ROLE_KEY di environment server."
      >
        <form action={saveStudentAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
          <input
            name="full_name"
            defaultValue={editableProfile?.full_name ?? ""}
            placeholder="Nama lengkap"
            className="rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="nis"
            defaultValue={editableProfile?.nis ?? ""}
            placeholder="NIS"
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            name="nisn"
            defaultValue={editableProfile?.nisn ?? ""}
            placeholder="NISN"
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            name="phone"
            defaultValue={editableProfile?.phone ?? ""}
            placeholder="Telepon"
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
              Simpan Siswa
            </button>
          </div>
        </form>
      </FormSection>

      <FormSection
        title="Assign Siswa ke Kelas"
        description="Jika siswa masih punya kelas aktif, sistem akan mengisi left_at sebelum membuat record class_members baru."
      >
        <form
          action={saveClassMemberAction}
          className="grid gap-4 md:grid-cols-3"
        >
          <select
            name="student_id"
            defaultValue={editable?.id ?? students[0]?.id ?? ""}
            className="rounded-md border px-3 py-2 text-sm"
            required
          >
            {students.map((student) => {
              const profile = getProfile(student);

              return (
                <option key={student.id} value={student.id}>
                  {profile?.full_name ?? student.username}
                </option>
              );
            })}
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
          <input
            name="joined_at"
            type="date"
            className="rounded-md border px-3 py-2 text-sm"
          />
          <div className="md:col-span-3">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Tambah Riwayat Kelas
            </button>
          </div>
        </form>

        {editable ? (
          <div className="mt-4 rounded-md border">
            <div className="border-b px-3 py-2 text-sm font-medium">
              Riwayat kelas {editableProfile?.full_name ?? editable.username}
            </div>
            <div className="divide-y">
              {classHistory.length ? (
                classHistory.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 px-3 py-2 text-sm md:grid-cols-3"
                  >
                    <span>{item.classes?.name ?? "-"}</span>
                    <span>Masuk: {item.joined_at ?? "-"}</span>
                    <span>Keluar: {item.left_at ?? "Aktif"}</span>
                  </div>
                ))
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  Belum ada riwayat kelas untuk siswa ini.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </FormSection>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-base font-semibold">Daftar Siswa</h2>
        <SearchForm placeholder="Cari siswa" defaultValue={params.q} />
      </div>

      <DataTable
        columns={[
          "Nama",
          "NIS",
          "NISN",
          "Email",
          "Kelas Aktif",
          "Status",
          "Aksi",
        ]}
        isEmpty={students.length === 0}
        empty={
          <EmptyState
            title="Belum ada siswa"
            description="Tambahkan siswa sebelum assign ke kelas."
          />
        }
      >
        {students.map((student) => {
          const profile = getProfile(student);
          const activeClassCount = activeClassCounts.get(student.id) ?? 0;
          const needsClass =
            student.status === "active" && activeClassCount === 0;
          const duplicatedClass = activeClassCount > 1;

          return (
            <tr key={student.id}>
              <td className="px-4 py-3">
                <div className="font-medium">
                  {profile?.full_name ?? student.username}
                </div>
                {needsClass ? (
                  <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                    Belum ada kelas aktif
                  </span>
                ) : duplicatedClass ? (
                  <span className="mt-2 inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                    Kelas aktif ganda
                  </span>
                ) : (
                  <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    Ready
                  </span>
                )}
              </td>
              <td className="px-4 py-3">{profile?.nis ?? "-"}</td>
              <td className="px-4 py-3">{profile?.nisn ?? "-"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {student.email}
              </td>
              <td className="px-4 py-3">{activeClassCount}</td>
              <td className="px-4 py-3">
                <StatusBadge active={student.status === "active"} />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <a
                    href={`/dashboard/master-data/students?edit=${student.id}`}
                    className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Edit
                  </a>
                  <form action={toggleUserStatusAction}>
                    <input type="hidden" name="target" value="students" />
                    <input type="hidden" name="id" value={student.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={
                        student.status === "active" ? "inactive" : "active"
                      }
                    />
                    <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                      {student.status === "active" ? "Nonaktifkan" : "Aktifkan"}
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
