import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import {
  firstRelation,
  getStudentSubmittedAttempts,
} from "@/features/results/queries";
import { requirePermission } from "@/lib/auth/require-permission";
import { formatJakartaDateTime } from "@/lib/date-time";

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    message?: string;
  }>;
};

function scoreText(score?: number | null, maxScore?: number | null) {
  return `${Number(score ?? 0)} / ${Number(maxScore ?? 0)}`;
}

export default async function ExamHistoryPage({ searchParams }: PageProps) {
  await requirePermission("exam_results.view");
  const [params, attempts] = await Promise.all([
    searchParams,
    getStudentSubmittedAttempts(),
  ]);

  return (
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />
      <DashboardPageHeader
        title="Riwayat Ujian"
        description="Daftar ujian yang sudah kamu kumpulkan beserta hasil yang tersedia."
      />
      <DataTable
        columns={["Ujian", "Mapel", "Dikumpulkan", "Skor", "Status", "Aksi"]}
        isEmpty={attempts.length === 0}
        empty={
          <EmptyState
            title="Riwayat masih kosong"
            description="Riwayat akan bertambah setelah peserta menyelesaikan ujian."
          />
        }
      >
        {attempts.map((attempt) => {
          const schedule = firstRelation(attempt.exam_schedules);
          const examPackage = firstRelation(schedule?.exam_packages);
          const subject = firstRelation(examPackage?.subjects);
          const canShowScore =
            Boolean(examPackage?.show_result) &&
            attempt.grading_status !== "needs_manual_grading";

          return (
            <tr key={attempt.id}>
              <td className="px-4 py-3 font-medium">
                {schedule?.title ?? "-"}
              </td>
              <td className="px-4 py-3">
                {subject?.code ?? "-"}
                <div className="text-xs text-muted-foreground">
                  {subject?.name ?? ""}
                </div>
              </td>
              <td className="px-4 py-3">
                {attempt.submitted_at
                  ? formatJakartaDateTime(attempt.submitted_at)
                  : "-"}
              </td>
              <td className="px-4 py-3">
                {canShowScore
                  ? scoreText(attempt.score, attempt.max_score)
                  : "Menunggu hasil"}
              </td>
              <td className="px-4 py-3">
                {attempt.grading_status === "needs_manual_grading"
                  ? "Menunggu Koreksi"
                  : attempt.grading_status === "finalized"
                    ? "Nilai Final"
                    : attempt.grading_status ?? "-"}
              </td>
              <td className="px-4 py-3">
                <a
                  href={`/dashboard/exam-results/${attempt.id}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Detail
                </a>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
