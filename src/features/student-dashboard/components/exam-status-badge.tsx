import { cn } from "@/lib/utils";

export type StudentExamStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "late";

const statusConfig: Record<
  StudentExamStatus,
  {
    label: string;
    className: string;
  }
> = {
  not_started: {
    label: "Belum dikerjakan",
    className: "bg-slate-50 text-slate-700 ring-slate-200",
  },
  in_progress: {
    label: "Sedang berlangsung",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  submitted: {
    label: "Sudah Dikumpulkan",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  late: {
    label: "Terlambat",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
};

export function ExamStatusBadge({ status }: { status: StudentExamStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-semibold ring-1",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
