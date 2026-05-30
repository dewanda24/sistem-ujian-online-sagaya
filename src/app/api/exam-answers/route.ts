import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/has-permission";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";
import { saveAnswerSchema } from "@/lib/validations/exam-room";

type AttemptTiming = {
  id: string;
  exam_participant_id: string;
  status: string;
  locked_at?: string | null;
  exam_schedules?: { end_at?: string | null } | Array<{ end_at?: string | null }> | null;
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
  const parsed = saveAnswerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Jawaban tidak valid.",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, exam_participant_id, status, locked_at, exam_schedules(end_at)")
    .eq("id", parsed.data.attempt_id)
    .eq("student_id", user!.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!attempt) {
    return NextResponse.json(
      { ok: false, message: "Attempt tidak aktif." },
      { status: 409 },
    );
  }

  if ((attempt as AttemptTiming).locked_at) {
    return NextResponse.json(
      { ok: false, message: "Attempt sedang dikunci oleh pengawas." },
      { status: 423 },
    );
  }

  if (isAttemptExpired(attempt as AttemptTiming)) {
    await expireAttempt(attempt.id, attempt.exam_participant_id);

    return NextResponse.json(
      { ok: false, message: "Waktu ujian sudah berakhir." },
      { status: 423 },
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

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 },
    );
  }

  await supabase
    .from("exam_attempts")
    .update({ last_saved_at: now })
    .eq("id", parsed.data.attempt_id);

  return NextResponse.json({
    ok: true,
    saved_at: now,
  });
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
