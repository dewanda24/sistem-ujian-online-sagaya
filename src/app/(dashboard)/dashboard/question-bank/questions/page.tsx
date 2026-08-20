import Link from "next/link";
import {
  BookOpen,
  FileSpreadsheet,
  FileText,
  FolderTree,
  Plus,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { ActionToast } from "@/components/master-data/action-toast";
import { QuestionBankFilters } from "@/features/question-bank/components/question-bank-filters";
import { QuestionTable } from "@/features/question-bank/components/question-table";
import { QuestionDrawer } from "@/features/question-bank/components/question-drawer";
import { QuestionForm } from "@/features/question-bank/components/question-form";
import { publishAllQuestionsAction } from "@/features/question-bank/actions";
import {
  getQuestionCategoryOptions,
  getQuestions,
  getScopedSubjectOptions,
  getQuestionStimulusOptions,
  getDefaultSchoolId,
  getQuestionById,
} from "@/features/question-bank/queries";
import { hasPermission } from "@/lib/auth/has-permission";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    subject_id?: string;
    category_id?: string;
    type?: string;
    status?: string;
    notice?: string;
    message?: string;
    action?: "create" | "edit" | "duplicate";
    id?: string;
  }>;
};

export default async function QuestionsPage({ searchParams }: PageProps) {
  const currentUser = await requirePermission("question_bank.view");
  const canPublish = hasPermission(currentUser, "questions.publish");
  const params = await searchParams;
  const filters = {
    q: params.q,
    subject_id: params.subject_id,
    category_id: params.category_id,
    type: params.type,
    status: params.status,
  };
  
  const isDrawerOpen = params.action === "create" || params.action === "edit" || params.action === "duplicate";
  const drawerTitle = params.action === "edit" ? "Edit Soal" : params.action === "duplicate" ? "Duplikat Soal" : "Tambah Soal Cepat";

  const [subjects, categories, questions, stimuli, schoolId, fetchedQuestion] = await Promise.all([
    getScopedSubjectOptions(),
    getQuestionCategoryOptions(params.subject_id),
    getQuestions(filters),
    isDrawerOpen ? getQuestionStimulusOptions(params.subject_id) : Promise.resolve([]),
    isDrawerOpen ? getDefaultSchoolId() : Promise.resolve(null),
    (params.action === "edit" || params.action === "duplicate") && params.id 
      ? getQuestionById(params.id) 
      : Promise.resolve(null),
  ]);

  const draftCount = questions.filter((q) => q.status === "draft").length;

  const editable = params.action === "duplicate" && fetchedQuestion
    ? { ...fetchedQuestion, id: null }
    : fetchedQuestion;

  return (
    <div className="space-y-5">
      <ActionToast status={params.notice} message={params.message} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <DashboardPageHeader
          title="Bank Soal"
          description="Pusat pembuatan dan manajemen butir soal pilihan ganda & esai dengan dukungan rumus KaTeX, media, dan import cepat."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="?action=create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1D4ED8] active:scale-[0.98]"
          >
            <Plus className="size-4" />
            <span>Tambah Soal</span>
          </Link>
          <Link
            href="/dashboard/question-bank/import-word"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs font-semibold text-indigo-700 shadow-2xs transition-all hover:bg-indigo-100"
            title="Import naskah soal dari Microsoft Word (.docx)"
          >
            <FileText className="size-3.5" />
            <span>Import Word</span>
          </Link>
          <Link
            href="/dashboard/question-bank/import-excel"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-2xs transition-all hover:bg-emerald-100"
            title="Import template butir soal dari Excel (.xlsx)"
          >
            <FileSpreadsheet className="size-3.5" />
            <span>Import Excel</span>
          </Link>
          <Link
            href="/dashboard/question-bank/stimuli"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition-all hover:bg-slate-50"
          >
            <BookOpen className="size-3.5 text-slate-500" />
            <span>Stimulus</span>
          </Link>
          <Link
            href="/dashboard/question-bank/categories"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition-all hover:bg-slate-50"
          >
            <FolderTree className="size-3.5 text-slate-500" />
            <span>Kategori</span>
          </Link>

          {canPublish && draftCount > 0 ? (
            <form action={publishAllQuestionsAction}>
              <SubmitButton
                loadingText="Menerbitkan..."
                className="h-8 rounded-xl border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-800 shadow-2xs hover:bg-amber-100"
                title={`Terbitkan sekaligus ${draftCount} soal draft`}
              >
                <Send className="size-3.5" />
                <span>Terbitkan Semua ({draftCount})</span>
              </SubmitButton>
            </form>
          ) : null}
        </div>
      </div>

      <QuestionBankFilters
        subjects={subjects}
        categories={categories}
        defaults={filters}
        includeQuestionFilters
      />

      <QuestionTable questions={questions} />

      <QuestionDrawer isOpen={isDrawerOpen} title={drawerTitle}>
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
      </QuestionDrawer>
    </div>
  );
}
