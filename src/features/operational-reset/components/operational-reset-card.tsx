"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DangerConfirmDialog } from "@/components/common/dialogs/danger-confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  OPERATIONAL_RESET_CONFIRMATION,
  operationalResetScopes,
  operationalResetRetainedTables,
  type OperationalResetScope,
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
  const [selectedScopes, setSelectedScopes] = useState<OperationalResetScope[]>([
    "exams",
    "assignments",
  ]);

  const selectedScopeSet = new Set(selectedScopes);
  const selectedDefinitions = operationalResetScopes.filter((scope) =>
    selectedScopeSet.has(scope.id),
  );
  const selectedTables = selectedDefinitions.flatMap((scope) => scope.tables);

  async function handleReset() {
    if (isSubmitting || selectedScopes.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/super-admin/reset-operational-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmation: OPERATIONAL_RESET_CONFIRMATION,
          scopes: selectedScopes,
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

  function toggleScope(scope: OperationalResetScope) {
    setSelectedScopes((current) =>
      current.includes(scope)
        ? current.filter((item) => item !== scope)
        : [...current, scope],
    );
  }

  function selectAllScopes() {
    setSelectedScopes(operationalResetScopes.map((scope) => scope.id));
  }

  function clearScopes() {
    setSelectedScopes([]);
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
            Pilih kategori data yang ingin dikosongkan. Akun Super Admin, role,
            permission, konfigurasi, dan template tetap dipertahankan.
          </p>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {operationalResetScopes.map((scope) => (
              <label
                key={scope.id}
                className="flex cursor-pointer gap-3 rounded-md border p-3 text-sm transition hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={selectedScopeSet.has(scope.id)}
                  disabled={isSubmitting}
                  onChange={() => toggleScope(scope.id)}
                  className="mt-1"
                />
                <span>
                  <span className="flex items-center gap-2 font-medium">
                    {scope.label}
                    {scope.dangerous ? (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-destructive">
                        Bahaya
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {scope.description}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={selectAllScopes}
              className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
            >
              Pilih semua
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={clearScopes}
              className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
            >
              Kosongkan pilihan
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-3">
              <p className="text-xs font-semibold uppercase text-destructive">
                Akan dikosongkan sesuai pilihan
              </p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                {(selectedTables.length ? selectedTables : ["Belum ada kategori dipilih"])
                  .slice(0, 10)
                  .map((item) => (
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
          disabled={isSubmitting || selectedScopes.length === 0}
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
        title="Reset Data Terpilih"
        description={`Aksi ini akan menghapus kategori: ${selectedDefinitions
          .map((scope) => scope.label)
          .join(", ")}. Jika Master sekolah & akademik atau Bank Soal dipilih, data yang bergantung seperti ujian/assignment ikut dibersihkan agar relasi database tetap aman. Akun Super Admin, Role, Permission, konfigurasi sistem, dan template tetap aman.`}
        confirmationText={OPERATIONAL_RESET_CONFIRMATION}
        confirmationHint={`Ketik "${OPERATIONAL_RESET_CONFIRMATION}" untuk menjalankan reset`}
        confirmLabel="Reset Data Terpilih"
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
