"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DangerConfirmDialog } from "@/components/common/dialogs/danger-confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  OPERATIONAL_RESET_CONFIRMATION,
  operationalResetDeletedTables,
  operationalResetRetainedTables,
  type OperationalResetSummary,
} from "@/features/operational-reset/reset-plan";

type ApiResponse = {
  ok: boolean;
  message: string;
  summary?: OperationalResetSummary;
};

export function OperationalResetCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState<OperationalResetSummary | null>(null);

  async function handleReset() {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/super-admin/reset-operational-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmation: OPERATIONAL_RESET_CONFIRMATION,
        }),
      });
      const result = (await response.json().catch(() => ({
        ok: false,
        message: "Response reset tidak valid.",
      }))) as ApiResponse;

      if (!response.ok || !result.ok) {
        toast.error(result.message || "Reset data operasional gagal.");
        return;
      }

      setSummary(result.summary ?? null);
      setIsOpen(false);
      toast.success(result.message);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Reset data operasional gagal.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-destructive/40 bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" aria-hidden="true" />
            <h2 className="text-base font-semibold">Reset Data Operasional</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Kosongkan data operasional ujian, assignment, kelas, tahun ajaran,
            dan akun non-Super Admin. Bank Soal, role, permission, konfigurasi,
            dan akun Super Admin tetap dipertahankan.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-3">
              <p className="text-xs font-semibold uppercase text-destructive">
                Akan dikosongkan
              </p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                {operationalResetDeletedTables.slice(0, 8).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs font-semibold uppercase text-foreground">
                Tetap aman
              </p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                {operationalResetRetainedTables.slice(0, 8).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="destructive"
          className="self-start"
          disabled={isSubmitting}
          onClick={() => setIsOpen(true)}
        >
          <Trash2 aria-hidden="true" />
          Reset Operasional
        </Button>
      </div>

      {summary ? (
        <div className="mt-5 rounded-md border bg-muted/30 p-4">
          <p className="text-sm font-medium">Summary reset terakhir</p>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
            <SummaryItem
              label="Akun aplikasi"
              value={String(summary.operationalUsersDeleted)}
            />
            <SummaryItem
              label="Akun auth"
              value={String(summary.authUsersDeleted)}
            />
            <SummaryItem
              label="Tabel diproses"
              value={String(summary.tables.length)}
            />
          </div>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
            {summary.tables.map((item) => (
              <div key={item.table} className="flex justify-between gap-3">
                <span>{item.table}</span>
                <span>{item.skipped ? "skip" : item.deleted}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <DangerConfirmDialog
        isOpen={isOpen}
        title="Reset Data Operasional"
        description="Aksi ini akan menghapus data sekolah operasional, akun admin sekolah/guru/siswa/proctor/principal, assignment, ujian, jadwal, peserta, jawaban, hasil, dan token ujian. Akun Super Admin, Bank Soal, Permission, Role, konfigurasi sistem, dan template import/export tetap aman."
        confirmationText={OPERATIONAL_RESET_CONFIRMATION}
        confirmationHint={`Ketik "${OPERATIONAL_RESET_CONFIRMATION}" untuk menjalankan reset`}
        confirmLabel="Reset Data Operasional"
        isLoading={isSubmitting}
        onCancel={() => {
          if (!isSubmitting) {
            setIsOpen(false);
          }
        }}
        onConfirm={handleReset}
      />
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
