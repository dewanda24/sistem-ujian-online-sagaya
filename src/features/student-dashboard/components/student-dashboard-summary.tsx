import Link from "next/link";
import { CalendarCheck2, History, Sparkles } from "lucide-react";

type SummaryProps = {
  activeCount: number;
  upcomingCount: number;
  historyCount: number;
};

export function StudentDashboardSummary({
  activeCount,
  upcomingCount,
  historyCount,
}: SummaryProps) {
  const items = [
    {
      label: "Ujian Aktif",
      count: activeCount,
      desc: activeCount > 0 ? "Siap kamu kerjakan sekarang" : "Belum ada ujian aktif",
      href: "/dashboard/student/active-exams",
      icon: Sparkles,
      iconBg: "bg-blue-600 text-white",
      badgeBg: activeCount > 0 ? "bg-blue-100 text-blue-700 font-extrabold" : "bg-slate-100 text-slate-600",
      cardBorder: activeCount > 0 ? "border-blue-300 ring-2 ring-blue-500/20 bg-blue-50/40" : "border-slate-200 bg-white",
    },
    {
      label: "Jadwal Ujian",
      count: upcomingCount,
      desc: upcomingCount > 0 ? "Jadwal ujian mendatang" : "Belum ada jadwal baru",
      href: "/dashboard/student/schedules",
      icon: CalendarCheck2,
      iconBg: "bg-indigo-600 text-white",
      badgeBg: upcomingCount > 0 ? "bg-indigo-100 text-indigo-700 font-extrabold" : "bg-slate-100 text-slate-600",
      cardBorder: "border-slate-200 bg-white",
    },
    {
      label: "Riwayat Nilai",
      count: historyCount,
      desc: historyCount > 0 ? "Hasil ujian tersimpan" : "Belum ada riwayat",
      href: "/dashboard/student/history",
      icon: History,
      iconBg: "bg-emerald-600 text-white",
      badgeBg: historyCount > 0 ? "bg-emerald-100 text-emerald-700 font-extrabold" : "bg-slate-100 text-slate-600",
      cardBorder: "border-slate-200 bg-white",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex items-center justify-between gap-3.5 rounded-2xl border p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-98 ${item.cardBorder}`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-xs transition-transform group-hover:scale-105 ${item.iconBg}`}>
                <Icon className="size-6" />
              </span>
              <div className="min-w-0">
                <span className="block text-base font-bold text-slate-950 truncate">
                  {item.label}
                </span>
                <span className="block text-xs font-medium text-slate-500 truncate mt-0.5">
                  {item.desc}
                </span>
              </div>
            </div>

            <div className={`flex shrink-0 items-center justify-center rounded-xl px-2.5 py-1 text-sm ${item.badgeBg}`}>
              {item.count}
            </div>
          </Link>
        );
      })}
    </section>
  );
}

