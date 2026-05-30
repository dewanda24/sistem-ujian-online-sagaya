import { notFound } from "next/navigation";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActionToast } from "@/components/master-data/action-toast";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable } from "@/components/master-data/data-table";
import {
  finalizeAttemptAction,
  gradeEssayAnswerAction,
} from "@/features/results/actions";
import { QuestionMathRenderer } from "@/features/question-bank/components/question-math-renderer";
import { QuestionMediaPreview } from "@/features/question-bank/components/question-media-preview";
import {
  firstRelation,
  getResultDetail,
} from "@/features/results/queries";
import { hasPermission } from "@/lib/auth/has-permission";
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

export default async function ExamResultDetailPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requirePermission("exam_results.view");
  const [{ attemptId }, query] = await Promise.all([params, searchParams]);
  const result = await getResultDetail(attemptId);

  if (!result) {
    notFound();
  }

  const { attempt, answers } = result;
  const student = firstRelation(attempt.users);
  const profile = firstRelation(student?.user_profiles);
  const schedule = firstRelation(attempt.exam_schedules);
  const examPackage = firstRelation(schedule?.exam_packages);
  const subject = firstRelation(examPackage?.subjects);
  const canGrade = hasPermission(user, "grading.manage");
  const canFinalize = hasPermission(user, "exam_results.finalize");
  const hasPendingEssay = answers.some((answer) => answer.needs_manual_grading);
  const isStudent = user.roles?.name === "student";
  const resultVisibleForStudent =
    Boolean(examPackage?.show_result) &&
    attempt.grading_status !== "needs_manual_grading";
  const canViewResultDetail = !isStudent || resultVisibleForStudent;

  if (!canViewResultDetail) {
    return (
      <div className="space-y-6">
        <ActionToast status={query.notice} message={query.message} />
        <DashboardPageHeader
          title="Exam Result"
          description={`${schedule?.title ?? "Ujian"} | ${
            subject?.code ?? "Mapel"
          }`}
        />
        <div className="rounded-lg border bg-card p-6">
          <StatusPill value={attempt.grading_status ?? attempt.status} />
          <h2 className="mt-4 text-lg font-semibold">
            {examPackage?.show_result
              ? "Nilai sedang diproses"
              : "Hasil belum dibuka"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {examPackage?.show_result
              ? "Jawaban essay masih menunggu koreksi atau finalisasi guru."
              : "Guru/admin belum mengaktifkan tampilan hasil untuk paket ujian ini."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ActionToast status={query.notice} message={query.message} />
      <DashboardPageHeader
        title="Exam Result"
        description={`${schedule?.title ?? "Ujian"} | ${
          subject?.code ?? "Mapel"
        } | ${profile?.full_name ?? student?.username ?? "Siswa"}`}
      />

      <div className="grid gap-4 rounded-lg border bg-card p-4 text-sm md:grid-cols-5">
        <div>
          <div className="text-muted-foreground">Skor</div>
          <div className="font-semibold">
            {Number(attempt.score ?? 0)} / {Number(attempt.max_score ?? 0)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Auto Score</div>
          <div className="font-semibold">{Number(attempt.auto_score ?? 0)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Benar</div>
          <div className="font-semibold">
            {attempt.correct_answers ?? 0} / {attempt.total_questions ?? 0}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Terjawab</div>
          <div className="font-semibold">
            {attempt.answered_questions ?? 0} soal
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Status</div>
          <div className="font-semibold">
            <StatusPill value={attempt.grading_status} />
          </div>
        </div>
      </div>

      {canFinalize ? (
        <form
          action={finalizeAttemptAction}
          className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4"
        >
          <div>
            <h2 className="text-sm font-semibold">Finalisasi Nilai</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Finalisasi bisa dilakukan setelah semua essay dikoreksi.
            </p>
          </div>
          <input type="hidden" name="attempt_id" value={attempt.id} />
          <ConfirmSubmitButton
            confirmMessage="Finalisasi nilai ujian ini?"
            disabled={hasPendingEssay || attempt.grading_status === "finalized"}
            variant="default"
            className="px-4 py-2 text-sm"
          >
            Finalize
          </ConfirmSubmitButton>
        </form>
      ) : null}

      <DataTable
        columns={["Soal", "Jawaban", "Skor", "Status", "Koreksi"]}
        isEmpty={answers.length === 0}
        empty={
          <EmptyState
            title="Belum ada jawaban"
            description="Jawaban akan muncul setelah peserta menyimpan jawaban."
          />
        }
      >
        {answers.map((answer) => {
          const question = firstRelation(answer.questions);
          const selectedOption = firstRelation(answer.question_options);

          return (
            <tr key={answer.id} className="align-top">
              <td className="max-w-md px-4 py-3">
                {question?.content ? (
                  <div className="space-y-3">
                    {question.question_stimuli ? (
                      <div className="rounded-md border border-dashed p-3">
                        <div className="text-sm font-medium">
                          {question.question_stimuli.title}
                        </div>
                        <QuestionMathRenderer
                          content={question.question_stimuli.content}
                          className="mt-2 text-sm text-muted-foreground"
                        />
                        <QuestionMediaPreview
                          mediaType={question.question_stimuli.media_type}
                          url={question.question_stimuli.media_url}
                          title={question.question_stimuli.title}
                          className="mt-2"
                        />
                      </div>
                    ) : null}
                    <div className="line-clamp-3 font-medium">
                      <QuestionMathRenderer content={question.content} />
                    </div>
                    {question.question_attachments?.length ? (
                      <div className="grid gap-2">
                        {[...question.question_attachments]
                          .sort((a, b) => a.order_number - b.order_number)
                          .map((attachment) => (
                            <QuestionMediaPreview
                              key={attachment.id}
                              mediaType={attachment.media_type}
                              url={attachment.url}
                              title={attachment.file_name}
                              caption={attachment.caption}
                            />
                          ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  "-"
                )}
                <div className="mt-1 text-xs text-muted-foreground">
                  {question?.type ?? "-"}
                </div>
              </td>
              <td className="px-4 py-3">
                {question?.type === "essay" ? (
                  answer.essay_answer ? (
                    <QuestionMathRenderer content={answer.essay_answer} />
                  ) : (
                    "-"
                  )
                ) : selectedOption ? (
                  <div className="flex gap-2">
                    <span className="font-semibold">
                      {selectedOption.option_label}.
                    </span>
                    <QuestionMathRenderer content={selectedOption.option_text} />
                  </div>
                ) : (
                  "-"
                )}
              </td>
              <td className="px-4 py-3">
                {answer.awarded_score ?? "-"} / {answer.max_score ?? "-"}
              </td>
              <td className="px-4 py-3">
                {question?.type === "essay"
                  ? answer.needs_manual_grading
                    ? "Perlu koreksi"
                    : "Sudah dikoreksi"
                  : answer.is_correct
                    ? "Benar"
                    : "Salah"}
              </td>
              <td className="px-4 py-3">
                {canGrade && question?.type === "essay" ? (
                  <form action={gradeEssayAnswerAction} className="flex gap-2">
                    <input type="hidden" name="attempt_id" value={attempt.id} />
                    <input type="hidden" name="answer_id" value={answer.id} />
                    <input
                      type="hidden"
                      name="max_score"
                      value={answer.max_score ?? question.point ?? 0}
                    />
                    <input
                      name="awarded_score"
                      type="number"
                      min="0"
                      max={Number(answer.max_score ?? question.point ?? 0)}
                      step="0.01"
                      defaultValue={answer.awarded_score ?? 0}
                      className="w-24 rounded-md border px-2 py-1 text-xs"
                    />
                    <button className="rounded-md border px-3 py-1 text-xs hover:bg-muted">
                      Simpan
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
