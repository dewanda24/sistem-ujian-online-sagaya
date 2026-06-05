import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ConfirmLinkButton } from "@/components/dashboard/confirm-link-button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
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
import { requirePermission } from "@/lib/auth/require-permission";
import { getEnvStatus } from "@/lib/env";

const templateTypes: TemplateType[] = [
  "students",
  "teachers",
  "classes",
  "student-class-assignments",
  "teacher-subject-assignments",
  "questions",
];

const dataExports = [
  {
    title: "Export Guru",
    description: "Unduh data guru sesuai scope sekolah.",
    href: "/api/data-export/teachers",
  },
  {
    title: "Export Siswa",
    description: "Unduh data siswa sesuai scope sekolah.",
    href: "/api/data-export/students",
  },
  {
    title: "Export Kelas",
    description: "Unduh data kelas dan wali kelas.",
    href: "/api/data-export/classes",
  },
  {
    title: "Export Assignment Guru",
    description: "Unduh assignment guru, mapel, kelas, dan tahun ajaran.",
    href: "/api/data-export/teacher-assignments",
  },
];

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function ImportExportPage({ searchParams }: PageProps) {
  const user = await requirePermission("import_export.view");
  const canUseAdminCenter = hasPermission(user, "import_export.view");
  const canManageQuestions =
    user.roles?.name === "super_admin" ||
    hasPermission(user, "question_bank.manage");
  const canExportReports = hasPermission(user, "reports.export");
  const canExportMonitoring = hasPermission(user, "exam_monitoring.view");

  if (!canUseAdminCenter) {
    redirect("/dashboard/forbidden");
  }

  const [params, subjects, categories] = await Promise.all([
    searchParams,
    canManageQuestions ? getScopedSubjectOptions() : Promise.resolve([]),
    canManageQuestions ? getQuestionCategoryOptions() : Promise.resolve([]),
  ]);
  const envStatus = getEnvStatus();

  return (
    <div className="space-y-6">
      <ActionToast
        status={params.notice ?? params.status}
        message={params.message}
      />
      <DashboardPageHeader
        title="Import / Export"
        description="Pusat operasional import dan export resmi untuk admin sekolah dan super admin."
      />

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Wizard Import</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Alur resmi: Pilih Modul, Download Template, Upload File, Validasi,
            Preview, Commit, Result. Preview tidak menyimpan data.
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-7">
          {[
            "Pilih Modul",
            "Template",
            "Upload",
            "Validasi",
            "Preview",
            "Commit",
            "Result",
          ].map((step, index) => (
            <div key={step} className="rounded-md border px-3 py-2 text-sm">
              <div className="text-xs text-muted-foreground">
                Step {index + 1}
              </div>
              <div className="font-medium">{step}</div>
            </div>
          ))}
        </div>
      </section>

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
        {dataExports.map((item) => (
          <DashboardCard
            key={item.href}
            title={item.title}
            description={item.description}
          >
            <ConfirmLinkButton
              href={item.href}
              confirmMessage={`${item.title} ke CSV sekarang?`}
            >
              Export CSV
            </ConfirmLinkButton>
          </DashboardCard>
        ))}

        <DashboardCard
          title="Export Bank Soal"
          description="Unduh data bank soal sesuai scope pengguna dalam format CSV."
        >
          <ConfirmLinkButton
            href="/api/question-bank/export"
            confirmMessage="Export bank soal ke CSV sekarang?"
          >
            Export CSV
          </ConfirmLinkButton>
        </DashboardCard>

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
            description="Preview staging tidak menyimpan data. Form assignment dan import soal memakai validasi sebelum commit. Import kelas tersedia sebagai preview matrix dan memakai backend legacy."
          />

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
        </>
      ) : null}
    </div>
  );
}
