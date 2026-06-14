import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.DEMO_PASSWORD;

if (!supabaseUrl || !serviceRoleKey) {
  fail("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia.");
}

if (!demoPassword) {
  fail("DEMO_PASSWORD wajib diisi sebelum menjalankan seed demo.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const demoAccounts = [
  {
    role: "admin",
    envKey: "DEMO_ADMIN_EMAIL",
    defaultEmail: "demo.admin@sagaya.test",
    username: "demo-admin",
    fullName: "Demo Admin Sekolah",
  },
  {
    role: "teacher",
    envKey: "DEMO_TEACHER_EMAIL",
    defaultEmail: "demo.guru@sagaya.test",
    username: "demo-guru",
    fullName: "Demo Guru Matematika",
    nip: "DEMO-GURU-001",
  },
  {
    role: "student",
    envKey: "DEMO_STUDENT_EMAIL",
    defaultEmail: "demo.siswa@sagaya.test",
    username: "demo-siswa",
    fullName: "Demo Siswa",
    nis: "DEMO-SISWA-001",
    nisn: "DEMO-NISN-001",
  },
  {
    role: "proctor",
    envKey: "DEMO_PROCTOR_EMAIL",
    defaultEmail: "demo.pengawas@sagaya.test",
    username: "demo-pengawas",
    fullName: "Demo Pengawas",
    nip: "DEMO-PENGAWAS-001",
  },
  {
    role: "principal",
    envKey: "DEMO_PRINCIPAL_EMAIL",
    defaultEmail: "demo.kepsek@sagaya.test",
    username: "demo-kepsek",
    fullName: "Demo Kepala Sekolah",
    nip: "DEMO-KEPSEK-001",
  },
];

const retiredDemoAccounts = [
  {
    email: "demo.superadmin@sagaya.test",
    label: "retired super admin demo",
  },
];

const summary = [];

const roles = await getRoles();
const school = await ensureSchool();
const academicYear = await ensureAcademicYear(school.id);
const semester = await ensureSemester(academicYear.id);
const classes = await ensureClasses(school.id, academicYear.id);
const subjects = await ensureSubjects(school.id);
const users = await ensureDemoUsers({ roles, schoolId: school.id });
await ensureRetiredDemoUsersInactive();

await ensureTeacherAssignments({
  teacherId: users.teacher.id,
  subjectIds: subjects.map((subject) => subject.id),
  classIds: classes.map((classItem) => classItem.id),
  academicYearId: academicYear.id,
});

await ensureStudentClass({
  studentId: users.student.id,
  classId: classes[0].id,
  academicYearId: academicYear.id,
});

const category = await ensureQuestionCategory({
  schoolId: school.id,
  subjectId: subjects[0].id,
  createdBy: users.teacher.id,
});
const questions = await ensureQuestions({
  schoolId: school.id,
  subjectId: subjects[0].id,
  categoryId: category.id,
  createdBy: users.teacher.id,
});
const examPackage = await ensureExamPackage({
  schoolId: school.id,
  subjectId: subjects[0].id,
  createdBy: users.teacher.id,
  questions,
});
const schedule = await ensureExamSchedule({
  schoolId: school.id,
  packageId: examPackage.id,
  academicYearId: academicYear.id,
  semesterId: semester.id,
  createdBy: users.teacher.id,
});

await ensureScheduleClass({
  scheduleId: schedule.id,
  classId: classes[0].id,
});
await ensureExamParticipant({
  scheduleId: schedule.id,
  studentId: users.student.id,
  classId: classes[0].id,
});
await ensureExamProctor({
  scheduleId: schedule.id,
  teacherId: users.proctor.id,
  schoolId: school.id,
  assignedBy: users.admin.id,
});

console.log("Demo seed selesai.");
console.table(summary);
console.log("\nPastikan .env.local memuat nilai berikut agar tombol demo bisa login:");
console.log("DEMO_ENABLED=true");
console.log(`DEMO_PASSWORD=${mask(demoPassword)}`);
for (const account of demoAccounts) {
  console.log(`${account.envKey}=${getDemoEmail(account)}`);
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

async function getRoles() {
  const { data, error } = await supabase
    .from("roles")
    .select("id, name");

  if (error) {
    throw error;
  }

  const roleMap = new Map((data ?? []).map((role) => [role.name, role.id]));
  const missing = demoAccounts
    .map((account) => account.role)
    .filter((role) => !roleMap.has(role));

  if (missing.length > 0) {
    fail(`Role belum tersedia: ${missing.join(", ")}`);
  }

  return roleMap;
}

async function ensureSchool() {
  const payload = {
    name: "SMP Demo Sagaya",
    npsn: "DEMO-SAGAYA",
    address: "Jl. Demo No. 1",
    city: "Jakarta",
    province: "DKI Jakarta",
    principal_name: "Demo Kepala Sekolah",
    email: "info@sagaya.test",
    phone: "021-000000",
    is_active: true,
  };

  const existing = await maybeSingle(
    supabase.from("schools").select("id").eq("npsn", payload.npsn),
  );

  if (existing) {
    await updateById("schools", existing.id, payload);
    record("school", "updated", payload.name);
    return { id: existing.id, ...payload };
  }

  const inserted = await insertRow("schools", payload);
  record("school", "created", payload.name);
  return inserted;
}

async function ensureAcademicYear(schoolId) {
  const payload = {
    school_id: schoolId,
    name: "2026/2027 Demo",
    start_date: "2026-07-01",
    end_date: "2027-06-30",
    is_active: true,
  };

  await supabase
    .from("academic_years")
    .update({ is_active: false })
    .eq("school_id", schoolId)
    .neq("name", payload.name);

  const existing = await maybeSingle(
    supabase
      .from("academic_years")
      .select("id")
      .eq("school_id", schoolId)
      .eq("name", payload.name),
  );

  if (existing) {
    await updateById("academic_years", existing.id, payload);
    record("academic_year", "updated", payload.name);
    return { id: existing.id, ...payload };
  }

  const inserted = await insertRow("academic_years", payload);
  record("academic_year", "created", payload.name);
  return inserted;
}

async function ensureSemester(academicYearId) {
  const payload = {
    academic_year_id: academicYearId,
    name: "Ganjil",
    code: "GANJIL",
    is_active: true,
  };

  await supabase
    .from("semesters")
    .update({ is_active: false })
    .eq("academic_year_id", academicYearId)
    .neq("code", payload.code);

  const existing = await maybeSingle(
    supabase
      .from("semesters")
      .select("id")
      .eq("academic_year_id", academicYearId)
      .eq("code", payload.code),
  );

  if (existing) {
    await updateById("semesters", existing.id, payload);
    record("semester", "updated", payload.name);
    return { id: existing.id, ...payload };
  }

  const inserted = await insertRow("semesters", payload);
  record("semester", "created", payload.name);
  return inserted;
}

async function ensureClasses(schoolId, academicYearId) {
  const definitions = [
    { name: "VII Demo A", grade_level: "VII", sort_order: 1 },
    { name: "VIII Demo A", grade_level: "VIII", sort_order: 2 },
  ];

  const rows = [];

  for (const definition of definitions) {
    const payload = {
      school_id: schoolId,
      academic_year_id: academicYearId,
      ...definition,
      is_active: true,
    };
    const existing = await maybeSingle(
      supabase
        .from("classes")
        .select("id")
        .eq("school_id", schoolId)
        .eq("academic_year_id", academicYearId)
        .eq("name", definition.name),
    );

    if (existing) {
      await updateById("classes", existing.id, payload);
      record("class", "updated", definition.name);
      rows.push({ id: existing.id, ...payload });
      continue;
    }

    const inserted = await insertRow("classes", payload);
    record("class", "created", definition.name);
    rows.push(inserted);
  }

  return rows;
}

async function ensureSubjects(schoolId) {
  const definitions = [
    { code: "MTK-DEMO", name: "Matematika Demo" },
    { code: "BIN-DEMO", name: "Bahasa Indonesia Demo" },
  ];
  const rows = [];

  for (const definition of definitions) {
    const payload = {
      school_id: schoolId,
      ...definition,
      is_active: true,
    };
    const existing = await maybeSingle(
      supabase
        .from("subjects")
        .select("id")
        .eq("school_id", schoolId)
        .eq("code", definition.code),
    );

    if (existing) {
      await updateById("subjects", existing.id, payload);
      record("subject", "updated", definition.name);
      rows.push({ id: existing.id, ...payload });
      continue;
    }

    const inserted = await insertRow("subjects", payload);
    record("subject", "created", definition.name);
    rows.push(inserted);
  }

  return rows;
}

async function ensureDemoUsers({ roles, schoolId }) {
  const result = {};

  for (const account of demoAccounts) {
    const email = getDemoEmail(account);
    const authUser = await ensureAuthUser(email, account.fullName);
    const userPayload = {
      auth_user_id: authUser.id,
      role_id: roles.get(account.role),
      school_id: schoolId,
      username: account.username,
      email,
      status: "active",
      deleted_at: null,
    };
    const existing = await maybeSingle(
      supabase.from("users").select("id").eq("email", email),
    );
    const user = existing
      ? await updateById("users", existing.id, userPayload)
      : await insertRow("users", userPayload);

    await ensureProfile(user.id, account);
    record("user", existing ? "updated" : "created", `${account.role}: ${email}`);
    result[account.role] = user;
  }

  return result;
}

async function ensureRetiredDemoUsersInactive() {
  for (const account of retiredDemoAccounts) {
    const existing = await maybeSingle(
      supabase
        .from("users")
        .select("id, auth_user_id")
        .eq("email", account.email),
    );

    if (!existing) {
      continue;
    }

    await updateById("users", existing.id, {
      status: "inactive",
      deleted_at: new Date().toISOString(),
    });

    if (existing.auth_user_id) {
      await supabase.auth.admin.updateUserById(existing.auth_user_id, {
        password: crypto.randomUUID(),
        user_metadata: { demo: false, retired_demo: true },
      });
    }

    record("user", "retired", account.label);
  }
}

async function ensureAuthUser(email, fullName) {
  const existingPublicUser = await maybeSingle(
    supabase.from("users").select("auth_user_id").eq("email", email),
  );

  if (existingPublicUser?.auth_user_id) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      existingPublicUser.auth_user_id,
      {
        email,
        password: demoPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName, demo: true },
      },
    );

    if (error) {
      throw error;
    }

    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: demoPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, demo: true },
  });

  if (error || !data.user) {
    throw error ?? new Error(`Gagal membuat auth user ${email}.`);
  }

  return data.user;
}

async function ensureProfile(userId, account) {
  const payload = {
    user_id: userId,
    full_name: account.fullName,
    nis: account.nis ?? null,
    nisn: account.nisn ?? null,
    nip: account.nip ?? null,
    phone: null,
    avatar_url: null,
  };
  const existing = await maybeSingle(
    supabase.from("user_profiles").select("user_id").eq("user_id", userId),
  );

  if (existing) {
    await supabase.from("user_profiles").update(payload).eq("user_id", userId);
    return;
  }

  await insertRow("user_profiles", payload);
}

async function ensureTeacherAssignments({
  teacherId,
  subjectIds,
  classIds,
  academicYearId,
}) {
  for (const subjectId of subjectIds) {
    for (const classId of classIds) {
      const existing = await maybeSingle(
        supabase
          .from("teacher_subjects")
          .select("id")
          .eq("teacher_id", teacherId)
          .eq("subject_id", subjectId)
          .eq("class_id", classId)
          .eq("academic_year_id", academicYearId),
      );

      if (!existing) {
        await insertRow("teacher_subjects", {
          teacher_id: teacherId,
          subject_id: subjectId,
          class_id: classId,
          academic_year_id: academicYearId,
        });
        record("teacher_subject", "created", `${subjectId}/${classId}`);
      }
    }
  }
}

async function ensureStudentClass({ studentId, classId, academicYearId }) {
  const existingStudentClass = await maybeSingle(
    supabase
      .from("student_classes")
      .select("id")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .eq("academic_year_id", academicYearId),
  );

  if (!existingStudentClass) {
    await insertRow("student_classes", {
      student_id: studentId,
      class_id: classId,
      academic_year_id: academicYearId,
    });
    record("student_class", "created", "demo student assignment");
  }

  const existingMember = await maybeSingle(
    supabase
      .from("class_members")
      .select("id")
      .eq("student_id", studentId)
      .is("left_at", null),
  );

  if (existingMember) {
    await updateById("class_members", existingMember.id, {
      class_id: classId,
      joined_at: "2026-07-01",
      left_at: null,
    });
    record("class_member", "updated", "demo student active class");
    return;
  }

  await insertRow("class_members", {
    student_id: studentId,
    class_id: classId,
    joined_at: "2026-07-01",
    left_at: null,
  });
  record("class_member", "created", "demo student active class");
}

async function ensureQuestionCategory({ schoolId, subjectId, createdBy }) {
  const payload = {
    school_id: schoolId,
    subject_id: subjectId,
    name: "Demo Bilangan",
    description: "Kategori soal demo untuk landing page.",
    is_active: true,
    created_by: createdBy,
    deleted_at: null,
  };
  const existing = await maybeSingle(
    supabase
      .from("question_categories")
      .select("id")
      .eq("school_id", schoolId)
      .eq("subject_id", subjectId)
      .eq("name", payload.name),
  );

  if (existing) {
    await updateById("question_categories", existing.id, payload);
    record("question_category", "updated", payload.name);
    return { id: existing.id, ...payload };
  }

  const inserted = await insertRow("question_categories", payload);
  record("question_category", "created", payload.name);
  return inserted;
}

async function ensureQuestions({ schoolId, subjectId, categoryId, createdBy }) {
  const definitions = [
    {
      content: "Hasil dari 12 + 8 adalah ...",
      explanation: "12 + 8 = 20.",
      options: [
        ["A", "18", false],
        ["B", "20", true],
        ["C", "22", false],
        ["D", "24", false],
      ],
    },
    {
      content: "Jika 5 x 6 = n, maka nilai n adalah ...",
      explanation: "5 x 6 = 30.",
      options: [
        ["A", "11", false],
        ["B", "25", false],
        ["C", "30", true],
        ["D", "36", false],
      ],
    },
    {
      content: "Bilangan genap berikut ini adalah ...",
      explanation: "14 habis dibagi 2.",
      options: [
        ["A", "9", false],
        ["B", "11", false],
        ["C", "13", false],
        ["D", "14", true],
      ],
    },
  ];
  const rows = [];

  for (const definition of definitions) {
    const payload = {
      school_id: schoolId,
      subject_id: subjectId,
      category_id: categoryId,
      created_by: createdBy,
      type: "multiple_choice",
      difficulty: "easy",
      content: definition.content,
      explanation: definition.explanation,
      point: 1,
      status: "published",
      current_version: 1,
      is_active: true,
      deleted_at: null,
    };
    const existing = await maybeSingle(
      supabase
        .from("questions")
        .select("id")
        .eq("school_id", schoolId)
        .eq("subject_id", subjectId)
        .eq("content", definition.content),
    );
    const question = existing
      ? await updateById("questions", existing.id, payload)
      : await insertRow("questions", payload);

    await ensureQuestionOptions(question.id, definition.options);
    record("question", existing ? "updated" : "created", definition.content);
    rows.push(question);
  }

  return rows;
}

async function ensureQuestionOptions(questionId, options) {
  for (const [index, [label, text, isCorrect]] of options.entries()) {
    const payload = {
      question_id: questionId,
      option_label: label,
      option_text: text,
      is_correct: isCorrect,
      order_number: index + 1,
    };
    const existing = await maybeSingle(
      supabase
        .from("question_options")
        .select("id")
        .eq("question_id", questionId)
        .eq("option_label", label),
    );

    if (existing) {
      await updateById("question_options", existing.id, payload);
      continue;
    }

    await insertRow("question_options", payload);
  }
}

async function ensureExamPackage({ schoolId, subjectId, createdBy, questions }) {
  const payload = {
    school_id: schoolId,
    subject_id: subjectId,
    created_by: createdBy,
    title: "Paket Demo Matematika",
    description: "Paket ujian contoh untuk mode demo Sagaya.",
    duration_minutes: 45,
    total_questions: questions.length,
    total_points: questions.length,
    status: "published",
    shuffle_questions: false,
    shuffle_options: false,
    show_result: true,
    is_active: true,
    deleted_at: null,
  };
  const existing = await maybeSingle(
    supabase
      .from("exam_packages")
      .select("id")
      .eq("school_id", schoolId)
      .eq("title", payload.title),
  );
  const examPackage = existing
    ? await updateById("exam_packages", existing.id, payload)
    : await insertRow("exam_packages", payload);

  for (const [index, question] of questions.entries()) {
    const existingQuestion = await maybeSingle(
      supabase
        .from("exam_package_questions")
        .select("id")
        .eq("exam_package_id", examPackage.id)
        .eq("question_id", question.id),
    );
    const packageQuestionPayload = {
      exam_package_id: examPackage.id,
      question_id: question.id,
      order_number: index + 1,
      point_override: null,
    };

    if (existingQuestion) {
      await updateById(
        "exam_package_questions",
        existingQuestion.id,
        packageQuestionPayload,
      );
      continue;
    }

    await insertRow("exam_package_questions", packageQuestionPayload);
  }

  record("exam_package", existing ? "updated" : "created", payload.title);
  return examPackage;
}

async function ensureExamSchedule({
  schoolId,
  packageId,
  academicYearId,
  semesterId,
  createdBy,
}) {
  const startAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const endAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const payload = {
    school_id: schoolId,
    exam_package_id: packageId,
    academic_year_id: academicYearId,
    semester_id: semesterId,
    created_by: createdBy,
    title: "Jadwal Demo Matematika",
    start_at: startAt,
    end_at: endAt,
    status: "scheduled",
    token_required: false,
    is_active: true,
    deleted_at: null,
  };
  const existing = await maybeSingle(
    supabase
      .from("exam_schedules")
      .select("id")
      .eq("school_id", schoolId)
      .eq("title", payload.title),
  );
  const schedule = existing
    ? await updateById("exam_schedules", existing.id, payload)
    : await insertRow("exam_schedules", payload);

  record("exam_schedule", existing ? "updated" : "created", payload.title);
  return schedule;
}

async function ensureScheduleClass({ scheduleId, classId }) {
  const existing = await maybeSingle(
    supabase
      .from("exam_schedule_classes")
      .select("id")
      .eq("exam_schedule_id", scheduleId)
      .eq("class_id", classId),
  );

  if (!existing) {
    await insertRow("exam_schedule_classes", {
      exam_schedule_id: scheduleId,
      class_id: classId,
    });
    record("exam_schedule_class", "created", "demo class target");
  }
}

async function ensureExamParticipant({ scheduleId, studentId, classId }) {
  const payload = {
    exam_schedule_id: scheduleId,
    student_id: studentId,
    class_id: classId,
    status: "assigned",
    started_at: null,
    submitted_at: null,
  };
  const existing = await maybeSingle(
    supabase
      .from("exam_participants")
      .select("id")
      .eq("exam_schedule_id", scheduleId)
      .eq("student_id", studentId),
  );

  if (existing) {
    await updateById("exam_participants", existing.id, payload);
    record("exam_participant", "updated", "demo student participant");
    return;
  }

  await insertRow("exam_participants", payload);
  record("exam_participant", "created", "demo student participant");
}

async function ensureExamProctor({
  scheduleId,
  teacherId,
  schoolId,
  assignedBy,
}) {
  const payload = {
    exam_schedule_id: scheduleId,
    teacher_id: teacherId,
    school_id: schoolId,
    assigned_by: assignedBy,
    is_active: true,
    notes: "Pengawas demo otomatis.",
  };
  const existing = await maybeSingle(
    supabase
      .from("exam_proctors")
      .select("id")
      .eq("exam_schedule_id", scheduleId)
      .eq("teacher_id", teacherId),
  );

  if (existing) {
    await updateById("exam_proctors", existing.id, payload);
    record("exam_proctor", "updated", "demo proctor");
    return;
  }

  await insertRow("exam_proctors", payload);
  record("exam_proctor", "created", "demo proctor");
}

function getDemoEmail(account) {
  return process.env[account.envKey] || account.defaultEmail;
}

async function maybeSingle(query) {
  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function insertRow(table, payload) {
  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateById(table, id, payload) {
  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

function record(entity, action, label) {
  summary.push({ entity, action, label });
}

function mask(value) {
  return value.length <= 4 ? "****" : `${value.slice(0, 2)}****${value.slice(-2)}`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
