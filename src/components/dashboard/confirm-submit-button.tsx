"use client";

import { useRef, useState, type ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

import { Loader2 } from "lucide-react";

import { ConfirmDialog } from "@/components/common/dialogs/confirm-dialog";
import { DangerConfirmDialog } from "@/components/common/dialogs/danger-confirm-dialog";
import { cn } from "@/lib/utils";

interface ConfirmSubmitButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  confirmMessage: string;
  confirmTitle?: string;
  confirmationText?: "HAPUS" | "RESET";
  loadingText?: string;
  variant?: "default" | "danger" | "outline";
}

export function ConfirmSubmitButton({
  children,
  className,
  confirmMessage,
  confirmTitle,
  confirmationText,
  loadingText = "Memproses...",
  variant = "outline",
  onClick,
  disabled,
  ...props
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const confirmedRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const isDanger = variant === "danger" || Boolean(confirmationText);
  const isBusy = pending || submitted;

  function submitConfirmed() {
    if (isBusy) {
      return;
    }

    confirmedRef.current = true;
    setSubmitted(true);
    setIsOpen(false);

    // Close any parent details dropdown
    const details = buttonRef.current?.closest("details");
    if (details) {
      details.removeAttribute("open");
    }

    buttonRef.current?.form?.requestSubmit(buttonRef.current);
  }

  return (
    <>
      <button
        {...props}
        ref={buttonRef}
        type="submit"
        data-confirm-trigger="true"
        disabled={disabled || isBusy}
        onClick={(event) => {
          onClick?.(event);

          if (event.defaultPrevented || confirmedRef.current) {
            confirmedRef.current = false;
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          if (!isBusy) {
            setIsOpen(true);
          }
        }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-150 select-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
          variant === "default" &&
            "bg-[#2563EB] text-white shadow-sm hover:bg-blue-700 active:bg-blue-800",
          variant === "danger" &&
            "border border-[#EF4444]/35 bg-white text-[#EF4444] shadow-sm hover:bg-red-50 active:bg-red-100",
          variant === "outline" &&
            "border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm hover:bg-[#F8FAFC] active:bg-slate-100",
          className,
        )}
      >
        {isBusy ? (
          <>
            <Loader2 className="size-3.5 animate-spin shrink-0" />
            <span>{loadingText}</span>
          </>
        ) : (
          children
        )}
      </button>
      {confirmationText ? (
        <DangerConfirmDialog
          isOpen={isOpen}
          title={confirmTitle ?? "Konfirmasi Aksi Berbahaya"}
          description={confirmMessage}
          confirmationText={confirmationText}
          confirmLabel="Lanjutkan"
          isLoading={isBusy}
          onCancel={() => setIsOpen(false)}
          onConfirm={submitConfirmed}
        />
      ) : (
        <ConfirmDialog
          isOpen={isOpen}
          title={confirmTitle ?? (isDanger ? "Konfirmasi Aksi" : "Konfirmasi")}
          description={confirmMessage}
          confirmLabel="Lanjutkan"
          isDangerous={isDanger}
          isLoading={isBusy}
          onCancel={() => setIsOpen(false)}
          onConfirm={submitConfirmed}
        />
      )}
    </>
  );
}
