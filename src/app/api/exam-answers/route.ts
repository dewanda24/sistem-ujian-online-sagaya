import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/has-permission";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import {
  saveAnswerSchema,
  saveBatchAnswersSchema,
} from "@/lib/validations/exam-room";
import { calculateAndPersistAttemptScore } from "@/lib/scoring/exam-scoring";

type AttemptTiming = {
  id: string;
  exam_participant_id: string;
  status: string;
  locked_at?: string | null;
  active_session_id?: string | null;
  active_session_seen_at?: string | null;
  exam_schedules?: { end_at?: string | null; exam_package_id?: string | null } | Array<{ end_at?: string | null; exam_package_id?: string | null }> | null;
};

type NormalizedAnswerPayload = {
  attempt_id: string;
  session_id?: string;
  answers: Array<{
    question_id: string;
    selected_option_id?: string;
    essay_answer?: string;
  }>;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!hasPermission(user, "exam_answers.save")) {
    return NextResponse.json(
      { ok: false, message: "Tidak memiliki akses menyimpan jawaban." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);

  let normalized: NormalizedAnswerPayload | null = null;

  // Try batch schema first
  const batchParsed = saveBatchAnswersSchema.safeParse(body);
  if (batchParsed.success) {
    normalized = {
      attempt_id: batchParsed.data.attempt_id,
      session_id: batchParsed.data.session_id,
      answers: batchParsed.data.answers,
    };
  } else {
    // Fallback to single answer schema
    const singleParsed = saveAnswerSchema.safeParse(body);
    if (singleParsed.success) {
      normalized = {
        attempt_id: singleParsed.data.attempt_id,
        session_id: singleParsed.data.session_id,
        answers: [
          {
            question_id: singleParsed.data.question_id,
            selected_option_id: singleParsed.data.selected_option_id,
            essay_answer: singleParsed.data.essay_answer,
          },
        ],
      };
    }
  }

  if (!normalized) {
    return NextResponse.json(
      {
        ok: false,
        message: "Format payload jawaban tidak valid.",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const { data: attempt } = await dbClient
    .from("exam_attempts")
    .select("id, exam_participant_id, status, locked_at, active_session_id, active_session_seen_at, exam_schedules(end_at, exam_package_id)")
    .eq("id", normalized.attempt_id)
    .eq("student_id", user!.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!attempt) {
    return NextResponse.json(
      { ok: false, message: "Pengerjaan tidak aktif atau sudah selesai." },
      { status: 409 },
    );
  }

  if ((attempt as AttemptTiming).locked_at) {
    return NextResponse.json(
      { ok: false, message: "Pengerjaan sedang dikunci oleh pengawas." },
      { status: 423 },
    );
  }

  if (hasActiveSessionConflict(attempt as AttemptTiming, normalized.session_id)) {
    return NextResponse.json(
      { ok: false, message: "Pengerjaan sedang aktif di perangkat atau tab lain." },
      { status: 409 },
    );
  }

  if (isAttemptExpired(attempt as AttemptTiming)) {
    const scheduleRelation = attempt.exam_schedules as
      | { exam_package_id?: string | null }
      | Array<{ exam_package_id?: string | null }>
      | null;
    const packageId = Array.isArray(scheduleRelation)
      ? scheduleRelation[0]?.exam_package_id
      : scheduleRelation?.exam_package_id;

    await expireAttempt(attempt.id, attempt.exam_participant_id);
    await calculateAndPersistAttemptScore(attempt.id, { packageId });

    return NextResponse.json(
      { ok: false, message: "Waktu ujian sudah berakhir." },
      { status: 423 },
    );
  }

  const now = new Date().toISOString();
  const rows = normalized.answers.map((ans) => ({
    exam_attempt_id: normalized.attempt_id,
    question_id: ans.question_id,
    selected_option_id: ans.selected_option_id ?? null,
    essay_answer: ans.essay_answer || null,
    answered_at: now,
    saved_at: now,
  }));

  const { error } = await dbClient.from("exam_answers").upsert(rows, {
    onConflict: "exam_attempt_id,question_id",
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 },
    );
  }

  await dbClient
    .from("exam_attempts")
    .update({
      active_session_id:
        normalized.session_id ?? (attempt as AttemptTiming).active_session_id,
      active_session_seen_at: normalized.session_id
        ? now
        : (attempt as AttemptTiming).active_session_seen_at,
      last_saved_at: now,
      last_activity_at: now,
    })
    .eq("id", normalized.attempt_id);

  return NextResponse.json({
    ok: true,
    saved_count: rows.length,
    saved_at: now,
  });
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

function isAttemptExpired(attempt: AttemptTiming) {
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
