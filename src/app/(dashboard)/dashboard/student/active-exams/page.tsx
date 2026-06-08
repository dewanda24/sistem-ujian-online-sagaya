import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { startExamAction } from "@/features/exam-room/actions";
import { getStudentExamSchedules } from "@/features/exam-room/queries";
import { ActiveExamCard } from "@/features/student-dashboard/components/active-exam-card";
import { EmptyExamState } from "@/features/student-dashboard/components/empty-exam-state";
import type { StudentExamStatus } from "@/features/student-dashboard/components/exam-status-badge";
import { requirePermission } from "@/lib/auth/require-permission";

type StudentAttemptStatus = { id?: string; status?: string | null };

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    message?: string;
  }>;
};

function getParticipant(schedule: {
  exam_participants?: Array<{
    id: string;
    status: string;
    exam_attempts?: Array<{ id: string; status: string }> | null;
  }> | null;
}) {
  return schedule.exam_participants?.[0] ?? null;
}

function getStatus(schedule: Awaited<ReturnType<typeof getStudentExamSchedules>>[number]) {
  const participant = getParticipant(schedule);
  const attempts = participant?.exam_attempts ?? [];
  const hasSubmitted =
    participant?.status === "submitted" ||
    attempts.some((attempt: StudentAttemptStatus) => attempt.status === "submitted");
  const hasInProgress =
    participant?.status === "in_progress" ||
    attempts.some((attempt: StudentAttemptStatus) => attempt.status === "in_progress");

  if (hasSubmitted) {
    return "submitted" satisfies StudentExamStatus;
  }

  if (hasInProgress) {
    return "in_progress" satisfies StudentExamStatus;
  }

  return "not_started" satisfies StudentExamStatus;
}

export default async function ActiveExamsPage({ searchParams }: PageProps) {
  await requirePermission("active_exams.view");
  const params = await searchParams;
  const schedules = await getStudentExamSchedules({ activeOnly: true });

  return (
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />
      <DashboardPageHeader
        title="Ujian Aktif"
        description="Ujian yang sedang bisa kamu kerjakan sekarang."
      />

      {schedules.length > 0 ? (
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const participant = getParticipant(schedule);
            const activeAttempt = participant?.exam_attempts?.find(
              (attempt: StudentAttemptStatus) => attempt.status === "in_progress",
            );

            return (
              <ActiveExamCard
                key={schedule.id}
                action={startExamAction}
                exam={{
                  id: schedule.id as string,
                  title: schedule.title as string,
                  subjectCode: schedule.exam_packages?.subjects?.code ?? "-",
                  subjectName:
                    schedule.exam_packages?.subjects?.name ?? "Mata pelajaran",
                  startAt: schedule.start_at as string,
                  endAt: schedule.end_at as string,
                  durationMinutes: schedule.exam_packages?.duration_minutes,
                  status: getStatus(schedule),
                  attemptId: activeAttempt?.id ?? null,
                  tokenRequired: schedule.token_required,
                }}
              />
            );
          })}
        </div>
      ) : (
        <EmptyExamState />
      )}

    </div>
  );
}
