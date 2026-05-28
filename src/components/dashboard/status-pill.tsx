import { cn } from "@/lib/utils";

interface StatusPillProps {
  value: string;
}

const toneByValue: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  submitted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  finalized: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  scheduled: "bg-sky-50 text-sky-700 ring-sky-600/20",
  in_progress: "bg-sky-50 text-sky-700 ring-sky-600/20",
  auto_scored: "bg-sky-50 text-sky-700 ring-sky-600/20",
  draft: "bg-muted text-muted-foreground ring-border",
  assigned: "bg-muted text-muted-foreground ring-border",
  pending: "bg-muted text-muted-foreground ring-border",
  needs_manual_grading: "bg-amber-50 text-amber-700 ring-amber-600/20",
  expired: "bg-amber-50 text-amber-700 ring-amber-600/20",
  archived: "bg-zinc-100 text-zinc-700 ring-zinc-300",
  cancelled: "bg-red-50 text-red-700 ring-red-600/20",
  finished: "bg-zinc-100 text-zinc-700 ring-zinc-300",
};

export function StatusPill({ value }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1",
        toneByValue[value] ?? "bg-muted text-muted-foreground ring-border",
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
