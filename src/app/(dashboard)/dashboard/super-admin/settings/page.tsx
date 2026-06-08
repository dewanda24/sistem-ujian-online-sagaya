import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { OperationalResetCard } from "@/features/operational-reset/components/operational-reset-card";
import { getEnvStatus } from "@/lib/env";
import { requireRole } from "@/lib/auth/require-role";

export default async function SystemSettingsPage() {
  await requireRole("super_admin");
  const envStatus = getEnvStatus();
  const appName =
    process.env.NEXT_PUBLIC_APP_NAME || "Sistem Ujian Online Sagaya";
  const appEnvironment =
    process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development";
  const maintenanceMode =
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  const configuredCount = envStatus.filter((item) => item.configured).length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Pengaturan Sistem"
        description="Konfigurasi runtime dan kesiapan produksi. Nilai rahasia tidak ditampilkan."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Aplikasi"
          description="Identitas aplikasi yang dibaca dari environment."
        >
          <div className="space-y-3 text-sm">
            <SettingRow label="Nama aplikasi" value={appName} />
            <SettingRow label="Lingkungan" value={appEnvironment} />
            <SettingRow
              label="Maintenance"
              value={maintenanceMode ? "Aktif" : "Nonaktif"}
              tone={maintenanceMode ? "danger" : "success"}
            />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Lingkungan Sistem"
          description="Status variabel wajib untuk Supabase dan akun admin."
        >
          <div className="space-y-2 text-sm">
            {envStatus.map((item) => (
              <SettingRow
                key={item.key}
                label={item.key}
                value={item.configured ? "Siap" : "Belum Siap"}
                tone={item.configured ? "success" : "danger"}
              />
            ))}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Kesiapan"
          description="Ringkasan kesiapan konfigurasi server."
        >
          <div className="space-y-3 text-sm">
            <SettingRow
              label="Variabel wajib"
              value={`${configuredCount}/${envStatus.length}`}
              tone={configuredCount === envStatus.length ? "success" : "danger"}
            />
            <SettingRow
              label="API akun admin"
              value={
                envStatus.find(
                  (item) => item.key === "SUPABASE_SERVICE_ROLE_KEY",
                )?.configured
                  ? "Aktif"
                  : "Tidak aktif"
              }
              tone={
                envStatus.find(
                  (item) => item.key === "SUPABASE_SERVICE_ROLE_KEY",
                )?.configured
                  ? "success"
                  : "danger"
              }
            />
            <SettingRow label="RLS" value="Belum tahap penguatan" />
          </div>
        </DashboardCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          title="Daftar Cek Keamanan"
          description="Daftar cek operasional sebelum rilis produksi."
        >
          <ChecklistItem done label="Login dan hak akses aktif" />
          <ChecklistItem done label="Catatan aktivitas tersedia" />
          <ChecklistItem done label="Kunci layanan hanya dipakai di server" />
          <ChecklistItem done={configuredCount === envStatus.length} label="Variabel wajib lengkap" />
          <ChecklistItem label="Penguatan RLS produksi belum dieksekusi" />
          <ChecklistItem label="Backup otomatis belum diaktifkan" />
        </DashboardCard>

        <DashboardCard
          title="Catatan Konfigurasi"
          description="Pengaturan saat ini sengaja hanya-baca agar tidak membutuhkan struktur database baru."
        >
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Untuk mengubah nama aplikasi, lingkungan, atau mode perawatan,
              gunakan variabel lingkungan di Vercel/server.
            </p>
            <p>
              Pengaturan permanen seperti logo sekolah, aturan keamanan ujian global,
              dan kebijakan ujian sebaiknya memakai tabel pengaturan khusus pada
              sprint terpisah.
            </p>
          </div>
        </DashboardCard>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-destructive">
            Area Berisiko
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Operasi berisiko tinggi untuk maintenance data sistem.
          </p>
        </div>
        <OperationalResetCard />
      </section>
    </div>
  );
}

function SettingRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
      <span className="truncate text-muted-foreground">{label}</span>
      <span
        className={
          tone === "success"
            ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
            : tone === "danger"
              ? "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
              : "text-right font-medium"
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
