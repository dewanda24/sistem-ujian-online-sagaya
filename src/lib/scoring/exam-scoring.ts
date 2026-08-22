import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";

type ScoredQuestion = {
  question_id: string;
  point: number;
  type: "multiple_choice" | "essay";
  correct_option_id: string | null;
};

export type AttemptScoreResult = {
  ok: boolean;
  message: string;
  autoScore: number;
  essayScore: number;
  maxScore: number;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  hasEssay: boolean;
  pendingEssay: boolean;
  gradingStatus: "auto_scored" | "needs_manual_grading" | "finalized";
};

export async function calculateAndPersistAttemptScore(
  attemptId: string,
  options: { packageId?: string | null; finalize?: boolean } = {},
): Promise<AttemptScoreResult> {
  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;

  const packageId =
    options.packageId ?? (await getAttemptPackageId(attemptId)) ?? null;

  if (!packageId) {
    return emptyResult(false, "Paket ujian attempt tidak ditemukan.");
  }

  const questions = await getPackageQuestions(packageId);

  if (questions.length === 0) {
    return emptyResult(false, "Paket ujian belum memiliki soal.");
  }

  const { data: answers, error } = await dbClient
    .from("exam_answers")
    .select("id, question_id, selected_option_id, essay_answer, awarded_score, needs_manual_grading")
    .eq("exam_attempt_id", attemptId);

  if (error) {
    return emptyResult(false, error.message);
  }

  const answerMap = new Map(
    (answers ?? []).map((answer) => [answer.question_id as string, answer]),
  );

  let autoScore = 0;
  let essayScore = 0;
  let answeredQuestions = 0;
  let correctAnswers = 0;
  let hasEssay = false;
  let pendingEssay = false;

  const answerUpdates: Array<{
    id: string;
    is_correct: boolean | null;
    max_score: number;
    awarded_score: number | null;
    needs_manual_grading: boolean;
  }> = [];

  for (const question of questions) {
    const answer = answerMap.get(question.question_id);
    const isEssay = question.type === "essay";
    const hasManualScore =
      answer?.awarded_score !== null && answer?.awarded_score !== undefined;
    const needsManualGrading =
      isEssay && Boolean(answer?.id) && !hasManualScore;
    const answered = Boolean(
      answer?.selected_option_id || answer?.essay_answer?.trim(),
    );

    if (answered) {
      answeredQuestions += 1;
    }

    if (isEssay) {
      hasEssay = true;

      if (needsManualGrading) {
        pendingEssay = true;
      }

      essayScore += Number(answer?.awarded_score ?? 0);

      if (answer?.id) {
        answerUpdates.push({
          id: answer.id,
          is_correct: null,
          max_score: question.point,
          awarded_score: hasManualScore ? Number(answer.awarded_score) : null,
          needs_manual_grading: needsManualGrading,
        });
      }
    } else {
      const isCorrect =
        Boolean(answer?.selected_option_id) &&
        answer?.selected_option_id === question.correct_option_id;
      const awardedScore = isCorrect ? question.point : 0;

      if (isCorrect) {
        correctAnswers += 1;
        autoScore += awardedScore;
      }

      if (answer?.id) {
        answerUpdates.push({
          id: answer.id,
          is_correct: isCorrect,
          max_score: question.point,
          awarded_score: awardedScore,
          needs_manual_grading: false,
        });
      }
    }
  }

  // Optimize: 1 Single Batch Upsert for all scored answers instead of N individual updates
  if (answerUpdates.length > 0) {
    const { error: batchError } = await dbClient
      .from("exam_answers")
      .upsert(answerUpdates, { onConflict: "id" });

    if (batchError) {
      return emptyResult(false, `Gagal menyimpan hasil penilaian: ${batchError.message}`);
    }
  }

  if (options.finalize && pendingEssay) {
    return {
      ...emptyResult(false, "Masih ada jawaban essay yang belum dikoreksi."),
      autoScore,
      essayScore,
      maxScore: sumMaxScore(questions),
      totalQuestions: questions.length,
      answeredQuestions,
      correctAnswers,
      hasEssay,
      pendingEssay,
      gradingStatus: "needs_manual_grading",
    };
  }

  const gradingStatus = options.finalize
    ? "finalized"
    : pendingEssay
      ? "needs_manual_grading"
      : "auto_scored";
  const maxScore = sumMaxScore(questions);
  const score = autoScore + essayScore;

  const { error: updateError } = await dbClient
    .from("exam_attempts")
    .update({
      score,
      auto_score: autoScore,
      essay_score: hasEssay ? essayScore : null,
      max_score: maxScore,
      total_questions: questions.length,
      answered_questions: answeredQuestions,
      correct_answers: correctAnswers,
      grading_status: gradingStatus,
    })
    .eq("id", attemptId);

  return {
    ok: !updateError,
    message: updateError?.message ?? "Nilai attempt diperbarui.",
    autoScore,
    essayScore,
    maxScore,
    totalQuestions: questions.length,
    answeredQuestions,
    correctAnswers,
    hasEssay,
    pendingEssay,
    gradingStatus,
  };
}

async function getAttemptPackageId(attemptId: string) {
  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;

  const { data } = await dbClient
    .from("exam_attempts")
    .select("exam_schedules(exam_package_id)")
    .eq("id", attemptId)
    .maybeSingle();

  const schedule = Array.isArray(data?.exam_schedules)
    ? data?.exam_schedules[0]
    : data?.exam_schedules;

  return schedule?.exam_package_id as string | null | undefined;
}

async function getPackageQuestions(packageId: string) {
  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;

  const { data } = await dbClient
    .from("exam_package_questions")
    .select(
      "question_id, point_override, questions(id, type, point, question_options(id, is_correct))",
    )
    .eq("exam_package_id", packageId);

  return (data ?? [])
    .map((item) => {
      const question = Array.isArray(item.questions)
        ? item.questions[0]
        : item.questions;

      if (!question?.id) {
        return null;
      }

      const options = question.question_options ?? [];
      const correctOption = options.find(
        (option: { is_correct?: boolean }) => option.is_correct,
      );

      return {
        question_id: question.id as string,
        point: Number(item.point_override ?? question.point ?? 0),
        type: question.type as "multiple_choice" | "essay",
        correct_option_id: correctOption?.id ?? null,
      };
    })
    .filter((question): question is ScoredQuestion => Boolean(question));
}

function sumMaxScore(questions: ScoredQuestion[]) {
  return questions.reduce((total, question) => total + question.point, 0);
}

function emptyResult(ok: boolean, message: string): AttemptScoreResult {
  return {
    ok,
    message,
    autoScore: 0,
    essayScore: 0,
    maxScore: 0,
    totalQuestions: 0,
    answeredQuestions: 0,
    correctAnswers: 0,
    hasEssay: false,
    pendingEssay: false,
    gradingStatus: "auto_scored",
  };
}
