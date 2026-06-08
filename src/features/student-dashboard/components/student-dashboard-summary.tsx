import Link from "next/link";
import { History, ListChecks, PlayCircle } from "lucide-react";

type SummaryProps = {
  activeCount: number;
  upcomingCount: number;
  historyCount: number;
};

const actions = [
  {
    label: "Mulai Ujian",
    href: "/dashboard/student/active-exams",
    icon: PlayCircle,
  },
  {
    label: "Lihat Jadwal",
    href: "/dashboard/student/schedules",
    icon: ListChecks,
  },
  {
    label: "Lihat Riwayat",
    href: "/dashboard/student/history",
    icon: History,
  },
];

export function StudentDashboardSummary({
  activeCount,
  upcomingCount,
  historyCount,
}: SummaryProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        const value = [activeCount, upcomingCount, historyCount][index];

        return (
          <Link
            key={action.href}
            href={action.href}
            className="flex min-h-24 items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-600">
                {value} item
              </span>
              <span className="block text-lg font-bold text-slate-950">
                {action.label}
              </span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}
