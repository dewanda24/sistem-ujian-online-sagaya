import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
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

      {teachingGroups.length === 0 ? (
        <EmptyState
          title="Belum ada kelas mengajar"
          description="Hubungi admin sekolah jika mapel atau kelas belum muncul."
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {teachingGroups.map((group) => {
            const classes = Array.from(group.classes.values());
            const subjectHref = buildQueryHref("/dashboard/question-bank/questions", {
              subject_id: group.subject.id,
            });
            const packageHref = buildQueryHref("/dashboard/exams/packages", {
              subject_id: group.subject.id,
            });

            return (
              <article
                key={group.subject.id ?? group.subject.name}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#2563EB]">Mapel</p>
                    <h2 className="mt-1 text-xl font-semibold text-[#0F172A]">
                      {group.subject.name}
                    </h2>
                    <p className="mt-1 text-sm text-[#64748B]">
                      {group.subject.code ?? "Kode mapel belum tersedia"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] px-3 py-2 text-sm text-[#64748B]">
                    {Array.from(group.academicYears).join(", ") || "Tahun ajaran aktif"}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-[#0F172A]">Kelas</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {classes.length > 0 ? (
                      classes.map((classItem) => (
                        <span
                          key={classItem.id}
                          className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm font-medium text-[#0F172A]"
                        >
                          {classItem.name ?? "Kelas"}{" "}
                          <span className="font-normal text-[#64748B]">
                            {classItem.grade_level ? `Tingkat ${classItem.grade_level}` : ""}
                          </span>
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[#64748B]">
                        Kelas belum tersedia.
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  <Link
                    href={subjectHref}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2563EB] px-3 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
                  >
                    Soal
                  </Link>
                  <Link
                    href={packageHref}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E2E8F0] px-3 text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    Paket Ujian
                  </Link>
                  <Link
                    href="/dashboard/exams/schedules"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E2E8F0] px-3 text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    Jadwal
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
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
