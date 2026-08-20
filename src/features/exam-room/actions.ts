"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getStudentClassIds } from "@/features/exam-room/queries";
import { requirePermission } from "@/lib/auth/require-permission";
import { calculateAndPersistAttemptScore } from "@/lib/scoring/exam-scoring";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
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
  active_session_id?: string | null;
  active_session_seen_at?: string | null;
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
      `Gagal Memulai Ujian||${parsed.error.issues[0]?.message ?? "Jadwal ujian tidak valid."}`,
    );
  }

  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const classIds = await getStudentClassIds(user.id);

  if (classIds.length === 0) {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      "Akses Ditolak||Siswa belum terdaftar di kelas manapun. Silakan hubungi admin sekolah.",
    );
  }

  const { data: scheduleClass } = await dbClient
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
      "Bukan Peserta Ujian||Jadwal ujian ini tidak ditujukan untuk kelas Anda.",
    );
  }

  const now = new Date().toISOString();
  const { data: schedule } = await dbClient
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
      "Ujian Belum Aktif||Jadwal ujian sudah terlewat atau belum dibuka oleh pengawas. Silakan hubungi pengawas ujian.",
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
      "Token Ujian Salah||Token yang Anda masukkan tidak valid. Silakan minta token yang benar kepada pengawas.",
    );
  }

  const { data: existingParticipant } = await dbClient
    .from("exam_participants")
    .select("id, status, exam_attempts(id, status)")
    .eq("exam_schedule_id", parsed.data.schedule_id)
    .eq("student_id", user.id)
    .maybeSingle();

  if (existingParticipant?.status === "submitted" || existingParticipant?.status === "expired") {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      "Ujian Selesai||Anda sudah mengumpulkan ujian ini dan tidak dapat mengulang.",
    );
  }

  const participant: ParticipantWithAttempts | null =
    existingParticipant ??
    (
      await dbClient
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
      "Gangguan Sistem||Gagal mendaftarkan peserta ke dalam ujian. Silakan coba beberapa saat lagi.",
    );
  }

  const existingAttempt = Array.isArray(participant.exam_attempts)
    ? participant.exam_attempts.find(
        (attempt: { status?: string }) => attempt.status === "in_progress",
      )
    : null;

  if (existingAttempt?.id) {
    redirect(`/dashboard/exam-room/${existingAttempt.id}/briefing`);
  }

  const { data: attempt, error: attemptError } = await dbClient
    .from("exam_attempts")
    .insert({
      exam_participant_id: participant.id,
      exam_schedule_id: parsed.data.schedule_id,
      student_id: user.id,
      status: "in_progress",
      last_activity_at: now,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    const { data: activeAttempt } = await dbClient
      .from("exam_attempts")
      .select("id")
      .eq("exam_participant_id", participant.id)
      .eq("status", "in_progress")
      .maybeSingle();

    if (activeAttempt?.id) {
      redirect(`/dashboard/exam-room/${activeAttempt.id}/briefing`);
    }

    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      `Gagal Membuka Ujian||${attemptError?.message ?? "Terjadi kesalahan sistem saat mencoba memulai ujian."}`,
    );
  }

  await dbClient
    .from("exam_participants")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("id", participant.id);

  revalidatePath("/dashboard/student/active-exams");
  redirect(`/dashboard/exam-room/${attempt.id}/briefing`);
}

export async function saveAnswerAction(formData: FormData) {
  const user = await requirePermission("exam_answers.save");
  const parsed = saveAnswerSchema.safeParse({
    attempt_id: formString(formData, "attempt_id"),
    question_id: formString(formData, "question_id"),
    selected_option_id: formString(formData, "selected_option_id") || undefined,
    essay_answer: formString(formData, "essay_answer") || undefined,
    session_id: formString(formData, "session_id") || undefined,
  });

  if (!parsed.success) {
    redirectWithNotice(
      `/dashboard/exam-room/${formString(formData, "attempt_id")}`,
      false,
      `Gagal Menyimpan||${parsed.error.issues[0]?.message ?? "Jawaban tidak valid."}`,
    );
  }

  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const { data: attempt } = await dbClient
    .from("exam_attempts")
    .select(
      "id, exam_participant_id, status, locked_at, active_session_id, active_session_seen_at, exam_schedules(end_at)",
    )
    .eq("id", parsed.data.attempt_id)
    .eq("student_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!attempt) {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      "Data Tidak Ditemukan||Pengerjaan tidak ditemukan atau ujian sudah selesai.",
    );
  }

  if (hasActiveSessionConflict(attempt as AttemptTiming, parsed.data.session_id)) {
    redirectWithNotice(
      `/dashboard/exam-room/${parsed.data.attempt_id}`,
      false,
      "Akses Ganda Terdeteksi||Ujian ini sedang dibuka pada tab atau perangkat lain. Tutup sesi lain untuk melanjutkan.",
    );
  }

  if ((attempt as AttemptTiming).locked_at) {
    redirectWithNotice(
      `/dashboard/exam-room/${parsed.data.attempt_id}`,
      false,
      "Ujian Dikunci||Pengerjaan ujian sedang dikunci oleh pengawas.",
    );
  }

  if (await isAttemptExpired(attempt as AttemptTiming)) {
    await expireAttempt(attempt.id, attempt.exam_participant_id);
    redirectWithNotice(
      `/dashboard/exam-room/${parsed.data.attempt_id}`,
      false,
      "Waktu Habis||Durasi ujian telah berakhir. Pengerjaan secara otomatis dikunci.",
    );
  }

  const now = new Date().toISOString();
  const { error } = await dbClient.from("exam_answers").upsert(
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

  await dbClient
    .from("exam_attempts")
    .update({
      active_session_id:
        parsed.data.session_id ?? (attempt as AttemptTiming).active_session_id,
      active_session_seen_at: parsed.data.session_id
        ? now
        : (attempt as AttemptTiming).active_session_seen_at,
      last_saved_at: now,
      last_activity_at: now,
    })
    .eq("id", parsed.data.attempt_id);

  revalidatePath(`/dashboard/exam-room/${parsed.data.attempt_id}`);
  redirectWithNotice(
    `/dashboard/exam-room/${parsed.data.attempt_id}`,
    !error,
    error ? `Gagal Menyimpan||${error.message}` : "Tersimpan||Jawaban berhasil disimpan.",
  );
}

export async function submitAttemptAction(formData: FormData) {
  const user = await requirePermission("exam_attempts.submit");
  const parsed = submitAttemptSchema.safeParse({
    attempt_id: formString(formData, "attempt_id"),
    session_id: formString(formData, "session_id"),
  });

  if (!parsed.success) {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      `Gagal Mengumpulkan||${parsed.error.issues[0]?.message ?? "Pengerjaan ujian tidak valid."}`,
    );
  }

  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const { data: attempt } = await dbClient
    .from("exam_attempts")
    .select(
      "id, exam_participant_id, exam_schedule_id, status, locked_at, active_session_id, active_session_seen_at, exam_schedules(exam_package_id, end_at)",
    )
    .eq("id", parsed.data.attempt_id)
    .eq("student_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!attempt) {
    redirectWithNotice(
      "/dashboard/student/active-exams",
      false,
      "Data Tidak Ditemukan||Pengerjaan tidak ditemukan atau ujian sudah dikumpulkan sebelumnya.",
    );
  }

  if (hasActiveSessionConflict(attempt as AttemptTiming, parsed.data.session_id)) {
    await logExamAttemptEvent(attempt.id, attempt.exam_schedule_id, user.id, "failed_submit", {
      reason: "session_conflict",
    });

    redirectWithNotice(
      `/dashboard/exam-room/${parsed.data.attempt_id}`,
      false,
      "Akses Ganda Terdeteksi||Ujian ini sedang aktif di tab atau perangkat lain. Tutup sesi lain sebelum mengumpulkan.",
    );
  }

  if ((attempt as AttemptTiming).locked_at) {
    redirectWithNotice(
      `/dashboard/exam-room/${parsed.data.attempt_id}`,
      false,
      "Ujian Dikunci||Tidak dapat mengumpulkan karena ujian sedang dikunci oleh pengawas.",
    );
  }

  if (await isAttemptExpired(attempt as AttemptTiming)) {
    const scheduleRelation = attempt.exam_schedules as
      | { exam_package_id?: string | null }
      | Array<{ exam_package_id?: string | null }>
      | null;
    const packageId = Array.isArray(scheduleRelation)
      ? scheduleRelation[0]?.exam_package_id
      : scheduleRelation?.exam_package_id;

    await expireAttempt(attempt.id, attempt.exam_participant_id);
    await calculateAndPersistAttemptScore(attempt.id, { packageId });

    redirectWithNotice(
      "/dashboard/student/history",
      false,
      "Waktu Habis||Durasi ujian telah berakhir. Jawaban Anda otomatis dikumpulkan.",
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
    await logExamAttemptEvent(attempt.id, attempt.exam_schedule_id, user.id, "failed_submit", {
      reason: "scoring_failed",
      message: scoring.message,
    });

    redirectWithNotice(
      `/dashboard/exam-room/${parsed.data.attempt_id}`,
      false,
      `Gagal Memproses Nilai||${scoring.message}`,
    );
  }

  const now = new Date().toISOString();
  const { data: submittedAttempt, error: submitError } = await dbClient
    .from("exam_attempts")
    .update({
      status: "submitted",
      submitted_at: now,
      last_saved_at: now,
      active_session_id:
        parsed.data.session_id ?? (attempt as AttemptTiming).active_session_id,
      active_session_seen_at: parsed.data.session_id
        ? now
        : (attempt as AttemptTiming).active_session_seen_at,
      score: scoring.autoScore + scoring.essayScore,
      auto_score: scoring.autoScore,
      essay_score: scoring.hasEssay ? scoring.essayScore : null,
      max_score: scoring.maxScore,
      total_questions: scoring.totalQuestions,
      answered_questions: scoring.answeredQuestions,
      correct_answers: scoring.correctAnswers,
      grading_status: scoring.gradingStatus,
    })
    .eq("id", attempt.id)
    .eq("status", "in_progress")
    .select("id")
    .maybeSingle();

  if (submitError) {
    await logExamAttemptEvent(attempt.id, attempt.exam_schedule_id, user.id, "failed_submit", {
      reason: "status_update_failed",
      message: submitError.message,
    });

    redirectWithNotice(
      `/dashboard/exam-room/${parsed.data.attempt_id}`,
      false,
      `Gagal Mengumpulkan||${submitError.message}`,
    );
  }

  if (!submittedAttempt) {
    redirectWithNotice(
      "/dashboard/student/history",
      true,
      "Selesai||Ujian sudah berhasil dikumpulkan.",
    );
  }

  await dbClient
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
    "Ujian Selesai||Jawaban Anda berhasil dikumpulkan dan tersimpan aman di sistem.",
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
  const dbClient = getServiceRoleClient() ?? supabase;
  const now = new Date().toISOString();

  await dbClient
    .from("exam_attempts")
    .update({
      status: "expired",
      submitted_at: now,
      last_saved_at: now,
    })
    .eq("id", attemptId)
    .eq("status", "in_progress");

  await dbClient
    .from("exam_participants")
    .update({
      status: "expired",
      submitted_at: now,
    })
    .eq("id", participantId);
}

function hasActiveSessionConflict(
  attempt: AttemptTiming,
  sessionId?: string,
) {
  if (!attempt.active_session_id || !sessionId) {
    return false;
  }

  return (
    attempt.active_session_id !== sessionId &&
    !isSessionStale(attempt.active_session_seen_at)
  );
}

function isSessionStale(value?: string | null) {
  if (!value) {
    return true;
  }

  return Date.now() - new Date(value).getTime() > 2 * 60 * 1000;
}

async function logExamAttemptEvent(
  attemptId: string,
  scheduleId: string,
  studentId: string,
  eventType: "failed_submit",
  metadata: Record<string, unknown>,
) {
  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;

  await dbClient.from("exam_events").insert({
    exam_attempt_id: attemptId,
    exam_schedule_id: scheduleId,
    student_id: studentId,
    event_type: eventType,
    metadata,
  });
}
