import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSchoolScope } from "@/lib/auth/school-scope";
import {
  getAcademicYears,
  getAllTeacherAssignments,
  getClasses,
  getSemesters,
  getSubjects,
  getUsersByRole,
} from "@/lib/master-data/queries";

function compactList(values: string[], emptyLabel: string) {
  const uniqueValues = Array.from(new Set(values.filter(Boolean)));

  if (uniqueValues.length === 0) {
    return emptyLabel;
  }

  if (uniqueValues.length <= 2) {
    return uniqueValues.join(", ");
  }

  return `${uniqueValues.slice(0, 2).join(", ")} +${uniqueValues.length - 2}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

const preparationModules = [
  {
    title: "Tahun Ajaran & Semester",
    href: "/dashboard/master-data/academic-years",
    description: "Kelola periode akademik dan semester aktif sekolah.",
  },
  {
    title: "Kelas",
    href: "/dashboard/master-data/classes",
    description: "Atur kelas, wali kelas, dan anggota kelas.",
  },
  {
    title: "Mata Pelajaran",
    href: "/dashboard/master-data/subjects",
    description: "Kelola mata pelajaran yang digunakan dalam ujian.",
  },
  {
    title: "Penugasan Guru",
    href: "/dashboard/master-data/teacher-assignments",
    description: "Hubungkan guru dengan kelas dan mata pelajaran.",
  },
];

function relationName<T extends { name?: string | null }>(
  value: T | T[] | null | undefined,
) {
  return Array.isArray(value) ? value[0]?.name : value?.name;
}

function activeMemberCount(classItem: {
  class_members?: Array<{ left_at?: string | null }> | null;
}) {
  return (classItem.class_members ?? []).filter((member) => !member.left_at)
    .length;
}

function getCreatedAt(item: { created_at?: string | null }) {
  return item.created_at ? new Date(item.created_at).getTime() : 0;
}

export default async function MasterDataPage() {
  await requirePermission("master_data.view");
  await requireSchoolScope();

  const [
    academicYears,
    semesters,
    classes,
    subjects,
    teachers,
    students,
    teacherAssignments,
  ] = await Promise.all([
    getAcademicYears(),
    getSemesters(),
    getClasses(),
    getSubjects(),
    getUsersByRole("teacher"),
    getUsersByRole("student"),
    getAllTeacherAssignments(),
  ]);

  const activeYears = academicYears.filter((year) => Boolean(year.is_active));
  const activeSemesters = semesters.filter((semester) =>
    Boolean(semester.is_active),
  );
  const totalActiveStudents = students.filter(
    (student) => student.status === "active",
  ).length;
  const totalActiveTeachers = teachers.filter(
    (teacher) => teacher.status === "active",
  ).length;
  const classDistribution = classes
    .map((classItem) => ({
      id: classItem.id,
      name: classItem.name,
      academicYear: relationName(classItem.academic_years) ?? "Tahun ajaran",
      count: activeMemberCount(classItem),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const largestClassSize = Math.max(
    1,
    ...classDistribution.map((item) => item.count),
  );

  const subjectTeacherMap = new Map<string, Set<string>>();

  for (const assignment of teacherAssignments) {
    const subject = Array.isArray(assignment.subjects)
      ? assignment.subjects[0]
      : assignment.subjects;
    const subjectLabel = [subject?.code, subject?.name]
      .filter(Boolean)
      .join(" - ");

    if (!subjectLabel || !assignment.teacher_id) {
      continue;
    }

    if (!subjectTeacherMap.has(subjectLabel)) {
      subjectTeacherMap.set(subjectLabel, new Set<string>());
    }

    subjectTeacherMap.get(subjectLabel)?.add(assignment.teacher_id);
  }

  const subjectTeacherStats = Array.from(subjectTeacherMap.entries())
    .map(([label, teacherIds]) => ({ label, count: teacherIds.size }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);

  const recentActivity = [
    ...academicYears.map((item) => ({
      label: `Tahun ajaran ${item.name}`,
      type: "Tahun Ajaran",
      createdAt: getCreatedAt(item),
    })),
    ...semesters.map((item) => ({
      label: `Semester ${item.name}`,
      type: "Semester",
      createdAt: getCreatedAt(item),
    })),
    ...classes.map((item) => ({
      label: `Kelas ${item.name}`,
      type: "Kelas",
      createdAt: getCreatedAt(item),
    })),
    ...subjects.map((item) => ({
      label: `Mata pelajaran ${item.name}`,
      type: "Mata Pelajaran",
      createdAt: getCreatedAt(item),
    })),
  ]
    .filter((item) => item.createdAt > 0)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Persiapan Sekolah"
        description="Kelola data dasar yang dibutuhkan sebelum pelaksanaan ujian."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {preparationModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <DashboardCard
              title={module.title}
              description={module.description}
              className="h-full transition hover:border-primary/40 hover:shadow-md"
            />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardCard
          title="Tahun Ajaran Aktif"
          value={compactList(
            activeYears.map((year) => year.name),
            "Belum aktif",
          )}
          description={`${formatNumber(academicYears.length)} tahun ajaran tercatat`}
        />
        <DashboardCard
          title="Semester Aktif"
          value={compactList(
            activeSemesters.map((semester) => semester.name),
            "Belum aktif",
          )}
          description={`${formatNumber(semesters.length)} semester tercatat`}
        />
        <DashboardCard
          title="Total Siswa"
          value={formatNumber(students.length)}
          description={`${formatNumber(totalActiveStudents)} siswa aktif`}
        />
        <DashboardCard
          title="Total Guru"
          value={formatNumber(teachers.length)}
          description={`${formatNumber(totalActiveTeachers)} guru aktif`}
        />
        <DashboardCard
          title="Total Kelas"
          value={formatNumber(classes.length)}
          description={`${formatNumber(classDistribution.reduce((sum, item) => sum + item.count, 0))} anggota kelas aktif`}
        />
        <DashboardCard
          title="Total Mata Pelajaran"
          value={formatNumber(subjects.length)}
          description={`${formatNumber(teacherAssignments.length)} penugasan guru tercatat`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[#0F172A]">
              Distribusi Siswa Per Kelas
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Berdasarkan anggota kelas aktif yang belum memiliki tanggal keluar.
            </p>
          </div>
          <div className="space-y-3">
            {classDistribution.slice(0, 8).map((item) => (
              <div key={item.id} className="grid gap-2 sm:grid-cols-[12rem_1fr_4rem] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#0F172A]">
                    {item.name}
                  </p>
                  <p className="truncate text-xs text-[#64748B]">
                    {item.academicYear}
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                  <div
                    className="h-full rounded-full bg-[#2563EB]"
                    style={{
                      width: `${Math.max(4, (item.count / largestClassSize) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-sm font-semibold text-[#0F172A] sm:text-right">
                  {formatNumber(item.count)}
                </div>
              </div>
            ))}
            {classDistribution.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#CBD5E1] p-4 text-sm text-[#64748B]">
                Belum ada kelas yang tercatat.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[#0F172A]">
              Guru Per Mata Pelajaran
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Ringkasan dari penugasan guru yang sudah dibuat.
            </p>
          </div>
          <div className="space-y-3">
            {subjectTeacherStats.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm text-[#0F172A]">
                  {item.label}
                </span>
                <span className="shrink-0 rounded-md bg-[#EFF6FF] px-2 py-1 text-xs font-semibold text-[#1D4ED8]">
                  {formatNumber(item.count)} guru
                </span>
              </div>
            ))}
            {subjectTeacherStats.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#CBD5E1] p-4 text-sm text-[#64748B]">
                Belum ada penugasan guru.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#0F172A]">
            Aktivitas Akademik Terbaru
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Data akademik terakhir yang masuk ke sistem.
          </p>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {recentActivity.map((item) => (
            <div
              key={`${item.type}-${item.label}-${item.createdAt}`}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#0F172A]">
                  {item.label}
                </p>
                <p className="text-xs text-[#64748B]">{item.type}</p>
              </div>
              <time className="text-xs text-[#64748B]">
                {new Intl.DateTimeFormat("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }).format(item.createdAt)}
              </time>
            </div>
          ))}
          {recentActivity.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#CBD5E1] p-4 text-sm text-[#64748B]">
              Belum ada aktivitas akademik yang dapat ditampilkan.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
