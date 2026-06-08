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
        title="Cadangan & Pemulihan"
        description="Kontrol kesiapan cadangan data dan prosedur pemulihan produksi."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Status Backup"
          description="Ringkasan kesiapan cadangan manual sebelum otomatisasi dibuat."
        >
          <div className="space-y-3 text-sm">
            <ReadinessRow
              label="Environment wajib"
              value={`${readyEnvCount}/${envStatus.length}`}
              ready={readyEnvCount === envStatus.length}
            />
            <ReadinessRow
              label="Kunci layanan server"
              value={
                envStatus.find(
                  (item) => item.key === "SUPABASE_SERVICE_ROLE_KEY",
                )?.configured
                  ? "Siap"
                  : "Belum Siap"
              }
              ready={Boolean(
                envStatus.find(
                  (item) => item.key === "SUPABASE_SERVICE_ROLE_KEY",
                )?.configured,
              )}
            />
            <ReadinessRow label="Cadangan otomatis" value="Belum aktif" />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Jadwal Rekomendasi"
          description="SOP dasar sampai cadangan otomatis disiapkan."
        >
          <div className="space-y-3 text-sm">
            <ReadinessRow label="Sebelum migrasi" value="Wajib cadangkan" ready />
            <ReadinessRow label="Sebelum simulasi besar" value="Wajib cadangkan" ready />
            <ReadinessRow label="Harian produksi" value="Manual/Supabase" />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Target Pemulihan"
          description="Target operasional untuk pemulihan data."
        >
          <div className="space-y-3 text-sm">
            <ReadinessRow label="RPO awal" value="24 jam" />
            <ReadinessRow label="RTO awal" value="Upaya terbaik" />
            <ReadinessRow label="Runbook" value="Tersedia di halaman ini" ready />
          </div>
        </DashboardCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          title="Daftar Cek Cadangan"
          description="Lakukan ini sebelum migrasi, demo besar, atau ujian produksi."
        >
          <ChecklistItem done label="Pastikan semua pengguna keluar dari sesi perubahan data." />
          <ChecklistItem done label="Unduh/cadangkan database dari Supabase dashboard." />
          <ChecklistItem done label="Catat waktu cadangan dan nama operator." />
          <ChecklistItem done label="Jalankan migrasi hanya setelah cadangan berhasil." />
          <ChecklistItem label="Simpan file cadangan di penyimpanan internal sekolah." />
          <ChecklistItem label="Uji pemulihan di proyek uji coba secara berkala." />
        </DashboardCard>

        <DashboardCard
          title="Panduan Pemulihan"
          description="Langkah darurat jika migrasi/import merusak data."
        >
          <ol className="space-y-3 text-sm leading-6 text-muted-foreground">
            <li>1. Hentikan sementara aktivitas perubahan data dari beranda.</li>
            <li>2. Identifikasi waktu kejadian dan modul yang terdampak.</li>
            <li>3. Cek Catatan Aktivitas untuk aksi terakhir sebelum insiden.</li>
            <li>4. Pulihkan cadangan terakhir ke proyek uji coba untuk verifikasi.</li>
            <li>5. Jika data valid, lakukan pemulihan produksi sesuai SOP Supabase.</li>
            <li>6. Setelah pemulihan, uji login, data sekolah, ujian, dan laporan.</li>
          </ol>
        </DashboardCard>
      </section>

      <DashboardCard
        title="Catatan"
        description="Halaman ini belum menjalankan cadangan otomatis dari aplikasi."
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Cadangan database tetap dilakukan dari Supabase dashboard atau alur
          operasional yang disetujui. Integrasi cadangan otomatis sebaiknya
          dibuat setelah RLS dan penguatan keamanan final agar akses produksi
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
