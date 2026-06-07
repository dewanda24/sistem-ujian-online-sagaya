import Link from "next/link";
import { FolderTree, Plus } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { QuestionBankFilters } from "@/features/question-bank/components/question-bank-filters";
import { QuestionTable } from "@/features/question-bank/components/question-table";
import {
  getQuestionCategoryOptions,
  getQuestions,
  getScopedSubjectOptions,
} from "@/features/question-bank/queries";
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
  }>;
};

export default async function QuestionsPage({ searchParams }: PageProps) {
  await requirePermission("question_bank.view");
  const params = await searchParams;
  const filters = {
    q: params.q,
    subject_id: params.subject_id,
    category_id: params.category_id,
    type: params.type,
    status: params.status,
  };
  const [subjects, categories, questions] = await Promise.all([
    getScopedSubjectOptions(),
    getQuestionCategoryOptions(params.subject_id),
    getQuestions(filters),
  ]);

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
            href="/dashboard/question-bank/questions/create"
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
    </div>
  );
}
