import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
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
};

type AcademicYearRelation = {
  name?: string | null;
};

type TeachingGroup = {
  subject: SubjectRelation;
  academicYears: Set<string>;
  classes: Map<string, ClassRelation>;
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
  const teachingMap = new Map<string, TeachingGroup>();

  for (const assignment of assignments) {
    const subject = firstRelation(
      assignment.subjects as SubjectRelation | SubjectRelation[] | null,
    );
    const classItem = firstRelation(
      assignment.classes as ClassRelation | ClassRelation[] | null,
    );
    const academicYear = firstRelation(
      assignment.academic_years as AcademicYearRelation | AcademicYearRelation[] | null,
    );
    const subjectId = subject?.id ?? (assignment.subject_id as string | null) ?? "unknown";

    if (!teachingMap.has(subjectId)) {
      teachingMap.set(subjectId, {
        subject: {
          id: subjectId,
          code: subject?.code ?? null,
          name: subject?.name ?? "Mapel belum tersedia",
        },
        academicYears: new Set(),
        classes: new Map(),
      });
    }

    const group = teachingMap.get(subjectId)!;

    if (academicYear?.name) {
      group.academicYears.add(academicYear.name);
    }

    if (classItem?.id) {
      group.classes.set(classItem.id, classItem);
    }
  }

  const teachingGroups = Array.from(teachingMap.values());
  const classCount = new Set(
    assignments
      .map((assignment) => assignment.class_id as string | null)
      .filter(Boolean),
  ).size;
  const academicYearCount = new Set(
    assignments
      .map((assignment) => assignment.academic_year_id as string | null)
      .filter(Boolean),
  ).size;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Kelas Saya"
        description="Mapel dan kelas yang sedang diajar. Dari sini guru bisa langsung membuat soal, paket ujian, atau jadwal."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Mapel" value={teachingGroups.length} />
        <SummaryCard label="Kelas" value={classCount} />
        <SummaryCard label="Tahun Ajaran" value={academicYearCount} />
      </div>

      <DataTable
        columns={["Mapel", "Kelas", "Tahun Ajaran", "Aksi"]}
        isEmpty={teachingGroups.length === 0}
        empty={
          <EmptyState
            title="Belum ada kelas mengajar"
            description="Hubungi admin sekolah jika mapel atau kelas belum muncul."
          />
        }
        searchPlaceholder="Cari mapel atau kelas..."
        enableColumnVisibility={false}
      >
        {teachingGroups.map((group) => {
          const classes = Array.from(group.classes.values());
          const subjectHref = buildQueryHref("/dashboard/question-bank/questions", {
            subject_id: group.subject.id,
          });
          const packageHref = buildQueryHref("/dashboard/exams/packages", {
            subject_id: group.subject.id,
          });

          return (
            <tr key={group.subject.id ?? group.subject.name}>
              <td className="px-4 py-3">
                <div className="font-semibold text-[#0F172A]">
                  {group.subject.name}
                </div>
                <div className="mt-1 text-xs text-[#64748B]">
                  {group.subject.code ?? "Kode mapel belum tersedia"}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {classes.length > 0 ? (
                    classes.map((classItem) => (
                      <span
                        key={classItem.id}
                        className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#0F172A]"
                      >
                        {classItem.name ?? "Kelas"}
                        {classItem.grade_level ? (
                          <span className="font-normal text-[#64748B]">
                            {" "}
                            - Tingkat {classItem.grade_level}
                          </span>
                        ) : null}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#64748B]">
                      Kelas belum tersedia.
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-[#64748B]">
                {Array.from(group.academicYears).join(", ") || "Tahun ajaran aktif"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={subjectHref}
                    className="inline-flex h-8 items-center rounded-lg bg-[#2563EB] px-3 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
                  >
                    Soal
                  </Link>
                  <Link
                    href={packageHref}
                    className="inline-flex h-8 items-center rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    Paket
                  </Link>
                  <Link
                    href="/dashboard/exams/schedules"
                    className="inline-flex h-8 items-center rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    Jadwal
                  </Link>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
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
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-[#64748B]">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-[#0F172A]">{value}</div>
    </div>
  );
}
