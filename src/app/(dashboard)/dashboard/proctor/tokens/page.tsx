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

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ProctorTokensPage() {
  await requirePermission("exam_monitoring.view");
  const schedules = (await getProctorScheduleOverview()).filter(
    (schedule) => schedule.token_required,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <DashboardPageHeader
          title="Token Ujian"
          description="Tampilan token read-only untuk pengawas. Regenerate token tetap dilakukan dari halaman jadwal oleh role yang memiliki permission token."
        />
        <PrintButton label="Print Token" />
      </div>

      {schedules.length === 0 ? (
        <EmptyState
          title="Tidak ada token aktif"
          description="Token akan tampil jika jadwal memakai token_required."
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
                className="rounded-lg border bg-card p-5 shadow-sm break-inside-avoid"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{schedule.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {subject?.code ?? "Mapel"} - {subject?.name ?? examPackage?.title ?? "-"}
                    </p>
                  </div>
                  <StatusPill value={schedule.status} />
                </div>

                <div className="my-5 rounded-lg border border-dashed p-4 text-center">
                  <div className="text-xs uppercase text-muted-foreground">
                    Token
                  </div>
                  <div className="mt-2 font-mono text-3xl font-semibold tracking-widest">
                    {schedule.access_token ?? "BELUM ADA"}
                  </div>
                </div>

                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Mulai</dt>
                    <dd className="text-right">{formatDateTime(schedule.start_at)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Selesai</dt>
                    <dd className="text-right">{formatDateTime(schedule.end_at)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Kelas</dt>
                    <dd className="text-right">
                      {classes.length
                        ? classes.map((classItem) => classItem.name).join(", ")
                        : "-"}
                    </dd>
                  </div>
                </dl>

                <Link
                  href={`/dashboard/proctor/monitoring?schedule_id=${schedule.id}`}
                  className="mt-4 inline-flex rounded-md border px-3 py-1.5 text-xs hover:bg-muted print:hidden"
                >
                  Monitoring
                </Link>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
