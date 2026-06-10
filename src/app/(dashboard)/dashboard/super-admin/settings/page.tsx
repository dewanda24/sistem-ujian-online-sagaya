import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { ActionToast } from "@/components/master-data/action-toast";
import { OperationalResetCard } from "@/features/operational-reset/components/operational-reset-card";
import { saveSystemSettingsAction } from "@/features/super-admin/advanced-actions";
import { getSystemSettings } from "@/features/super-admin/advanced";
import { getEnvStatus } from "@/lib/env";
import { requireRole } from "@/lib/auth/require-role";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function SystemSettingsPage({ searchParams }: PageProps) {
  await requireRole("super_admin");
  const [params, settings] = await Promise.all([
    searchParams,
    getSystemSettings(),
  ]);
  const envStatus = getEnvStatus();
  const appEnvironment =
    process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development";
  const configuredCount = envStatus.filter((item) => item.configured).length;

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Pengaturan Sistem"
        description="Konfigurasi runtime dan kesiapan produksi. Nilai rahasia tidak ditampilkan."
      />

      <form action={saveSystemSettingsAction} className="space-y-4">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DashboardCard
            title="Nama Aplikasi"
            description="Identitas aplikasi global."
          >
            <div className="space-y-3 text-sm">
              <LabeledInput
                label="Nama aplikasi"
                name="app_name"
                defaultValue={settings.platform.app_name}
              />
              <LabeledInput
                label="Logo URL"
                name="logo_url"
                defaultValue={settings.platform.logo_url}
              />
              <SettingRow label="Lingkungan" value={appEnvironment} />
            </div>
          </DashboardCard>

          <DashboardCard
            title="Logo & Tema"
            description="Tampilan global aplikasi."
          >
            <div className="space-y-3 text-sm">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Tema
                </span>
                <select
                  name="theme"
                  defaultValue={settings.platform.theme}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  <option value="default">Default</option>
                  <option value="blue">Biru</option>
                  <option value="green">Hijau</option>
                  <option value="high-contrast">Kontras Tinggi</option>
                </select>
              </label>
              <ToggleSelect
                label="Maintenance mode"
                name="maintenance_mode"
                defaultValue={settings.platform.maintenance_mode}
              />
            </div>
          </DashboardCard>

          <DashboardCard
            title="Konfigurasi CBT"
            description="Default global untuk perilaku ruang ujian."
          >
            <div className="space-y-3 text-sm">
              <LabeledInput
                label="Autosave detik"
                name="autosave_interval_seconds"
                type="number"
                defaultValue={String(settings.cbt.autosave_interval_seconds)}
              />
              <LabeledInput
                label="Batas pelanggaran fullscreen"
                name="fullscreen_violation_limit"
                type="number"
                defaultValue={String(settings.cbt.fullscreen_violation_limit)}
              />
              <ToggleSelect
                label="Token ujian default"
                name="default_token_required"
                defaultValue={settings.cbt.default_token_required}
              />
              <ToggleSelect
                label="Acak soal"
                name="shuffle_questions"
                defaultValue={settings.cbt.shuffle_questions}
              />
              <ToggleSelect
                label="Acak opsi"
                name="shuffle_options"
                defaultValue={settings.cbt.shuffle_options}
              />
            </div>
          </DashboardCard>
        </section>

        <div className="flex justify-end">
          <ConfirmSubmitButton
            confirmMessage="Simpan pengaturan global platform?"
            confirmTitle="Konfirmasi Pengaturan"
            variant="default"
          >
            Simpan Pengaturan
          </ConfirmSubmitButton>
        </div>
      </form>

      <section className="grid gap-4 md:grid-cols-3">
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
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <DashboardCard
          title="Maintenance Mode"
          description="Status mode perawatan dari environment."
        >
          <SettingRow
            label="Maintenance"
            value={settings.platform.maintenance_mode ? "Aktif" : "Nonaktif"}
            tone={settings.platform.maintenance_mode ? "danger" : "success"}
          />
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

function LabeledInput({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="rounded-md border px-3 py-2 text-sm"
      />
    </label>
  );
}

function ToggleSelect({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: boolean;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ? "true" : "false"}
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="true">Aktif</option>
        <option value="false">Nonaktif</option>
      </select>
    </label>
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
