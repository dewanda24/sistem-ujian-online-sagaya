"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  cancelLabel?: string;
  confirmLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  cancelLabel = "Batal",
  confirmLabel = "Lanjutkan",
  isDangerous = false,
  isLoading = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  const handleConfirm = async () => {
    if (isLoading) return;
    await onConfirm();
  };

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-5 text-[#0F172A] shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-xs animate-in zoom-in-95 duration-150"
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-[#F8FAFC] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm ${
              isDangerous
                ? "bg-[#EF4444] hover:bg-red-600 active:bg-red-700"
                : "bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800"
            }`}
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
    document.body
  );
}
