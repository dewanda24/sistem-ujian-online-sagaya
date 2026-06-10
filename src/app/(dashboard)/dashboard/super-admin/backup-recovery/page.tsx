import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  createBackupAction,
  restoreBackupAction,
} from "@/features/super-admin/advanced-actions";
import {
  getBackupJobs,
  getSchoolOptionsForSuperAdmin,
} from "@/features/super-admin/advanced";
import { getEnvStatus } from "@/lib/env";
import { requireRole } from "@/lib/auth/require-role";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function BackupRecoveryPage({ searchParams }: PageProps) {
  await requireRole("super_admin");
  const [params, backupJobs, schools] = await Promise.all([
    searchParams,
    getBackupJobs(),
    getSchoolOptionsForSuperAdmin(),
  ]);
  const envStatus = getEnvStatus();
  const readyEnvCount = envStatus.filter((item) => item.configured).length;
  const latestBackup = backupJobs.rows[0];

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
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
          title="Backup Terakhir"
          description="Status job backup terbaru yang tersimpan."
        >
          <div className="space-y-3 text-sm">
            <ReadinessRow
              label="Status"
              value={latestBackup?.status ?? "Belum ada"}
              ready={latestBackup?.status === "completed"}
            />
            <ReadinessRow
              label="Scope"
              value={latestBackup?.scope ?? "-"}
              ready={Boolean(latestBackup)}
            />
            <ReadinessRow
              label="Waktu"
              value={
                latestBackup?.created_at
                  ? new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(latestBackup.created_at))
                  : "-"
              }
              ready={Boolean(latestBackup)}
            />
          </div>
        </DashboardCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          title="Buat Backup"
          description="Backup nyata berupa snapshot terbatas yang disimpan di database."
        >
          <form action={createBackupAction} className="space-y-3 text-sm">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Scope
              </span>
              <select name="scope" className="rounded-md border px-3 py-2">
                <option value="global">Global</option>
                <option value="school">Per Sekolah</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Sekolah
              </span>
              <select name="school_id" className="rounded-md border px-3 py-2">
                <option value="">Pilih jika scope per sekolah</option>
                {schools.map((school) => (
                  <option key={school.value} value={school.value}>
                    {school.label}
                  </option>
                ))}
              </select>
            </label>
            <ConfirmSubmitButton
              confirmMessage="Buat snapshot backup sekarang?"
              confirmTitle="Konfirmasi Backup"
              variant="default"
            >
              Buat Backup
            </ConfirmSubmitButton>
          </form>
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

      <DataTable
        columns={["Waktu", "Jenis", "Status", "Operator", "Restore"]}
        isEmpty={backupJobs.rows.length === 0}
        empty={
          <EmptyState
            title={
              backupJobs.unavailable
                ? "Histori backup belum tersedia"
                : "Belum ada backup"
            }
            description={
              backupJobs.unavailable
                ? "Jalankan migration backend Super Admin terlebih dahulu."
                : "Buat backup global atau per sekolah untuk melihat histori."
            }
          />
        }
      >
        {backupJobs.rows.map((job) => (
          <tr key={job.id}>
            <td className="px-4 py-3">
              {job.created_at
                ? new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(job.created_at))
                : "-"}
            </td>
            <td className="px-4 py-3">
              <div className="font-medium">
                {job.scope === "global" ? "Global" : "Per Sekolah"}
              </div>
              <div className="text-xs text-muted-foreground">
                {job.scope === "school"
                  ? (Array.isArray(job.schools) ? job.schools[0]?.name : job.schools?.name) ?? "-"
                  : "Semua sekolah"}
              </div>
            </td>
            <td className="px-4 py-3">
              <StatusBadge active={job.status === "completed" || job.status === "restored"} />
            </td>
            <td className="px-4 py-3 font-mono text-xs">
              {Object.entries(job.row_counts ?? {})
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ") || "-"}
            </td>
            <td className="px-4 py-3">
              {job.status === "completed" ? (
                <form action={restoreBackupAction}>
                  <input type="hidden" name="backup_id" value={job.id} />
                  <ConfirmSubmitButton
                    confirmMessage="Restore terbatas akan memulihkan pengaturan global dan metadata sekolah bila backup per sekolah. Lanjutkan?"
                    confirmTitle="Konfirmasi Restore Terbatas"
                    variant="danger"
                  >
                    Restore Terbatas
                  </ConfirmSubmitButton>
                </form>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Tidak tersedia
                </span>
              )}
            </td>
          </tr>
        ))}
      </DataTable>

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
        title="Restore"
        description="Restore terbatas memulihkan pengaturan global dan metadata sekolah dari snapshot."
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Snapshot aplikasi ini bukan pengganti point-in-time recovery Supabase.
          Data operasional ujian, guru, siswa, soal, dan jawaban tidak dipulihkan
          dari halaman ini agar batas kewenangan Super Admin tetap terjaga.
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
