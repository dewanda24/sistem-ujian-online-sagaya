import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
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
        title="Settings Sistem"
        description="Konfigurasi runtime dan readiness production. Nilai rahasia tidak ditampilkan."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Aplikasi"
          description="Identitas aplikasi yang dibaca dari environment."
        >
          <div className="space-y-3 text-sm">
            <SettingRow label="Nama aplikasi" value={appName} />
            <SettingRow label="Environment" value={appEnvironment} />
            <SettingRow
              label="Maintenance"
              value={maintenanceMode ? "Aktif" : "Nonaktif"}
              tone={maintenanceMode ? "danger" : "success"}
            />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Environment"
          description="Status variable wajib untuk Supabase SSR dan admin auth."
        >
          <div className="space-y-2 text-sm">
            {envStatus.map((item) => (
              <SettingRow
                key={item.key}
                label={item.key}
                value={item.configured ? "Ready" : "Missing"}
                tone={item.configured ? "success" : "danger"}
              />
            ))}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Readiness"
          description="Ringkasan kesiapan konfigurasi server."
        >
          <div className="space-y-3 text-sm">
            <SettingRow
              label="Required env"
              value={`${configuredCount}/${envStatus.length}`}
              tone={configuredCount === envStatus.length ? "success" : "danger"}
            />
            <SettingRow
              label="Auth admin API"
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
            <SettingRow label="RLS" value="Belum sprint hardening" />
          </div>
        </DashboardCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          title="Security Checklist"
          description="Checklist operasional sebelum deployment production."
        >
          <ChecklistItem done label="Auth/RBAC middleware aktif" />
          <ChecklistItem done label="Audit logs foundation tersedia" />
          <ChecklistItem done label="Service role hanya server-side" />
          <ChecklistItem done={configuredCount === envStatus.length} label="Environment wajib lengkap" />
          <ChecklistItem label="RLS production hardening belum dieksekusi" />
          <ChecklistItem label="Backup otomatis belum diaktifkan" />
        </DashboardCard>

        <DashboardCard
          title="Catatan Konfigurasi"
          description="Settings saat ini sengaja read-only agar tidak membutuhkan schema baru."
        >
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Untuk mengubah nama aplikasi, environment, atau maintenance flag,
              gunakan environment variable di Vercel/server.
            </p>
            <p>
              Persistent settings seperti logo sekolah, aturan anti-cheat global,
              dan kebijakan ujian sebaiknya memakai tabel settings khusus pada
              sprint terpisah.
            </p>
          </div>
        </DashboardCard>
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
