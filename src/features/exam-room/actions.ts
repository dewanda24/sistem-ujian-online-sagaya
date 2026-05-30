"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getStudentClassIds } from "@/features/exam-room/queries";
import { requirePermission } from "@/lib/auth/require-permission";
import { calculateAndPersistAttemptScore } from "@/lib/scoring/exam-scoring";
import { createClient } from "@/lib/supabase/server";
import {
  saveAnswerSchema,
  startExamSchema,
  submitAttemptSchema,
} from "@/lib/validations/exam-room";

type ParticipantWithAttempts = {
  id: string;
  status?: string;
  exam_attempts?: Array<{
    id: string;
    status: string;
  }> | null;
};

type AttemptTiming = {
  id: string;
  exam_participant_id: string;
  status: string;
  locked_at?: string | null;
  exam_schedules?: {
    end_at?: string | null;
  } | Array<{
    end_at?: string | null;
  }> | null;
};

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function redirectWithNotice(path: string, ok: boolean, message: string): never {
  const params = new URLSearchParams({
    notice: ok ? "success" : "error",
    message,
  });

  redirect(`${path}?${params.toString()}`);
}

export async function startExamAction(formData: FormData) {
  const user = await requirePermission("exam_attempts.start");
  const parsed = startExamSchema.safeParse({
    schedule_id: formString(formData, "schedule_id"),
    access_token: formString(formData, "access_token").trim().toUpperCase(),
  });

  if (!parsed.success) {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      parsed.error.issues[0]?.message ?? "Jadwal ujian tidak valid.",
    );
  }

  const supabase = await createClient();
  const classIds = await getStudentClassIds(user.id);

  if (classIds.length === 0) {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      "Siswa belum memiliki kelas aktif.",
    );
  }

  const { data: scheduleClass } = await supabase
    .from("exam_schedule_classes")
    .select("class_id")
    .eq("exam_schedule_id", parsed.data.schedule_id)
    .in("class_id", classIds)
    .limit(1)
    .maybeSingle();

  if (!scheduleClass?.class_id) {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      "Jadwal ujian tidak tersedia untuk kelas siswa.",
    );
  }

  const now = new Date().toISOString();
  const { data: schedule } = await supabase
    .from("exam_schedules")
    .select("id, status, start_at, end_at, is_active, token_required, access_token")
    .eq("id", parsed.data.schedule_id)
    .eq("is_active", true)
    .in("status", ["scheduled", "active"])
    .lte("start_at", now)
    .gte("end_at", now)
    .maybeSingle();

  if (!schedule) {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      "Ujian belum aktif atau sudah selesai.",
    );
  }

  if (
    schedule.token_required &&
    (!parsed.data.access_token ||
      parsed.data.access_token !== String(schedule.access_token ?? "").toUpperCase())
  ) {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      "Token ujian tidak valid.",
    );
  }

  const { data: existingParticipant } = await supabase
    .from("exam_participants")
    .select("id, status, exam_attempts(id, status)")
    .eq("exam_schedule_id", parsed.data.schedule_id)
    .eq("student_id", user.id)
    .maybeSingle();

  const participant: ParticipantWithAttempts | null =
    existingParticipant ??
    (
      await supabase
        .from("exam_participants")
        .insert({
          exam_schedule_id: parsed.data.schedule_id,
          student_id: user.id,
          class_id: scheduleClass.class_id,
          status: "assigned",
        })
        .select("id, status")
        .single()
    ).data;

  if (!participant?.id) {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      "Gagal menyiapkan peserta ujian.",
    );
  }

  const existingAttempt = Array.isArray(participant.exam_attempts)
    ? participant.exam_attempts.find(
        (attempt: { status?: string }) => attempt.status === "in_progress",
      )
    : null;

  if (existingAttempt?.id) {
    redirect(`/dashboard/exam-room/${existingAttempt.id}`);
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("exam_attempts")
    .insert({
      exam_participant_id: participant.id,
      exam_schedule_id: parsed.data.schedule_id,
      student_id: user.id,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      attemptError?.message ?? "Gagal memulai ujian.",
    );
  }

  await supabase
    .from("exam_participants")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("id", participant.id);

  revalidatePath("/dashboard/student/active-exams");
  redirect(`/dashboard/exam-room/${attempt.id}`);
}

export async function saveAnswerAction(formData: FormData) {
  const user = await requirePermission("exam_answers.save");
  const parsed = saveAnswerSchema.safeParse({
    attempt_id: formString(formData, "attempt_id"),
    question_id: formString(formData, "question_id"),
    selected_option_id: formString(formData, "selected_option_id"),
    essay_answer: formString(formData, "essay_answer"),
  });

  if (!parsed.success) {
    redirectWithNotice(
      `/dashboard/exam-room/${formString(formData, "attempt_id")}`,
      false,
      parsed.error.issues[0]?.message ?? "Jawaban tidak valid.",
    );
  }

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, exam_participant_id, status, locked_at, exam_schedules(end_at)")
    .eq("id", parsed.data.attempt_id)
    .eq("student_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!attempt) {
    redirectWithNotice(
      `/dashboard/exam-room/${parsed.data.attempt_id}`,
      false,
      "Attempt tidak aktif.",
    );
  }

  if ((attempt as AttemptTiming).locked_at) {
    redirectWithNotice(
      `/dashboard/exam-room/${parsed.data.attempt_id}`,
      false,
      "Attempt sedang dikunci oleh pengawas.",
    );
  }

  if (await isAttemptExpired(attempt as AttemptTiming)) {
    await expireAttempt(attempt.id, attempt.exam_participant_id);
    redirectWithNotice(
      `/dashboard/exam-room/${parsed.data.attempt_id}`,
      false,
      "Waktu ujian sudah berakhir. Attempt dikunci.",
    );
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("exam_answers").upsert(
    {
      exam_attempt_id: parsed.data.attempt_id,
      question_id: parsed.data.question_id,
      selected_option_id: parsed.data.selected_option_id ?? null,
      essay_answer: parsed.data.essay_answer || null,
      answered_at: now,
      saved_at: now,
    },
    {
      onConflict: "exam_attempt_id,question_id",
    },
  );

  await supabase
    .from("exam_attempts")
    .update({ last_saved_at: now })
    .eq("id", parsed.data.attempt_id);

  revalidatePath(`/dashboard/exam-room/${parsed.data.attempt_id}`);
  redirectWithNotice(
    `/dashboard/exam-room/${parsed.data.attempt_id}`,
    !error,
    error ? error.message : "Jawaban tersimpan.",
  );
}

export async function submitAttemptAction(formData: FormData) {
  const user = await requirePermission("exam_attempts.submit");
  const parsed = submitAttemptSchema.safeParse({
    attempt_id: formString(formData, "attempt_id"),
  });

  if (!parsed.success) {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      parsed.error.issues[0]?.message ?? "Attempt tidak valid.",
    );
  }

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select(
      "id, exam_participant_id, exam_schedule_id, status, locked_at, exam_schedules(exam_package_id, end_at)",
    )
    .eq("id", parsed.data.attempt_id)
    .eq("student_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!attempt) {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      "Attempt tidak ditemukan atau sudah dikumpulkan.",
    );
  }

  if ((attempt as AttemptTiming).locked_at) {
    redirectWithNotice(
      `/dashboard/exam-room/${parsed.data.attempt_id}`,
      false,
      "Attempt sedang dikunci oleh pengawas.",
    );
  }

  if (await isAttemptExpired(attempt as AttemptTiming)) {
    await expireAttempt(attempt.id, attempt.exam_participant_id);
    redirectWithNotice(
      "/dashboard/student/history",
      false,
      "Waktu ujian sudah berakhir. Attempt ditandai expired.",
    );
  }

  const scheduleRelation = attempt.exam_schedules as
    | { exam_package_id?: string | null }
    | Array<{ exam_package_id?: string | null }>
    | null;
  const packageId = Array.isArray(scheduleRelation)
    ? scheduleRelation[0]?.exam_package_id
    : scheduleRelation?.exam_package_id;
  const scoring = await calculateAndPersistAttemptScore(parsed.data.attempt_id, {
    packageId,
  });

  if (!scoring.ok) {
    redirectWithNotice(
      `/dashboard/exam-room/${parsed.data.attempt_id}`,
      false,
      scoring.message,
    );
  }

  const now = new Date().toISOString();
  await supabase
    .from("exam_attempts")
    .update({
      status: "submitted",
      submitted_at: now,
      last_saved_at: now,
      score: scoring.autoScore + scoring.essayScore,
      auto_score: scoring.autoScore,
      essay_score: scoring.hasEssay ? scoring.essayScore : null,
      max_score: scoring.maxScore,
      total_questions: scoring.totalQuestions,
      answered_questions: scoring.answeredQuestions,
      correct_answers: scoring.correctAnswers,
      grading_status: scoring.gradingStatus,
    })
    .eq("id", attempt.id);

  await supabase
    .from("exam_participants")
    .update({
      status: "submitted",
      submitted_at: now,
    })
    .eq("id", attempt.exam_participant_id);

  revalidatePath("/dashboard/student/active-exams");
  revalidatePath("/dashboard/student/history");
  redirectWithNotice(
    "/dashboard/student/history",
    true,
    "Ujian berhasil dikumpulkan.",
  );
}

async function isAttemptExpired(attempt: AttemptTiming) {
  const schedule = Array.isArray(attempt.exam_schedules)
    ? attempt.exam_schedules[0]
    : attempt.exam_schedules;

  if (!schedule?.end_at) {
    return false;
  }

  return new Date(schedule.end_at) < new Date();
}

async function expireAttempt(attemptId: string, participantId: string) {
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

  await supabase
    .from("exam_participants")
    .update({
      status: "expired",
      submitted_at: now,
    })
    .eq("id", participantId);
}
