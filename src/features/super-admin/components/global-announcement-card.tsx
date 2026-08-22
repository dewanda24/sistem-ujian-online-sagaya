import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { saveGlobalAnnouncementAction } from "@/features/super-admin/advanced-actions";
import type { GlobalAnnouncementSettings } from "@/features/super-admin/advanced";

export function GlobalAnnouncementCard({
  announcement,
}: {
  announcement: GlobalAnnouncementSettings;
}) {
  return (
    <DashboardCard
      title="Pengumuman Darurat & Siaran Global"
      description="Siarkan pengumuman penting atau peringatan pemeliharaan ke seluruh dashboard sekolah & ruang ujian."
    >
      <form action={saveGlobalAnnouncementAction} className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Status Siaran
            </span>
            <select
              name="enabled"
              defaultValue={announcement.enabled ? "true" : "false"}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="false">Nonaktif (Sembunyikan)</option>
              <option value="true">Aktif (Tampilkan ke Pengguna)</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Tipe Pengumuman
            </span>
            <select
              name="type"
              defaultValue={announcement.type || "info"}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="info">Informasi (Biru)</option>
              <option value="warning">Peringatan / Perhatian (Kuning)</option>
              <option value="danger">Darurat / Maintenance (Merah)</option>
              <option value="success">Berita Baik / Pengumuman Selesai (Hijau)</option>
            </select>
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Judul Pengumuman
          </span>
          <input
            name="title"
            defaultValue={announcement.title || ""}
            placeholder="Contoh: Pemeliharaan Server Terjadwal Pukul 22:00 WIB"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Pesan Siaran
          </span>
          <textarea
            name="message"
            defaultValue={announcement.message || ""}
            placeholder="Tuliskan isi pengumuman yang jelas dan mudah dipahami..."
            rows={3}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </label>

        <div className="flex justify-end">
          <ConfirmSubmitButton
            confirmMessage="Simpan dan perbarui siaran pengumuman global?"
            confirmTitle="Konfirmasi Pengumuman Global"
            variant="default"
            className="px-4 py-2 text-xs"
          >
            Simpan Pengumuman
          </ConfirmSubmitButton>
        </div>
      </form>
    </DashboardCard>
  );
}
