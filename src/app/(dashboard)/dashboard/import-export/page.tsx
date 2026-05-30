import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import {
  importTemplates,
  type TemplateType,
} from "@/features/import-export/templates";
import { ImportPreviewForm } from "@/features/import-export/components/import-preview-form";
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

export default async function ImportExportPage() {
  await requirePermission("import_export.view");
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
        <DashboardCard
          title="Export Nilai"
          description="Unduh rekap nilai peserta dari modul reports dalam format CSV."
        >
          <Link
            href="/api/reports/export"
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Export CSV
          </Link>
        </DashboardCard>

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

      <ImportPreviewForm />

      <DashboardCard
        title="Catatan Import"
        description="Sprint ini menyiapkan template dan staging readiness. Eksekusi import otomatis tetap dipisahkan agar validasi data akademik bisa dibuat aman di sprint berikutnya."
      />
    </div>
  );
}
