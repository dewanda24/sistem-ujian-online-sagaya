import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const heartbeatSchema = z.object({
  attempt_id: z.string().uuid("Pengerjaan ujian tidak valid."),
  session_id: z.string().min(12).max(128),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = heartbeatSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!appUser?.id) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { data: currentAttempt } = await supabase
    .from("exam_attempts")
    .select("id, active_session_id, active_session_seen_at")
    .eq("id", parsed.data.attempt_id)
    .eq("student_id", appUser.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!currentAttempt) {
    return NextResponse.json({ ok: false }, { status: 409 });
  }

  if (
    currentAttempt.active_session_id &&
    currentAttempt.active_session_id !== parsed.data.session_id &&
    !isSessionStale(currentAttempt.active_session_seen_at as string | null)
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: "session_conflict",
        message: "Attempt sedang aktif di perangkat atau tab lain.",
      },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const { data: attempt, error } = await supabase
    .from("exam_attempts")
    .update({
      active_session_id: parsed.data.session_id,
      active_session_seen_at: now,
      last_activity_at: now,
    })
    .eq("id", parsed.data.attempt_id)
    .eq("student_id", appUser.id)
    .eq("status", "in_progress")
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 },
    );
  }

  if (!attempt) {
    return NextResponse.json({ ok: false }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    active_session_id: parsed.data.session_id,
    last_activity_at: now,
  });
}

function isSessionStale(value?: string | null) {
  if (!value) {
    return true;
  }

  return Date.now() - new Date(value).getTime() > 2 * 60 * 1000;
}
