"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen, mounted]);

  const isConfirmed = inputValue === confirmationText;

  const handleConfirm = async () => {
    if (isLoading || !isConfirmed) return;
    setInputValue("");
    await onConfirm();
  };

  const handleCancel = () => {
    setInputValue("");
    onCancel();
  };

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-5 text-[#0F172A] shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-xs animate-in zoom-in-95 duration-150"
      onCancel={handleCancel}
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#EF4444]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
        </div>

        <div className="rounded-xl border border-[#EF4444]/30 bg-red-50 p-3">
          <p className="text-xs font-semibold text-[#DC2626]">
            Aksi ini tidak dapat dibatalkan. Ketik &quot;{confirmationText}
            &quot; di bawah untuk melanjutkan.
          </p>
        </div>

        <div>
          <label htmlFor="confirm-input" className="text-xs font-bold text-slate-700">
            {confirmationHint || `Ketik "${confirmationText}" untuk konfirmasi`}
          </label>
          <input
            id="confirm-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder={`Ketik: ${confirmationText}`}
            className="mt-1 w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm font-semibold text-slate-900 focus:border-red-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-[#F8FAFC] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !isConfirmed}
            className="rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
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
    </dialog>,
    document.body,
  );
}
