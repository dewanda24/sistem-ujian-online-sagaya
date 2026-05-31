import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ConfirmLinkButton } from "@/components/dashboard/confirm-link-button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import {
  importTemplates,
  type TemplateType,
} from "@/features/import-export/templates";
import { ImportPreviewForm } from "@/features/import-export/components/import-preview-form";
import { StudentAssignmentImportForm } from "@/features/import-export/components/student-assignment-import-form";
import { TeacherAssignmentImportForm } from "@/features/import-export/components/teacher-assignment-import-form";
import { ExcelImportForm } from "@/features/question-bank/components/excel-import-form";
import { WordImportForm } from "@/features/question-bank/components/word-import-form";
import {
  getQuestionCategoryOptions,
  getScopedSubjectOptions,
} from "@/features/question-bank/queries";
import { hasPermission } from "@/lib/auth/has-permission";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEnvStatus } from "@/lib/env";

const templateTypes: TemplateType[] = [
  "students",
  "teachers",
  "classes",
  "student-class-assignments",
  "teacher-subject-assignments",
  "questions",
];

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    message?: string;
  }>;
};

export default async function ImportExportPage({ searchParams }: PageProps) {
  const user = await requireAuth();
  const canUseAdminCenter = hasPermission(user, "import_export.view");
  const canManageQuestions = hasPermission(user, "question_bank.manage");
  const canExportReports = hasPermission(user, "reports.export");
  const canExportMonitoring = hasPermission(user, "exam_monitoring.view");

  if (!canUseAdminCenter && !canManageQuestions && !canExportMonitoring) {
    return null;
  }

  const [params, subjects, categories] = await Promise.all([
    searchParams,
    canManageQuestions ? getScopedSubjectOptions() : Promise.resolve([]),
    canManageQuestions ? getQuestionCategoryOptions() : Promise.resolve([]),
  ]);
  const envStatus = getEnvStatus();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Import / Export"
        description="Pusat template CSV, export laporan, dan pengecekan kesiapan environment."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {templateTypes.map((type) => {
          const template = importTemplates[type];

          return (
            <DashboardCard
              key={type}
              title={template.title}
              description={template.description}
              className="h-full"
            >
              <Link
                href={`/api/templates/${type}`}
                className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Download CSV
              </Link>
            </DashboardCard>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {canExportReports ? (
          <DashboardCard
            title="Export Nilai"
            description="Unduh rekap nilai peserta dari modul reports dalam format CSV."
          >
            <ConfirmLinkButton
              href="/api/reports/export"
              confirmMessage="Export rekap nilai ke CSV sekarang?"
            >
              Export CSV
            </ConfirmLinkButton>
          </DashboardCard>
        ) : null}

        {canExportMonitoring ? (
          <DashboardCard
            title="Export Monitoring"
            description="Unduh data monitoring ujian dalam format CSV."
          >
            <ConfirmLinkButton
              href="/api/monitoring/export"
              confirmMessage="Export data monitoring ujian ke CSV sekarang?"
            >
              Export CSV
            </ConfirmLinkButton>
          </DashboardCard>
        ) : null}

        <DashboardCard
          title="Environment"
          description="Status konfigurasi variable server tanpa menampilkan nilai rahasia."
        >
          <div className="space-y-2">
            {envStatus.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <span className="truncate font-medium">{item.key}</span>
                <span
                  className={
                    item.configured
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                      : "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                  }
                >
                  {item.configured ? "Ready" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </section>

      {canManageQuestions ? (
        <>
          <WordImportForm
            subjects={subjects}
            categories={categories}
            notice={params.notice}
            message={params.message}
          />

          <ExcelImportForm notice={params.notice} message={params.message} />
        </>
      ) : null}

      {canUseAdminCenter ? (
        <>
          <ImportPreviewForm />

          <StudentAssignmentImportForm />

          <TeacherAssignmentImportForm />

          <DashboardCard
            title="Catatan Import"
            description="Preview staging tidak menyimpan data. Form assignment dan import soal memakai validasi sebelum commit."
          />
        </>
      ) : null}
    </div>
  );
}
