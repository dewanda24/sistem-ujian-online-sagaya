import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { getEnvStatus } from "@/lib/env";
import { requireRole } from "@/lib/auth/require-role";

export default async function BackupRecoveryPage() {
  await requireRole("super_admin");
  const envStatus = getEnvStatus();
  const readyEnvCount = envStatus.filter((item) => item.configured).length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Backup / Recovery"
        description="Kontrol kesiapan backup dan prosedur recovery produksi."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Status Backup"
          description="Ringkasan kesiapan backup manual sebelum automation dibuat."
        >
          <div className="space-y-3 text-sm">
            <ReadinessRow
              label="Environment wajib"
              value={`${readyEnvCount}/${envStatus.length}`}
              ready={readyEnvCount === envStatus.length}
            />
            <ReadinessRow
              label="Service role server"
              value={
                envStatus.find(
                  (item) => item.key === "SUPABASE_SERVICE_ROLE_KEY",
                )?.configured
                  ? "Ready"
                  : "Missing"
              }
              ready={Boolean(
                envStatus.find(
                  (item) => item.key === "SUPABASE_SERVICE_ROLE_KEY",
                )?.configured,
              )}
            />
            <ReadinessRow label="Backup otomatis" value="Belum aktif" />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Jadwal Rekomendasi"
          description="Baseline SOP sampai automation backup disiapkan."
        >
          <div className="space-y-3 text-sm">
            <ReadinessRow label="Sebelum migration" value="Wajib backup" ready />
            <ReadinessRow label="Sebelum simulasi besar" value="Wajib backup" ready />
            <ReadinessRow label="Harian production" value="Manual/Supabase" />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Recovery Target"
          description="Target operasional untuk pemulihan data."
        >
          <div className="space-y-3 text-sm">
            <ReadinessRow label="RPO awal" value="24 jam" />
            <ReadinessRow label="RTO awal" value="Best effort" />
            <ReadinessRow label="Runbook" value="Tersedia di halaman ini" ready />
          </div>
        </DashboardCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          title="Checklist Backup"
          description="Lakukan ini sebelum migration, demo besar, atau ujian produksi."
        >
          <ChecklistItem done label="Pastikan semua user keluar dari sesi admin mutasi data." />
          <ChecklistItem done label="Export/backup database dari Supabase dashboard." />
          <ChecklistItem done label="Catat timestamp backup dan operator." />
          <ChecklistItem done label="Jalankan migration hanya setelah backup berhasil." />
          <ChecklistItem label="Simpan file backup di storage internal sekolah." />
          <ChecklistItem label="Uji restore di project staging secara berkala." />
        </DashboardCard>

        <DashboardCard
          title="Runbook Recovery"
          description="Langkah darurat jika migration/import merusak data."
        >
          <ol className="space-y-3 text-sm leading-6 text-muted-foreground">
            <li>1. Hentikan sementara aktivitas mutasi data dari dashboard.</li>
            <li>2. Identifikasi waktu kejadian dan modul yang terdampak.</li>
            <li>3. Cek Audit Logs untuk action terakhir sebelum insiden.</li>
            <li>4. Restore backup terakhir ke staging untuk verifikasi.</li>
            <li>5. Jika data valid, lakukan restore production sesuai SOP Supabase.</li>
            <li>6. Setelah recovery, jalankan smoke test login, master data, ujian, dan report.</li>
          </ol>
        </DashboardCard>
      </section>

      <DashboardCard
        title="Catatan"
        description="Halaman ini belum menjalankan backup otomatis dari aplikasi."
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Backup database tetap dilakukan dari Supabase dashboard atau pipeline
          operasional yang disetujui. Integrasi automation backup sebaiknya
          dibuat setelah RLS dan security hardening final agar akses produksi
          tidak terlalu luas.
        </p>
      </DashboardCard>
    </div>
  );
}

function ReadinessRow({
  label,
  value,
  ready,
}: {
  label: string;
  value: string;
  ready?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          ready
            ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
            : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

function ChecklistItem({ done = false, label }: { done?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 border-b py-2 text-sm last:border-b-0">
      <span
        className={
          done
            ? "h-2.5 w-2.5 rounded-full bg-emerald-500"
            : "h-2.5 w-2.5 rounded-full bg-amber-500"
        }
      />
      <span>{label}</span>
    </div>
  );
}
