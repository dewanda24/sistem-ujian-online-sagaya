import Link from "next/link";
import type { ReactNode } from "react";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import {
  commitGlobalImportAction,
  previewGlobalImportAction,
} from "@/features/super-admin/advanced-actions";
import { getGlobalImportJobs } from "@/features/super-admin/advanced";
import { requireRole } from "@/lib/auth/require-role";

type PageProps = {
  searchParams: Promise<{
    tab?: string;
    type?: string;
    job_id?: string;
    status?: string;
    message?: string;
  }>;
};

const exportRows = [
  {
    module: "Sekolah",
    description: "Data tenant sekolah.",
    href: "/api/super-admin/export/schools",
  },
  {
    module: "User",
    description: "Semua user lintas sekolah dan role.",
    href: "/api/super-admin/export/users",
  },
  {
    module: "Laporan Global",
    description: "Ringkasan sekolah, user, dan ujian.",
    href: "/api/super-admin/export/reports",
  },
];

const templates = {
  schools:
    "name,npsn,education_level,address,city,province,email,phone,is_active\nSMA Contoh,12345678,SMA,Jl. Merdeka,Kota A,Provinsi A,admin@sma.test,021000,true",
  school_admins:
    "school_npsn,full_name,email,username,password,status\n12345678,Admin Sekolah,admin@sma.test,admin_sma,Password123,active",
};

export default async function SuperAdminImportExportPage({
  searchParams,
}: PageProps) {
  await requireRole("super_admin");
  const params = await searchParams;
  const activeTab = params.tab === "export" || params.tab === "history" ? params.tab : "import";
  const activeType = params.type === "school_admins" ? "school_admins" : "schools";
  const jobs = await getGlobalImportJobs();
  const selectedJob = jobs.rows.find((job) => job.id === params.job_id) ?? jobs.rows[0];

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Import & Export Global"
        description="Import sekolah/admin sekolah dengan preview validasi, serta export sekolah, user, dan laporan global."
      />

      <nav className="flex flex-wrap gap-2 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-sm">
        <TabLink active={activeTab === "import"} href="/dashboard/super-admin/import-export?tab=import">
          Import
        </TabLink>
        <TabLink active={activeTab === "export"} href="/dashboard/super-admin/import-export?tab=export">
          Export
        </TabLink>
        <TabLink active={activeTab === "history"} href="/dashboard/super-admin/import-export?tab=history">
          Log Import
        </TabLink>
      </nav>

      {activeTab === "import" ? (
        <div className="space-y-6">
          <section className="grid gap-4 lg:grid-cols-2">
            <DashboardCard
              title="Preview Import"
              description="Upload CSV untuk validasi template sebelum data diproses."
            >
              <form action={previewGlobalImportAction} className="space-y-3 text-sm">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Jenis Import
                  </span>
                  <select
                    name="type"
                    defaultValue={activeType}
                    className="rounded-md border px-3 py-2"
                  >
                    <option value="schools">Sekolah</option>
                    <option value="school_admins">Admin Sekolah</option>
                  </select>
                </label>
                <input
                  name="file"
                  type="file"
                  accept=".csv,text/csv"
                  className="block w-full rounded-md border px-3 py-2 text-sm"
                  required
                />
                <ConfirmSubmitButton
                  confirmMessage="Validasi file dan buat preview import?"
                  confirmTitle="Konfirmasi Preview Import"
                  variant="default"
                >
                  Preview Import
                </ConfirmSubmitButton>
              </form>
            </DashboardCard>

            <DashboardCard
              title="Template CSV"
              description="Gunakan header persis seperti template."
            >
              <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs leading-5">
                {templates[activeType]}
              </pre>
              <a
                download={`template-${activeType}.csv`}
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(templates[activeType])}`}
                className="mt-3 inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Unduh Template
              </a>
            </DashboardCard>
          </section>

          {selectedJob ? (
            <DashboardCard
              title="Preview Terakhir"
              description="Commit hanya tersedia jika semua baris valid."
            >
              <div className="grid gap-3 text-sm md:grid-cols-4">
                <Metric label="Jenis" value={selectedJob.type} />
                <Metric label="Total" value={String(selectedJob.total_rows)} />
                <Metric label="Valid" value={String(selectedJob.valid_rows)} />
                <Metric label="Invalid" value={String(selectedJob.invalid_rows)} />
              </div>
              {selectedJob.invalid_rows === 0 && selectedJob.status === "previewed" ? (
                <form action={commitGlobalImportAction} className="mt-4">
                  <input type="hidden" name="job_id" value={selectedJob.id} />
                  <ConfirmSubmitButton
                    confirmMessage="Commit import valid ke database sekarang?"
                    confirmTitle="Konfirmasi Commit Import"
                    variant="default"
                  >
                    Commit Import
                  </ConfirmSubmitButton>
                </form>
              ) : null}
              {selectedJob.errors.length > 0 ? (
                <div className="mt-4">
                  <DataTable
                    columns={["Baris", "Error"]}
                    enableSearch={false}
                    enablePagination={false}
                    enableColumnVisibility={false}
                    isEmpty={selectedJob.errors.length === 0}
                  >
                    {selectedJob.errors.slice(0, 20).map((error) => (
                      <tr key={error.row_number}>
                        <td className="px-4 py-3">{error.row_number}</td>
                        <td className="px-4 py-3">{error.errors.join(", ")}</td>
                      </tr>
                    ))}
                  </DataTable>
                </div>
              ) : null}
            </DashboardCard>
          ) : null}
        </div>
      ) : null}

      {activeTab === "export" ? (
        <DataTable columns={["Data", "Deskripsi", "CSV", "Excel", "PDF"]}>
          {exportRows.map((row) => (
            <tr key={row.module}>
              <td className="px-4 py-3 font-medium">{row.module}</td>
              <td className="px-4 py-3">{row.description}</td>
              <td className="px-4 py-3">
                <a className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted" href={`${row.href}?format=csv`}>
                  CSV
                </a>
              </td>
              <td className="px-4 py-3">
                <a className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted" href={`${row.href}?format=xlsx`}>
                  Excel
                </a>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground">
                  Belum tersedia
                </span>
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {activeTab === "history" ? (
        <DataTable
          columns={["Waktu", "Jenis", "File", "Status", "Total", "Valid", "Invalid"]}
          isEmpty={jobs.rows.length === 0}
          empty={
            <EmptyState
              title={jobs.unavailable ? "Log import belum tersedia" : "Belum ada log import"}
              description={
                jobs.unavailable
                  ? "Jalankan migration backend Super Admin terlebih dahulu."
                  : "Log hasil import akan muncul setelah preview atau commit."
              }
            />
          }
        >
          {jobs.rows.map((job) => (
            <tr key={job.id}>
              <td className="px-4 py-3">
                {job.created_at
                  ? new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(job.created_at))
                  : "-"}
              </td>
              <td className="px-4 py-3">{job.type}</td>
              <td className="px-4 py-3">{job.filename ?? "-"}</td>
              <td className="px-4 py-3">{job.status}</td>
              <td className="px-4 py-3">{job.total_rows}</td>
              <td className="px-4 py-3">{job.valid_rows}</td>
              <td className="px-4 py-3">{job.invalid_rows}</td>
            </tr>
          ))}
        </DataTable>
      ) : null}
    </div>
  );
}

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-sm font-medium ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
