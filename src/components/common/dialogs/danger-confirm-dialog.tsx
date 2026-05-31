"use client";

import { useEffect, useRef, useState } from "react";

export interface DangerConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmationText: string;
  confirmationHint?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function DangerConfirmDialog({
  isOpen,
  title,
  description,
  confirmationText,
  confirmationHint,
  cancelLabel = "Batal",
  confirmLabel = "Ya, Saya Yakin",
  isLoading = false,
  onCancel,
  onConfirm,
}: DangerConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      setInputValue("");
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const isConfirmed = inputValue === confirmationText;

  const handleConfirm = async () => {
    if (isLoading || !isConfirmed) return;
    await onConfirm();
  };

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg border bg-background p-6 shadow-lg backdrop:bg-black/50"
      onCancel={onCancel}
    >
      <div className="max-w-md space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-destructive">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-xs font-medium text-destructive">
            Aksi ini tidak dapat dibatalkan. Ketik "{confirmationText}" di bawah
            untuk melanjutkan.
          </p>
        </div>

        <div>
          <label htmlFor="confirm-input" className="text-xs font-medium">
            {confirmationHint || `Ketik "${confirmationText}" untuk konfirmasi`}
          </label>
          <input
            id="confirm-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder={`Ketik: ${confirmationText}`}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !isConfirmed}
            className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Memproses...
              </div>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
}
