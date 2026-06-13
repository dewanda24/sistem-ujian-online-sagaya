import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { ExamPackageForm } from "@/features/exams/components/exam-package-form";
import {
  getDefaultSchoolId,
  getExamPackageQuestionIds,
  getExamPackages,
  getPublishedQuestionOptions,
  getScopedSubjectOptions,
} from "@/features/exams/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    edit?: string;
    subject_id?: string;
    notice?: string;
    message?: string;
  }>;
};

export default async function CreateExamPackagePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isEditing = Boolean(params.edit);

  await requirePermission("exam_packages.manage");

  const [subjects, schoolId, packages, questions, selectedQuestionIds] =
    await Promise.all([
      getScopedSubjectOptions(),
      getDefaultSchoolId(),
      getExamPackages({}),
      getPublishedQuestionOptions(),
      getExamPackageQuestionIds(params.edit),
    ]);
  const editable = packages.find((examPackage) => examPackage.id === params.edit);
  const selectedSubjectId =
    editable?.subject_id ?? params.subject_id ?? subjects[0]?.value ?? "";

  return (
    <div className="space-y-5">
      <ActionToast status={params.notice} message={params.message} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <DashboardPageHeader
          title={isEditing ? "Edit Paket" : "Buat Paket"}
          description="Susun paket ujian melalui langkah singkat. Daftar soal dibuat ringkas dan hanya menampilkan detail saat pratinjau."
        />
        <Link
          href="/dashboard/exams/packages"
          className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]"
        >
          <ArrowLeft className="size-4" />
          Semua Paket
        </Link>
      </div>

      <ExamPackageForm
        editable={editable}
        schoolId={schoolId ?? ""}
        subjects={subjects}
        questions={questions}
        selectedQuestionIds={selectedQuestionIds}
        defaultSubjectId={selectedSubjectId}
      />
    </div>
  );
}
