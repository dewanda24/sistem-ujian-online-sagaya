import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import type { SelectOption } from "@/lib/master-data/queries";

export type QuestionFilters = {
  q?: string;
  subject_id?: string;
  category_id?: string;
  type?: string;
  difficulty?: string;
  status?: string;
};

export type StimulusFilters = {
  q?: string;
  subject_id?: string;
};

export async function getDefaultSchoolId() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("schools")
    .select("id")
    .eq("is_active", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    return data.id as string;
  }

  const fallback = await supabase
    .from("schools")
    .select("id")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  return fallback.data?.id ?? null;
}

export async function getScopedSubjectOptions(): Promise<SelectOption[]> {
  const user = await requireAuth();
  const supabase = await createClient();

  if (user.roles?.name === "teacher") {
    const { data, error } = await supabase
      .from("teacher_subjects")
      .select("subject_id, subjects(id, code, name)")
      .eq("teacher_id", user.id);

    if (error || !data) {
      return [];
    }

    const unique = new Map<string, SelectOption>();

    data.forEach((assignment) => {
      const subject = Array.isArray(assignment.subjects)
        ? assignment.subjects[0]
        : assignment.subjects;

      if (subject?.id) {
        unique.set(subject.id, {
          value: subject.id,
          label: `${subject.code} - ${subject.name}`,
        });
      }
    });

    return Array.from(unique.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }

  const { data, error } = await supabase
    .from("subjects")
    .select("id, code, name")
    .eq("is_active", true)
    .order("name");

  if (error || !data) {
    return [];
  }

  return data.map((subject) => ({
    value: subject.id,
    label: `${subject.code} - ${subject.name}`,
  }));
}

async function getScopedSubjectIds() {
  const subjects = await getScopedSubjectOptions();

  return subjects.map((subject) => subject.value);
}

export async function getQuestionCategories(filters: {
  q?: string;
  subject_id?: string;
}) {
  const supabase = await createClient();
  const subjectIds = await getScopedSubjectIds();

  if (subjectIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("question_categories")
    .select("*, subjects(id, code, name), schools(name), users(username)")
    .is("deleted_at", null)
    .in("subject_id", subjectIds)
    .order("name");

  if (filters.subject_id) {
    query = query.eq("subject_id", filters.subject_id);
  }

  if (filters.q) {
    query = query.ilike("name", `%${filters.q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getQuestionCategoryOptions(subjectId?: string) {
  const categories = await getQuestionCategories({
    subject_id: subjectId,
  });

  return categories
    .filter((category) => category.is_active)
    .map((category) => ({
      value: category.id,
      label: category.name,
      subject_id: category.subject_id,
    }));
}

export async function getQuestionStimulusOptions(subjectId?: string) {
  const supabase = await createClient();
  const subjectIds = await getScopedSubjectIds();

  if (subjectIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("question_stimuli")
    .select("id, title, content, media_url, media_type, subject_id")
    .is("deleted_at", null)
    .eq("is_active", true)
    .in("subject_id", subjectIds)
    .order("title");

  if (subjectId) {
    query = query.eq("subject_id", subjectId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((stimulus) => ({
    value: stimulus.id,
    label: stimulus.title,
    content: stimulus.content,
    media_url: stimulus.media_url,
    media_type: stimulus.media_type,
    subject_id: stimulus.subject_id,
  }));
}

export async function getQuestionStimuli(filters: StimulusFilters) {
  const supabase = await createClient();
  const subjectIds = await getScopedSubjectIds();

  if (subjectIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("question_stimuli")
    .select("*, subjects(id, code, name), schools(name), users(username)")
    .is("deleted_at", null)
    .in("subject_id", subjectIds)
    .order("created_at", { ascending: false });

  if (filters.subject_id) {
    query = query.eq("subject_id", filters.subject_id);
  }

  if (filters.q) {
    query = query.or(`title.ilike.%${filters.q}%,content.ilike.%${filters.q}%`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  const stimulusIds = data.map((stimulus) => stimulus.id as string);

  if (stimulusIds.length === 0) {
    return data.map((stimulus) => ({ ...stimulus, question_count: 0 }));
  }

  const { data: questionRows } = await supabase
    .from("questions")
    .select("stimulus_id")
    .in("stimulus_id", stimulusIds)
    .is("deleted_at", null);
  const countMap = new Map<string, number>();

  for (const row of questionRows ?? []) {
    const stimulusId = row.stimulus_id as string | null;

    if (stimulusId) {
      countMap.set(stimulusId, (countMap.get(stimulusId) ?? 0) + 1);
    }
  }

  return data.map((stimulus) => ({
    ...stimulus,
    question_count: countMap.get(stimulus.id as string) ?? 0,
  }));
}

export async function getQuestions(filters: QuestionFilters) {
  const supabase = await createClient();
  const subjectIds = await getScopedSubjectIds();

  if (subjectIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("questions")
    .select(
      "*, subjects(id, code, name), question_categories(id, name), question_stimuli(id, title, content, media_url, media_type), users(username), question_options(id, option_label, option_text, is_correct, order_number), question_attachments(id, media_type, url, file_name, caption, order_number)",
    )
    .is("deleted_at", null)
    .in("subject_id", subjectIds)
    .order("created_at", { ascending: false });

  if (filters.subject_id) {
    query = query.eq("subject_id", filters.subject_id);
  }

  if (filters.category_id) {
    query = query.eq("category_id", filters.category_id);
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.difficulty) {
    query = query.eq("difficulty", filters.difficulty);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.q) {
    query = query.ilike("content", `%${filters.q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  const questions = data ?? [];
  const stimulusIds = [
    ...new Set(
      questions
        .map((question) => question.stimulus_id as string | null)
        .filter((stimulusId): stimulusId is string => Boolean(stimulusId)),
    ),
  ];

  if (stimulusIds.length === 0) {
    return questions;
  }

  const { data: questionRows } = await supabase
    .from("questions")
    .select("stimulus_id")
    .in("stimulus_id", stimulusIds)
    .is("deleted_at", null);
  const countMap = new Map<string, number>();

  for (const row of questionRows ?? []) {
    const stimulusId = row.stimulus_id as string | null;

    if (stimulusId) {
      countMap.set(stimulusId, (countMap.get(stimulusId) ?? 0) + 1);
    }
  }

  return questions.map((question) => ({
    ...question,
    stimulus_question_count: question.stimulus_id
      ? (countMap.get(question.stimulus_id as string) ?? 0)
      : 0,
  }));
}

export async function getQuestionById(id: string) {
  const questions = await getQuestions({});

  return questions.find((question) => question.id === id) ?? null;
}
