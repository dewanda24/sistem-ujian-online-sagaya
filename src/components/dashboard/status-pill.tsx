import { getStatusLabel } from "@/constants/ui-labels";
import { cn } from "@/lib/utils";

type StatusVariant =
  | "active"
  | "submitted"
  | "graded"
  | "late"
  | "cancelled"
  | "pending"
  | "success"
  | "warning"
  | "error"
  | "default";

/** Props for the new Material 3 chip-style StatusPill */
interface ModernStatusPillProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
  showDot?: boolean;
}

/** Props for the legacy StatusPill (used by table columns) */
interface StatusPillProps {
  value: string;
}

const variantStyles: Record<StatusVariant, string> = {
  active:    "bg-blue-50 text-blue-700 border-blue-200",
  submitted: "bg-amber-50 text-amber-700 border-amber-200",
  graded:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  late:      "bg-orange-50 text-orange-700 border-orange-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  success:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning:   "bg-amber-50 text-amber-700 border-amber-200",
  error:     "bg-red-50 text-red-700 border-red-200",
  default:   "bg-slate-50 text-slate-600 border-slate-200",
};

const dotStyles: Record<StatusVariant, string> = {
  active:    "bg-blue-500",
  submitted: "bg-amber-500",
  graded:    "bg-emerald-500",
  late:      "bg-orange-500",
  cancelled: "bg-red-500",
  pending:   "bg-amber-500",
  success:   "bg-emerald-500",
  warning:   "bg-amber-500",
  error:     "bg-red-500",
  default:   "bg-slate-400",
};

const legacyTone: Record<string, string> = {
  active:               "bg-blue-50 text-blue-700 border-blue-200",
  inactive:             "bg-slate-50 text-slate-600 border-slate-200",
  submitted:            "bg-emerald-50 text-emerald-700 border-emerald-200",
  finalized:            "bg-emerald-50 text-emerald-700 border-emerald-200",
  published:            "bg-emerald-50 text-emerald-700 border-emerald-200",
  ready:                "bg-emerald-50 text-emerald-700 border-emerald-200",
  aktif:                "bg-emerald-50 text-emerald-700 border-emerald-200",
  scheduled:            "bg-blue-50 text-blue-700 border-blue-200",
  in_progress:          "bg-blue-50 text-blue-700 border-blue-200",
  auto_scored:          "bg-blue-50 text-blue-700 border-blue-200",
  draft:                "bg-slate-50 text-slate-600 border-slate-200",
  assigned:             "bg-slate-50 text-slate-600 border-slate-200",
  pending:              "bg-slate-50 text-slate-600 border-slate-200",
  needs_manual_grading: "bg-amber-50 text-amber-700 border-amber-200",
  expired:              "bg-amber-50 text-amber-700 border-amber-200",
  archived:             "bg-slate-50 text-slate-600 border-slate-200",
  absent:               "bg-red-50 text-red-700 border-red-200",
  cancelled:            "bg-red-50 text-red-700 border-red-200",
  dibatalkan:           "bg-red-50 text-red-700 border-red-200",
  finished:             "bg-slate-50 text-slate-600 border-slate-200",
  selesai:              "bg-slate-50 text-slate-600 border-slate-200",
};

/** Modern Material 3 chip StatusPill */
export function ModernStatusPill({
  status,
  variant = "default",
  className,
  showDot = false,
}: ModernStatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[13px] font-medium whitespace-nowrap",
        variantStyles[variant],
        className,
      )}
    >
      {showDot && (
        <span className={cn("size-1.5 rounded-full shrink-0", dotStyles[variant])} />
      )}
      {status}
    </span>
  );
}

/** Legacy StatusPill — keeps backward compatibility with existing table columns */
export function StatusPill({ value }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-8 px-3 rounded-lg border text-[13px] font-medium whitespace-nowrap",
        legacyTone[value] ?? "bg-slate-50 text-slate-600 border-slate-200",
      )}
    >
      {getStatusLabel(value)}
    </span>
  );
}
