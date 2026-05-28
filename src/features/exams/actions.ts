"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/require-auth";
import { requirePermission } from "@/lib/auth/require-permission";
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

function redirectTo(path: string, result: ActionResult): never {
  const params = new URLSearchParams({
    notice: result.ok ? "success" : "error",
    message: result.message,
  });

  redirect(`${path}?${params.toString()}`);
}

function toDatetime(value: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString();
}

function generateExamToken() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";

  for (let index = 0; index < 6; index += 1) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return token;
}

export async function saveExamPackageAction(formData: FormData) {
  const currentUser = await requireAuth();
  const packageId = formString(formData, "id");
  await requirePermission("exam_packages.manage");

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
  const selectedQuestions = await supabase
    .from("questions")
    .select("id, point")
    .in("id", question_ids);

  if (selectedQuestions.error || !selectedQuestions.data?.length) {
    redirectTo("/dashboard/exams/packages", {
      ok: false,
      message: selectedQuestions.error?.message ?? "Soal paket tidak valid.",
    });
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
  await requirePermission(
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
  const { error } = await supabase
    .from("exam_packages")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  revalidatePath("/dashboard/exams/packages");
  redirectTo("/dashboard/exams/packages", {
    ok: !error,
    message: error ? error.message : "Status paket ujian diperbarui.",
  });
}

export async function toggleExamPackageActiveAction(formData: FormData) {
  await requirePermission("exam_packages.manage");
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
  const { error } = await supabase
    .from("exam_packages")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.id);

  revalidatePath("/dashboard/exams/packages");
  redirectTo("/dashboard/exams/packages", {
    ok: !error,
    message: error ? error.message : "Status aktif paket diperbarui.",
  });
}

export async function archiveExamPackageAction(formData: FormData) {
  await requirePermission("exam_packages.archive");
  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_packages")
    .update({
      status: "archived",
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", formString(formData, "id"));

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
  await requirePermission(
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
  const { error } = await supabase
    .from("exam_schedules")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  revalidatePath("/dashboard/exams/schedules");
  redirectTo("/dashboard/exams/schedules", {
    ok: !error,
    message: error ? error.message : "Status jadwal ujian diperbarui.",
  });
}

export async function toggleExamScheduleActiveAction(formData: FormData) {
  await requirePermission("exam_schedules.manage");
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
  const { error } = await supabase
    .from("exam_schedules")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.id);

  revalidatePath("/dashboard/exams/schedules");
  redirectTo("/dashboard/exams/schedules", {
    ok: !error,
    message: error ? error.message : "Status aktif jadwal diperbarui.",
  });
}

export async function archiveExamScheduleAction(formData: FormData) {
  await requirePermission("exam_schedules.archive");
  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_schedules")
    .update({
      status: "archived",
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", formString(formData, "id"));

  revalidatePath("/dashboard/exams/schedules");
  redirectTo("/dashboard/exams/schedules", {
    ok: !error,
    message: error ? error.message : "Jadwal ujian berhasil diarsipkan.",
  });
}

export async function regenerateExamTokenAction(formData: FormData) {
  await requirePermission("exam_tokens.manage");
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
  const { error } = await supabase
    .from("exam_schedules")
    .update({
      access_token: generateExamToken(),
      token_updated_at: new Date().toISOString(),
      token_required: true,
    })
    .eq("id", parsed.data.id);

  revalidatePath("/dashboard/exams/schedules");
  redirectTo("/dashboard/exams/schedules", {
    ok: !error,
    message: error ? error.message : "Token ujian diperbarui.",
  });
}
