import { redirect } from "next/navigation";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { WordImportForm } from "@/features/question-bank/components/word-import-form";
import {
  getQuestionCategoryOptions,
  getScopedSubjectOptions,
} from "@/features/question-bank/queries";
import { hasPermission } from "@/lib/auth/has-permission";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    message?: string;
  }>;
};

export default async function ImportWordPage({ searchParams }: PageProps) {
  const user = await requirePermission("question_bank.manage");

  if (hasPermission(user, "import_export.view")) {
    redirect("/dashboard/import-export?tab=import");
  }

  const [params, subjects, categories] = await Promise.all([
    searchParams,
    getScopedSubjectOptions(),
    getQuestionCategoryOptions(),
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Import Word Bank Soal"
        description="Pratinjau template Word resmi lalu simpan soal valid sebagai draft."
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
