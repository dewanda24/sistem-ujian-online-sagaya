import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { examEventSchema } from "@/lib/validations/exam-events";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = examEventSchema.safeParse(body);

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

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, exam_schedule_id, student_id, status")
    .eq("id", parsed.data.attempt_id)
    .eq("student_id", appUser.id)
    .maybeSingle();

  if (!attempt || attempt.status !== "in_progress") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { error } = await supabase.from("exam_events").insert({
    exam_attempt_id: attempt.id,
    exam_schedule_id: attempt.exam_schedule_id,
    student_id: appUser.id,
    event_type: parsed.data.event_type,
    metadata: parsed.data.metadata ?? {},
  });

  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
