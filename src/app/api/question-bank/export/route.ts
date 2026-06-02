import { NextResponse } from "next/server";

import { getQuestions, type QuestionFilters } from "@/features/question-bank/queries";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { hasPermission } from "@/lib/auth/has-permission";
import { requireAuth } from "@/lib/auth/require-auth";

type QuestionOption = {
  option_label?: string | null;
  option_text?: string | null;
  is_correct?: boolean | null;
};

const headers = [
  "subject_code",
  "subject_name",
  "category",
  "type",
  "difficulty",
  "content",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_answer",
  "explanation",
  "point",
  "status",
  "is_active",
  "stimulus_title",
  "created_at",
] as const;

export async function GET(request: Request) {
  const user = await requireAuth();

  if (!hasPermission(user, "question_bank.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters: QuestionFilters = {
    q: url.searchParams.get("q") ?? undefined,
    subject_id: url.searchParams.get("subject_id") ?? undefined,
    category_id: url.searchParams.get("category_id") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    difficulty: url.searchParams.get("difficulty") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  };
  const questions = await getQuestions(filters);
  const csv = toCsv(
    questions.map((question) => {
      const options = optionMap(question.question_options as QuestionOption[] | null);

      return {
        subject_code: question.subjects?.code ?? "",
        subject_name: question.subjects?.name ?? "",
        category: question.question_categories?.name ?? "",
        type: question.type ?? "",
        difficulty: question.difficulty ?? "",
        content: question.content ?? "",
        option_a: options.A?.option_text ?? "",
        option_b: options.B?.option_text ?? "",
        option_c: options.C?.option_text ?? "",
        option_d: options.D?.option_text ?? "",
        correct_answer: correctAnswer(options),
        explanation: question.explanation ?? "",
        point: String(question.point ?? ""),
        status: question.status ?? "",
        is_active: question.is_active ? "true" : "false",
        stimulus_title: question.question_stimuli?.title ?? "",
        created_at: question.created_at ?? "",
      };
    }),
  );

  await logAuditEvent({
    userId: user.id,
    action: "questions.export_csv",
    entityType: "questions",
    payload: {
      filters,
      row_count: questions.length,
    },
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bank-soal.csv"',
    },
  });
}

function optionMap(options: QuestionOption[] | null | undefined) {
  return (options ?? []).reduce<Record<string, QuestionOption>>((map, option) => {
    if (option.option_label) {
      map[option.option_label.toUpperCase()] = option;
    }

    return map;
  }, {});
}

function correctAnswer(options: Record<string, QuestionOption>) {
  return Object.entries(options).find(([, option]) => option.is_correct)?.[0] ?? "";
}

function toCsv(rows: Array<Record<(typeof headers)[number], string>>) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;

  return [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header] ?? "")).join(",")),
  ].join("\n");
}
