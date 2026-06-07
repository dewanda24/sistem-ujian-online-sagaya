import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { ExamScheduleForm } from "@/features/exams/components/exam-schedule-form";
import {
  getAcademicYearSelectOptions,
  getDefaultSchoolId,
  getExamPackages,
  getExamScheduleClassIds,
  getExamSchedules,
  getScopedClassOptions,
  getSemesterOptions,
} from "@/features/exams/queries";
import { requirePermission } from "@/lib/auth/require-permission";
import { isoToJakartaDatetimeLocal } from "@/lib/date-time";

type PageProps = {
  searchParams: Promise<{
    edit?: string;
    package_id?: string;
    notice?: string;
    message?: string;
  }>;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function CreateExamSchedulePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isEditing = Boolean(params.edit);

  await requirePermission("exam_schedules.manage");

  const [
    schoolId,
    packages,
    schedules,
    academicYears,
    semesters,
    classes,
    selectedClassIds,
  ] = await Promise.all([
    getDefaultSchoolId(),
    getExamPackages({}),
    getExamSchedules({}),
    getAcademicYearSelectOptions(),
    getSemesterOptions(),
    getScopedClassOptions(),
    getExamScheduleClassIds(params.edit),
  ]);
  const editable = schedules.find((schedule) => schedule.id === params.edit);
  const packageOptions =
    packages.map((examPackage) => {
      const subject = firstRelation(examPackage.subjects);

      return {
        value: examPackage.id as string,
        label: `${examPackage.title} - ${subject?.code ?? "Mapel"}`,
        subjectCode: subject?.code ?? "",
        subjectName: subject?.name ?? "",
        totalQuestions: Number(examPackage.total_questions ?? 0),
        durationMinutes: Number(examPackage.duration_minutes ?? 0),
        status: String(examPackage.status ?? "draft"),
      };
    });

  return (
    <div className="space-y-5">
      <ActionToast status={params.notice} message={params.message} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <DashboardPageHeader
          title={isEditing ? "Edit Jadwal" : "Buat Jadwal"}
          description="Buat jadwal melalui wizard singkat. Target kelas dibuat compact dan detail peserta tetap terpisah dari halaman utama."
        />
        <Link
          href="/dashboard/exams/schedules"
          className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]"
        >
          <ArrowLeft className="size-4" />
          Semua Jadwal
        </Link>
      </div>

      <ExamScheduleForm
        editable={editable}
        schoolId={schoolId ?? ""}
        packages={packageOptions}
        academicYears={academicYears}
        semesters={semesters}
        classes={classes}
        selectedClassIds={selectedClassIds}
        defaultPackageId={params.package_id}
        defaultStartAt={isoToJakartaDatetimeLocal(editable?.start_at)}
        defaultEndAt={isoToJakartaDatetimeLocal(editable?.end_at)}
      />
    </div>
  );
}
