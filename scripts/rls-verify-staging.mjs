import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnv() {
  const env = {};
  const text = readFileSync(".env.local", "utf8");

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match?.[2]?.trim() && !env[match[1].trim()]) {
      env[match[1].trim()] = match[2].trim();
    }
  }

  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const results = [];
const cleanup = { attempts: [], proctors: [], files: [] };

function addResult(area, actor, action, expected, got, pass, evidence, related = "direct Supabase API") {
  results.push({ area, actor, action, expected, got, pass: Boolean(pass), evidence, related });
}

function authedClient(token) {
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

async function sessionFor(email) {
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error) throw new Error(`generateLink ${email}: ${link.error.message}`);

  const anon = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const verified = await anon.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.data.properties.hashed_token,
  });
  if (verified.error) throw new Error(`verify ${email}: ${verified.error.message}`);

  return authedClient(verified.data.session.access_token);
}

async function selectOne(area, actor, client, table, filter, shouldSee, related) {
  let query = client.from(table).select("id");
  for (const [key, value] of Object.entries(filter)) query = query.eq(key, value);

  const { data, error, status } = await query.limit(1);
  const seen = !error && (data?.length ?? 0) > 0;
  addResult(
    area,
    actor,
    `SELECT ${table} ${JSON.stringify(filter)}`,
    shouldSee ? "visible" : "not visible",
    seen ? "visible" : "not visible",
    seen === shouldSee,
    error ? `${status} ${error.code} ${error.message}` : `${status} rows=${data.length}`,
    related,
  );
}

async function mutation(area, actor, promise, shouldPass, related, action = "mutation") {
  const { data, error, status } = await promise;
  const ok = !error;
  addResult(
    area,
    actor,
    action,
    shouldPass ? "allowed" : "blocked",
    ok ? "allowed" : "blocked",
    ok === shouldPass,
    error ? `${status} ${error.code} ${error.message}` : `${status} ok`,
    related,
  );
  return { data, error, status };
}

async function main() {
  let actors = {};

  try {
    const { data: users, error: userError } = await admin
      .from("users")
      .select("id,email,school_id,roles(name)")
      .not("email", "like", "rls_%")
      .not("auth_user_id", "is", null);
    if (userError) throw userError;

    const byEmail = Object.fromEntries(users.map((user) => [user.email, user]));
    actors = {
      super_admin: { email: "superadmin@sekolah.sch.id" },
      adminA: { email: "adminsekolah1@sekolah.sch.id" },
      adminB: { email: "adminsekolah2@sekolah.sch.id" },
      teacherA: { email: "gurusmp1@sekolah.sch.id" },
      teacherB: { email: "gurusmp2@sekolah.sch.id" },
      studentA: { email: "siswa1smp1@gmail.com" },
      studentB: { email: "siswa1smp2@gmail.com" },
    };

    for (const key of Object.keys(actors)) {
      actors[key].user = byEmail[actors[key].email];
      actors[key].client = await sessionFor(actors[key].email);
    }

    const schoolA = actors.adminA.user.school_id;
    const schoolB = actors.adminB.user.school_id;
    const { data: schedA } = await admin
      .from("exam_schedules")
      .select("id,school_id,exam_package_id")
      .eq("school_id", schoolA)
      .limit(1)
      .single();
    const { data: schedB } = await admin
      .from("exam_schedules")
      .select("id,school_id,exam_package_id")
      .eq("school_id", schoolB)
      .limit(1)
      .single();
    const { data: partA } = await admin
      .from("exam_participants")
      .select("id,student_id,exam_schedule_id")
      .eq("exam_schedule_id", schedA.id)
      .eq("student_id", actors.studentA.user.id)
      .limit(1)
      .single();
    const { data: partB } = await admin
      .from("exam_participants")
      .select("id,student_id,exam_schedule_id")
      .eq("exam_schedule_id", schedB.id)
      .eq("student_id", actors.studentB.user.id)
      .limit(1)
      .single();
    const { data: pkgQuestionA } = await admin
      .from("exam_package_questions")
      .select("question_id")
      .eq("exam_package_id", schedA.exam_package_id)
      .limit(1)
      .single();
    const { data: pkgQuestionB } = await admin
      .from("exam_package_questions")
      .select("question_id")
      .eq("exam_package_id", schedB.exam_package_id)
      .limit(1)
      .single();
    const { data: packageQuestionsA } = await admin
      .from("exam_package_questions")
      .select("question_id")
      .eq("exam_package_id", schedA.exam_package_id);
    const packageQuestionIdsA = (packageQuestionsA ?? []).map((item) => item.question_id);
    const { data: outsideA } = await admin
      .from("questions")
      .select("id")
      .eq("school_id", schoolA)
      .not("id", "in", `(${packageQuestionIdsA.join(",")})`)
      .limit(1)
      .maybeSingle();
    const { data: attemptB } = await admin
      .from("exam_attempts")
      .select("id,student_id,exam_schedule_id")
      .eq("student_id", actors.studentB.user.id)
      .limit(1)
      .maybeSingle();

    for (const name of ["super_admin", "adminA", "adminB", "teacherA", "teacherB", "studentA", "studentB"]) {
      const actor = actors[name];
      await selectOne("users", name, actor.client, "users", { id: actors.studentA.user.id }, ["super_admin", "adminA", "teacherA", "studentA"].includes(name), "users RLS");
      await selectOne("users", name, actor.client, "users", { id: actors.studentB.user.id }, ["super_admin", "adminB", "teacherB", "studentB"].includes(name), "users RLS");
      await selectOne("schools", name, actor.client, "schools", { id: schoolA }, ["super_admin", "adminA", "teacherA", "studentA"].includes(name), "schools RLS");
      await selectOne("schools", name, actor.client, "schools", { id: schoolB }, ["super_admin", "adminB", "teacherB", "studentB"].includes(name), "schools RLS");
      await selectOne("questions", name, actor.client, "questions", { id: pkgQuestionA.question_id }, ["super_admin", "adminA", "teacherA"].includes(name), "questions RLS");
      await selectOne("exam_schedules", name, actor.client, "exam_schedules", { id: schedA.id }, ["super_admin", "adminA", "teacherA", "studentA"].includes(name), "exam_schedules RLS");
      await selectOne("exam_participants", name, actor.client, "exam_participants", { id: partA.id }, ["super_admin", "adminA", "teacherA", "studentA"].includes(name), "exam_participants RLS");
      if (attemptB) {
        await selectOne("exam_attempts", name, actor.client, "exam_attempts", { id: attemptB.id }, ["super_admin", "adminB", "teacherB", "studentB"].includes(name), "exam_attempts RLS");
      }
    }

    const attemptA = await mutation(
      "exam_attempts",
      "studentA",
      actors.studentA.client
        .from("exam_attempts")
        .insert({ exam_participant_id: partA.id, exam_schedule_id: schedA.id, student_id: actors.studentA.user.id, status: "in_progress" })
        .select("id")
        .single(),
      true,
      "exam_attempts insert policy",
      "insert own attempt",
    );
    if (attemptA.data?.id) cleanup.attempts.push(attemptA.data.id);

    await mutation(
      "exam_attempts",
      "studentA",
      actors.studentA.client
        .from("exam_attempts")
        .insert({ exam_participant_id: partB.id, exam_schedule_id: schedB.id, student_id: actors.studentA.user.id, status: "in_progress" })
        .select("id")
        .single(),
      false,
      "exam_attempts trigger/RLS",
      "insert using studentB participant",
    );

    if (attemptA.data?.id) {
      await mutation(
        "exam_answers",
        "studentA",
        actors.studentA.client
          .from("exam_answers")
          .insert({ exam_attempt_id: attemptA.data.id, question_id: pkgQuestionA.question_id, essay_answer: "ok" })
          .select("id")
          .single(),
        true,
        "exam_answers trigger/RLS",
        "insert answer package question",
      );
      if (outsideA) {
        await mutation(
          "exam_answers",
          "studentA",
          actors.studentA.client
            .from("exam_answers")
            .insert({ exam_attempt_id: attemptA.data.id, question_id: outsideA.id, essay_answer: "bad" })
            .select("id")
            .single(),
          false,
          "exam_answers trigger/RLS",
          "insert answer outside package",
        );
      }
      await mutation(
        "exam_events",
        "studentA",
        actors.studentA.client
          .from("exam_events")
          .insert({ exam_attempt_id: attemptA.data.id, exam_schedule_id: schedA.id, student_id: actors.studentA.user.id, event_type: "tab_focus", metadata: {} })
          .select("id")
          .single(),
        true,
        "exam_events trigger/RLS",
        "insert own event",
      );
    }

    if (attemptB) {
      await mutation(
        "exam_answers",
        "studentA",
        actors.studentA.client
          .from("exam_answers")
          .insert({ exam_attempt_id: attemptB.id, question_id: pkgQuestionB.question_id, essay_answer: "bad" })
          .select("id")
          .single(),
        false,
        "exam_answers trigger/RLS",
        "insert answer on studentB attempt",
      );
      await mutation(
        "exam_events",
        "studentA",
        actors.studentA.client
          .from("exam_events")
          .insert({ exam_attempt_id: attemptB.id, exam_schedule_id: schedB.id, student_id: actors.studentB.user.id, event_type: "tab_focus", metadata: {} })
          .select("id")
          .single(),
        false,
        "exam_events trigger/RLS",
        "insert event on studentB attempt",
      );
    }

    await mutation(
      "exam_participants",
      "studentA",
      actors.studentA.client
        .from("exam_participants")
        .update({ student_id: actors.studentB.user.id })
        .eq("id", partA.id)
        .select("id")
        .single(),
      false,
      "exam_participants trigger/RLS",
      "change participant student_id",
    );

    const proctorRow = await mutation(
      "exam_proctors",
      "adminA",
      actors.adminA.client
        .from("exam_proctors")
        .insert({ exam_schedule_id: schedA.id, teacher_id: actors.teacherA.user.id, school_id: schoolA, assigned_by: actors.adminA.user.id, is_active: true })
        .select("id")
        .single(),
      true,
      "exam_proctors RLS",
      "assign teacherA as proctor row",
    );
    if (proctorRow.data?.id) cleanup.proctors.push(proctorRow.data.id);
    if (proctorRow.data?.id) {
      await selectOne("exam_proctors", "teacherA assigned", actors.teacherA.client, "exam_proctors", { id: proctorRow.data.id }, true, "exam_proctors RLS");
      await selectOne("exam_proctors", "adminB cross-school", actors.adminB.client, "exam_proctors", { id: proctorRow.data.id }, false, "exam_proctors RLS");
    }

    const filePath = `${schoolA}/${actors.teacherA.user.id}/2026-06-12/rls-verify-${Date.now()}.png`;
    cleanup.files.push(filePath);
    const upload = await actors.teacherA.client.storage.from("question-media").upload(filePath, Buffer.from([137, 80, 78, 71]), { contentType: "image/png", upsert: false });
    addResult("storage question-media", "teacherA", "upload school A prefix", "allowed", upload.error ? "blocked" : "allowed", !upload.error, upload.error ? `${upload.error.statusCode ?? ""} ${upload.error.message}` : "uploaded", "Supabase Storage");
    const downloadA = await actors.teacherA.client.storage.from("question-media").download(filePath);
    addResult("storage question-media", "teacherA", "download own school prefix", "allowed", downloadA.error ? "blocked" : "allowed", !downloadA.error, downloadA.error ? `${downloadA.error.statusCode ?? ""} ${downloadA.error.message}` : "downloaded", "Supabase Storage");
    const downloadB = await actors.studentB.client.storage.from("question-media").download(filePath);
    addResult("storage question-media", "studentB", "download school A object", "blocked", downloadB.error ? "blocked" : "allowed", Boolean(downloadB.error), downloadB.error ? `${downloadB.error.statusCode ?? ""} ${downloadB.error.message}` : "downloaded", "Supabase Storage");
    const badPath = `${schoolA}/${actors.studentA.user.id}/2026-06-12/rls-verify-student-${Date.now()}.png`;
    const studentUpload = await actors.studentA.client.storage.from("question-media").upload(badPath, Buffer.from([137, 80, 78, 71]), { contentType: "image/png", upsert: false });
    addResult("storage question-media", "studentA", "upload without manage_questions", "blocked", studentUpload.error ? "blocked" : "allowed", Boolean(studentUpload.error), studentUpload.error ? `${studentUpload.error.statusCode ?? ""} ${studentUpload.error.message}` : "uploaded", "Supabase Storage");
    if (!studentUpload.error) cleanup.files.push(badPath);

    addResult("proctor A", "runner", "dedicated proctor account", "available", "not available", false, "No existing proctor user with auth_user_id in staging; exam_proctors row tested with assigned teacherA only", "staging data");
    addResult("export endpoint", "source review", "data-export tenant filter", "guarded", "guarded", true, "requireAuth + hasPermission + requireSchoolScope/requireScopedSchoolId", "src/app/api/data-export/[type]/route.ts");
    addResult("export endpoint", "source review", "super-admin export global", "super_admin only", "super_admin only", true, "requireRole(\"super_admin\")", "src/app/api/super-admin/export/[type]/route.ts");
  } catch (error) {
    addResult("fatal", "runner", "setup/run", "no fatal", "fatal", false, error.message ?? String(error), "verification runner");
  } finally {
    if (actors.adminA?.client) {
      for (const id of cleanup.attempts) await actors.adminA.client.from("exam_attempts").delete().eq("id", id);
      for (const id of cleanup.proctors) await actors.adminA.client.from("exam_proctors").delete().eq("id", id);
    }
    if (actors.teacherA?.client && cleanup.files.length) {
      await actors.teacherA.client.storage.from("question-media").remove(cleanup.files);
    }

    const passed = results.filter((result) => result.pass).length;
    const failed = results.length - passed;
    console.log(JSON.stringify({ summary: { total: results.length, passed, failed }, results }, null, 2));
  }
}

main();
