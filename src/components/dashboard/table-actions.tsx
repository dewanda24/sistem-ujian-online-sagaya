"use client";

import Link from "next/link";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { cn } from "@/lib/utils";

type TableActionsProps = {
  children: ReactNode;
  label?: string;
  align?: "start" | "end";
  className?: string;
};

type TableActionTone = "default" | "danger" | "muted";

type TableActionLinkProps = {
  href: string;
  children: ReactNode;
  icon?: LucideIcon;
  tone?: TableActionTone;
  className?: string;
};

type TableActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  tone?: TableActionTone;
};

type TableActionSubmitProps = {
  children: ReactNode;
  confirmMessage: string;
  confirmTitle?: string;
  confirmationText?: "HAPUS" | "RESET";
  disabled?: boolean;
  icon?: LucideIcon;
  tone?: Exclude<TableActionTone, "muted">;
};

export function TableActions({
  children,
  label = "Aksi",
  align = "end",
  className,
}: TableActionsProps) {
  return (
    <details className={cn("group relative inline-block text-left", className)}>
      <summary className="inline-flex h-8 min-w-20 cursor-pointer list-none items-center justify-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#0F172A] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20">
        <MoreHorizontal className="size-3.5 text-[#64748B]" aria-hidden="true" />
        <span>{label}</span>
      </summary>
      <div
        className={cn(
          "absolute z-40 mt-2 grid min-w-48 gap-1 rounded-lg border border-[#E2E8F0] bg-white p-1.5 text-xs shadow-lg",
          align === "end" ? "right-0" : "left-0",
        )}
      >
        {children}
      </div>
    </details>
  );
}

export function TableActionLink({
  href,
  children,
  icon: Icon,
  tone = "default",
  className,
}: TableActionLinkProps) {
  return (
    <Link href={href} className={cn(tableActionClassName(tone), className)}>
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      <span>{children}</span>
    </Link>
  );
}

export function TableActionButton({
  children,
  icon: Icon,
  tone = "default",
  className,
  type = "button",
  ...props
}: TableActionButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(tableActionClassName(tone), className)}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function TableActionSubmit({
  children,
  confirmMessage,
  confirmTitle,
  confirmationText,
  disabled,
  icon: Icon,
  tone = "default",
}: TableActionSubmitProps) {
  return (
    <ConfirmSubmitButton
      confirmMessage={confirmMessage}
      confirmTitle={confirmTitle}
      confirmationText={confirmationText}
      disabled={disabled}
      variant={tone === "danger" ? "danger" : "outline"}
      className={cn(
        tableActionClassName(tone),
        "h-auto w-full justify-start rounded-md border-0 px-2 py-1.5 text-xs",
      )}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      <span>{children}</span>
    </ConfirmSubmitButton>
  );
}

export function TableActionDisabled({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <span className={cn(tableActionClassName("muted"), "cursor-not-allowed")}>
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      <span>{children}</span>
    </span>
  );
}

function tableActionClassName(tone: TableActionTone) {
  return cn(
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    tone === "default" && "text-[#0F172A] hover:bg-[#F8FAFC]",
    tone === "danger" && "text-[#DC2626] hover:bg-red-50",
    tone === "muted" && "text-[#94A3B8]",
  );
}
