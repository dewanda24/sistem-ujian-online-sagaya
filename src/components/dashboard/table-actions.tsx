"use client";

import Link from "next/link";
import {
  Archive,
  CalendarPlus,
  Clipboard,
  Download,
  Eye,
  FileText,
  KeyRound,
  MoreHorizontal,
  PenLine,
  Pencil,
  Power,
  RotateCcw,
  ScreenShare,
  Send,
  ShieldAlert,
  ToggleLeft,
  Trash2,
  Undo2,
  Unlock,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
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
export type TableActionIconName = keyof typeof tableActionIcons;

type TableActionLinkProps = {
  href: string;
  children: ReactNode;
  icon?: TableActionIconName;
  tone?: TableActionTone;
  className?: string;
};

type TableActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: TableActionIconName;
  tone?: TableActionTone;
};

type TableActionSubmitProps = {
  children: ReactNode;
  confirmMessage: string;
  confirmTitle?: string;
  confirmationText?: "HAPUS" | "RESET";
  disabled?: boolean;
  icon?: TableActionIconName;
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
      <summary className="inline-flex h-8 min-w-20 cursor-pointer list-none items-center justify-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#0F172A] shadow-xs transition-all duration-150 select-none hover:bg-[#F8FAFC] hover:border-slate-300 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20">
        <MoreHorizontal className="size-3.5 text-[#64748B]" aria-hidden="true" />
        <span>{label}</span>
      </summary>
      <div
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("a, button")) {
            const details = target.closest("details");
            if (details) details.removeAttribute("open");
          }
        }}
        className={cn(
          "absolute z-40 mt-2 grid min-w-48 gap-1 rounded-lg border border-[#E2E8F0] bg-white p-1.5 text-xs shadow-lg animate-in fade-in-50 zoom-in-95 duration-100",
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
  icon,
  tone = "default",
  className,
}: TableActionLinkProps) {
  const Icon = icon ? tableActionIcons[icon] : null;

  return (
    <Link href={href} className={cn(tableActionClassName(tone), className)}>
      {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden="true" /> : null}
      <span className="truncate">{children}</span>
    </Link>
  );
}

export function TableActionButton({
  children,
  icon,
  tone = "default",
  className,
  type = "button",
  ...props
}: TableActionButtonProps) {
  const Icon = icon ? tableActionIcons[icon] : null;

  return (
    <button
      {...props}
      type={type}
      className={cn(tableActionClassName(tone), className)}
    >
      {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden="true" /> : null}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function TableActionSubmit({
  children,
  confirmMessage,
  confirmTitle,
  confirmationText,
  disabled,
  icon,
  tone = "default",
}: TableActionSubmitProps) {
  const ActionIcon = icon ? tableActionIcons[icon] : null;

  return (
    <ConfirmSubmitButton
      confirmMessage={confirmMessage}
      confirmTitle={confirmTitle}
      confirmationText={confirmationText}
      disabled={disabled}
      variant={tone === "danger" ? "danger" : "outline"}
      className={cn(
        tableActionClassName(tone),
        "h-auto w-full justify-start rounded-md border-0 px-2 py-1.5 text-xs shadow-none hover:shadow-none",
      )}
    >
      {ActionIcon ? (
        <ActionIcon className="size-3.5 shrink-0" aria-hidden="true" />
      ) : null}
      <span className="truncate">{children}</span>
    </ConfirmSubmitButton>
  );
}

export function TableActionDisabled({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: TableActionIconName;
}) {
  const Icon = icon ? tableActionIcons[icon] : null;

  return (
    <span className={cn(tableActionClassName("muted"), "cursor-not-allowed")}>
      {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden="true" /> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}

function tableActionClassName(tone: TableActionTone) {
  return cn(
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-all duration-150 select-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
    tone === "default" && "text-[#0F172A] hover:bg-[#F8FAFC] active:bg-slate-100",
    tone === "danger" && "text-[#DC2626] hover:bg-red-50 active:bg-red-100",
    tone === "muted" && "text-[#94A3B8]",
  );
}

const tableActionIcons = {
  archive: Archive,
  "calendar-plus": CalendarPlus,
  clipboard: Clipboard,
  download: Download,
  eye: Eye,
  "file-text": FileText,
  "key-round": KeyRound,
  "pen-line": PenLine,
  pencil: Pencil,
  power: Power,
  "rotate-ccw": RotateCcw,
  "screen-share": ScreenShare,
  send: Send,
  "shield-alert": ShieldAlert,
  "toggle-left": ToggleLeft,
  trash: Trash2,
  undo: Undo2,
  unlock: Unlock,
  "user-check": UserCheck,
} satisfies Record<string, LucideIcon>;
