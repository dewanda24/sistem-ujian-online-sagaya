"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import {
  Archive,
  CalendarPlus,
  Clipboard,
  Copy,
  Download,
  Eye,
  FileText,
  KeyRound,
  Loader2,
  MoreHorizontal,
  PenLine,
  Pencil,
  Power,
  RefreshCw,
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
  const [isPending, setIsPending] = useState(false);

  return (
    <details
      className={cn("group relative inline-block text-left open:z-50", className)}
      onSubmitCapture={() => setIsPending(true)}
    >
      <summary
        className={cn(
          "inline-flex h-10 min-w-20 cursor-pointer list-none items-center justify-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-3 text-[13px] font-medium text-[#1E293B] shadow-sm transition-all duration-150 select-none hover:bg-[#F8FAFC] active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20",
          isPending && "pointer-events-none opacity-80 border-blue-300 bg-blue-50/50 text-blue-700",
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin text-blue-600 shrink-0" aria-hidden="true" />
            <span>Memproses...</span>
          </>
        ) : (
          <>
            <MoreHorizontal className="size-4 text-[#64748B]" aria-hidden="true" />
            <span>{label}</span>
          </>
        )}
      </summary>
      <div
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const isConfirmTrigger = Boolean(target.closest("[data-confirm-trigger]"));
          if (!isConfirmTrigger && target.closest("a, button")) {
            const details = target.closest("details");
            if (details) details.removeAttribute("open");
          }
        }}
        className={cn(
          "absolute z-40 mt-2 grid min-w-48 gap-0.5 rounded-2xl border border-[#E2E8F0] bg-white p-1.5 text-xs shadow-lg animate-in fade-in-50 zoom-in-95 duration-100",
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
  "refresh-cw": RefreshCw,
  "rotate-ccw": RotateCcw,
  "screen-share": ScreenShare,
  send: Send,
  "shield-alert": ShieldAlert,
  "toggle-left": ToggleLeft,
  trash: Trash2,
  undo: Undo2,
  unlock: Unlock,
  "user-check": UserCheck,
  copy: Copy,
} satisfies Record<string, LucideIcon>;
