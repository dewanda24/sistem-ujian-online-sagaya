import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { QuestionForm } from "@/features/question-bank/components/question-form";
import {
  getQuestionCategoryOptions,
  getScopedSubjectOptions,
  getQuestionStimulusOptions,
  getDefaultSchoolId,
  getQuestionById,
} from "@/features/question-bank/queries";
import { hasPermission } from "@/lib/auth/has-permission";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    subject_id?: string;
    category_id?: string;
    id?: string;
    action?: "edit" | "duplicate";
  }>;
};

export default async function CreateQuestionPage({ searchParams }: PageProps) {
  const currentUser = await requirePermission("question_bank.view");
  const canPublish = hasPermission(currentUser, "questions.publish");
  const params = await searchParams;

  const [subjects, categories, stimuli, schoolId, fetchedQuestion] = await Promise.all([
    getScopedSubjectOptions(),
    getQuestionCategoryOptions(params.subject_id),
    getQuestionStimulusOptions(params.subject_id),
    getDefaultSchoolId(),
    params.id ? getQuestionById(params.id) : Promise.resolve(null),
  ]);

  const editable =
    params.action === "duplicate" && fetchedQuestion
      ? { ...fetchedQuestion, id: null }
      : fetchedQuestion;

  const isEdit = params.action === "edit" && fetchedQuestion;
  const isDuplicate = params.action === "duplicate" && fetchedQuestion;

  const title = isEdit
    ? "Edit Butir Soal"
    : isDuplicate
      ? "Duplikat Butir Soal"
      : "Buat Butir Soal Baru";

  const description = isEdit
    ? "Perbarui konten soal, pilihan jawaban, kunci nilai, dan stimulus bacaan."
    : "Ruang kerja luas untuk menyusun soal kompleks, rumus matematika KaTeX, pilihan ganda, dan esai.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DashboardPageHeader title={title} description={description} />
        <Link
          href="/dashboard/question-bank/questions"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95"
        >
          <ChevronLeft className="size-4" />
          <span>Kembali ke Bank Soal</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <QuestionForm
          editable={editable}
          schoolId={schoolId ?? ""}
          subjects={subjects}
          categories={categories}
          stimuli={stimuli}
          defaultSubjectId={params.subject_id}
          defaultCategoryId={params.category_id}
          canPublish={canPublish}
        />
      </div>
    </div>
  );
}
