import Link from "next/link";
import { FolderTree, Plus } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { QuestionBankFilters } from "@/features/question-bank/components/question-bank-filters";
import { QuestionTable } from "@/features/question-bank/components/question-table";
import { QuestionDrawer } from "@/features/question-bank/components/question-drawer";
import { QuestionForm } from "@/features/question-bank/components/question-form";
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

  const editable = params.action === "duplicate" && fetchedQuestion
    ? { ...fetchedQuestion, id: null }
    : fetchedQuestion;

  return (
    <div className="space-y-5">
      <ActionToast status={params.notice} message={params.message} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <DashboardPageHeader
          title="Bank Soal"
          description="Kelola daftar soal, tambah soal baru, dan atur kategori tanpa form panjang di halaman daftar."
        />
        <div className="flex flex-wrap gap-2">
          <Link
            href="?action=create"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#1D4ED8]"
          >
            <Plus className="size-4" />
            Tambah Soal
          </Link>
          <Link
            href="/dashboard/question-bank/categories"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]"
          >
            <FolderTree className="size-4" />
            Kategori Soal
          </Link>
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
