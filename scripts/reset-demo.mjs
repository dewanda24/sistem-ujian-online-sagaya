import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  fail("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const demoSchoolNpsn = "DEMO-SAGAYA";
const demoScheduleTitle = "Jadwal Demo Matematika";
const demoStudentEmail = process.env.DEMO_STUDENT_EMAIL || "demo.siswa@sagaya.test";

const resetSummary = await resetDemoAttempts();

console.log("Reset percobaan ujian demo selesai.");
console.table(resetSummary);
console.log("\nMenjalankan seed demo ulang untuk memastikan master data tetap fresh...");

const seedResult = spawnSync(process.execPath, ["scripts/seed-demo.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

if (seedResult.error) {
  throw seedResult.error;
}

if (seedResult.status !== 0) {
  process.exit(seedResult.status ?? 1);
}

async function resetDemoAttempts() {
  const school = await maybeSingle(
    supabase.from("schools").select("id, name").eq("npsn", demoSchoolNpsn),
  );

  if (!school) {
    fail("Sekolah demo belum tersedia. Jalankan npm run demo:seed dulu.");
  }

  const student = await maybeSingle(
    supabase.from("users").select("id, email").eq("email", demoStudentEmail),
  );

  if (!student) {
    fail("Siswa demo belum tersedia. Jalankan npm run demo:seed dulu.");
  }

  const { data: schedules, error: scheduleError } = await supabase
    .from("exam_schedules")
    .select("id, title")
    .eq("school_id", school.id)
    .eq("title", demoScheduleTitle);

  if (scheduleError) {
    throw scheduleError;
  }

  const scheduleIds = (schedules ?? []).map((schedule) => schedule.id);

  if (scheduleIds.length === 0) {
    return [
      {
        entity: "exam_schedule",
        action: "skipped",
        count: 0,
        detail: demoScheduleTitle,
      },
    ];
  }

  const { data: participants, error: participantError } = await supabase
    .from("exam_participants")
    .select("id")
    .eq("student_id", student.id)
    .in("exam_schedule_id", scheduleIds);

  if (participantError) {
    throw participantError;
  }

  const participantIds = (participants ?? []).map((participant) => participant.id);

  if (participantIds.length === 0) {
    return [
      {
        entity: "exam_participant",
        action: "skipped",
        count: 0,
        detail: demoStudentEmail,
      },
    ];
  }

  const attemptCount = await countRows(
    supabase
      .from("exam_attempts")
      .select("id", { count: "exact", head: true })
      .in("exam_participant_id", participantIds),
  );

  const { error: deleteAttemptsError } = await supabase
    .from("exam_attempts")
    .delete()
    .in("exam_participant_id", participantIds);

  if (deleteAttemptsError) {
    throw deleteAttemptsError;
  }

  const { error: updateParticipantsError } = await supabase
    .from("exam_participants")
    .update({
      status: "assigned",
      started_at: null,
      submitted_at: null,
    })
    .in("id", participantIds);

  if (updateParticipantsError) {
    throw updateParticipantsError;
  }

  return [
    {
      entity: "exam_attempt",
      action: "deleted",
      count: attemptCount,
      detail: demoStudentEmail,
    },
    {
      entity: "exam_participant",
      action: "reset",
      count: participantIds.length,
      detail: demoScheduleTitle,
    },
  ];
}

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

async function maybeSingle(query) {
  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function countRows(query) {
  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
