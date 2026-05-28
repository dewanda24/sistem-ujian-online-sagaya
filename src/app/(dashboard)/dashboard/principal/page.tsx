import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { getReportSummary } from "@/features/reports/queries";
import { requireRole } from "@/lib/auth/require-role";

export default async function PrincipalDashboardPage() {
  const user = await requireRole("principal");
  const summary = await getReportSummary();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Principal Dashboard"
        description={`Ringkasan performa ujian sekolah. Selamat datang, ${
          user.user_profiles?.full_name ?? user.username
        }.`}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Attempts"
          value={String(summary.totalAttempts)}
          description="Total attempt submitted/expired."
        />
        <DashboardCard
          title="Submitted"
          value={String(summary.submitted)}
          description="Peserta yang mengumpulkan ujian."
        />
        <DashboardCard
          title="Expired"
          value={String(summary.expired)}
          description="Attempt yang melewati batas waktu."
        />
        <DashboardCard
          title="Average"
          value={`${summary.averagePercent.toFixed(2)}%`}
          description="Rata-rata persentase nilai."
        />
      </div>
      <a
        href="/dashboard/reports"
        className="inline-flex rounded-md border px-4 py-2 text-sm hover:bg-muted"
      >
        Buka Reports
      </a>
    </div>
  );
}
