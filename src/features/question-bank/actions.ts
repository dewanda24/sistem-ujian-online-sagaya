"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { getFriendlyErrorMessage } from "@/lib/actions/action-result";
import { requireAuth } from "@/lib/auth/require-auth";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  assertSameSchool,
  requireSchoolScope,
  requireScopedSchoolId,
} from "@/lib/auth/school-scope";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import {
  questionActiveSchema,
  questionAttachmentSchema,
  questionCategorySchema,
  questionSchema,
  questionStimulusSchema,
  questionStatusSchema,
} from "@/lib/validations/question-bank";
import { parseCsvText } from "@/lib/import/csv";
import type { CurrentUser } from "@/types/auth";

type ActionResult = {
  ok: boolean;
  message: string;
};

type PublishableQuestion = {
  id: string;
  school_id: string;
  subject_id: string;
  category_id: string | null;
  stimulus_id: string | null;
  type: string;
  difficulty: string;
  content: string;
  explanation: string | null;
  point: number | string;
  is_active: boolean;
  question_categories?: { subject_id?: string | null } | { subject_id?: string | null }[] | null;
  question_options?: Array<{
    id: string;
    option_label: string;
    option_text: string;
    is_correct: boolean;
    order_number: number;
  }> | null;
};

const CATEGORY_PATH = "/dashboard/question-bank/categories";
const QUESTION_PATH = "/dashboard/question-bank/questions";
const STIMULUS_PATH = "/dashboard/question-bank/stimuli";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function formBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function parseCsv(text: string) {
  return parseCsvText(text).rows;
}

function redirectTo(path: string, result: ActionResult): never {
  const params = new URLSearchParams({
    notice: result.ok ? "success" : "error",
    message: result.ok ? result.message : getFriendlyErrorMessage(result.message),
  });

  redirect(`${path}?${params.toString()}`);
}

function bypassesSubjectScope(user: CurrentUser) {
  return user.roles?.name !== "teacher";
}

async function assertAdminSameSchool(
  user: CurrentUser,
  targetSchoolId: string | null | undefined,
) {
  if (user.roles?.name !== "admin") {
    return;
  }

  const scope = await requireSchoolScope();
  assertSameSchool(scope, targetSchoolId);
}

async function getTeacherSubjectIds(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_subjects")
    .select("subject_id")
    .eq("teacher_id", userId);

  if (error || !data) {
    return [];
  }

  return data
    .map((item) => item.subject_id as string | null)
    .filter((subjectId): subjectId is string => Boolean(subjectId));
}

async function assertSubjectInScope(
  user: CurrentUser,
  subjectId: string,
  redirectPath: string,
) {
  const supabase = await createClient();
  const { data: subject, error } = await supabase
    .from("subjects")
    .select("school_id")
    .eq("id", subjectId)
    .maybeSingle();

  if (error || !subject) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Mapel tidak ditemukan.",
    });
  }

  await assertAdminSameSchool(user, subject.school_id);

  if (bypassesSubjectScope(user)) {
    return;
  }

  const subjectIds = await getTeacherSubjectIds(user.id);

  if (!subjectIds.includes(subjectId)) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Akses mapel ditolak. Guru hanya boleh mengelola mapel yang ditugaskan.",
    });
  }
}

async function getQuestionSubjectId(questionId: string, redirectPath: string) {
  const supabase = await createClient();
  const { data: question, error } = await supabase
    .from("questions")
    .select("id, school_id, subject_id")
    .eq("id", questionId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !question?.subject_id) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Soal tidak ditemukan atau sudah diarsipkan.",
    });
  }

  const user = await requireAuth();
  await assertAdminSameSchool(user, question.school_id);

  return question.subject_id as string;
}

async function assertQuestionInScope(
  user: CurrentUser,
  questionId: string,
  redirectPath = QUESTION_PATH,
) {
  const subjectId = await getQuestionSubjectId(questionId, redirectPath);

  await assertSubjectInScope(user, subjectId, redirectPath);
}

async function getCategorySubjectId(categoryId: string, redirectPath: string) {
  const supabase = await createClient();
  const { data: category, error } = await supabase
    .from("question_categories")
    .select("id, subject_id")
    .eq("id", categoryId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !category?.subject_id) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Kategori soal tidak ditemukan atau sudah diarsipkan.",
    });
  }

  return category.subject_id as string;
}

async function assertCategoryInScope(
  user: CurrentUser,
  categoryId: string,
  redirectPath = CATEGORY_PATH,
) {
  const subjectId = await getCategorySubjectId(categoryId, redirectPath);

  await assertSubjectInScope(user, subjectId, redirectPath);

  return subjectId;
}

async function assertCategoryMatchesSubject(
  user: CurrentUser,
  categoryId: string | null | undefined,
  subjectId: string,
  redirectPath: string,
) {
  if (!categoryId) {
    return;
  }

  const categorySubjectId = await assertCategoryInScope(user, categoryId, redirectPath);

  if (categorySubjectId !== subjectId) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Kategori soal harus berasal dari mapel yang sama dengan soal.",
    });
  }
}

async function assertQuestionPublishable(
  user: CurrentUser,
  questionId: string,
) {
  const supabase = await createClient();
  const { data: question, error } = await supabase
    .from("questions")
    .select(
      "id, school_id, subject_id, category_id, stimulus_id, type, difficulty, content, explanation, point, is_active, question_options(id, option_label, option_text, is_correct, order_number)",
    )
    .eq("id", questionId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !question) {
    redirectTo(QUESTION_PATH, {
      ok: false,
      message: "Soal tidak ditemukan atau sudah diarsipkan.",
    });
  }

  await assertSubjectInScope(user, question.subject_id as string, QUESTION_PATH);
  await assertCategoryMatchesSubject(
    user,
    question.category_id as string | null,
    question.subject_id as string,
    QUESTION_PATH,
  );

  if (!question.is_active) {
    redirectTo(QUESTION_PATH, {
      ok: false,
      message: "Soal nonaktif tidak bisa diterbitkan.",
    });
  }

  const parsed = questionSchema.safeParse({
    id: question.id,
    school_id: question.school_id,
    subject_id: question.subject_id,
    category_id: question.category_id ?? "",
    stimulus_id: question.stimulus_id ?? "",
    type: question.type,
    difficulty: question.difficulty,
    content: question.content,
    explanation: question.explanation ?? "",
    point: question.point,
    status: "published",
    is_active: Boolean(question.is_active),
    options:
      question.type === "multiple_choice"
        ? (question.question_options ?? []).map((option) => ({
            id: option.id,
            option_label: option.option_label,
            option_text: option.option_text,
            is_correct: option.is_correct,
            order_number: option.order_number,
          }))
        : [],
  });

  if (!parsed.success) {
    redirectTo(QUESTION_PATH, {
      ok: false,
      message:
        parsed.error.issues[0]?.message ??
        "Soal belum memenuhi syarat untuk diterbitkan.",
    });
  }
}

function firstRelated<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getQuestionPublishIssue(question: PublishableQuestion) {
  if (!question.is_active) {
    return "soal nonaktif";
  }

  const category = firstRelated(question.question_categories);

  if (question.category_id && !category) {
    return "kategori soal tidak ditemukan";
  }

  if (
    question.category_id &&
    category?.subject_id &&
    category.subject_id !== question.subject_id
  ) {
    return "kategori soal berbeda mapel";
  }

  const parsed = questionSchema.safeParse({
    id: question.id,
    school_id: question.school_id,
    subject_id: question.subject_id,
    category_id: question.category_id ?? "",
    stimulus_id: question.stimulus_id ?? "",
    type: question.type,
    difficulty: question.difficulty,
    content: question.content,
    explanation: question.explanation ?? "",
    point: question.point,
    status: "published",
    is_active: Boolean(question.is_active),
    options:
      question.type === "multiple_choice"
        ? (question.question_options ?? []).map((option) => ({
            id: option.id,
            option_label: option.option_label,
            option_text: option.option_text,
            is_correct: option.is_correct,
            order_number: option.order_number,
          }))
        : [],
  });

  return parsed.success
    ? null
    : (parsed.error.issues[0]?.message ??
        "soal belum memenuhi syarat untuk diterbitkan");
}

async function assertStimulusInScope(
  user: CurrentUser,
  stimulusId: string | null | undefined,
  subjectId: string,
  redirectPath: string,
) {
  if (!stimulusId) {
    return;
  }

  const supabase = await createClient();
  const { data: stimulus, error } = await supabase
    .from("question_stimuli")
    .select("id, subject_id")
    .eq("id", stimulusId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !stimulus) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Stimulus tidak ditemukan atau sudah diarsipkan.",
    });
  }

  if (stimulus.subject_id && stimulus.subject_id !== subjectId) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Stimulus harus berasal dari mapel yang sama dengan soal.",
    });
  }

  if (stimulus.subject_id) {
    await assertSubjectInScope(user, stimulus.subject_id as string, redirectPath);
  }
}

async function getStimulusSubjectId(stimulusId: string, redirectPath: string) {
  const supabase = await createClient();
  const { data: stimulus, error } = await supabase
    .from("question_stimuli")
    .select("id, subject_id")
    .eq("id", stimulusId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !stimulus?.subject_id) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Stimulus tidak ditemukan atau sudah diarsipkan.",
    });
  }

  return stimulus.subject_id as string;
}

async function assertStimulusRecordInScope(
  user: CurrentUser,
  stimulusId: string,
  redirectPath = STIMULUS_PATH,
) {
  const subjectId = await getStimulusSubjectId(stimulusId, redirectPath);

  await assertSubjectInScope(user, subjectId, redirectPath);

  return subjectId;
}

async function createInlineStimulus({
  formData,
  user,
  schoolId,
  subjectId,
}: {
  formData: FormData;
  user: CurrentUser;
  schoolId: string;
  subjectId: string;
}) {
  const mode = formString(formData, "stimulus_mode");

  if (mode && mode !== "new") {
    return null;
  }

  const title = formString(formData, "new_stimulus_title").trim();
  const content = formString(formData, "new_stimulus_content").trim();
  const mediaUrl = formString(formData, "new_stimulus_media_url").trim();
  const mediaType = formString(formData, "new_stimulus_media_type");

  if (!title && !content && !mediaUrl) {
    return null;
  }

  if (!title || (!content && !mediaUrl)) {
    redirectTo(QUESTION_PATH, {
      ok: false,
      message:
        "Stimulus baru wajib memiliki judul dan isi bacaan atau URL media.",
    });
  }

  const parsed = questionStimulusSchema.safeParse({
    school_id: schoolId,
    subject_id: subjectId,
    title: title || content.slice(0, 80) || "Stimulus soal",
    content,
    media_url: mediaUrl,
    media_type: mediaType,
    is_active: true,
  });

  if (!parsed.success) {
    redirectTo(QUESTION_PATH, {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Stimulus tidak valid.",
    });
  }

  await assertSubjectInScope(user, subjectId, QUESTION_PATH);
  await assertAdminSameSchool(user, parsed.data.school_id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("question_stimuli")
    .insert({
      school_id: parsed.data.school_id,
      subject_id: parsed.data.subject_id,
      title: parsed.data.title,
      content: parsed.data.content || null,
      media_url: parsed.data.media_url || null,
      media_type: parsed.data.media_type || null,
      is_active: parsed.data.is_active,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    redirectTo(QUESTION_PATH, {
      ok: false,
      message: error?.message ?? "Gagal membuat stimulus.",
    });
  }

  return data.id as string;
}

export async function saveQuestionStimulusAction(formData: FormData) {
  const user = await requirePermission("question_bank.manage");
  const content = formString(formData, "content").trim();
  const mediaUrl = formString(formData, "media_url").trim();
  const parsed = questionStimulusSchema.safeParse({
    id: formString(formData, "id"),
    school_id: formString(formData, "school_id"),
    subject_id: formString(formData, "subject_id"),
    title: formString(formData, "title"),
    content,
    media_url: mediaUrl,
    media_type: formString(formData, "media_type"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo(STIMULUS_PATH, {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data stimulus tidak valid.",
    });
  }

  if (!parsed.data.subject_id) {
    redirectTo(STIMULUS_PATH, {
      ok: false,
      message: "Mapel stimulus wajib dipilih.",
    });
  }

  if (!parsed.data.content.trim() && !parsed.data.media_url) {
    redirectTo(STIMULUS_PATH, {
      ok: false,
      message: "Isi bacaan atau URL media stimulus wajib diisi.",
    });
  }

  if (parsed.data.id) {
    await assertStimulusRecordInScope(user, parsed.data.id);
  }

  await assertSubjectInScope(user, parsed.data.subject_id, STIMULUS_PATH);
  await assertAdminSameSchool(user, parsed.data.school_id);

  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const { id, ...payload } = parsed.data;
  const normalizedPayload = {
    ...payload,
    subject_id: payload.subject_id,
    content: payload.content || null,
    media_url: payload.media_url || null,
    media_type: payload.media_type || null,
  };
  const { data: savedStimulus, error } = id
    ? await dbClient
        .from("question_stimuli")
        .update(normalizedPayload)
        .eq("id", id)
        .select("id")
        .single()
    : await dbClient
        .from("question_stimuli")
        .insert({ ...normalizedPayload, created_by: user.id })
        .select("id")
        .single();

  if (!error && savedStimulus?.id) {
    await logAuditEvent({
      userId: user.id,
      action: id ? "question_stimuli.update" : "question_stimuli.create",
      entityType: "question_stimuli",
      entityId: savedStimulus.id,
      payload: {
        subject_id: payload.subject_id,
        media_type: payload.media_type || null,
        is_active: payload.is_active,
      },
    });
  }

  revalidatePath(STIMULUS_PATH);
  revalidatePath(QUESTION_PATH);
  redirectTo(STIMULUS_PATH, {
    ok: !error,
    message: error ? error.message : "Stimulus berhasil disimpan.",
  });
}

export async function toggleQuestionStimulusAction(formData: FormData) {
  const user = await requirePermission("question_bank.manage");
  const parsed = questionActiveSchema.safeParse({
    id: formString(formData, "id"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo(STIMULUS_PATH, {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Status stimulus tidak valid.",
    });
  }

  await assertStimulusRecordInScope(user, parsed.data.id);

  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const { error } = await dbClient
    .from("question_stimuli")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.id);

  if (!error) {
    await logAuditEvent({
      userId: user.id,
      action: "question_stimuli.active_update",
      entityType: "question_stimuli",
      entityId: parsed.data.id,
      payload: { is_active: parsed.data.is_active },
    });
  }

  revalidatePath(STIMULUS_PATH);
  redirectTo(STIMULUS_PATH, {
    ok: !error,
    message: error ? error.message : "Status stimulus berhasil diperbarui.",
  });
}

export async function deleteQuestionStimulusAction(formData: FormData) {
  const user = await requirePermission("question_bank.manage");
  const id = formString(formData, "id");

  await assertStimulusRecordInScope(user, id);

  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const { error } = await dbClient
    .from("question_stimuli")
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: user.id,
      action: "question_stimuli.archive",
      entityType: "question_stimuli",
      entityId: id,
      payload: { is_active: false },
    });
  }

  revalidatePath(STIMULUS_PATH);
  revalidatePath(QUESTION_PATH);
  redirectTo(STIMULUS_PATH, {
    ok: !error,
    message: error ? error.message : "Stimulus berhasil diarsipkan.",
  });
}

async function snapshotQuestionVersion(questionId: string, userId: string) {
  const supabase = await createClient();
  const { data: question } = await supabase
    .from("questions")
    .select(
      "*, question_options(id, option_label, option_text, is_correct, order_number), question_attachments(id, media_type, url, file_name, caption, order_number)",
    )
    .eq("id", questionId)
    .maybeSingle();

  if (!question) {
    return 1;
  }

  await supabase.from("question_versions").insert({
    question_id: questionId,
    version_number: question.current_version ?? 1,
    snapshot: question,
    change_reason: "Snapshot before question update.",
    created_by: userId,
  });

  return Number(question.current_version ?? 1);
}

async function replaceQuestionAttachment(
  formData: FormData,
  questionId: string,
  userId: string,
) {
  const attachmentUrl = formString(formData, "attachment_url").trim();
  const supabase = await createClient();

  await supabase.from("question_attachments").delete().eq("question_id", questionId);

  if (!attachmentUrl) {
    return;
  }

  const parsed = questionAttachmentSchema.safeParse({
    media_type: formString(formData, "attachment_media_type") || "image",
    url: attachmentUrl,
    file_name: formString(formData, "attachment_file_name"),
    caption: formString(formData, "attachment_caption"),
    order_number: 1,
  });

  if (!parsed.success) {
    redirectTo(QUESTION_PATH, {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Media soal tidak valid.",
    });
  }

  const { error } = await supabase.from("question_attachments").insert({
    question_id: questionId,
    media_type: parsed.data.media_type,
    url: parsed.data.url,
    file_name: parsed.data.file_name || null,
    caption: parsed.data.caption || null,
    order_number: parsed.data.order_number,
    created_by: userId,
  });

  if (error) {
    redirectTo(QUESTION_PATH, {
      ok: false,
      message:
        "Media soal belum bisa disimpan. Pastikan akses bank soal dan kebijakan database lampiran soal sudah aktif.",
    });
  }
}

function getQuestionOptions(formData: FormData) {
  const labels = ["A", "B", "C", "D", "E"];
  const correctLabel = formString(formData, "correct_option");

  return labels
    .map((label, index) => ({
      option_label: label,
      option_text: formString(formData, `option_${label}`),
      is_correct: correctLabel === label,
      order_number: index + 1,
    }))
    .filter((option) => option.option_text.trim());
}

function getImportQuestionOptions(row: Record<string, string>) {
  const labels = ["A", "B", "C", "D"];
  const correctLabel = String(row.correct_option ?? "").trim().toUpperCase();

  return labels.map((label, index) => ({
    option_label: label,
    option_text: row[`option_${label.toLowerCase()}`] ?? "",
    is_correct: correctLabel === label,
    order_number: index + 1,
  }));
}

async function getImportSubjectMap(userId: string, roleName?: string) {
  const supabase = await createClient();

  if (roleName === "teacher") {
    const { data } = await supabase
      .from("teacher_subjects")
      .select("subjects(id, code, name, school_id)")
      .eq("teacher_id", userId);
    const subjectMap = new Map<string, { id: string; school_id: string }>();

    for (const assignment of data ?? []) {
      const subject = Array.isArray(assignment.subjects)
        ? assignment.subjects[0]
        : assignment.subjects;

      if (subject?.code && subject.id && subject.school_id) {
        subjectMap.set(String(subject.code).toUpperCase(), {
          id: subject.id as string,
          school_id: subject.school_id as string,
        });
      }
    }

    return subjectMap;
  }

  let query = supabase
    .from("subjects")
    .select("id, code, school_id")
    .eq("is_active", true);

  if (roleName !== "super_admin") {
    const scope = await requireSchoolScope();
    query = query.eq("school_id", requireScopedSchoolId(scope));
  }

  const { data } = await query;
  const subjectMap = new Map<string, { id: string; school_id: string }>();

  for (const subject of data ?? []) {
    if (subject.code && subject.id && subject.school_id) {
      subjectMap.set(String(subject.code).toUpperCase(), {
        id: subject.id as string,
        school_id: subject.school_id as string,
      });
    }
  }

  return subjectMap;
}

async function getOrCreateImportCategory({
  schoolId,
  subjectId,
  name,
  userId,
}: {
  schoolId: string;
  subjectId: string;
  name: string;
  userId: string;
}) {
  if (!name.trim()) {
    return null;
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("question_categories")
    .select("id")
    .eq("school_id", schoolId)
    .eq("subject_id", subjectId)
    .ilike("name", name.trim())
    .is("deleted_at", null)
    .maybeSingle();

  if (existing?.id) {
    return existing.id as string;
  }

  const { data: category } = await supabase
    .from("question_categories")
    .insert({
      school_id: schoolId,
      subject_id: subjectId,
      name: name.trim(),
      description: "",
      is_active: true,
      created_by: userId,
    })
    .select("id")
    .single();

  return category?.id ?? null;
}

export async function saveQuestionCategoryAction(formData: FormData) {
  const user = await requirePermission("question_categories.manage");
  const parsed = questionCategorySchema.safeParse({
    id: formString(formData, "id"),
    school_id: formString(formData, "school_id"),
    subject_id: formString(formData, "subject_id"),
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/question-bank/categories", {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Data kategori soal tidak valid.",
    });
  }

  if (parsed.data.id) {
    await assertCategoryInScope(user, parsed.data.id);
  }

  await assertSubjectInScope(user, parsed.data.subject_id, CATEGORY_PATH);
  await assertAdminSameSchool(user, parsed.data.school_id);

  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const { id, ...payload } = parsed.data;
  const { data: savedCategory, error } = id
    ? await dbClient
        .from("question_categories")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : await dbClient
        .from("question_categories")
        .insert({ ...payload, created_by: user.id })
        .select("id")
        .single();

  if (!error && savedCategory?.id) {
    await logAuditEvent({
      userId: user.id,
      action: id
        ? "question_categories.update"
        : "question_categories.create",
      entityType: "question_categories",
      entityId: savedCategory.id,
      payload: {
        name: payload.name,
        subject_id: payload.subject_id,
        is_active: payload.is_active,
      },
    });
  }

  revalidatePath("/dashboard/question-bank/categories");
  redirectTo("/dashboard/question-bank/categories", {
    ok: !error,
    message: error ? error.message : "Kategori soal berhasil disimpan.",
  });
}

export async function toggleQuestionCategoryAction(formData: FormData) {
  const user = await requirePermission("question_categories.manage");
  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const id = formString(formData, "id");
  const isActive = formBoolean(formData, "is_active");

  await assertCategoryInScope(user, id);

  const { error } = await dbClient
    .from("question_categories")
    .update({ is_active: isActive })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: user.id,
      action: "question_categories.active_update",
      entityType: "question_categories",
      entityId: id,
      payload: { is_active: isActive },
    });
  }

  revalidatePath("/dashboard/question-bank/categories");
  redirectTo("/dashboard/question-bank/categories", {
    ok: !error,
    message: error ? error.message : "Status kategori soal diperbarui.",
  });
}

export async function deleteQuestionCategoryAction(formData: FormData) {
  const user = await requirePermission("question_categories.manage");
  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const id = formString(formData, "id");

  await assertCategoryInScope(user, id);

  const { error } = await dbClient
    .from("question_categories")
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: user.id,
      action: "question_categories.archive",
      entityType: "question_categories",
      entityId: id,
      payload: { is_active: false },
    });
  }

  revalidatePath("/dashboard/question-bank/categories");
  redirectTo("/dashboard/question-bank/categories", {
    ok: !error,
    message: error ? error.message : "Kategori soal berhasil diarsipkan.",
  });
}

export async function saveQuestionAction(formData: FormData) {
  const questionId = formString(formData, "id");
  const currentUser = questionId
    ? await requirePermission("questions.update")
    : await requirePermission("questions.create");

  const type = formString(formData, "type");
  const parsed = questionSchema.safeParse({
    id: questionId,
    school_id: formString(formData, "school_id"),
    subject_id: formString(formData, "subject_id"),
    category_id: formString(formData, "category_id"),
    stimulus_id: formString(formData, "stimulus_id"),
    type,
    difficulty: formString(formData, "difficulty"),
    content: formString(formData, "content"),
    explanation: formString(formData, "explanation"),
    point: formString(formData, "point"),
    status: formString(formData, "status"),
    is_active: formBoolean(formData, "is_active"),
    options: type === "multiple_choice" ? getQuestionOptions(formData) : [],
  });

  if (!parsed.success) {
    redirectTo("/dashboard/question-bank/questions", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data soal tidak valid.",
    });
  }

  if (formString(formData, "stimulus_mode") === "existing" && !parsed.data.stimulus_id) {
    redirectTo(QUESTION_PATH, {
      ok: false,
      message: "Pilih stimulus yang akan digunakan.",
    });
  }

  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const { id, options, ...payload } = parsed.data;

  if (id) {
    await assertQuestionInScope(currentUser, id);
  }

  await assertAdminSameSchool(currentUser, payload.school_id);
  await assertSubjectInScope(currentUser, payload.subject_id, QUESTION_PATH);
  await assertCategoryMatchesSubject(
    currentUser,
    payload.category_id,
    payload.subject_id,
    QUESTION_PATH,
  );
  await assertStimulusInScope(
    currentUser,
    payload.stimulus_id,
    payload.subject_id,
    QUESTION_PATH,
  );

  const inlineStimulusId = await createInlineStimulus({
    formData,
    user: currentUser,
    schoolId: payload.school_id,
    subjectId: payload.subject_id,
  });

  const previousVersion = id
    ? await snapshotQuestionVersion(id, currentUser.id)
    : 0;
  const questionPayload = {
    ...payload,
    category_id: payload.category_id || null,
    stimulus_id: inlineStimulusId ?? payload.stimulus_id ?? null,
    explanation: payload.explanation || null,
    current_version: id ? previousVersion + 1 : 1,
  };

  const { data: savedQuestion, error: questionError } = id
    ? await dbClient
        .from("questions")
        .update(questionPayload)
        .eq("id", id)
        .select("id")
        .single()
    : await dbClient
        .from("questions")
        .insert({ ...questionPayload, created_by: currentUser.id })
        .select("id")
        .single();

  if (questionError || !savedQuestion) {
    redirectTo("/dashboard/question-bank/questions", {
      ok: false,
      message: questionError?.message ?? "Gagal menyimpan soal.",
    });
  }

  await dbClient
    .from("question_options")
    .delete()
    .eq("question_id", savedQuestion.id);

  if (parsed.data.type === "multiple_choice") {
    const filledOptions = options
      .filter((option) => option.option_text.trim())
      .map((option) => ({
        question_id: savedQuestion.id,
        option_label: option.option_label,
        option_text: option.option_text,
        is_correct: option.is_correct,
        order_number: option.order_number,
      }));

    const { error: optionError } = await dbClient
      .from("question_options")
      .insert(filledOptions);

    if (optionError) {
      redirectTo("/dashboard/question-bank/questions", {
        ok: false,
        message: optionError.message,
      });
    }
  }

  await replaceQuestionAttachment(formData, savedQuestion.id, currentUser.id);

  await logAuditEvent({
    userId: currentUser.id,
    action: id ? "questions.update" : "questions.create",
    entityType: "questions",
    entityId: savedQuestion.id,
    payload: {
      subject_id: payload.subject_id,
      category_id: payload.category_id || null,
      type: payload.type,
      difficulty: payload.difficulty,
      status: payload.status,
      is_active: payload.is_active,
    },
  });

  const saveAndAddAnother = formBoolean(formData, "save_and_add_another");
  const redirectTarget = saveAndAddAnother
    ? `/dashboard/question-bank/questions?action=create&subject_id=${payload.subject_id}${payload.category_id ? `&category_id=${payload.category_id}` : ""}`
    : "/dashboard/question-bank/questions";

  revalidatePath("/dashboard/question-bank/questions");
  redirectTo(redirectTarget, {
    ok: true,
    message: saveAndAddAnother
      ? "Soal berhasil disimpan. Silakan lanjutkan menulis soal berikutnya."
      : "Soal berhasil disimpan.",
  });
}

export async function updateQuestionStatusAction(formData: FormData) {
  const status = formString(formData, "status");
  let user: CurrentUser;

  if (status === "published") {
    user = await requirePermission("questions.publish");
  } else if (status === "archived") {
    user = await requirePermission("questions.archive");
  } else {
    user = await requirePermission("questions.update");
  }

  const parsed = questionStatusSchema.safeParse({
    id: formString(formData, "id"),
    status,
  });

  if (!parsed.success) {
    redirectTo("/dashboard/question-bank/questions", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Status soal tidak valid.",
    });
  }

  await assertQuestionInScope(user, parsed.data.id);

  if (parsed.data.status === "published") {
    await assertQuestionPublishable(user, parsed.data.id);
  }

  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const { error } = await dbClient
    .from("questions")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (!error) {
    await logAuditEvent({
      userId: user.id,
      action: "questions.status_update",
      entityType: "questions",
      entityId: parsed.data.id,
      payload: { status: parsed.data.status },
    });
  }

  revalidatePath("/dashboard/question-bank/questions");
  redirectTo("/dashboard/question-bank/questions", {
    ok: !error,
    message: error ? error.message : "Status soal berhasil diperbarui.",
  });
}

export async function bulkQuestionAction(formData: FormData) {
  const action = formString(formData, "bulk_action");
  const ids = formData
    .getAll("question_ids")
    .map((id) => String(id))
    .filter(Boolean);

  if (ids.length === 0) {
    redirectTo(QUESTION_PATH, {
      ok: false,
      message: "Pilih minimal satu soal.",
    });
  }

  let user: CurrentUser;

  if (action === "publish") {
    user = await requirePermission("questions.publish");
  } else if (action === "archive" || action === "delete") {
    user = await requirePermission("questions.archive");
  } else if (action === "unpublish") {
    user = await requirePermission("questions.update");
  } else {
    redirectTo(QUESTION_PATH, {
      ok: false,
      message: "Aksi massal tidak valid.",
    });
  }

  for (const id of ids) {
    await assertQuestionInScope(user, id);

    if (action === "publish") {
      await assertQuestionPublishable(user, id);
    }
  }

  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const payload =
    action === "publish"
      ? { status: "published" }
      : action === "unpublish"
        ? { status: "draft" }
        : action === "archive"
          ? { status: "archived" }
          : { deleted_at: new Date().toISOString(), is_active: false };
  const { error } = await dbClient.from("questions").update(payload).in("id", ids);

  if (!error) {
    await logAuditEvent({
      userId: user.id,
      action: `questions.bulk_${action}`,
      entityType: "questions",
      payload: {
        question_ids: ids,
        count: ids.length,
      },
    });
  }

  revalidatePath(QUESTION_PATH);
  redirectTo(QUESTION_PATH, {
    ok: !error,
    message: error
      ? error.message
      : `${ids.length} soal berhasil diproses.`,
  });
}

export async function publishAllQuestionsAction() {
  const user = await requirePermission("questions.publish");
  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;

  let query = dbClient
    .from("questions")
    .select(
      "id, school_id, subject_id, category_id, stimulus_id, type, difficulty, content, explanation, point, is_active, question_categories(subject_id), question_options(id, option_label, option_text, is_correct, order_number)",
    )
    .eq("status", "draft")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (!bypassesSubjectScope(user)) {
    const subjectIds = await getTeacherSubjectIds(user.id);

    if (subjectIds.length === 0) {
      redirectTo(QUESTION_PATH, {
        ok: false,
      message: "Tidak ada mapel yang dapat diterbitkan untuk akun ini.",
      });
    }

    query = query.in("subject_id", subjectIds);
  }

  const { data, error } = await query;

  if (error) {
    redirectTo(QUESTION_PATH, {
      ok: false,
      message: error.message,
    });
  }

  const questions = (data ?? []) as PublishableQuestion[];

  if (questions.length === 0) {
    redirectTo(QUESTION_PATH, {
      ok: true,
      message: "Tidak ada soal belum diterbitkan yang perlu diterbitkan.",
    });
  }

  const publishableIds: string[] = [];
  const skipped: string[] = [];

  for (const question of questions) {
    const issue = getQuestionPublishIssue(question);

    if (issue) {
      skipped.push(`${question.id}: ${issue}`);
      continue;
    }

    publishableIds.push(question.id);
  }

  let updateError: { message: string } | null = null;

  if (publishableIds.length > 0) {
    const { error: statusError } = await dbClient
      .from("questions")
      .update({ status: "published" })
      .in("id", publishableIds);

    updateError = statusError;
  }

  await logAuditEvent({
    userId: user.id,
    action: "questions.publish_all",
    entityType: "questions",
    payload: {
      total_draft: questions.length,
      published_count: updateError ? 0 : publishableIds.length,
      skipped_count: skipped.length,
      sample_skipped: skipped.slice(0, 5),
    },
  });

  revalidatePath(QUESTION_PATH);

  if (updateError) {
    redirectTo(QUESTION_PATH, {
      ok: false,
      message: updateError.message,
    });
  }

  const skippedMessage =
    skipped.length > 0
      ? ` ${skipped.length} soal dilewati karena belum valid atau nonaktif.`
      : "";

  redirectTo(QUESTION_PATH, {
    ok: publishableIds.length > 0,
    message:
      publishableIds.length > 0
        ? `Terbitkan massal selesai: ${publishableIds.length} soal berhasil diterbitkan.${skippedMessage}`
        : `Tidak ada soal yang bisa diterbitkan. ${skipped.length} soal belum diterbitkan belum valid atau nonaktif.`,
  });
}

export async function toggleQuestionActiveAction(formData: FormData) {
  const user = await requirePermission("questions.update");
  const parsed = questionActiveSchema.safeParse({
    id: formString(formData, "id"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/question-bank/questions", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Status aktif tidak valid.",
    });
  }

  await assertQuestionInScope(user, parsed.data.id);

  const supabase = await createClient();
  const { error } = await supabase
    .from("questions")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.id);

  if (!error) {
    await logAuditEvent({
      userId: user.id,
      action: "questions.active_update",
      entityType: "questions",
      entityId: parsed.data.id,
      payload: { is_active: parsed.data.is_active },
    });
  }

  revalidatePath("/dashboard/question-bank/questions");
  redirectTo("/dashboard/question-bank/questions", {
    ok: !error,
    message: error ? error.message : "Status aktif soal berhasil diperbarui.",
  });
}

export async function importQuestionsCsvAction(formData: FormData) {
  const user = await requireAuth();
  await requirePermission("question_bank.manage");
  await requirePermission("questions.create");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirectTo("/dashboard/question-bank/questions", {
      ok: false,
      message: "File CSV bank soal wajib diunggah.",
    });
  }

  const rows = parseCsv(await file.text());

  if (rows.length === 0) {
    redirectTo("/dashboard/question-bank/questions", {
      ok: false,
      message: "CSV kosong atau header tidak valid.",
    });
  }

  const subjectMap = await getImportSubjectMap(user.id, user.roles?.name);

  if (subjectMap.size === 0) {
    redirectTo("/dashboard/question-bank/questions", {
      ok: false,
      message: "Tidak ada mapel yang dapat digunakan untuk import.",
    });
  }

  const supabase = await createClient();
  let success = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const subjectCode = String(row.subject_code ?? "").trim().toUpperCase();
    const subject = subjectMap.get(subjectCode);

    if (!subject) {
      errors.push(`Baris ${rowNumber}: subject_code tidak ditemukan atau di luar scope`);
      continue;
    }

    const type = row.type === "essay" ? "essay" : "multiple_choice";
    const categoryId = await getOrCreateImportCategory({
      schoolId: subject.school_id,
      subjectId: subject.id,
      name: row.category_name ?? "",
      userId: user.id,
    });
    const parsed = questionSchema.safeParse({
      school_id: subject.school_id,
      subject_id: subject.id,
      category_id: categoryId ?? "",
      type,
      difficulty: row.difficulty || "medium",
      content: row.content ?? "",
      explanation: row.explanation ?? "",
      point: row.point || "1",
      status: row.status === "published" ? "published" : "draft",
      is_active: true,
      options: type === "multiple_choice" ? getImportQuestionOptions(row) : [],
    });

    if (!parsed.success) {
      errors.push(
        `Baris ${rowNumber}: ${
          parsed.error.issues[0]?.message ?? "data soal tidak valid"
        }`,
      );
      continue;
    }

    const { options, ...payload } = parsed.data;
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({
        ...payload,
        category_id: payload.category_id || null,
        explanation: payload.explanation || null,
        current_version: 1,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (questionError || !question?.id) {
      errors.push(
        `Baris ${rowNumber}: ${questionError?.message ?? "gagal menyimpan soal"}`,
      );
      continue;
    }

    if (parsed.data.type === "multiple_choice") {
      const filledOptions = options
        .filter((option) => option.option_text.trim())
        .map((option) => ({
          question_id: question.id,
          option_label: option.option_label,
          option_text: option.option_text,
          is_correct: option.is_correct,
          order_number: option.order_number,
        }));
      const { error: optionError } = await supabase
        .from("question_options")
        .insert(filledOptions);

      if (optionError) {
        errors.push(`Baris ${rowNumber}: ${optionError.message}`);
        continue;
      }
    }

    success += 1;
  }

  await logAuditEvent({
    userId: user.id,
    action: "questions.import_csv",
    entityType: "questions",
    payload: {
      total_rows: rows.length,
      success_count: success,
      error_count: errors.length,
      sample_errors: errors.slice(0, 3),
    },
  });

  revalidatePath("/dashboard/question-bank/questions");
  redirectTo("/dashboard/question-bank/questions", {
    ok: errors.length === 0,
    message:
      errors.length > 0
        ? `Import selesai: ${success} berhasil, ${errors.length} gagal. ${errors
            .slice(0, 3)
            .join("; ")}`
        : `Import berhasil: ${success} soal ditambahkan.`,
  });
}

export async function deleteQuestionAction(formData: FormData) {
  const user = await requirePermission("questions.delete");
  const id = formString(formData, "id");

  if (!id) {
    redirectTo(QUESTION_PATH, { ok: false, message: "ID soal tidak valid." });
  }

  await assertQuestionInScope(user, id);
  const supabase = await createClient();
  const dbClient = getServiceRoleClient() ?? supabase;
  const { error } = await dbClient
    .from("questions")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: user.id,
      action: "questions.delete",
      entityType: "questions",
      entityId: id,
    });
  }

  revalidatePath(QUESTION_PATH);
  redirectTo(QUESTION_PATH, {
    ok: !error,
    message: error ? error.message : "Soal berhasil dihapus.",
  });
}

