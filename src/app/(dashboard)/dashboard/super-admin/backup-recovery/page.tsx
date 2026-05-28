import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { requireRole } from "@/lib/auth/require-role";

export default async function BackupRecoveryPage() {
  await requireRole("super_admin");

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Backup / Recovery"
        description="Kontrol kesiapan backup dan prosedur recovery produksi."
      />
      <EmptyState
        title="Backup otomatis belum diaktifkan"
        description="Gunakan prosedur backup Supabase dari dokumentasi deployment sampai desain automation dan permission operasional disetujui."
      />
    </div>
  );
}
