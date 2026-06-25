import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { QuestionForm } from "@/features/question-bank/components/question-form";
import {
  getDefaultSchoolId,
  getQuestionById,
  getQuestionCategoryOptions,
  getQuestionStimulusOptions,
  getScopedSubjectOptions,
} from "@/features/question-bank/queries";
import { hasPermission } from "@/lib/auth/has-permission";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    edit?: string;
    subject_id?: string;
    category_id?: string;
    notice?: string;
    message?: string;
  }>;
};

export default async function CreateQuestionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isEditing = Boolean(params.edit);

  const currentUser = await requirePermission(
    isEditing ? "questions.update" : "questions.create",
  );

  const [subjects, schoolId, categories, stimuli, editable] = await Promise.all([
    getScopedSubjectOptions(),
    getDefaultSchoolId(),
    getQuestionCategoryOptions(params.subject_id),
    getQuestionStimulusOptions(params.subject_id),
    params.edit ? getQuestionById(params.edit) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-5">
      <ActionToast status={params.notice} message={params.message} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <DashboardPageHeader
          title={isEditing ? "Edit Soal" : "Tambah Soal"}
          description="Isi mapel, pertanyaan, dan jawaban dalam satu halaman. Stimulus, media, dan pengaturan lanjutan tersedia saat dibutuhkan."
        />
        <Link
          href="/dashboard/question-bank/questions"
          className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]"
        >
          <ArrowLeft className="size-4" />
          Semua Soal
        </Link>
      </div>

      <QuestionForm
        editable={editable}
        schoolId={schoolId ?? ""}
        subjects={subjects}
        categories={categories}
        stimuli={stimuli}
        defaultSubjectId={params.subject_id}
        defaultCategoryId={params.category_id}
        canPublish={hasPermission(currentUser, "questions.publish")}
      />
    </div>
  );
}
