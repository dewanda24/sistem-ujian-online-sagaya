import { redirect } from "next/navigation";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ExcelImportForm } from "@/features/question-bank/components/excel-import-form";
import { hasPermission } from "@/lib/auth/has-permission";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    message?: string;
  }>;
};

export default async function ImportExcelPage({ searchParams }: PageProps) {
  const user = await requirePermission("question_bank.manage");

  if (hasPermission(user, "import_export.view")) {
    redirect("/dashboard/import-export?tab=import");
  }

  const params = await searchParams;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Import Excel / CSV Bank Soal"
        description="Pratinjau template Excel/CSV lalu simpan baris valid sebagai draft."
      />
      <ExcelImportForm notice={params.notice} message={params.message} />
    </div>
  );
}
