import { requireAuth } from "@/lib/auth/require-auth";
import { calculateAndPersistAttemptScore } from "@/lib/scoring/exam-scoring";
import { createClient } from "@/lib/supabase/server";

function createSeededRandom(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function deterministicShuffle<T>(array: T[], seed: string): T[] {
  const result = [...array];
  const random = createSeededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function calculateAttemptTargetEndMs(attempt: {
  started_at?: string | null;
  exam_schedules?: {
    end_at?: string | null;
    exam_packages?: { duration_minutes?: number | null } | null;
  } | null;
}): number | null {
  const schedule = attempt.exam_schedules;
  const scheduleEndMs = schedule?.end_at ? new Date(schedule.end_at).getTime() : null;
  const durationMinutes = schedule?.exam_packages?.duration_minutes ?? null;

  let durationEndMs: number | null = null;
  if (attempt.started_at && durationMinutes && durationMinutes > 0) {
    durationEndMs = new Date(attempt.started_at).getTime() + durationMinutes * 60 * 1000;
  }

  if (scheduleEndMs !== null && durationEndMs !== null) {
    return Math.min(scheduleEndMs, durationEndMs);
  }
  return scheduleEndMs ?? durationEndMs;
}

export function isAttemptExpired(attempt: {
  started_at?: string | null;
  exam_schedules?: {
    end_at?: string | null;
    exam_packages?: { duration_minutes?: number | null } | null;
  } | null;
}): boolean {
  const targetEndMs = calculateAttemptTargetEndMs(attempt);
  if (!targetEndMs) return false;
  return Date.now() > targetEndMs;
}

export async function getStudentClassIds(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("student_id", studentId)
    .is("left_at", null);

  if (error || !data) {
    return [];
  }

  return data.map((item) => item.class_id as string).filter(Boolean);
}

export async function getStudentAcademicContext() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_members")
    .select(
      "id, joined_at, left_at, classes(id, name, grade_level, schools(name), academic_years(name))",
    )
    .eq("student_id", user.id)
    .order("joined_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getStudentExamSchedules(options?: { activeOnly?: boolean }) {
  const user = await requireAuth();
  const supabase = await createClient();
  const classIds = await getStudentClassIds(user.id);

  if (classIds.length === 0) {
    return [];
  }

  const { data: scheduleClasses, error: scheduleClassError } = await supabase
    .from("exam_schedule_classes")
    .select("exam_schedule_id")
    .in("class_id", classIds);

  if (scheduleClassError || !scheduleClasses?.length) {
    return [];
  }

  const scheduleIds = [
    ...new Set(
      scheduleClasses
        .map((item) => item.exam_schedule_id as string)
        .filter(Boolean),
    ),
  ];

  const now = new Date().toISOString();
  let query = supabase
    .from("exam_schedules")
    .select(
      "*, exam_packages(id, title, duration_minutes, total_questions, total_points, subjects(code, name)), academic_years(name), semesters(name), exam_participants(id, status, student_id, exam_attempts(id, status, started_at, submitted_at))",
    )
    .is("deleted_at", null)
    .eq("is_active", true)
    .in("id", scheduleIds)
    .order("start_at", { ascending: true });

  if (options?.activeOnly) {
    query = query.in("status", ["scheduled", "active"]).lte("start_at", now).gte("end_at", now);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((schedule) => ({
    ...schedule,
    exam_participants: (schedule.exam_participants ?? []).filter(
      (participant: { student_id?: string }) => participant.student_id === user.id,
    ),
  }));
}

export async function getExamAttempt(attemptId: string) {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: attempt, error } = await supabase
    .from("exam_attempts")
    .select(
      "*, exam_schedules(id, title, start_at, end_at, status, exam_packages(id, title, duration_minutes, total_questions, total_points, shuffle_questions, shuffle_options, subjects(code, name))), exam_participants(id, status)",
    )
    .eq("id", attemptId)
    .eq("student_id", user.id)
    .single();

  if (error || !attempt) {
    return null;
  }

  if (attempt.status === "in_progress" && isAttemptExpired(attempt)) {
    const packageId = attempt.exam_schedules?.exam_packages?.id;
    await expireAttempt(attempt.id, attempt.exam_participant_id, packageId);

    return {
      ...attempt,
      status: "expired",
    };
  }

  return attempt;
}

async function expireAttempt(
  attemptId: string,
  participantId?: string | null,
  packageId?: string,
) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  await supabase
    .from("exam_attempts")
    .update({
      status: "expired",
      submitted_at: now,
      last_saved_at: now,
    })
    .eq("id", attemptId)
    .eq("status", "in_progress");

  if (participantId) {
    await supabase
      .from("exam_participants")
      .update({
        status: "expired",
        submitted_at: now,
      })
      .eq("id", participantId);
  }

  try {
    await calculateAndPersistAttemptScore(attemptId, { packageId });
  } catch (err) {
    console.error("Gagal menghitung skor attempt yang expired:", err);
  }
}

export async function getAttemptQuestions(attemptId: string) {
  const attempt = await getExamAttempt(attemptId);

  if (!attempt) {
    return [];
  }

  const examPackage = attempt.exam_schedules?.exam_packages;
  const packageId = examPackage?.id;

  if (!packageId) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_package_questions")
    .select(
      "order_number, point_override, questions(id, type, content, point, explanation, question_stimuli(id, title, content, media_url, media_type), question_attachments(id, media_type, url, file_name, caption, order_number), question_options(id, option_label, option_text, order_number))",
    )
    .eq("exam_package_id", packageId)
    .order("order_number");

  if (error || !data) {
    return [];
  }

  const baseQuestions = data
    .map((item) => {
      const question = Array.isArray(item.questions)
        ? item.questions[0]
        : item.questions;

      return question
        ? {
            order_number: item.order_number as number,
            question: {
              ...question,
              point: Number(item.point_override ?? question.point ?? 0),
            },
          }
        : null;
    })
    .filter(
      (item): item is NonNullable<typeof item> =>
        Boolean(item?.question),
    );

  // Deterministic question shuffling if enabled for this exam package
  let processedQuestions = baseQuestions;
  if (examPackage?.shuffle_questions) {
    const shuffled = deterministicShuffle(baseQuestions, `questions_${attemptId}`);
    processedQuestions = shuffled.map((item, idx) => ({
      ...item,
      order_number: idx + 1,
    }));
  }

  // Deterministic option shuffling if enabled for this exam package
  if (examPackage?.shuffle_options) {
    const optionLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];
    processedQuestions = processedQuestions.map((item) => {
      if (item.question.question_options && item.question.question_options.length > 0) {
        const shuffledOptions = deterministicShuffle(
          item.question.question_options,
          `options_${attemptId}_${item.question.id}`,
        ).map((opt, optIdx) => ({
          ...opt,
          order_number: optIdx + 1,
          option_label: optionLabels[optIdx] ?? opt.option_label,
        }));

        return {
          ...item,
          question: {
            ...item.question,
            question_options: shuffledOptions,
          },
        };
      }
      return item;
    });
  }

  return processedQuestions;
}

export async function getAttemptAnswers(attemptId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_answers")
    .select("*")
    .eq("exam_attempt_id", attemptId);

  if (error || !data) {
    return new Map<string, { selected_option_id?: string | null; essay_answer?: string | null }>();
  }

  return new Map(
    data.map((answer) => [
      answer.question_id as string,
      {
        selected_option_id: answer.selected_option_id as string | null,
        essay_answer: answer.essay_answer as string | null,
      },
    ]),
  );
}
