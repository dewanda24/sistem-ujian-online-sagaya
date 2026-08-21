import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { PrintButton } from "@/features/monitoring/components/print-button";
import {
  firstRelation,
  getProctorScheduleOverview,
} from "@/features/monitoring/queries";
import { requirePermission } from "@/lib/auth/require-permission";
import { formatJakartaDateTime } from "@/lib/date-time";

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return formatJakartaDateTime(value);
}

export default async function ProctorTokensPage() {
  const user = await requirePermission("exam_monitoring.view");
  const schedules = (await getProctorScheduleOverview(user)).filter(
    (schedule) => schedule.token_required,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DashboardPageHeader
          title="Token Ujian Ruangan"
          description="Daftar token aktif untuk pengawas ruangan. Token dapat dicetak untuk dibagikan atau ditulis di papan tulis."
        />
        <PrintButton label="Cetak Slip Token" />
      </div>

      {schedules.length === 0 ? (
        <EmptyState
          title="Tidak ada token aktif"
          description="Token akan tampil jika jadwal ujian aktif mewajibkan token masuk."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schedules.map((schedule) => {
            const examPackage = firstRelation(schedule.exam_packages);
            const subject = firstRelation(examPackage?.subjects);
            const classes = (schedule.exam_schedule_classes ?? [])
              .map((item) => firstRelation(item.classes))
              .filter((classItem): classItem is { id: string; name: string } =>
                Boolean(classItem?.id),
              );

            return (
              <section
                key={schedule.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs break-inside-avoid print:border-slate-400"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 leading-snug">{schedule.title}</h2>
                    <p className="mt-0.5 text-xs font-semibold text-blue-700">
                      {subject?.code ?? "Mapel"} • {subject?.name ?? examPackage?.title ?? "-"}
                    </p>
                  </div>
                  <StatusPill value={schedule.status} />
                </div>

                <div className="my-4 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-4 text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    KODE TOKEN MASUK
                  </div>
                  <div className="mt-1 font-mono text-3xl font-black tracking-widest text-blue-800 selection:bg-blue-200">
                    {schedule.access_token ?? "BELUM ADA"}
                  </div>
                </div>

                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between gap-3 text-slate-600">
                    <dt className="font-medium text-slate-400">Mulai</dt>
                    <dd className="font-semibold text-slate-800 text-right">{formatDateTime(schedule.start_at)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-600">
                    <dt className="font-medium text-slate-400">Selesai</dt>
                    <dd className="font-semibold text-slate-800 text-right">{formatDateTime(schedule.end_at)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-600">
                    <dt className="font-medium text-slate-400">Kelas</dt>
                    <dd className="font-semibold text-slate-800 text-right">
                      {classes.length
                        ? classes.map((classItem) => classItem.name).join(", ")
                        : "-"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between print:hidden">
                  <Link
                    href={`/dashboard/proctor/monitoring?schedule_id=${schedule.id}`}
                    className="inline-flex h-8 items-center rounded-xl bg-blue-600 px-3 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition"
                  >
                    Pantau Ujian Ini
                  </Link>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
