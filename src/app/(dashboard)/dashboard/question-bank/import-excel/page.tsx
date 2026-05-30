import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ExcelImportForm } from "@/features/question-bank/components/excel-import-form";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    message?: string;
  }>;
};

export default async function ImportExcelPage({ searchParams }: PageProps) {
  await requirePermission("question_bank.manage");
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Import Excel/CSV Bank Soal"
        description="Upload template Excel atau CSV, cek validasi per baris, lalu import hanya baris valid sebagai draft."
      />
      <ExcelImportForm notice={params.notice} message={params.message} />
    </div>
  );
}
