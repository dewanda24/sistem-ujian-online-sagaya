import Link from "next/link";
import type { ReactNode } from "react";

import { ActionsMenu } from "@/components/dashboard/actions-menu";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { StatusBadge } from "@/components/master-data/status-badge";
import { getBackupStatusSummary } from "@/features/super-admin/advanced";
import { getSuperAdminDashboardData } from "@/features/super-admin/school-management";
import { requireRole } from "@/lib/auth/require-role";

export default async function SuperAdminDashboardPage() {
  await requireRole("super_admin");
  const [{ summary, schools, attentionSchools, notifications }, backupStatus] =
    await Promise.all([
      getSuperAdminDashboardData(),
      getBackupStatusSummary(),
    ]);
  const totalUsers =
    summary.totalAdmins + summary.totalTeachers + summary.totalStudents;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Dashboard Pusat"
        description="Ringkasan kondisi seluruh sekolah dan aktivitas sistem."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Total Sekolah"
          value={String(summary.totalSchools)}
          description="Sekolah yang sudah terdaftar di sistem."
        />
        <DashboardCard
          title="Sekolah Aktif"
          value={String(summary.activeSchools)}
          description="Sekolah yang aktif menggunakan sistem."
        />
        <DashboardCard
          title="Total Pengguna"
          value={String(totalUsers)}
          description="Akun admin sekolah, guru, dan siswa."
        />
        <DashboardCard
          title="Ujian Berjalan"
          value={String(summary.totalActiveExams)}
          description="Ujian yang sedang berlangsung di sekolah."
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <DashboardCard
          title="Perlu Ditindaklanjuti"
          description="Kondisi sekolah atau data yang perlu dicek."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <AttentionLink
              label="Sekolah belum siap ujian"
              value={summary.attentionSchools}
              href="/dashboard/super-admin/support"
            />
            <AttentionLink
              label="Backup gagal"
              value={summary.backupFailed}
              href="/dashboard/super-admin/backup-recovery"
            />
            <AttentionLink
              label="Import gagal"
              value={summary.importFailed}
              href="/dashboard/super-admin/import-export?tab=history"
            />
            <AttentionLink
              label="Login bermasalah"
              value={summary.loginIssues}
              href="/dashboard/super-admin/support"
            />
          </div>
        </DashboardCard>

        <DashboardCard title="Aksi Cepat" description="Akses cepat untuk pekerjaan harian Super Admin.">
          <div className="grid gap-2 text-sm">
            <QuickAction href="/dashboard/super-admin/schools/new" label="Tambah Sekolah" />
            <QuickAction href="/dashboard/super-admin/admins" label="Tambah Admin Sekolah" />
            <QuickAction href="/dashboard/super-admin/import-export?tab=import" label="Import Data" />
            <QuickAction href="/dashboard/super-admin/backup-recovery" label="Backup Data" />
          </div>
        </DashboardCard>
      </section>

      <DashboardCard
        title="Status Cadangan Data"
        description="Ringkasan cadangan dan pemulihan data sistem."
      >
        <div className="grid gap-3 text-sm sm:grid-cols-4">
          <BackupStatusItem
            label="Backup terakhir"
            value={formatDateTime(backupStatus.latestBackup?.created_at)}
          />
          <BackupStatusItem
            label="Status backup"
            value={backupStatus.latestBackup?.status ?? "Belum ada"}
            tone={backupStatus.latestBackup?.status === "completed" ? "ok" : "warn"}
          />
          <BackupStatusItem
            label="Jumlah backup"
            value={backupStatus.unavailable ? "Tidak tersedia" : String(backupStatus.total)}
          />
          <BackupStatusItem
            label="Restore terakhir"
            value={formatDateTime(backupStatus.latestRestore?.restored_at)}
            tone={backupStatus.latestRestore ? "ok" : "warn"}
          />
        </div>
        <div className="mt-3">
          <Link
            href="/dashboard/super-admin/backup-recovery"
            className="text-sm font-medium text-primary hover:underline"
          >
            Buka Cadangan & Pemulihan
          </Link>
        </div>
      </DashboardCard>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <DashboardCard
          title="Pusat Pemberitahuan"
          description="Pemberitahuan yang perlu ditinjau."
        >
          <div className="space-y-2">
            {notifications.length > 0 ? (
              notifications.map((item, index) => (
                <Link
                  key={`${item.title}-${item.description}-${index}`}
                  href={item.href}
                  className="block rounded-md border px-3 py-2 text-sm hover:bg-muted"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.title}</span>
                    <span
                      className={
                        item.priority === "high"
                          ? "rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                          : "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                      }
                    >
                      {item.priority === "high" ? "Tinggi" : "Sedang"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                title="Tidak ada notifikasi"
                description="Semua sekolah terlihat aman untuk saat ini."
              />
            )}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Sekolah Prioritas"
          description="Sekolah yang perlu dibantu agar pelaksanaan ujian berjalan lancar."
        >
          <div className="space-y-2">
            {attentionSchools.slice(0, 6).map((school) => (
              <Link
                key={school.id}
                href={`/dashboard/super-admin/schools/${school.id}`}
                className="grid gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="font-medium">{school.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {school.readiness.missing.slice(0, 2).join(", ") || "Perlu dicek"}
                  </div>
                </div>
                <SchoolHealthBadge status={school.health.status} />
              </Link>
            ))}
            {attentionSchools.length === 0 ? (
              <EmptyState
                title="Semua sekolah siap"
                description="Tidak ada sekolah yang membutuhkan perhatian saat ini."
              />
            ) : null}
          </div>
        </DashboardCard>
      </section>

      <DataTable
        columns={["Nama Sekolah", "Status", "Kesiapan Ujian", "Kondisi", "Admin", "Guru", "Siswa", "Aksi"]}
        isEmpty={schools.length === 0}
        empty={
          <EmptyState
            title="Belum ada sekolah"
            description="Tambahkan sekolah untuk mulai memantau kesiapan ujian."
          />
        }
      >
        {schools.map((school) => (
          <tr key={school.id}>
            <td className="px-4 py-3">
              <div className="font-medium">{school.name}</div>
              <div className="text-xs text-muted-foreground">
                {[school.city, school.province].filter(Boolean).join(", ") || "-"}
              </div>
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={Boolean(school.is_active)} />
            </td>
            <td className="px-4 py-3">
              <ReadinessBadge status={school.readiness.status} />
            </td>
            <td className="px-4 py-3">
              <SchoolHealthBadge status={school.health.status} />
            </td>
            <td className="px-4 py-3">{school.stats.adminCount}</td>
            <td className="px-4 py-3">{school.stats.teacherCount}</td>
            <td className="px-4 py-3">{school.stats.studentCount}</td>
            <td className="px-4 py-3">
              <ActionsMenu label="Aksi">
                <MenuLink href={`/dashboard/super-admin/schools/${school.id}`}>
                  Lihat Detail
                </MenuLink>
                <MenuLink href={`/dashboard/super-admin/users?school_id=${school.id}`}>
                  Lihat Pengguna
                </MenuLink>
                <MenuLink href="/dashboard/super-admin/backup-recovery">
                  Backup Sekolah
                </MenuLink>
              </ActionsMenu>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function BackupStatusItem({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "neutral";
}) {
  const className =
    tone === "ok"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : "text-foreground";

  return (
    <div className="rounded-md border px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-semibold ${className}`}>{value}</div>
    </div>
  );
}

function AttentionLink({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-md border px-3 py-2 transition hover:bg-muted"
    >
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </Link>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md border px-3 py-2 font-medium transition hover:bg-muted"
    >
      {label}
    </Link>
  );
}

function MenuLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
    >
      {children}
    </Link>
  );
}

function ReadinessBadge({ status }: { status: "ready" | "attention" | "not_ready" }) {
  const label =
    status === "ready"
      ? "Siap"
      : status === "attention"
        ? "Perlu Perhatian"
        : "Belum Siap";
  const className =
    status === "ready"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "attention"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-red-50 text-red-700 ring-red-200";

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ${className}`}>
      {label}
    </span>
  );
}

function SchoolHealthBadge({ status }: { status: "normal" | "attention" | "problem" }) {
  const label =
    status === "normal"
      ? "Normal"
      : status === "attention"
        ? "Perlu Perhatian"
        : "Bermasalah";
  const className =
    status === "normal"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "attention"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-red-50 text-red-700 ring-red-200";

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ${className}`}>
      {label}
    </span>
  );
}
