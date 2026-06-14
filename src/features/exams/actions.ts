"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { getScheduleExamReadiness } from "@/features/exams/exam-readiness.service";
import {
  DEMO_MUTATION_BLOCKED_MESSAGE,
  isDemoUser,
} from "@/lib/auth/demo-mode";
import { requireAuth } from "@/lib/auth/require-auth";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  assertSameSchool,
  requireSchoolScope,
} from "@/lib/auth/school-scope";
import { jakartaDatetimeLocalToIso } from "@/lib/date-time";
import { createClient } from "@/lib/supabase/server";
import {
  examPackageActiveSchema,
  examPackageSchema,
  examPackageStatusSchema,
  examScheduleActiveSchema,
  examScheduleSchema,
  examScheduleStatusSchema,
  examTokenSchema,
} from "@/lib/validations/exams";

type ActionResult = {
  ok: boolean;
  message: string;
};

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function formBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function formStringList(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

function formNumber(formData: FormData, key: string) {
  return Number(formString(formData, key));
}

function redirectTo(path: string, result: ActionResult): never {
  const params = new URLSearchParams({
    notice: result.ok ? "success" : "error",
    message: result.message,
  });

  redirect(`${path}?${params.toString()}`);
}

function summarizeReadinessFailures(
  readiness: Awaited<ReturnType<typeof getScheduleExamReadiness>>,
  severity: "critical" | "warning",
) {
  return readiness.checks
    .filter((check) => !check.passed && check.severity === severity)
    .map((check) => check.title)
    .slice(0, 5)
    .join(", ");
}

async function enforceSchedulePublishReadiness(
  scheduleId: string,
  confirmWarnings: boolean,
): Promise<ActionResult> {
  const readiness = await getScheduleExamReadiness(scheduleId);

  if (readiness.summary.critical > 0) {
    return {
      ok: false,
      message: `Tidak dapat mempublish jadwal. Masalah: ${summarizeReadinessFailures(
        readiness,
        "critical",
      )}.`,
    };
  }

  if (readiness.summary.warning > 0 && !confirmWarnings) {
    return {
      ok: false,
      message: `Konfirmasi warning diperlukan sebelum publish. Masalah: ${summarizeReadinessFailures(
        readiness,
        "warning",
      )}.`,
    };
  }

  return {
    ok: true,
    message: "Readiness jadwal valid.",
  };
}

function toDatetime(value: string) {
  if (!value) {
    return "";
  }

  return jakartaDatetimeLocalToIso(value);
}

function generateExamToken() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";

  for (let index = 0; index < 6; index += 1) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return token;
}

async function assertPackageSchoolScope(packageId: string) {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const { data: examPackage } = await supabase
    .from("exam_packages")
    .select("school_id")
    .eq("id", packageId)
    .maybeSingle();

  assertSameSchool(scope, examPackage?.school_id);
  return scope;
}

async function assertScheduleSchoolScope(scheduleId: string) {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const { data: schedule } = await supabase
    .from("exam_schedules")
    .select("school_id")
    .eq("id", scheduleId)
    .maybeSingle();

  assertSameSchool(scope, schedule?.school_id);
  return scope;
}

export async function saveExamPackageAction(formData: FormData) {
  const currentUser = await requireAuth();
  const packageId = formString(formData, "id");
  await requirePermission("exam_packages.manage");
  const scope = await requireSchoolScope();

  const parsed = examPackageSchema.safeParse({
    id: packageId,
    school_id: formString(formData, "school_id"),
    subject_id: formString(formData, "subject_id"),
    title: formString(formData, "title"),
    description: formString(formData, "description"),
    duration_minutes: formString(formData, "duration_minutes"),
    status: formString(formData, "status"),
    shuffle_questions: formBoolean(formData, "shuffle_questions"),
    shuffle_options: formBoolean(formData, "shuffle_options"),
    show_result: formBoolean(formData, "show_result"),
    is_active: formBoolean(formData, "is_active"),
    question_ids: formStringList(formData, "question_ids"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/exams/packages", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data paket tidak valid.",
    });
  }

  const supabase = await createClient();
  const { id, question_ids, ...payload } = parsed.data;
  assertSameSchool(scope, payload.school_id);

  if (id) {
    await assertPackageSchoolScope(id);
  }

  const selectedQuestions = await supabase
    .from("questions")
    .select("id, school_id, subject_id, point, status, is_active, deleted_at")
    .in("id", question_ids);

  if (selectedQuestions.error || !selectedQuestions.data?.length) {
    redirectTo("/dashboard/exams/packages", {
      ok: false,
      message: selectedQuestions.error?.message ?? "Soal paket tidak valid.",
    });
  }

  const selectionReadiness = validateSelectedQuestionsForPackage(
    selectedQuestions.data,
    question_ids,
    payload.subject_id,
  );

  selectedQuestions.data.forEach((question) => {
    assertSameSchool(scope, question.school_id);
  });

  if (!selectionReadiness.ok) {
    redirectTo("/dashboard/exams/packages", selectionReadiness);
  }

  const totalPoints = selectedQuestions.data.reduce(
    (total, question) => total + Number(question.point ?? 0),
    0,
  );

  const packagePayload = {
    ...payload,
    description: payload.description || null,
    total_questions: question_ids.length,
    total_points: totalPoints,
  };

  const { data: savedPackage, error: packageError } = id
    ? await supabase
        .from("exam_packages")
        .update(packagePayload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("exam_packages")
        .insert({ ...packagePayload, created_by: currentUser.id })
        .select("id")
        .single();

  if (packageError || !savedPackage) {
    redirectTo("/dashboard/exams/packages", {
      ok: false,
      message: packageError?.message ?? "Gagal menyimpan paket ujian.",
    });
  }

  await supabase
    .from("exam_package_questions")
    .delete()
    .eq("exam_package_id", savedPackage.id);

  const packageQuestions = question_ids.map((questionId: string, index: number) => ({
    exam_package_id: savedPackage.id,
    question_id: questionId,
    order_number: index + 1,
  }));

  const { error: questionsError } = await supabase
    .from("exam_package_questions")
    .insert(packageQuestions);

  if (!questionsError) {
    await logAuditEvent({
      userId: currentUser.id,
      action: id ? "exam_packages.update" : "exam_packages.create",
      entityType: "exam_packages",
      entityId: savedPackage.id,
      payload: {
        title: payload.title,
        subject_id: payload.subject_id,
        status: payload.status,
        total_questions: question_ids.length,
      },
    });
  }

  revalidatePath("/dashboard/exams/packages");
  revalidatePath("/dashboard/exams");
  redirectTo("/dashboard/exams/packages", {
    ok: !questionsError,
    message: questionsError
      ? questionsError.message
      : "Paket ujian berhasil disimpan.",
  });
}

export async function updateExamPackageStatusAction(formData: FormData) {
  const status = formString(formData, "status");
  const currentUser = await requirePermission(
    status === "published"
      ? "exam_packages.publish"
      : status === "archived"
        ? "exam_packages.archive"
        : "exam_packages.manage",
  );

  const parsed = examPackageStatusSchema.safeParse({
    id: formString(formData, "id"),
    status,
  });

  if (!parsed.success) {
    redirectTo("/dashboard/exams/packages", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Status paket tidak valid.",
    });
  }

  const supabase = await createClient();
  await assertPackageSchoolScope(parsed.data.id);

  if (parsed.data.status === "published") {
    const readiness = await validateExamPackageReady(parsed.data.id);

    if (!readiness.ok) {
      redirectTo("/dashboard/exams/packages", readiness);
    }
  }

  const { error } = await supabase
    .from("exam_packages")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "exam_packages.status_update",
      entityType: "exam_packages",
      entityId: parsed.data.id,
      payload: { status: parsed.data.status },
    });
  }

  revalidatePath("/dashboard/exams/packages");
  redirectTo("/dashboard/exams/packages", {
    ok: !error,
    message: error ? error.message : "Status paket ujian diperbarui.",
  });
}

export async function updateExamPackageQuestionPointsAction(formData: FormData) {
  const currentUser = await requirePermission("exam_packages.manage");
  const packageId = formString(formData, "id");
  const point = formNumber(formData, "point_override");

  if (!packageId) {
    redirectTo("/dashboard/exams/packages", {
      ok: false,
      message: "Paket ujian tidak valid.",
    });
  }

  if (!Number.isFinite(point) || point <= 0) {
    redirectTo("/dashboard/exams/packages", {
      ok: false,
      message: "Bobot massal harus lebih dari 0.",
    });
  }

  await assertPackageSchoolScope(packageId);
  const supabase = await createClient();
  const { data: packageQuestions, error: readError } = await supabase
    .from("exam_package_questions")
    .select("id")
    .eq("exam_package_id", packageId);

  if (readError || !packageQuestions?.length) {
    redirectTo("/dashboard/exams/packages", {
      ok: false,
      message: readError?.message ?? "Paket belum memiliki soal.",
    });
  }

  const { error: updateError } = await supabase
    .from("exam_package_questions")
    .update({ point_override: point })
    .eq("exam_package_id", packageId);

  if (updateError) {
    redirectTo("/dashboard/exams/packages", {
      ok: false,
      message: updateError.message,
    });
  }

  const { error: packageError } = await supabase
    .from("exam_packages")
    .update({
      total_points: point * packageQuestions.length,
    })
    .eq("id", packageId);

  if (!packageError) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "exam_packages.question_points_bulk_update",
      entityType: "exam_packages",
      entityId: packageId,
      payload: {
        point_override: point,
        question_count: packageQuestions.length,
        total_points: point * packageQuestions.length,
      },
    });
  }

  revalidatePath("/dashboard/exams/packages");
  revalidatePath("/dashboard/exams/schedules");
  revalidatePath("/dashboard/exams");
  redirectTo("/dashboard/exams/packages", {
    ok: !packageError,
    message: packageError
      ? packageError.message
      : `Bobot ${packageQuestions.length} soal dalam paket berhasil diubah menjadi ${point}.`,
  });
}

function validateSelectedQuestionsForPackage(
  questions: Array<{
    id: string;
    subject_id?: string | null;
    point?: number | string | null;
    status?: string | null;
    is_active?: boolean | null;
    deleted_at?: string | null;
  }>,
  questionIds: string[],
  subjectId: string,
): ActionResult {
  if (questions.length !== new Set(questionIds).size) {
    return {
      ok: false,
      message: "Ada soal yang tidak ditemukan atau tidak dapat diakses.",
    };
  }

  const invalidSubject = questions.some(
    (question) => question.subject_id !== subjectId,
  );

  if (invalidSubject) {
    return {
      ok: false,
      message: "Semua soal dalam paket harus berasal dari mapel yang sama.",
    };
  }

  const invalidStatus = questions.some(
    (question) =>
      question.status !== "published" ||
      !question.is_active ||
      Boolean(question.deleted_at),
  );

  if (invalidStatus) {
    return {
      ok: false,
      message: "Paket hanya boleh memakai soal published, aktif, dan belum diarsipkan.",
    };
  }

  const invalidPoint = questions.some(
    (question) => Number(question.point ?? 0) <= 0,
  );

  if (invalidPoint) {
    return {
      ok: false,
      message: "Semua soal dalam paket harus memiliki poin lebih dari 0.",
    };
  }

  return {
    ok: true,
    message: "Paket siap disimpan.",
  };
}

async function validateExamPackageReady(packageId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: examPackage, error } = await supabase
    .from("exam_packages")
    .select(
      "id, subject_id, total_questions, exam_package_questions(question_id, point_override, questions(id, subject_id, point, status, is_active, deleted_at))",
    )
    .eq("id", packageId)
    .maybeSingle();

  if (error || !examPackage) {
    return {
      ok: false,
      message: error?.message ?? "Paket ujian tidak ditemukan.",
    };
  }

  const packageQuestions = examPackage.exam_package_questions ?? [];
  const questions = packageQuestions
    .map((item) =>
      Array.isArray(item.questions) ? item.questions[0] : item.questions,
    )
    .filter(Boolean) as Array<{
    id: string;
    subject_id?: string | null;
    point?: number | string | null;
    status?: string | null;
    is_active?: boolean | null;
    deleted_at?: string | null;
  }>;

  if (packageQuestions.length === 0 || questions.length === 0) {
    return {
      ok: false,
      message: "Paket belum memiliki soal.",
    };
  }

  if (questions.length !== packageQuestions.length) {
    return {
      ok: false,
      message: "Ada relasi soal paket yang tidak valid.",
    };
  }

  if (Number(examPackage.total_questions ?? 0) !== packageQuestions.length) {
    return {
      ok: false,
      message: "Jumlah soal paket tidak sinkron. Simpan ulang paket sebelum publish.",
    };
  }

  return validateSelectedQuestionsForPackage(
    questions,
    questions.map((question) => question.id),
    String(examPackage.subject_id),
  );
}

export async function toggleExamPackageActiveAction(formData: FormData) {
  const currentUser = await requirePermission("exam_packages.manage");
  const parsed = examPackageActiveSchema.safeParse({
    id: formString(formData, "id"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/exams/packages", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Status aktif tidak valid.",
    });
  }

  const supabase = await createClient();
  await assertPackageSchoolScope(parsed.data.id);

  const { error } = await supabase
    .from("exam_packages")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "exam_packages.active_update",
      entityType: "exam_packages",
      entityId: parsed.data.id,
      payload: { is_active: parsed.data.is_active },
    });
  }

  revalidatePath("/dashboard/exams/packages");
  redirectTo("/dashboard/exams/packages", {
    ok: !error,
    message: error ? error.message : "Status aktif paket diperbarui.",
  });
}

export async function archiveExamPackageAction(formData: FormData) {
  const currentUser = await requirePermission("exam_packages.archive");
  if (isDemoUser(currentUser)) {
    redirectTo("/dashboard/exams/packages", {
      ok: false,
      message: DEMO_MUTATION_BLOCKED_MESSAGE,
    });
  }

  const supabase = await createClient();
  const id = formString(formData, "id");
  await assertPackageSchoolScope(id);

  const { error } = await supabase
    .from("exam_packages")
    .update({
      status: "archived",
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "exam_packages.archive",
      entityType: "exam_packages",
      entityId: id,
      payload: { status: "archived", is_active: false },
    });
  }

  revalidatePath("/dashboard/exams/packages");
  redirectTo("/dashboard/exams/packages", {
    ok: !error,
    message: error ? error.message : "Paket ujian berhasil diarsipkan.",
  });
}

export async function saveExamScheduleAction(formData: FormData) {
  const currentUser = await requireAuth();
  const scheduleId = formString(formData, "id");
  await requirePermission("exam_schedules.manage");
  const scope = await requireSchoolScope();

  const parsed = examScheduleSchema.safeParse({
    id: scheduleId,
    school_id: formString(formData, "school_id"),
    exam_package_id: formString(formData, "exam_package_id"),
    academic_year_id: formString(formData, "academic_year_id"),
    semester_id: formString(formData, "semester_id"),
    title: formString(formData, "title"),
    start_at: toDatetime(formString(formData, "start_at")),
    end_at: toDatetime(formString(formData, "end_at")),
    status: formString(formData, "status"),
    token_required: formBoolean(formData, "token_required"),
    is_active: formBoolean(formData, "is_active"),
    class_ids: formStringList(formData, "class_ids"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/exams/schedules", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data jadwal tidak valid.",
    });
  }

  const supabase = await createClient();
  const { id, class_ids, ...payload } = parsed.data;
  assertSameSchool(scope, payload.school_id);

  if (id) {
    await assertScheduleSchoolScope(id);
  }

  const [
    { data: examPackage },
    { data: academicYear },
    { data: classes },
  ] = await Promise.all([
    supabase
      .from("exam_packages")
      .select("school_id")
      .eq("id", payload.exam_package_id)
      .maybeSingle(),
    supabase
      .from("academic_years")
      .select("school_id")
      .eq("id", payload.academic_year_id)
      .maybeSingle(),
    class_ids.length > 0
      ? supabase.from("classes").select("id, school_id").in("id", class_ids)
      : Promise.resolve({ data: [] }),
  ]);

  assertSameSchool(scope, examPackage?.school_id);
  assertSameSchool(scope, academicYear?.school_id);
  if ((classes ?? []).length !== new Set(class_ids).size) {
    assertSameSchool(scope, null);
  }

  (classes ?? []).forEach((classItem) =>
    assertSameSchool(scope, classItem.school_id),
  );

  if (payload.status === "scheduled" || payload.status === "active") {
    const validation = await validateScheduleInputReady({
      scheduleId: id,
      examPackageId: payload.exam_package_id,
      startAt: payload.start_at,
      endAt: payload.end_at,
      classIds: class_ids,
    });

    if (!validation.ok) {
      redirectTo("/dashboard/exams/schedules", validation);
    }
  }

  const schedulePayload = {
    ...payload,
    semester_id: payload.semester_id || null,
  };

  const { data: savedSchedule, error: scheduleError } = id
    ? await supabase
        .from("exam_schedules")
        .update(schedulePayload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("exam_schedules")
        .insert({ ...schedulePayload, created_by: currentUser.id })
        .select("id")
        .single();

  if (scheduleError || !savedSchedule) {
    redirectTo("/dashboard/exams/schedules", {
      ok: false,
      message: scheduleError?.message ?? "Gagal menyimpan jadwal ujian.",
    });
  }

  await supabase
    .from("exam_schedule_classes")
    .delete()
    .eq("exam_schedule_id", savedSchedule.id);

  const { error: classError } = await supabase
    .from("exam_schedule_classes")
    .insert(
      class_ids.map((classId: string) => ({
        exam_schedule_id: savedSchedule.id,
        class_id: classId,
      })),
    );

  let syncResult: ActionResult | null = null;

  if (!classError && (payload.status === "scheduled" || payload.status === "active")) {
    syncResult = await syncScheduleParticipants(savedSchedule.id);

    if (!syncResult.ok) {
      redirectTo("/dashboard/exams/schedules", syncResult);
    }

    const publishReadiness = await enforceSchedulePublishReadiness(
      savedSchedule.id,
      formString(formData, "confirm_warnings") === "true",
    );

    if (!publishReadiness.ok) {
      redirectTo("/dashboard/exams/schedules", publishReadiness);
    }
  }

  if (!classError) {
    await logAuditEvent({
      userId: currentUser.id,
      action: id ? "exam_schedules.update" : "exam_schedules.create",
      entityType: "exam_schedules",
      entityId: savedSchedule.id,
      payload: {
        title: payload.title,
        exam_package_id: payload.exam_package_id,
        status: payload.status,
        start_at: payload.start_at,
        end_at: payload.end_at,
        class_count: class_ids.length,
        participant_sync: syncResult?.message ?? null,
      },
    });
  }

  revalidatePath("/dashboard/exams/schedules");
  revalidatePath("/dashboard/exams");
  redirectTo("/dashboard/exams/schedules", {
    ok: !classError,
    message: classError
      ? classError.message
      : "Jadwal ujian berhasil disimpan.",
  });
}

export async function updateExamScheduleStatusAction(formData: FormData) {
  const status = formString(formData, "status");
  const currentUser = await requirePermission(
    status === "archived"
      ? "exam_schedules.archive"
      : status === "active" || status === "scheduled"
        ? "exam_schedules.publish"
        : "exam_schedules.manage",
  );

  const parsed = examScheduleStatusSchema.safeParse({
    id: formString(formData, "id"),
    status,
  });

  if (!parsed.success) {
    redirectTo("/dashboard/exams/schedules", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Status jadwal tidak valid.",
    });
  }

  const supabase = await createClient();
  await assertScheduleSchoolScope(parsed.data.id);

  if (parsed.data.status === "scheduled" || parsed.data.status === "active") {
    const confirmWarnings = formString(formData, "confirm_warnings") === "true";

    const syncResult = await syncScheduleParticipants(parsed.data.id);

    if (!syncResult.ok) {
      redirectTo("/dashboard/exams/schedules", syncResult);
    }

    const publishReadiness = await enforceSchedulePublishReadiness(
      parsed.data.id,
      confirmWarnings,
    );

    if (!publishReadiness.ok) {
      redirectTo("/dashboard/exams/schedules", publishReadiness);
    }
  }

  const { error } = await supabase
    .from("exam_schedules")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "exam_schedules.status_update",
      entityType: "exam_schedules",
      entityId: parsed.data.id,
      payload: { status: parsed.data.status },
    });
  }

  revalidatePath("/dashboard/exams/schedules");
  redirectTo("/dashboard/exams/schedules", {
    ok: !error,
    message: error ? error.message : "Status jadwal ujian diperbarui.",
  });
}

export async function syncExamScheduleParticipantsAction(formData: FormData) {
  const currentUser = await requirePermission("exam_schedules.manage");
  const id = formString(formData, "id");

  if (!id) {
    redirectTo("/dashboard/exams/schedules", {
      ok: false,
      message: "Jadwal ujian tidak valid.",
    });
  }

  await assertScheduleSchoolScope(id);

  const result = await syncScheduleParticipants(id);

  if (result.ok) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "exam_participants.sync",
      entityType: "exam_schedules",
      entityId: id,
      payload: result.payload,
    });
  }

  revalidatePath("/dashboard/exams/schedules");
  revalidatePath("/dashboard/proctor/monitoring");
  revalidatePath("/dashboard/admin/monitoring");
  revalidatePath("/dashboard/super-admin/monitoring");
  revalidatePath("/dashboard/teacher/monitoring");
  redirectTo("/dashboard/exams/schedules", result);
}

export async function resetExamScheduleSessionsAction(formData: FormData) {
  const currentUser = await requirePermission("exam_schedules.manage");
  if (isDemoUser(currentUser)) {
    redirectTo("/dashboard/exams/schedules", {
      ok: false,
      message: DEMO_MUTATION_BLOCKED_MESSAGE,
    });
  }

  const id = formString(formData, "id");

  if (!id) {
    redirectTo("/dashboard/exams/schedules", {
      ok: false,
      message: "Jadwal ujian tidak valid.",
    });
  }

  await assertScheduleSchoolScope(id);

  const supabase = await createClient();
  const { data: attempts, error: attemptsError } = await supabase
    .from("exam_attempts")
    .select("id")
    .eq("exam_schedule_id", id)
    .neq("status", "cancelled");

  if (attemptsError) {
    redirectTo("/dashboard/exams/schedules", {
      ok: false,
      message: attemptsError.message,
    });
  }

  const { data: participants, error: participantsError } = await supabase
    .from("exam_participants")
    .select("id")
    .eq("exam_schedule_id", id);

  if (participantsError) {
    redirectTo("/dashboard/exams/schedules", {
      ok: false,
      message: participantsError.message,
    });
  }

  const now = new Date().toISOString();
  const { error: attemptResetError } = await supabase
    .from("exam_attempts")
    .update({
      status: "cancelled",
      submitted_at: null,
      last_saved_at: now,
      locked_at: null,
      lock_reason: null,
    })
    .eq("exam_schedule_id", id)
    .neq("status", "cancelled");

  if (attemptResetError) {
    redirectTo("/dashboard/exams/schedules", {
      ok: false,
      message: attemptResetError.message,
    });
  }

  const { error: participantResetError } = await supabase
    .from("exam_participants")
    .update({
      status: "assigned",
      started_at: null,
      submitted_at: null,
    })
    .eq("exam_schedule_id", id);

  if (!participantResetError) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "exam_schedules.sessions_reset",
      entityType: "exam_schedules",
      entityId: id,
      payload: {
        reset_attempt_count: attempts?.length ?? 0,
        reset_participant_count: participants?.length ?? 0,
      },
    });
  }

  revalidatePath("/dashboard/exams/schedules");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/active-exams");
  revalidatePath("/dashboard/student/history");
  revalidatePath("/dashboard/proctor/monitoring");
  revalidatePath("/dashboard/admin/monitoring");
  revalidatePath("/dashboard/super-admin/monitoring");
  revalidatePath("/dashboard/teacher/monitoring");
  redirectTo("/dashboard/exams/schedules", {
    ok: !participantResetError,
    message: participantResetError
      ? participantResetError.message
      : `Reset sesi selesai. ${attempts?.length ?? 0} attempt dibatalkan dan ${
          participants?.length ?? 0
        } peserta bisa mulai ulang.`,
  });
}

export async function toggleExamScheduleActiveAction(formData: FormData) {
  const currentUser = await requirePermission("exam_schedules.manage");
  const parsed = examScheduleActiveSchema.safeParse({
    id: formString(formData, "id"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/exams/schedules", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Status aktif tidak valid.",
    });
  }

  const supabase = await createClient();
  await assertScheduleSchoolScope(parsed.data.id);

  const { error } = await supabase
    .from("exam_schedules")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "exam_schedules.active_update",
      entityType: "exam_schedules",
      entityId: parsed.data.id,
      payload: { is_active: parsed.data.is_active },
    });
  }

  revalidatePath("/dashboard/exams/schedules");
  redirectTo("/dashboard/exams/schedules", {
    ok: !error,
    message: error ? error.message : "Status aktif jadwal diperbarui.",
  });
}

export async function archiveExamScheduleAction(formData: FormData) {
  const currentUser = await requirePermission("exam_schedules.archive");
  if (isDemoUser(currentUser)) {
    redirectTo("/dashboard/exams/schedules", {
      ok: false,
      message: DEMO_MUTATION_BLOCKED_MESSAGE,
    });
  }

  const supabase = await createClient();
  const id = formString(formData, "id");
  await assertScheduleSchoolScope(id);

  const { error } = await supabase
    .from("exam_schedules")
    .update({
      status: "archived",
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "exam_schedules.archive",
      entityType: "exam_schedules",
      entityId: id,
      payload: { status: "archived", is_active: false },
    });
  }

  revalidatePath("/dashboard/exams/schedules");
  redirectTo("/dashboard/exams/schedules", {
    ok: !error,
    message: error ? error.message : "Jadwal ujian berhasil diarsipkan.",
  });
}

export async function regenerateExamTokenAction(formData: FormData) {
  const currentUser = await requirePermission("exam_tokens.manage");
  const parsed = examTokenSchema.safeParse({
    id: formString(formData, "id"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/exams/schedules", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Jadwal ujian tidak valid.",
    });
  }

  const supabase = await createClient();
  await assertScheduleSchoolScope(parsed.data.id);

  const accessToken = generateExamToken();
  const { error } = await supabase
    .from("exam_schedules")
    .update({
      access_token: accessToken,
      token_updated_at: new Date().toISOString(),
      token_required: true,
    })
    .eq("id", parsed.data.id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "exam_tokens.regenerate",
      entityType: "exam_schedules",
      entityId: parsed.data.id,
      payload: {
        token_required: true,
        token_length: accessToken.length,
      },
    });
  }

  revalidatePath("/dashboard/exams/schedules");
  redirectTo("/dashboard/exams/schedules", {
    ok: !error,
    message: error ? error.message : "Token ujian diperbarui.",
  });
}

async function validateScheduleReady(scheduleId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: schedule, error } = await supabase
    .from("exam_schedules")
    .select(
      "id, exam_package_id, start_at, end_at, exam_schedule_classes(class_id)",
    )
    .eq("id", scheduleId)
    .maybeSingle();

  if (error || !schedule) {
    return {
      ok: false,
      message: error?.message ?? "Jadwal ujian tidak ditemukan.",
    };
  }

  const classIds = (schedule.exam_schedule_classes ?? [])
    .map((item) => item.class_id as string | null)
    .filter((classId): classId is string => Boolean(classId));

  return validateScheduleInputReady({
    scheduleId: schedule.id,
    examPackageId: schedule.exam_package_id,
    startAt: schedule.start_at,
    endAt: schedule.end_at,
    classIds,
  });
}

async function validateScheduleInputReady({
  scheduleId,
  examPackageId,
  startAt,
  endAt,
  classIds,
}: {
  scheduleId?: string | null;
  examPackageId?: string | null;
  startAt: string;
  endAt: string;
  classIds: string[];
}): Promise<ActionResult> {
  const supabase = await createClient();

  if (!examPackageId) {
    return {
      ok: false,
      message: "Jadwal belum memiliki paket ujian.",
    };
  }

  const { data: packageData, error: packageError } = await supabase
    .from("exam_packages")
    .select("id, status, is_active, total_questions")
    .eq("id", examPackageId)
    .maybeSingle();

  if (packageError || !packageData) {
    return {
      ok: false,
      message: packageError?.message ?? "Paket ujian tidak ditemukan.",
    };
  }

  const examPackage = packageData;

  if (examPackage.status !== "published" || !examPackage.is_active) {
    return {
      ok: false,
      message: "Paket ujian harus published dan aktif sebelum jadwal dipublish.",
    };
  }

  if (Number(examPackage.total_questions ?? 0) <= 0) {
    return {
      ok: false,
      message: "Paket ujian belum memiliki soal.",
    };
  }

  if (new Date(endAt) <= new Date(startAt)) {
    return {
      ok: false,
      message: "Waktu selesai harus setelah waktu mulai.",
    };
  }

  if (classIds.length === 0) {
    return {
      ok: false,
      message: "Pilih minimal satu kelas target sebelum jadwal dipublish.",
    };
  }

  const conflict = await findScheduleClassConflict({
    scheduleId,
    startAt,
    endAt,
    classIds,
  });

  if (conflict) {
    return {
      ok: false,
      message: `Bentrok jadwal: kelas ${conflict.className} sudah punya "${conflict.title}" pada rentang waktu yang sama.`,
    };
  }

  return {
    ok: true,
    message: "Jadwal siap dipublish.",
  };
}

async function findScheduleClassConflict({
  scheduleId,
  startAt,
  endAt,
  classIds,
}: {
  scheduleId?: string | null;
  startAt: string;
  endAt: string;
  classIds: string[];
}) {
  const supabase = await createClient();
  let query = supabase
    .from("exam_schedules")
    .select(
      "id, title, start_at, end_at, status, exam_schedule_classes!inner(class_id, classes(name))",
    )
    .in("status", ["scheduled", "active"])
    .eq("is_active", true)
    .is("deleted_at", null)
    .lt("start_at", endAt)
    .gt("end_at", startAt)
    .in("exam_schedule_classes.class_id", classIds);

  if (scheduleId) {
    query = query.neq("id", scheduleId);
  }

  const { data } = await query.limit(1);
  const schedule = data?.[0];
  const scheduleClass = schedule?.exam_schedule_classes?.[0];
  const classItem = Array.isArray(scheduleClass?.classes)
    ? scheduleClass?.classes[0]
    : scheduleClass?.classes;

  if (!schedule || !scheduleClass) {
    return null;
  }

  return {
    title: String(schedule.title ?? "Jadwal lain"),
    className: String(classItem?.name ?? scheduleClass.class_id ?? "target"),
  };
}

async function syncScheduleParticipants(scheduleId: string): Promise<
  ActionResult & {
    payload?: {
      class_count: number;
      student_count: number;
      existing_count: number;
      inserted_count: number;
    };
  }
> {
  const ready = await validateScheduleReady(scheduleId);

  if (!ready.ok) {
    return ready;
  }

  const supabase = await createClient();
  const { data: scheduleClasses, error: classError } = await supabase
    .from("exam_schedule_classes")
    .select("class_id")
    .eq("exam_schedule_id", scheduleId);

  if (classError || !scheduleClasses?.length) {
    return {
      ok: false,
      message: classError?.message ?? "Kelas target jadwal belum tersedia.",
    };
  }

  const classIds = scheduleClasses
    .map((item) => item.class_id as string | null)
    .filter((classId): classId is string => Boolean(classId));

  const { data: members, error: memberError } = await supabase
    .from("class_members")
    .select("class_id, student_id, users(status, roles(name))")
    .in("class_id", classIds)
    .is("left_at", null);

  if (memberError) {
    return {
      ok: false,
      message: memberError.message,
    };
  }

  const activeStudents = new Map<string, { student_id: string; class_id: string }>();

  for (const member of members ?? []) {
    const user = Array.isArray(member.users) ? member.users[0] : member.users;
    const role = Array.isArray(user?.roles) ? user?.roles[0] : user?.roles;

    if (
      member.student_id &&
      member.class_id &&
      user?.status === "active" &&
      role?.name === "student"
    ) {
      activeStudents.set(member.student_id as string, {
        student_id: member.student_id as string,
        class_id: member.class_id as string,
      });
    }
  }

  if (activeStudents.size === 0) {
    return {
      ok: false,
      message:
        "Tidak ada siswa aktif pada kelas target. Tambahkan siswa ke kelas terlebih dahulu.",
      payload: {
        class_count: classIds.length,
        student_count: 0,
        existing_count: 0,
        inserted_count: 0,
      },
    };
  }

  const { data: existingParticipants } = await supabase
    .from("exam_participants")
    .select("student_id")
    .eq("exam_schedule_id", scheduleId);

  const existingStudentIds = new Set(
    (existingParticipants ?? [])
      .map((participant) => participant.student_id as string | null)
      .filter((studentId): studentId is string => Boolean(studentId)),
  );
  const missingParticipants = Array.from(activeStudents.values()).filter(
    (student) => !existingStudentIds.has(student.student_id),
  );

  if (missingParticipants.length > 0) {
    const { error: insertError } = await supabase.from("exam_participants").insert(
      missingParticipants.map((student) => ({
        exam_schedule_id: scheduleId,
        student_id: student.student_id,
        class_id: student.class_id,
        status: "assigned",
      })),
    );

    if (insertError) {
      return {
        ok: false,
        message: insertError.message,
      };
    }
  }

  return {
    ok: true,
    message:
      missingParticipants.length > 0
        ? `${missingParticipants.length} peserta baru berhasil disinkronkan.`
        : "Peserta ujian sudah sinkron.",
    payload: {
      class_count: classIds.length,
      student_count: activeStudents.size,
      existing_count: existingStudentIds.size,
      inserted_count: missingParticipants.length,
    },
  };
}
