"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { ConfirmDialog } from "@/components/common/dialogs/confirm-dialog";
import { cn } from "@/lib/utils";

type ConfirmLinkButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
  confirmMessage: string;
  confirmTitle?: string;
  loadingText?: string;
  variant?: "default" | "outline";
};

export function ConfirmLinkButton({
  href,
  children,
  className,
  confirmMessage,
  confirmTitle = "Konfirmasi",
  loadingText = "Memproses...",
  variant = "default",
}: ConfirmLinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <Link
        href={href}
        onClick={(event) => {
          event.preventDefault();
          setIsOpen(true);
        }}
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-medium transition",
          variant === "default" &&
            "bg-[#2563EB] text-white hover:bg-blue-700",
          variant === "outline" && "border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]",
          isLoading && "pointer-events-none opacity-60",
          className,
        )}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {loadingText}
          </span>
        ) : (
          children
        )}
      </Link>
      <ConfirmDialog
        isOpen={isOpen}
        title={confirmTitle}
        description={confirmMessage}
        confirmLabel="Lanjutkan"
        isLoading={isLoading}
        onCancel={() => setIsOpen(false)}
        onConfirm={() => {
          setIsLoading(true);
          window.location.assign(href);
        }}
      />
    </>
  );
}
