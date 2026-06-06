import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const stats = [
  { label: "Peserta Aktif", value: "1.248", tone: "bg-blue-50 text-blue-700" },
  { label: "Ujian Hari Ini", value: "32", tone: "bg-emerald-50 text-emerald-700" },
  { label: "Skor Rata-rata", value: "86%", tone: "bg-slate-100 text-slate-700" },
] as const;

const sidebarItems = ["Dashboard", "Bank Soal", "Jadwal", "Laporan"] as const;
const chartBars = ["h-20", "h-28", "h-16", "h-32", "h-24", "h-36", "h-28"] as const;
const activityItems: { icon: LucideIcon; text: string; color: string }[] = [
  { icon: CheckCircle2, text: "Ujian Matematika selesai", color: "text-emerald-500" },
  { icon: Clock3, text: "Token sesi aktif", color: "text-blue-500" },
  { icon: FileText, text: "Laporan siap diunduh", color: "text-slate-500" },
];

export function DashboardMockup() {
  return (
    <div className="landing-float relative mx-auto w-full max-w-[620px]">
      <div className="rounded-[2rem] border border-white/80 bg-white/70 p-2 shadow-[0_30px_80px_rgba(37,99,235,0.20)] backdrop-blur-xl">
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-300" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="ml-3 h-5 flex-1 rounded-full bg-white/10" />
          </div>

          <div className="grid min-h-[360px] grid-cols-[88px_1fr] bg-white">
            <aside className="hidden border-r border-slate-200 bg-slate-50 p-3 sm:block">
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white">
                S
              </div>
              <div className="space-y-3">
                {sidebarItems.map((item, index) => (
                  <div
                    className={`h-9 rounded-xl ${
                      index === 0 ? "bg-blue-600/10" : "bg-slate-200/70"
                    }`}
                    key={item}
                  />
                ))}
              </div>
            </aside>

            <div className="p-4 sm:p-6">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 h-3 w-24 rounded-full bg-blue-100" />
                  <div className="h-7 w-52 rounded-full bg-slate-900" />
                </div>
                <div className="flex h-10 w-32 items-center justify-center gap-2 rounded-full bg-blue-600 text-xs font-semibold text-white">
                  <ShieldCheck className="h-4 w-4" />
                  CBT Aman
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={item.label}>
                    <div className={`mb-3 inline-flex rounded-xl px-2.5 py-1 text-[10px] font-bold ${item.tone}`}>
                      {item.label}
                    </div>
                    <div className="text-2xl font-black text-slate-950">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="h-3 w-28 rounded-full bg-slate-200" />
                      <div className="mt-2 h-2 w-20 rounded-full bg-slate-100" />
                    </div>
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex h-40 items-end gap-2 rounded-2xl bg-gradient-to-b from-blue-50 to-white p-4">
                    {chartBars.map((height, index) => (
                      <span
                        className={`${height} flex-1 rounded-t-xl bg-gradient-to-t from-blue-600 to-sky-300`}
                        key={`${height}-${index}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    <div className="h-3 w-28 rounded-full bg-slate-200" />
                  </div>
                  <div className="space-y-3">
                    {activityItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3" key={item.text}>
                          <Icon className={`h-4 w-4 ${item.color}`} />
                          <span className="text-xs font-semibold text-slate-600">{item.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 -right-1 w-[156px] rounded-[2rem] border border-white/80 bg-white p-2 shadow-[0_22px_50px_rgba(15,23,42,0.18)] sm:-right-7 sm:w-[184px]">
        <div className="overflow-hidden rounded-[1.45rem] border border-slate-200 bg-slate-950 p-2">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/30" />
          <div className="rounded-[1.15rem] bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <UsersRound className="h-4 w-4 text-blue-600" />
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-700">
                LIVE
              </span>
            </div>
            <div className="mb-3 h-3 w-20 rounded-full bg-slate-900" />
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-blue-100" />
              <div className="h-2 w-10/12 rounded-full bg-slate-100" />
              <div className="h-2 w-8/12 rounded-full bg-slate-100" />
            </div>
            <div className="mt-4 rounded-2xl bg-blue-600 p-3 text-center text-lg font-black text-white">86</div>
          </div>
        </div>
      </div>
    </div>
  );
}
