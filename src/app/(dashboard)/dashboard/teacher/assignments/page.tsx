import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable } from "@/components/master-data/data-table";
import {
  firstRelation,
  getTeacherAssignmentOverview,
} from "@/features/homeroom/queries";
import { requireRole } from "@/lib/auth/require-role";

type SubjectRelation = {
  id?: string | null;
  code?: string | null;
  name?: string | null;
};

type ClassRelation = {
  id?: string | null;
  name?: string | null;
  grade_level?: number | string | null;
  is_active?: boolean | null;
};

type AcademicYearRelation = {
  id?: string | null;
  name?: string | null;
  is_active?: boolean | null;
};

function buildQueryHref(path: string, params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();

  return query ? `${path}?${query}` : path;
}

export default async function TeacherAssignmentsPage() {
  await requireRole("teacher");
  const assignments = await getTeacherAssignmentOverview();
  const subjectIds = [
    ...new Set(
      assignments
        .map((assignment) => assignment.subject_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const classIds = [
    ...new Set(
      assignments
        .map((assignment) => assignment.class_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const academicYearIds = [
    ...new Set(
      assignments
        .map((assignment) => assignment.academic_year_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Mapel & Kelas Saya"
        description="Ringkasan assignment mengajar berdasarkan teacher_subjects. Halaman ini menjadi pintu kerja guru sebelum menyusun soal, paket, dan jadwal ujian."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Assignment" value={assignments.length} />
        <SummaryCard label="Mapel" value={subjectIds.length} />
        <SummaryCard label="Kelas" value={classIds.length} />
        <SummaryCard label="Tahun Ajaran" value={academicYearIds.length} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <QuickLink
          title="Bank Soal"
          description="Kelola soal sesuai mapel yang ditugaskan."
          href="/dashboard/question-bank/questions"
        />
        <QuickLink
          title="Paket Ujian"
          description="Susun paket dari soal yang sudah published."
          href="/dashboard/exams/packages"
        />
        <QuickLink
          title="Jadwal Ujian"
          description="Lihat jadwal ujian terkait mapel guru."
          href="/dashboard/exams/schedules"
        />
        <QuickLink
          title="Monitoring"
          description="Pantau sesi ujian aktif yang menjadi tanggung jawab guru."
          href="/dashboard/teacher/monitoring"
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Daftar Assignment Mengajar</h2>
        <DataTable
          columns={["Mapel", "Kelas", "Tahun Ajaran", "Status Kelas", "Aksi"]}
          isEmpty={assignments.length === 0}
          empty={
            <EmptyState
              title="Belum ada assignment mengajar"
              description="Assignment akan tampil setelah admin menghubungkan guru, mapel, kelas, dan tahun ajaran di master data guru."
            />
          }
        >
          {assignments.map((assignment) => {
            const subject = firstRelation(
              assignment.subjects as SubjectRelation | SubjectRelation[] | null,
            );
            const classItem = firstRelation(
              assignment.classes as ClassRelation | ClassRelation[] | null,
            );
            const academicYear = firstRelation(
              assignment.academic_years as
                | AcademicYearRelation
                | AcademicYearRelation[]
                | null,
            );
            const subjectHref = buildQueryHref("/dashboard/question-bank/questions", {
              subject_id: subject?.id ?? (assignment.subject_id as string | null),
            });
            const packageHref = buildQueryHref("/dashboard/exams/packages", {
              subject_id: subject?.id ?? (assignment.subject_id as string | null),
            });

            return (
              <tr key={assignment.id as string}>
                <td className="px-4 py-3">
                  <div className="font-medium">{subject?.name ?? "Mapel belum tersedia"}</div>
                  <div className="text-xs text-muted-foreground">
                    {subject?.code ?? assignment.subject_id ?? "-"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{classItem?.name ?? "Kelas belum tersedia"}</div>
                  <div className="text-xs text-muted-foreground">
                    Tingkat {classItem?.grade_level ?? "-"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>{academicYear?.name ?? "-"}</div>
                  <div className="text-xs text-muted-foreground">
                    {academicYear?.is_active ? "Aktif" : "Tidak aktif"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusPill value={classItem?.is_active ? "active" : "inactive"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={subjectHref}
                      className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      Soal
                    </Link>
                    <Link
                      href={packageHref}
                      className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      Paket
                    </Link>
                    <Link
                      href="/dashboard/exams/schedules"
                      className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      Jadwal
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function QuickLink({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border bg-card p-4 transition hover:border-primary/50 hover:bg-muted/40"
    >
      <div className="font-semibold">{title}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}
