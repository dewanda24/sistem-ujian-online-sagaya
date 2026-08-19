import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import {
  firstRelation,
  getStudentSubmittedAttempts,
} from "@/features/results/queries";
import { HistoryExamCard } from "@/features/student-dashboard/components/history-exam-card";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    message?: string;
  }>;
};

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
        description="Daftar ujian yang sudah kamu kumpulkan beserta hasil nilai yang tersedia."
      />

      {attempts.length === 0 ? (
        <EmptyState
          title="Riwayat masih kosong"
          description="Riwayat ujian akan muncul di sini setelah kamu menyelesaikan dan mengumpulkan ujian."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {attempts.map((attempt) => {
            const schedule = firstRelation(attempt.exam_schedules);
            const examPackage = firstRelation(schedule?.exam_packages);
            const subject = firstRelation(examPackage?.subjects);
            const canShowScore =
              Boolean(examPackage?.show_result) &&
              attempt.grading_status !== "needs_manual_grading";

            return (
              <HistoryExamCard
                key={attempt.id}
                attemptId={attempt.id}
                scheduleTitle={schedule?.title ?? "Ujian"}
                subjectCode={subject?.code ?? "-"}
                subjectName={subject?.name ?? "Mata Pelajaran"}
                score={attempt.score}
                maxScore={attempt.max_score}
                canShowScore={canShowScore}
                gradingStatus={attempt.grading_status}
                submittedAt={attempt.submitted_at}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

