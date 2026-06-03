import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable } from "@/components/master-data/data-table";
import {
  firstRelation,
  getProctorOperationalSummary,
} from "@/features/monitoring/queries";
import { requirePermission } from "@/lib/auth/require-permission";
import { formatJakartaDateTime } from "@/lib/date-time";

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return formatJakartaDateTime(value);
}

export default async function ProctorSchedulesPage() {
  await requirePermission("exam_monitoring.view");
  const summary = await getProctorOperationalSummary();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Jadwal Pengawasan"
        description="Daftar jadwal yang dapat dipantau proctor berdasarkan permission monitoring saat ini. Scoping pengawas per ruang/jadwal dapat ditambahkan nanti dengan tabel assignment khusus."
      />

      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-6">
        <SummaryCard label="Jadwal" value={summary.schedules.length} />
        <SummaryCard label="Active" value={summary.activeSchedules.length} />
        <SummaryCard label="Mendatang" value={summary.upcomingSchedules.length} />
        <SummaryCard label="Peserta" value={summary.participants.length} />
        <SummaryCard label="In Progress" value={summary.inProgress} />
        <SummaryCard label="Event" value={summary.events.length} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <QuickLink
          title="Monitoring Live"
          description="Buka dashboard monitoring dengan auto-refresh, filter kelas/status, dan aksi kontrol peserta."
          href="/dashboard/proctor/monitoring"
        />
        <QuickLink
          title="Peserta Sedang Ujian"
          description="Langsung fokus ke attempt yang sedang berjalan."
          href="/dashboard/proctor/monitoring?status=in_progress"
        />
        <QuickLink
          title="Peserta Belum Mulai"
          description="Cek peserta assigned yang belum membuka ujian."
          href="/dashboard/proctor/monitoring?status=assigned"
        />
        <QuickLink
          title="Token Ujian"
          description="Buka tampilan token read-only yang siap dicetak untuk ruang ujian."
          href="/dashboard/proctor/tokens"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href="/dashboard/import-export"
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
        >
          Buka Import/Export
        </Link>
      </div>

      <DataTable
        columns={[
          "Jadwal",
          "Mapel",
          "Waktu",
          "Kelas",
          "Token",
          "Peserta",
          "Progress",
          "Event",
          "Aksi",
        ]}
        isEmpty={summary.schedules.length === 0}
        empty={
          <EmptyState
            title="Belum ada jadwal pengawasan"
            description="Jadwal akan tampil setelah admin/guru membuat jadwal dengan status scheduled, active, atau finished."
          />
        }
      >
        {summary.schedules.map((schedule) => {
          const examPackage = firstRelation(schedule.exam_packages);
          const subject = firstRelation(examPackage?.subjects);
          const classes = (schedule.exam_schedule_classes ?? [])
            .map((item) => firstRelation(item.classes))
            .filter((classItem): classItem is { id: string; name: string } =>
              Boolean(classItem?.id),
            );
          const participants = schedule.exam_participants ?? [];
          const attempts = participants
            .map((participant) => firstRelation(participant.exam_attempts))
            .filter((attempt): attempt is NonNullable<typeof attempt> =>
              Boolean(attempt),
            );
          const submitted = attempts.filter(
            (attempt) => attempt.status === "submitted",
          ).length;
          const inProgress = attempts.filter(
            (attempt) => attempt.status === "in_progress",
          ).length;
          const eventCount = attempts.reduce(
            (total, attempt) => total + (attempt.exam_events?.length ?? 0),
            0,
          );
          const progress =
            participants.length > 0
              ? Math.round((submitted / participants.length) * 100)
              : 0;
          const monitoringHref = `/dashboard/proctor/monitoring?schedule_id=${schedule.id}`;

          return (
            <tr key={schedule.id}>
              <td className="px-4 py-3">
                <div className="font-medium">{schedule.title}</div>
                <div className="mt-1">
                  <StatusPill value={schedule.status} />
                </div>
              </td>
              <td className="px-4 py-3">
                <div>{subject?.name ?? examPackage?.title ?? "-"}</div>
                <div className="text-xs text-muted-foreground">
                  {subject?.code ?? "Mapel"}
                </div>
              </td>
              <td className="px-4 py-3 text-xs">
                {formatDateTime(schedule.start_at)}
                <br />
                {formatDateTime(schedule.end_at)}
              </td>
              <td className="px-4 py-3 text-xs">
                {classes.length > 0
                  ? classes.map((classItem) => classItem.name).join(", ")
                  : "-"}
              </td>
              <td className="px-4 py-3">
                {schedule.token_required ? (
                  <div>
                    <StatusPill value="required" />
                    <div className="mt-1 font-mono text-xs">
                      {schedule.access_token ?? "Belum dibuat"}
                    </div>
                    <Link
                      href="/dashboard/proctor/tokens"
                      className="mt-1 inline-flex text-xs text-primary hover:underline"
                    >
                      Print
                    </Link>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Tidak wajib</span>
                )}
              </td>
              <td className="px-4 py-3">{participants.length}</td>
              <td className="px-4 py-3">
                <div className="text-xs text-muted-foreground">
                  {submitted} submitted / {inProgress} berjalan
                </div>
                <div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
              </td>
              <td className="px-4 py-3">{eventCount}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={monitoringHref}
                    className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Monitoring
                  </Link>
                  <Link
                    href="/dashboard/import-export"
                    className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Import/Export
                  </Link>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function QuickLink({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border bg-card p-4 transition hover:border-primary/50 hover:bg-muted/40"
    >
      <div className="font-semibold">{title}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}
