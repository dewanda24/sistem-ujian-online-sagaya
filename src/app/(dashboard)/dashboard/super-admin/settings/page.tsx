import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { requireRole } from "@/lib/auth/require-role";

export default async function SystemSettingsPage() {
  await requireRole("super_admin");

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Settings Sistem"
        description="Area konfigurasi global aplikasi untuk super admin."
      />
      <EmptyState
        title="Settings sistem belum diaktifkan"
        description="Route sudah diproteksi untuk super admin. Implementasi penyimpanan setting membutuhkan desain schema terpisah."
      />
    </div>
  );
}
