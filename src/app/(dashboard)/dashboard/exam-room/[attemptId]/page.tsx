import { notFound } from "next/navigation";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ActionToast } from "@/components/master-data/action-toast";
import { ExamRoomWorkspace } from "@/features/exam-room/components/exam-room-workspace";
import {
  getAttemptAnswers,
  getAttemptQuestions,
  getExamAttempt,
} from "@/features/exam-room/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  params: Promise<{
    attemptId: string;
  }>;
  searchParams: Promise<{
    notice?: string;
    message?: string;
  }>;
};

export default async function ExamRoomPage({ params, searchParams }: PageProps) {
  await requirePermission("exam_room.access");
  const [{ attemptId }, query] = await Promise.all([params, searchParams]);
  const [attempt, questions, answers] = await Promise.all([
    getExamAttempt(attemptId),
    getAttemptQuestions(attemptId),
    getAttemptAnswers(attemptId),
  ]);

  if (!attempt) {
    notFound();
  }

  const schedule = attempt.exam_schedules;
  const examPackage = schedule?.exam_packages;
  const serializedAnswers = Array.from(answers.entries()).map(
    ([question_id, answer]) => ({
      question_id,
      ...answer,
    }),
  );

  return (
    <div className="space-y-6">
      <ActionToast status={query.notice} message={query.message} />
      <DashboardPageHeader
        title={schedule?.title ?? "Ruang Ujian"}
        description={`${examPackage?.title ?? "Paket ujian"} | ${
          examPackage?.subjects?.code ?? "Mapel"
        } | ${examPackage?.duration_minutes ?? "-"} menit`}
      />
      <ExamRoomWorkspace
        attempt={attempt}
        questions={questions}
        answers={serializedAnswers}
      />
    </div>
  );
}
