"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  Eye,
  RotateCcw,
  Send,
  Unlock,
  Unplug,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import {
  forceSubmitAttemptAction,
  resetAttemptAction,
  unlockAttemptAction,
} from "@/features/monitoring/actions";
import {
  releaseActiveSessionAction,
  retryRecoveryAction,
} from "@/features/recovery-center/actions";
import type {
  RecoveryActionType,
  RecoveryCenterData,
  RecoveryQueueItem,
  RecoverySeverity,
} from "@/features/recovery-center/queries";

type RecoveryCenterViewProps = {
  data: RecoveryCenterData;
  returnTo: string;
};

const issueLabels: Record<RecoveryQueueItem["issueType"], string> = {
  failed_submit: "Gagal Mengumpulkan",
  session_conflict: "Akses Ganda",
  problem_attempt: "Perlu Dicek",
  offline_long: "Koneksi Terputus Lama",
  locked_attempt: "Pengerjaan Terkunci",
  expired_attempt: "Waktu Habis",
};

export function RecoveryCenterView({ data, returnTo }: RecoveryCenterViewProps) {
  const [selected, setSelected] = useState<RecoveryQueueItem | null>(null);
  const grouped = useMemo(
    () => ({
      failedSubmit: data.queue.filter((item) => item.issueType === "failed_submit"),
      sessionConflict: data.queue.filter((item) => item.issueType === "session_conflict"),
      attemptRecovery: data.queue.filter((item) =>
        ["problem_attempt", "offline_long", "locked_attempt", "expired_attempt"].includes(
          item.issueType,
        ),
      ),
    }),
    [data.queue],
  );

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard title="Gagal Mengumpulkan" value={data.summary.failedSubmit} tone="critical" />
        <SummaryCard title="Akses Ganda" value={data.summary.sessionConflict} tone="warning" />
        <SummaryCard title="Perlu Dicek" value={data.summary.problemAttempt} tone="info" />
        <SummaryCard title="Koneksi Terputus" value={data.summary.offlineLong} tone="warning" />
        <SummaryCard title="Terkunci" value={data.summary.lockedAttempt} tone="critical" />
        <SummaryCard title="Waktu Habis" value={data.summary.expiredAttempt} tone="warning" />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <SeverityCard label="Mendesak" value={data.summary.critical} severity="critical" />
        <SeverityCard label="Perlu Dicek" value={data.summary.warning} severity="warning" />
        <SeverityCard label="Informasi" value={data.summary.info} severity="info" />
      </section>

      <RecoverySection
        title="Pengumpulan Gagal"
        description="Peserta yang belum berhasil mengumpulkan ujian dan perlu tindak lanjut."
        items={grouped.failedSubmit}
        returnTo={returnTo}
        onDetail={setSelected}
      />

      <RecoverySection
        title="Akses Perangkat"
        description="Peserta yang perlu dibantu karena akses ujian masih tertahan di perangkat atau halaman lain."
        items={grouped.sessionConflict}
        returnTo={returnTo}
        onDetail={setSelected}
      />

      <RecoverySection
        title="Pemulihan Pengerjaan"
        description="Pengerjaan yang terkunci, waktu habis, atau kehilangan koneksi terlalu lama."
        items={grouped.attemptRecovery}
        returnTo={returnTo}
        onDetail={setSelected}
      />

      <RecoverySection
        title="Daftar Tindak Lanjut"
        description="Semua masalah aktif, diurutkan dari yang paling mendesak."
        items={data.queue}
        returnTo={returnTo}
        onDetail={setSelected}
      />

      {selected ? (
        <RecoveryDetailDrawer
          item={selected}
          returnTo={returnTo}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "critical" | "warning" | "info";
}) {
  const className =
    tone === "critical"
      ? "text-red-700 bg-red-50 border-red-100"
      : tone === "warning"
        ? "text-amber-700 bg-amber-50 border-amber-100"
        : "text-blue-700 bg-blue-50 border-blue-100";

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-normal">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function SeverityCard({
  label,
  value,
  severity,
}: {
  label: string;
  value: number;
  severity: RecoverySeverity;
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#64748B]">{label}</span>
        <SeverityBadge severity={severity} />
      </div>
      <p className="mt-2 text-3xl font-semibold text-[#0F172A]">{value}</p>
    </div>
  );
}

function RecoverySection({
  title,
  description,
  items,
  returnTo,
  onDetail,
}: {
  title: string;
  description: string;
  items: RecoveryQueueItem[];
  returnTo: string;
  onDetail: (item: RecoveryQueueItem) => void;
}) {
  return (
    <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">{title}</h2>
          <p className="text-sm text-[#64748B]">{description}</p>
        </div>
        <span className="text-sm font-medium text-[#64748B]">{items.length} item</span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Tidak ada masalah aktif"
          description="Daftar pemulihan untuk kategori ini sedang kosong."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
              <tr>
                <th className="px-3 py-2 font-medium">Peserta</th>
                <th className="hidden px-3 py-2 font-medium md:table-cell">Jadwal</th>
                <th className="hidden w-32 px-3 py-2 font-medium lg:table-cell">Terakhir Tersimpan</th>
                <th className="w-32 px-3 py-2 font-medium">Masalah</th>
                <th className="hidden w-36 px-3 py-2 font-medium xl:table-cell">Rekomendasi</th>
                <th className="w-28 px-3 py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8FAFC]">
                  <td className="min-w-0 px-3 py-2">
                    <div className="truncate font-medium text-[#0F172A]">
                      {item.studentName}
                    </div>
                    <div className="truncate text-xs text-[#64748B]">
                      {item.className} - {item.identity || "-"}
                    </div>
                  </td>
                  <td className="hidden min-w-0 px-3 py-2 md:table-cell">
                    <div className="truncate text-[#0F172A]">{item.scheduleTitle}</div>
                    <div className="text-xs text-[#64748B]">{item.durationLabel}</div>
                  </td>
                  <td className="hidden px-3 py-2 text-xs text-[#64748B] lg:table-cell">
                    {formatDateTime(item.lastSyncAt ?? item.lastActivityAt)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <SeverityBadge severity={item.severity} />
                      <span className="line-clamp-1 text-xs text-[#64748B]">
                        {issueLabels[item.issueType]}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2 text-xs text-[#64748B] xl:table-cell">
                    {actionLabel(item.action)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onDetail(item)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-white"
                        title="Detail"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      <QuickAction item={item} returnTo={returnTo} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function QuickAction({
  item,
  returnTo,
}: {
  item: RecoveryQueueItem;
  returnTo: string;
}) {
  if (!item.attemptId) {
    return null;
  }

  if (item.action === "release_session") {
    return (
      <form action={releaseActiveSessionAction}>
        <input type="hidden" name="attempt_id" value={item.attemptId} />
        <input type="hidden" name="return_to" value={returnTo} />
        <IconSubmit confirmMessage="Buka akses perangkat lama untuk peserta ini?">
          <Unplug className="size-3.5" />
        </IconSubmit>
      </form>
    );
  }

  if (item.action === "unlock_attempt") {
    return (
      <form action={unlockAttemptAction}>
        <input type="hidden" name="attempt_id" value={item.attemptId} />
        <input type="hidden" name="return_to" value={returnTo} />
        <IconSubmit confirmMessage="Buka kunci pengerjaan peserta ini?">
          <Unlock className="size-3.5" />
        </IconSubmit>
      </form>
    );
  }

  if (item.action === "reset_attempt") {
    return (
      <form action={resetAttemptAction}>
        <input type="hidden" name="attempt_id" value={item.attemptId} />
        <input type="hidden" name="return_to" value={returnTo} />
        <IconSubmit confirmMessage="Mulai ulang pengerjaan peserta ini?" variant="danger">
          <RotateCcw className="size-3.5" />
        </IconSubmit>
      </form>
    );
  }

  if (item.action === "force_submit") {
    return (
      <form action={forceSubmitAttemptAction}>
        <input type="hidden" name="attempt_id" value={item.attemptId} />
        <input type="hidden" name="return_to" value={returnTo} />
        <IconSubmit confirmMessage="Selesaikan ujian peserta ini sekarang?">
          <Send className="size-3.5" />
        </IconSubmit>
      </form>
    );
  }

  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#94A3B8]">
      <CheckCircle2 className="size-3.5" />
    </span>
  );
}

function IconSubmit({
  children,
  confirmMessage,
  variant = "default",
}: {
  children: ReactNode;
  confirmMessage: string;
  variant?: "default" | "danger";
}) {
  return (
    <ConfirmSubmitButton
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] p-0"
      confirmMessage={confirmMessage}
      confirmationText={variant === "danger" ? "RESET" : undefined}
      variant={variant === "danger" ? "danger" : "outline"}
    >
      {children}
    </ConfirmSubmitButton>
  );
}

function RecoveryDetailDrawer({
  item,
  returnTo,
  onClose,
}: {
  item: RecoveryQueueItem;
  returnTo: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Tutup detail pemulihan"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-[#E2E8F0] bg-[#F8FAFC] p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">
              {item.studentName}
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {item.scheduleTitle} - {item.className}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm"
          >
            Tutup
          </button>
        </div>

        <div className="mt-5 grid gap-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Kode Pengerjaan" value={item.attemptId ?? "-"} />
            <DetailItem label="Status" value={item.status} badge />
            <DetailItem label="Terakhir Tersimpan" value={formatDateTime(item.lastSyncAt)} />
            <DetailItem label="Aktivitas Terakhir" value={formatDateTime(item.lastActivityAt)} />
            <DetailItem label="Waktu Gagal" value={formatDateTime(item.failedAt)} />
            <DetailItem label="Jumlah Gagal" value={String(item.retryCount)} />
            <DetailItem label="Akses Lama" value={shortSession(item.activeSessionId)} />
            <DetailItem label="Akses Terakhir" value={formatDateTime(item.activeSessionSeenAt)} />
          </div>

          <section className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[#0F172A]">{item.problem}</h3>
                <p className="mt-1 text-sm text-[#64748B]">
                  {item.recommendation}
                </p>
              </div>
              <SeverityBadge severity={item.severity} />
            </div>
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                <QuickAction item={item} returnTo={returnTo} />
                {item.issueType === "failed_submit" && item.attemptId ? (
                  <form action={retryRecoveryAction}>
                    <input type="hidden" name="attempt_id" value={item.attemptId} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <ConfirmSubmitButton
                      className="h-8 rounded-lg px-3 text-xs"
                      confirmMessage="Catat permintaan coba lagi dan minta siswa mengumpulkan ulang?"
                      variant="outline"
                    >
                      Minta Coba Lagi
                    </ConfirmSubmitButton>
                  </form>
                ) : null}
                {item.attemptId ? (
                  <form action={resetAttemptAction}>
                    <input type="hidden" name="attempt_id" value={item.attemptId} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <ConfirmSubmitButton
                      className="h-8 rounded-lg px-3 text-xs"
                      confirmMessage="Mulai ulang pengerjaan ini?"
                      confirmationText="RESET"
                      variant="danger"
                    >
                      Mulai Ulang
                    </ConfirmSubmitButton>
                  </form>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <h3 className="font-semibold text-[#0F172A]">Riwayat Kejadian</h3>
            <div className="mt-3 grid gap-2">
              {item.eventTimeline.length ? (
                item.eventTimeline.map((event) => (
                  <div
                    key={event.id ?? `${event.eventType}-${event.createdAt}`}
                    className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2"
                  >
                    <div className="font-medium text-[#0F172A]">
                      {formatEventType(event.eventType)}
                    </div>
                    <div className="text-xs text-[#64748B]">
                      {formatDateTime(event.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#64748B]">Belum ada kejadian tercatat.</p>
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function DetailItem({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
      <div className="text-xs text-[#64748B]">{label}</div>
      <div className="mt-1 min-w-0 wrap-break-words font-medium text-[#0F172A]">
        {badge ? <StatusPill value={value} /> : value || "-"}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: RecoverySeverity }) {
  const className =
    severity === "critical"
      ? "bg-red-50 text-red-700 ring-red-100"
      : severity === "warning"
        ? "bg-amber-50 text-amber-700 ring-amber-100"
        : "bg-blue-50 text-blue-700 ring-blue-100";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${className}`}>
      {severity === "critical" ? "Mendesak" : severity === "warning" ? "Perlu Dicek" : "Informasi"}
    </span>
  );
}

function actionLabel(action: RecoveryActionType) {
  if (action === "release_session") return "Buka Akses";
  if (action === "unlock_attempt") return "Buka Kunci";
  if (action === "reset_attempt") return "Mulai Ulang";
  if (action === "force_submit") return "Selesaikan Ujian";
  if (action === "retry_submit") return "Minta Coba Lagi";
  return "Pantau";
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatEventType(value?: string | null) {
  if (!value) return "-";

  const labels: Record<string, string> = {
    failed_submit: "Gagal Mengumpulkan",
    offline: "Koneksi Terputus",
    online: "Tersambung Kembali",
    disconnected: "Terputus",
    tab_blur: "Keluar dari Halaman",
    visibility_hidden: "Halaman Disembunyikan",
    copy_attempt: "Percobaan Salin",
    paste_attempt: "Percobaan Tempel",
    fullscreen_exit: "Keluar Layar Penuh",
    before_unload: "Meninggalkan Halaman",
  };

  if (labels[value]) return labels[value];

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function shortSession(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 18) return value;

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}
