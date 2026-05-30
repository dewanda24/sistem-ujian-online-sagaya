import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { WordImportForm } from "@/features/question-bank/components/word-import-form";
import {
  getQuestionCategoryOptions,
  getScopedSubjectOptions,
} from "@/features/question-bank/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    message?: string;
  }>;
};

export default async function ImportWordPage({ searchParams }: PageProps) {
  await requirePermission("question_bank.manage");
  const [params, subjects, categories] = await Promise.all([
    searchParams,
    getScopedSubjectOptions(),
    getQuestionCategoryOptions(),
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Import Soal dari Word"
        description="Import soal dari file .docx template resmi, preview dan perbaiki hasil parsing, lalu simpan sebagai draft."
      />
      <WordImportForm
        subjects={subjects}
        categories={categories}
        notice={params.notice}
        message={params.message}
      />
    </div>
  );
}
