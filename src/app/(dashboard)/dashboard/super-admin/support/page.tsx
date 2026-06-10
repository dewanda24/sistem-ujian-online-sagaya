import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable } from "@/components/master-data/data-table";
import { getSuperAdminDashboardData } from "@/features/super-admin/school-management";
import { requireRole } from "@/lib/auth/require-role";

export default async function SuperAdminSupportPage() {
  await requireRole("super_admin");
  const { summary, attentionSchools, notifications } =
    await getSuperAdminDashboardData();
  const supportRows = attentionSchools.flatMap((school) => {
    const rows = [];

    if (school.stats.adminCount === 0) {
      rows.push({
        school,
        issue: "Login bermasalah",
        action: "Tambahkan atau aktifkan Admin Sekolah.",
      });
    }

    if (school.readiness.status !== "ready") {
      rows.push({
        school,
        issue: "Sekolah belum siap CBT",
        action: school.readiness.missing.slice(0, 3).join(", "),
      });
    }

    if (school.health.issues.includes("Backup gagal")) {
      rows.push({
        school,
        issue: "Backup gagal",
        action: "Buat backup ulang atau cek histori backup.",
      });
    }

    if (school.health.issues.includes("Import gagal")) {
      rows.push({
        school,
        issue: "Import gagal",
        action: "Cek log import dan validasi template.",
      });
    }

    return rows;
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Bantuan Sekolah"
        description="Pusat tindak lanjut untuk sekolah yang mengalami kendala operasional."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Login Bermasalah"
          value={String(summary.loginIssues)}
          description="Admin sekolah belum tersedia."
        />
        <DashboardCard
          title="Import Gagal"
          value={String(summary.importFailed)}
          description="Job import global gagal."
        />
        <DashboardCard
          title="Backup Gagal"
          value={String(summary.backupFailed)}
          description="Backup sekolah gagal."
        />
        <DashboardCard
          title="Belum Siap CBT"
          value={String(summary.attentionSchools)}
          description="Setup inti belum lengkap."
        />
      </section>

      <DataTable
        columns={["Sekolah", "Masalah", "Tindakan Disarankan", "Aksi"]}
        isEmpty={supportRows.length === 0}
        empty={
          <EmptyState
            title="Tidak ada masalah sekolah"
            description="Tidak ada sekolah yang membutuhkan tindak lanjut saat ini."
          />
        }
      >
        {supportRows.map((row) => (
          <tr key={`${row.school.id}-${row.issue}`}>
            <td className="px-4 py-3">
              <div className="font-medium">{row.school.name}</div>
              <div className="text-xs text-muted-foreground">
                {row.school.city || "-"}
              </div>
            </td>
            <td className="px-4 py-3">{row.issue}</td>
            <td className="px-4 py-3">{row.action || "-"}</td>
            <td className="px-4 py-3">
              <Link
                href={`/dashboard/super-admin/schools/${row.school.id}`}
                className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
              >
                Tindak Lanjut
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>

      <DashboardCard
        title="Notification Center"
        description="Daftar notifikasi prioritas dari dashboard pusat."
      >
        <div className="space-y-2">
          {notifications.length > 0 ? (
            notifications.map((item, index) => (
              <Link
                key={`${item.title}-${item.description}-${index}`}
                href={item.href}
                className="block rounded-md border px-3 py-2 text-sm hover:bg-muted"
              >
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground">
                  {item.description}
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              title="Tidak ada notifikasi"
              description="Belum ada notifikasi yang membutuhkan tindakan."
            />
          )}
        </div>
      </DashboardCard>
    </div>
  );
}
