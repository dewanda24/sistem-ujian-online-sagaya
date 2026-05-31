"use client";

import { useRef, useState, type ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

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
  const isDanger = variant === "danger" || Boolean(confirmationText);

  function submitConfirmed() {
    confirmedRef.current = true;
    setIsOpen(false);
    buttonRef.current?.form?.requestSubmit(buttonRef.current);
  }

  return (
    <>
      <button
        {...props}
        ref={buttonRef}
        type="submit"
        disabled={disabled || pending}
        onClick={(event) => {
          onClick?.(event);

          if (event.defaultPrevented || confirmedRef.current) {
            confirmedRef.current = false;
            return;
          }

          event.preventDefault();
          if (!pending) {
            setIsOpen(true);
          }
        }}
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-50",
          variant === "default" &&
            "bg-primary font-medium text-primary-foreground hover:bg-primary/90",
          variant === "danger" &&
            "border border-destructive/40 text-destructive hover:bg-destructive/10",
          variant === "outline" && "border hover:bg-muted",
          className,
        )}
      >
        {pending ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {loadingText}
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
          isLoading={pending}
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
          isLoading={pending}
          onCancel={() => setIsOpen(false)}
          onConfirm={submitConfirmed}
        />
      )}
    </>
  );
}
