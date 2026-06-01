import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import {
  DownloadLoginCardButton,
  DownloadLoginCardsButton,
} from "@/features/master-data/components/download-login-card-button";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getClassOptions,
  getStudentLoginCards,
} from "@/lib/master-data/queries";

type PageProps = {
  searchParams: Promise<{
    class_id?: string;
    q?: string;
    password?: string;
  }>;
};

export default async function StudentLoginCardsPage({
  searchParams,
}: PageProps) {
  await requirePermission("students.view");
  const params = await searchParams;
  const [classes, students] = await Promise.all([
    getClassOptions(),
    getStudentLoginCards({
      class_id: params.class_id,
      q: params.q,
    }),
  ]);
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`;
  const passwordLabel = params.password?.trim() || "Password awal";
  const selectedClass = classes.find(
    (classItem) => classItem.value === params.class_id,
  );
  const studentsByClass = new Map<
    string,
    { label: string; students: typeof students }
  >();

  for (const student of students) {
    if (!student.class_id) {
      continue;
    }

    const label =
      classes.find((classItem) => classItem.value === student.class_id)?.label ??
      `${student.class_name}${
        student.academic_year ? ` - ${student.academic_year}` : ""
      }`;
    const group = studentsByClass.get(student.class_id) ?? {
      label,
      students: [],
    };

    group.students.push(student);
    studentsByClass.set(student.class_id, group);
  }

  const classDownloadGroups = [...studentsByClass.entries()]
    .map(([classId, group]) => ({
      classId,
      ...group,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "id"));

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Kartu Login Siswa"
        description="Daftar akun siswa untuk unduh kartu per siswa, per kelas, atau semua sesuai filter."
      />

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <select
            name="class_id"
            defaultValue={params.class_id ?? ""}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Semua kelas aktif</option>
            {classes.map((classItem) => (
              <option key={classItem.value} value={classItem.value}>
                {classItem.label}
              </option>
            ))}
          </select>
          <input
            name="password"
            defaultValue={params.password ?? ""}
            placeholder="Password awal yang dicetak"
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Cari nama, username, atau email"
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
          <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            Terapkan Filter
          </button>
        </form>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <DownloadLoginCardsButton
              students={students}
              password={passwordLabel}
              loginUrl={loginUrl}
              filename={
                selectedClass
                  ? `kartu-login-${selectedClass.label}`
                  : "kartu-login-semua-siswa"
              }
              label={`Download PDF Semua (${students.length})`}
            />
            {params.class_id ? null : classDownloadGroups.map((group) => (
              <DownloadLoginCardsButton
                key={group.classId}
                students={group.students}
                password={passwordLabel}
                loginUrl={loginUrl}
                filename={`kartu-login-${group.label}`}
                label={`PDF ${group.label} (${group.students.length})`}
              />
            ))}
          </div>
          <Link
            href="/dashboard/master-data/students"
            className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
          >
            Kembali ke Siswa
          </Link>
        </div>
      </section>

      {students.length === 0 ? (
        <EmptyState
          title="Tidak ada siswa"
          description="Tidak ada siswa aktif sesuai filter kartu login."
        />
      ) : (
        <DataTable
          columns={["Nama", "Kelas", "Username", "Email", "NIS/NISN", "Aksi"]}
          isEmpty={students.length === 0}
          empty={
            <EmptyState
              title="Tidak ada siswa"
              description="Tidak ada siswa aktif sesuai filter kartu login."
            />
          }
        >
          {students.map((student) => (
            <tr key={student.id}>
              <td className="px-4 py-3">
                <div className="font-medium">{student.full_name}</div>
              </td>
              <td className="px-4 py-3">
                <div>{student.class_name}</div>
                {student.academic_year ? (
                  <div className="text-xs text-muted-foreground">
                    {student.academic_year}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3">{student.username}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {student.email}
              </td>
              <td className="px-4 py-3">
                {[student.nis, student.nisn].filter(Boolean).join(" / ") ||
                  "-"}
              </td>
              <td className="px-4 py-3 text-right">
                <DownloadLoginCardButton
                  student={student}
                  password={passwordLabel}
                  loginUrl={loginUrl}
                  label="Download PDF"
                />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
