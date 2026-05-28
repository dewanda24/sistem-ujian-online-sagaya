"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/require-auth";
import { requirePermission } from "@/lib/auth/require-permission";
import { createClient } from "@/lib/supabase/server";
import {
  questionActiveSchema,
  questionCategorySchema,
  questionSchema,
  questionStatusSchema,
} from "@/lib/validations/question-bank";

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

function redirectTo(path: string, result: ActionResult): never {
  const params = new URLSearchParams({
    notice: result.ok ? "success" : "error",
    message: result.message,
  });

  redirect(`${path}?${params.toString()}`);
}

function getQuestionOptions(formData: FormData) {
  const labels = ["A", "B", "C", "D"];
  const correctLabel = formString(formData, "correct_option");

  return labels.map((label, index) => ({
    option_label: label,
    option_text: formString(formData, `option_${label}`),
    is_correct: correctLabel === label,
    order_number: index + 1,
  }));
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

  const supabase = await createClient();
  const { id, ...payload } = parsed.data;
  const { error } = id
    ? await supabase
        .from("question_categories")
        .update(payload)
        .eq("id", id)
    : await supabase
        .from("question_categories")
        .insert({ ...payload, created_by: user.id });

  revalidatePath("/dashboard/question-bank/categories");
  redirectTo("/dashboard/question-bank/categories", {
    ok: !error,
    message: error ? error.message : "Kategori soal berhasil disimpan.",
  });
}

export async function toggleQuestionCategoryAction(formData: FormData) {
  await requirePermission("question_categories.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("question_categories")
    .update({ is_active: formBoolean(formData, "is_active") })
    .eq("id", formString(formData, "id"));

  revalidatePath("/dashboard/question-bank/categories");
  redirectTo("/dashboard/question-bank/categories", {
    ok: !error,
    message: error ? error.message : "Status kategori soal diperbarui.",
  });
}

export async function deleteQuestionCategoryAction(formData: FormData) {
  await requirePermission("question_categories.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("question_categories")
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("id", formString(formData, "id"));

  revalidatePath("/dashboard/question-bank/categories");
  redirectTo("/dashboard/question-bank/categories", {
    ok: !error,
    message: error ? error.message : "Kategori soal berhasil diarsipkan.",
  });
}

export async function saveQuestionAction(formData: FormData) {
  const currentUser = await requireAuth();
  const questionId = formString(formData, "id");

  if (questionId) {
    await requirePermission("questions.update");
  } else {
    await requirePermission("questions.create");
  }

  const type = formString(formData, "type");
  const parsed = questionSchema.safeParse({
    id: questionId,
    school_id: formString(formData, "school_id"),
    subject_id: formString(formData, "subject_id"),
    category_id: formString(formData, "category_id"),
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

  const supabase = await createClient();
  const { id, options, ...payload } = parsed.data;

  const questionPayload = {
    ...payload,
    category_id: payload.category_id || null,
    explanation: payload.explanation || null,
    current_version: 1,
  };

  const { data: savedQuestion, error: questionError } = id
    ? await supabase
        .from("questions")
        .update(questionPayload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
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

  await supabase
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

    const { error: optionError } = await supabase
      .from("question_options")
      .insert(filledOptions);

    if (optionError) {
      redirectTo("/dashboard/question-bank/questions", {
        ok: false,
        message: optionError.message,
      });
    }
  }

  revalidatePath("/dashboard/question-bank/questions");
  redirectTo("/dashboard/question-bank/questions", {
    ok: true,
    message: "Soal berhasil disimpan.",
  });
}

export async function updateQuestionStatusAction(formData: FormData) {
  const status = formString(formData, "status");

  if (status === "published") {
    await requirePermission("questions.publish");
  } else if (status === "archived") {
    await requirePermission("questions.archive");
  } else {
    await requirePermission("questions.update");
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

  const supabase = await createClient();
  const { error } = await supabase
    .from("questions")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  revalidatePath("/dashboard/question-bank/questions");
  redirectTo("/dashboard/question-bank/questions", {
    ok: !error,
    message: error ? error.message : "Status soal berhasil diperbarui.",
  });
}

export async function toggleQuestionActiveAction(formData: FormData) {
  await requirePermission("questions.update");
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

  const supabase = await createClient();
  const { error } = await supabase
    .from("questions")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.id);

  revalidatePath("/dashboard/question-bank/questions");
  redirectTo("/dashboard/question-bank/questions", {
    ok: !error,
    message: error ? error.message : "Status aktif soal berhasil diperbarui.",
  });
}
