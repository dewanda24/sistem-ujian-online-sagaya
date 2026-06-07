import { cn } from "@/lib/utils";

interface StatusPillProps {
  value: string;
}

const toneByValue: Record<string, string> = {
  active: "bg-emerald-50 text-[#16A34A] ring-[#22C55E]/25",
  submitted: "bg-emerald-50 text-[#16A34A] ring-[#22C55E]/25",
  finalized: "bg-emerald-50 text-[#16A34A] ring-[#22C55E]/25",
  published: "bg-emerald-50 text-[#16A34A] ring-[#22C55E]/25",
  ready: "bg-emerald-50 text-[#16A34A] ring-[#22C55E]/25",
  aktif: "bg-emerald-50 text-[#16A34A] ring-[#22C55E]/25",
  scheduled: "bg-blue-50 text-[#2563EB] ring-[#2563EB]/20",
  in_progress: "bg-blue-50 text-[#2563EB] ring-[#2563EB]/20",
  auto_scored: "bg-blue-50 text-[#2563EB] ring-[#2563EB]/20",
  draft: "bg-[#F8FAFC] text-[#64748B] ring-[#E2E8F0]",
  assigned: "bg-[#F8FAFC] text-[#64748B] ring-[#E2E8F0]",
  pending: "bg-[#F8FAFC] text-[#64748B] ring-[#E2E8F0]",
  needs_manual_grading: "bg-amber-50 text-[#D97706] ring-[#F59E0B]/25",
  expired: "bg-amber-50 text-[#D97706] ring-[#F59E0B]/25",
  archived: "bg-[#F8FAFC] text-[#64748B] ring-[#E2E8F0]",
  cancelled: "bg-red-50 text-[#DC2626] ring-[#EF4444]/25",
  dibatalkan: "bg-red-50 text-[#DC2626] ring-[#EF4444]/25",
  finished: "bg-[#F8FAFC] text-[#64748B] ring-[#E2E8F0]",
  selesai: "bg-[#F8FAFC] text-[#64748B] ring-[#E2E8F0]",
};

export function StatusPill({ value }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-1 text-xs font-medium capitalize ring-1",
        toneByValue[value] ?? "bg-[#F8FAFC] text-[#64748B] ring-[#E2E8F0]",
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
