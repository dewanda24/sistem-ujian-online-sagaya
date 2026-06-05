import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ConfirmLinkButton } from "@/components/dashboard/confirm-link-button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { ImportPreviewForm } from "@/features/import-export/components/import-preview-form";
import {
  getImportExportHistories,
  type ExportHistoryRow,
  type ImportHistoryRow,
} from "@/features/import-export/queries";
import {
  importTemplates,
  type TemplateType,
} from "@/features/import-export/templates";
import { ExcelImportForm } from "@/features/question-bank/components/excel-import-form";
import { WordImportForm } from "@/features/question-bank/components/word-import-form";
import {
  getQuestionCategoryOptions,
  getScopedSubjectOptions,
} from "@/features/question-bank/queries";
import { hasPermission } from "@/lib/auth/has-permission";
import { requirePermission } from "@/lib/auth/require-permission";
import { getEnvStatus } from "@/lib/env";
import { cn } from "@/lib/utils";

type CenterTab =
  | "import"
  | "export"
  | "import-history"
  | "export-history"
  | "environment";

type PageProps = {
  searchParams: Promise<{
    tab?: string;
    notice?: string;
    status?: string;
    message?: string;
  }>;
};

const templateTypes: TemplateType[] = [
  "students",
  "teachers",
  "classes",
  "student-class-assignments",
  "teacher-subject-assignments",
  "questions",
];

const importSteps = [
  "Pilih Modul",
  "Template",
  "Upload",
  "Validasi",
  "Preview",
  "Commit",
  "Result",
];

const exportItems = [
  {
    title: "Export Guru",
    description: "Data guru sesuai scope sekolah.",
    href: "/api/data-export/teachers",
    available: true,
  },
  {
    title: "Export Siswa",
    description: "Data siswa sesuai scope sekolah.",
    href: "/api/data-export/students",
    available: true,
  },
  {
    title: "Export Kelas",
    description: "Data kelas, tahun ajaran, dan wali kelas.",
    href: "/api/data-export/classes",
    available: true,
  },
  {
    title: "Export Assignment Guru",
    description: "Relasi guru, mapel, kelas, dan tahun ajaran.",
    href: "/api/data-export/teacher-assignments",
    available: true,
  },
  {
    title: "Export Assignment Siswa",
    description: "Backend export assignment siswa belum tersedia.",
    href: "",
    available: false,
  },
  {
    title: "Export Bank Soal",
    description: "Bank soal sesuai scope pengguna.",
    href: "/api/question-bank/export",
    available: true,
  },
  {
    title: "Export Nilai",
    description: "Rekap nilai dari modul laporan.",
    href: "/api/reports/export",
    available: true,
    permission: "reports.export",
  },
  {
    title: "Export Monitoring",
    description: "Data monitoring ujian.",
    href: "/api/monitoring/export",
    available: true,
    permission: "exam_monitoring.view",
  },
];

export default async function ImportExportPage({ searchParams }: PageProps) {
  const user = await requirePermission("import_export.view");
  const params = await searchParams;
  const isSuperAdmin = user.roles?.name === "super_admin";
  const activeTab = normalizeTab(params.tab, isSuperAdmin);
  const canManageQuestions =
    isSuperAdmin || hasPermission(user, "question_bank.manage");

  if (!hasPermission(user, "import_export.view")) {
    redirect("/dashboard/forbidden");
  }

  const [subjects, categories, histories] = await Promise.all([
    canManageQuestions ? getScopedSubjectOptions() : Promise.resolve([]),
    canManageQuestions ? getQuestionCategoryOptions() : Promise.resolve([]),
    getImportExportHistories(),
  ]);
  const envStatus = isSuperAdmin ? getEnvStatus() : [];

  return (
    <div className="space-y-6">
      <ActionToast
        status={params.notice ?? params.status}
        message={params.message}
      />
      <DashboardPageHeader
        title="Import / Export Center"
        description="Pusat operasional resmi untuk import data, export data, riwayat, dan status environment."
      />

      <nav className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2 shadow-sm">
        {getTabs(isSuperAdmin).map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/import-export?tab=${tab.value}`}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {activeTab === "import" ? (
        <ImportDataTab
          canManageQuestions={canManageQuestions}
          notice={params.notice}
          message={params.message}
          subjects={subjects}
          categories={categories}
        />
      ) : null}

      {activeTab === "export" ? <ExportDataTab user={user} /> : null}

      {activeTab === "import-history" ? (
        <ImportHistoryTab
          rows={histories.imports}
          unavailable={histories.unavailable}
        />
      ) : null}

      {activeTab === "export-history" ? (
        <ExportHistoryTab
          rows={histories.exports}
          unavailable={histories.unavailable}
        />
      ) : null}

      {activeTab === "environment" && isSuperAdmin ? (
        <EnvironmentTab envStatus={envStatus} />
      ) : null}
    </div>
  );
}

function ImportDataTab({
  canManageQuestions,
  notice,
  message,
  subjects,
  categories,
}: {
  canManageQuestions: boolean;
  notice?: string;
  message?: string;
  subjects: Awaited<ReturnType<typeof getScopedSubjectOptions>>;
  categories: Awaited<ReturnType<typeof getQuestionCategoryOptions>>;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Wizard Import Data</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Preview hanya memvalidasi dan menampilkan data. Database baru berubah
            saat Commit atau Import Sekarang dijalankan.
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-7">
          {importSteps.map((step, index) => (
            <div key={step} className="rounded-md border px-3 py-2 text-sm">
              <div className="text-xs text-muted-foreground">
                Step {index + 1}
              </div>
              <div className="font-medium">{step}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                Download Template CSV
              </Link>
            </DashboardCard>
          );
        })}
        <DashboardCard
          title="Template Bank Soal Word"
          description="Template DOCX resmi untuk import Bank Soal Word."
          className="h-full"
        >
          <Link
            href="/api/templates/questions-word"
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Download Template Word
          </Link>
        </DashboardCard>
      </section>

      <ImportPreviewForm />

      {canManageQuestions ? (
        <>
          <ExcelImportForm notice={notice} message={message} />
          <WordImportForm
            subjects={subjects}
            categories={categories}
            notice={notice}
            message={message}
          />
        </>
      ) : (
        <DashboardCard
          title="Bank Soal Excel/CSV dan Word"
          description="Backend tersedia, tetapi user ini belum memiliki izin question_bank.manage."
        />
      )}
    </div>
  );
}

function ExportDataTab({ user }: { user: Awaited<ReturnType<typeof requirePermission>> }) {
  const visibleItems = exportItems.filter(
    (item) => !item.permission || hasPermission(user, item.permission),
  );

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visibleItems.map((item) => (
        <DashboardCard
          key={item.title}
          title={item.title}
          description={item.description}
          className="h-full"
        >
          <div className="flex flex-wrap gap-2">
            {item.available ? (
              <ConfirmLinkButton
                href={item.href}
                confirmMessage={`${item.title} ke CSV sekarang?`}
              >
                Export CSV
              </ConfirmLinkButton>
            ) : (
              <span className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                Backend belum tersedia
              </span>
            )}
            <span className="rounded-md border px-3 py-2 text-sm text-muted-foreground opacity-70">
              Excel Coming Soon
            </span>
          </div>
        </DashboardCard>
      ))}
    </section>
  );
}

function ImportHistoryTab({
  rows,
  unavailable,
}: {
  rows: ImportHistoryRow[];
  unavailable: boolean;
}) {
  return (
    <DataTable
      columns={[
        "Tanggal",
        "Modul",
        "User",
        "Total Data",
        "Berhasil",
        "Gagal",
        "Status",
        "Aksi",
      ]}
      isEmpty={rows.length === 0}
      empty={
        unavailable
          ? "Riwayat belum dapat dibaca dari audit_logs."
          : "Belum ada riwayat import."
      }
    >
      {rows.map((row) => (
        <tr key={row.id}>
          <td className="whitespace-nowrap px-4 py-3">{formatDate(row.date)}</td>
          <td className="px-4 py-3 font-medium">{row.module}</td>
          <td className="px-4 py-3">{row.user}</td>
          <td className="px-4 py-3">{row.total}</td>
          <td className="px-4 py-3">{row.success}</td>
          <td className="px-4 py-3">{row.failed}</td>
          <td className="px-4 py-3">
            <StatusBadge label={row.status} />
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <DownloadJsonLink
                filename={`import-result-${row.id}.json`}
                label="Download Result"
                payload={row.payload}
              />
              <DownloadJsonLink
                filename={`import-error-log-${row.id}.json`}
                label="Download Error Log"
                payload={pickErrors(row.payload)}
              />
            </div>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}

function ExportHistoryTab({
  rows,
  unavailable,
}: {
  rows: ExportHistoryRow[];
  unavailable: boolean;
}) {
  return (
    <DataTable
      columns={[
        "Tanggal",
        "Modul",
        "User",
        "Jumlah Data",
        "Format",
        "Status",
      ]}
      isEmpty={rows.length === 0}
      empty={
        unavailable
          ? "Riwayat belum dapat dibaca dari audit_logs."
          : "Belum ada riwayat export."
      }
    >
      {rows.map((row) => (
        <tr key={row.id}>
          <td className="whitespace-nowrap px-4 py-3">{formatDate(row.date)}</td>
          <td className="px-4 py-3 font-medium">{row.module}</td>
          <td className="px-4 py-3">{row.user}</td>
          <td className="px-4 py-3">{row.rowCount}</td>
          <td className="px-4 py-3">{row.format}</td>
          <td className="px-4 py-3">
            <StatusBadge label={row.status} />
          </td>
        </tr>
      ))}
    </DataTable>
  );
}

function EnvironmentTab({
  envStatus,
}: {
  envStatus: Array<{ key: string; configured: boolean }>;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {envStatus.map((item) => (
        <DashboardCard key={item.key} title={item.key}>
          <StatusBadge label={item.configured ? "Ready" : "Missing"} />
        </DashboardCard>
      ))}
    </section>
  );
}

function StatusBadge({ label }: { label: string }) {
  const className =
    label === "Ready" || label === "Valid" || label === "Success"
      ? "bg-emerald-100 text-emerald-700"
      : label === "Missing" || label === "Error" || label === "Failed"
        ? "bg-red-100 text-red-700"
        : label === "Partial Success"
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}

function DownloadJsonLink({
  filename,
  label,
  payload,
}: {
  filename: string;
  label: string;
  payload: unknown;
}) {
  return (
    <a
      download={filename}
      href={`data:application/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(payload ?? {}, null, 2),
      )}`}
      className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
    >
      {label}
    </a>
  );
}

function pickErrors(payload: Record<string, unknown>) {
  return {
    failed_rows: payload.failed_rows ?? null,
    sample_errors: payload.sample_errors ?? null,
    error_count: payload.error_count ?? payload.failed_count ?? 0,
  };
}

function getTabs(isSuperAdmin: boolean) {
  const tabs: Array<{ value: CenterTab; label: string }> = [
    { value: "import", label: "Import Data" },
    { value: "export", label: "Export Data" },
    { value: "import-history", label: "Riwayat Import" },
    { value: "export-history", label: "Riwayat Export" },
  ];

  if (isSuperAdmin) {
    tabs.push({ value: "environment", label: "Environment" });
  }

  return tabs;
}

function normalizeTab(value: string | undefined, isSuperAdmin: boolean): CenterTab {
  const allowed = getTabs(isSuperAdmin).map((tab) => tab.value);

  return allowed.includes(value as CenterTab) ? (value as CenterTab) : "import";
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
