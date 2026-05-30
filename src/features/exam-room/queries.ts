import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";

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
      "*, exam_schedules(id, title, start_at, end_at, status, exam_packages(id, title, duration_minutes, total_questions, total_points, shuffle_questions, subjects(code, name))), exam_participants(id, status)",
    )
    .eq("id", attemptId)
    .eq("student_id", user.id)
    .single();

  if (error || !attempt) {
    return null;
  }

  if (
    attempt.status === "in_progress" &&
    attempt.exam_schedules?.end_at &&
    new Date(attempt.exam_schedules.end_at) < new Date()
  ) {
    await expireAttempt(attempt.id, attempt.exam_participant_id);

    return {
      ...attempt,
      status: "expired",
    };
  }

  return attempt;
}

async function expireAttempt(attemptId: string, participantId?: string | null) {
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
}

export async function getAttemptQuestions(attemptId: string) {
  const attempt = await getExamAttempt(attemptId);

  if (!attempt) {
    return [];
  }

  const packageId = attempt.exam_schedules?.exam_packages?.id;

  if (!packageId) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_package_questions")
    .select(
      "order_number, questions(id, type, content, point, explanation, question_options(id, option_label, option_text, order_number))",
    )
    .eq("exam_package_id", packageId)
    .order("order_number");

  if (error || !data) {
    return [];
  }

  return data
    .map((item) => ({
      order_number: item.order_number as number,
      question: Array.isArray(item.questions)
        ? item.questions[0]
        : item.questions,
    }))
    .filter((item) => item.question);
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
