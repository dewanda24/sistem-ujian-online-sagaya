import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable } from "@/components/master-data/data-table";
import {
  getReportsByClass,
  getReportsByExam,
  getReportsBySubject,
  getReportSummary,
} from "@/features/reports/queries";
import { requireRole } from "@/lib/auth/require-role";

function percent(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default async function PrincipalDashboardPage() {
  const user = await requireRole("principal");
  const [summary, examRows, classRows, subjectRows] = await Promise.all([
    getReportSummary(),
    getReportsByExam(),
    getReportsByClass(),
    getReportsBySubject(),
  ]);
  const completionPercent = percent(summary.submitted, summary.totalParticipants);
  const finalizedPercent = percent(summary.finalized, summary.totalAttempts);
  const pendingPercent = percent(summary.pending, summary.totalAttempts);
  const absentPercent = percent(summary.absent, summary.totalParticipants);
  const lowCompletionExams = [...examRows]
    .filter((row) => row.count > 0)
    .sort((a, b) => percent(a.submitted, a.count) - percent(b.submitted, b.count))
    .slice(0, 5);
  const topClasses = [...classRows]
    .sort((a, b) => b.averagePercent - a.averagePercent)
    .slice(0, 5);
  const needsAttentionClasses = [...classRows]
    .filter((row) => row.count > 0)
    .sort((a, b) => {
      const bRisk = b.pending + b.absent + (b.count - b.submitted);
      const aRisk = a.pending + a.absent + (a.count - a.submitted);

      return bRisk - aRisk;
    })
    .slice(0, 5);
  const subjectPerformance = [...subjectRows]
    .sort((a, b) => a.averagePercent - b.averagePercent)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Principal Dashboard"
        description={`Ringkasan performa ujian sekolah. Selamat datang, ${
          user.user_profiles?.full_name ?? user.username
        }.`}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/dashboard/reports/exams">
          <DashboardCard
            title="Completion"
            value={formatPercent(completionPercent)}
            description={`${summary.submitted}/${summary.totalParticipants} peserta sudah submit.`}
            className="h-full transition hover:border-primary/40 hover:shadow-md"
          />
        </Link>
        <Link href="/dashboard/reports">
          <DashboardCard
            title="Average Final"
            value={`${summary.averagePercent.toFixed(2)}%`}
            description="Rata-rata nilai dari attempt finalized."
            className="h-full transition hover:border-primary/40 hover:shadow-md"
          />
        </Link>
        <Link href="/dashboard/reports?grading_status=needs_manual_grading">
          <DashboardCard
            title="Pending Grading"
            value={String(summary.pending)}
            description={`${formatPercent(pendingPercent)} dari total attempt.`}
            className="h-full transition hover:border-primary/40 hover:shadow-md"
          />
        </Link>
        <Link href="/dashboard/reports/exams">
          <DashboardCard
            title="Absent"
            value={String(summary.absent)}
            description={`${formatPercent(absentPercent)} dari peserta terjadwal.`}
            className="h-full transition hover:border-primary/40 hover:shadow-md"
          />
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          title="Kesehatan Pelaksanaan"
          description="Ringkasan eksekutif status ujian lintas kelas dan mapel."
        >
          <div className="space-y-4">
            <ProgressLine
              label="Submitted"
              value={completionPercent}
              caption={`${summary.submitted}/${summary.totalParticipants} peserta`}
            />
            <ProgressLine
              label="Finalized"
              value={finalizedPercent}
              caption={`${summary.finalized}/${summary.totalAttempts} attempt`}
            />
            <ProgressLine
              label="Pending Grading"
              value={pendingPercent}
              caption={`${summary.pending} attempt perlu koreksi`}
              tone="warning"
            />
            <ProgressLine
              label="Absent"
              value={absentPercent}
              caption={`${summary.absent} peserta tidak hadir`}
              tone="danger"
            />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Akses Cepat"
          description="Pintu masuk laporan yang paling sering dipakai kepala sekolah."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <QuickLink href="/dashboard/reports/exams" label="Laporan Per Ujian" />
            <QuickLink href="/dashboard/reports/classes" label="Laporan Per Kelas" />
            <QuickLink href="/dashboard/reports/subjects" label="Laporan Per Mapel" />
            <QuickLink href="/dashboard/reports/students" label="Laporan Per Siswa" />
          </div>
        </DashboardCard>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Ujian Dengan Completion Terendah</h2>
        <DataTable
          columns={["Ujian", "Peserta", "Submitted", "Pending", "Absent", "Rata-rata", "Aksi"]}
          isEmpty={lowCompletionExams.length === 0}
          empty={
            <EmptyState
              title="Belum ada data ujian"
              description="Data akan tampil setelah jadwal memiliki peserta atau attempt."
            />
          }
        >
          {lowCompletionExams.map((row) => (
            <tr key={row.scheduleId || row.title}>
              <td className="px-4 py-3 font-medium">{row.title}</td>
              <td className="px-4 py-3">{row.count}</td>
              <td className="px-4 py-3">{formatPercent(percent(row.submitted, row.count))}</td>
              <td className="px-4 py-3">
                <StatusPill value={row.pending > 0 ? "needs_manual_grading" : "finalized"} />
              </td>
              <td className="px-4 py-3">{row.absent}</td>
              <td className="px-4 py-3">{row.averagePercent.toFixed(1)}%</td>
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/reports/students?schedule_id=${row.scheduleId}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Detail
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardCard
          title="Top Kelas"
          description="Kelas dengan rata-rata finalized tertinggi."
        >
          <RankingList
            rows={topClasses.map((row) => ({
              key: row.classId || row.name,
              label: row.name,
              value: `${row.averagePercent.toFixed(1)}%`,
              href: `/dashboard/reports/students?class_id=${row.classId}`,
            }))}
            empty="Belum ada nilai finalized per kelas."
          />
        </DashboardCard>
        <DashboardCard
          title="Kelas Perlu Perhatian"
          description="Diprioritaskan dari pending, absent, dan peserta belum submit."
        >
          <RankingList
            rows={needsAttentionClasses.map((row) => ({
              key: row.classId || row.name,
              label: row.name,
              value: `${row.pending} pending / ${row.absent} absent`,
              href: `/dashboard/reports/students?class_id=${row.classId}`,
            }))}
            empty="Belum ada kelas yang perlu perhatian khusus."
          />
        </DashboardCard>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Mapel Dengan Rata-rata Terendah</h2>
        <DataTable
          columns={["Mapel", "Peserta", "Submitted", "Finalized", "Pending", "Absent", "Rata-rata", "Aksi"]}
          isEmpty={subjectPerformance.length === 0}
          empty={
            <EmptyState
              title="Belum ada data mapel"
              description="Data mapel akan tampil setelah ada attempt finalized."
            />
          }
        >
          {subjectPerformance.map((row) => (
            <tr key={row.subjectId || row.code}>
              <td className="px-4 py-3">
                <div className="font-medium">{row.name}</div>
                <div className="text-xs text-muted-foreground">{row.code}</div>
              </td>
              <td className="px-4 py-3">{row.count}</td>
              <td className="px-4 py-3">{row.submitted}</td>
              <td className="px-4 py-3">{row.finalized}</td>
              <td className="px-4 py-3">{row.pending}</td>
              <td className="px-4 py-3">{row.absent}</td>
              <td className="px-4 py-3">{row.averagePercent.toFixed(1)}%</td>
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/reports/students?subject_id=${row.subjectId}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Detail
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}

function ProgressLine({
  label,
  value,
  caption,
  tone = "default",
}: {
  label: string;
  value: number;
  caption: string;
  tone?: "danger" | "default" | "warning";
}) {
  const color =
    tone === "danger"
      ? "bg-red-500"
      : tone === "warning"
        ? "bg-amber-500"
        : "bg-primary";

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{caption}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${color}`}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
    >
      {label}
    </Link>
  );
}

function RankingList({
  rows,
  empty,
}: {
  rows: Array<{ key: string; label: string; value: string; href: string }>;
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <Link
          key={row.key}
          href={row.href}
          className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          <span>
            <span className="mr-2 text-muted-foreground">{index + 1}.</span>
            {row.label}
          </span>
          <span className="font-medium">{row.value}</span>
        </Link>
      ))}
    </div>
  );
}
