"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import {
  previewWordImportAction,
  saveWordImportAction,
  type WordImportPreviewState,
} from "@/features/question-bank/word-import-actions";
import { QuestionMathRenderer } from "@/features/question-bank/components/question-math-renderer";
import {
  validateWordImportQuestion,
  type WordImportQuestion,
} from "@/features/question-bank/word-import";
import type { SelectOption } from "@/lib/master-data/queries";

type CategoryOption = SelectOption & {
  subject_id?: string;
};

type WordImportFormProps = {
  subjects: SelectOption[];
  categories: CategoryOption[];
  notice?: string;
  message?: string;
};

const initialState: WordImportPreviewState = {
  ok: false,
  message: "",
  questions: [],
  meta: {
    subject_id: "",
    category_id: "",
    difficulty: "medium",
  },
};

const optionLabels = ["A", "B", "C", "D"] as const;

export function WordImportForm({
  subjects,
  categories,
  notice,
  message,
}: WordImportFormProps) {
  const [previewState, previewAction, isPreviewPending] = useActionState(
    previewWordImportAction,
    initialState,
  );
  const [subjectId, setSubjectId] = useState(subjects[0]?.value ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState<WordImportQuestion[]>([]);
  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (category) => !category.subject_id || category.subject_id === subjectId,
      ),
    [categories, subjectId],
  );
  const validatedQuestions = questions.map((question, index) => {
    const validation = validateWordImportQuestion({
      local_id: question.local_id,
      number: question.number || index + 1,
      type: question.type,
      content: question.content,
      options: question.options,
      correct_option: question.correct_option,
      explanation: question.explanation,
    });

    return {
      ...question,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  });
  const validCount = validatedQuestions.filter(
    (question) => question.errors.length === 0,
  ).length;
  const errorCount = validatedQuestions.length - validCount;
  const validQuestions = validatedQuestions.filter(
    (question) => question.errors.length === 0,
  );

  useEffect(() => {
    if (previewState.questions.length > 0) {
      const timer = window.setTimeout(() => {
        setQuestions(previewState.questions);
        setSubjectId(previewState.meta.subject_id);
        setCategoryId(previewState.meta.category_id);
        setDifficulty(previewState.meta.difficulty);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [previewState]);

  function updateQuestion(index: number, patch: Partial<WordImportQuestion>) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    );
  }

  function updateOption(
    index: number,
    label: "A" | "B" | "C" | "D",
    value: string,
  ) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index
          ? {
              ...question,
              options: {
                ...question.options,
                [label]: value,
              },
            }
          : question,
      ),
    );
  }

  return (
    <div className="space-y-6">
      {notice && message ? (
        <div
          className={
            notice === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          }
        >
          {message}
        </div>
      ) : null}

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Upload Template Word</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Gunakan template resmi agar hasil parsing rapi. Hasil import selalu
            disimpan sebagai draft.
          </p>
        </div>
        <form action={previewAction} className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Mapel</span>
            <select
              name="subject_id"
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value);
                setCategoryId("");
              }}
              className="rounded-md border px-3 py-2 text-sm"
              required
            >
              <option value="">Pilih mapel</option>
              {subjects.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Kategori</span>
            <select
              name="category_id"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Tanpa kategori</option>
              {filteredCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Difficulty default</span>
            <select
              name="difficulty"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">File Word (.docx)</span>
            <input
              name="file"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
          </label>
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <Link
              href="/api/templates/questions-word"
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              Download Template Word
            </Link>
            <button
              disabled={isPreviewPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPreviewPending ? "Memproses..." : "Preview Import"}
            </button>
          </div>
        </form>
        {previewState.message ? (
          <div
            className={
              previewState.ok
                ? "mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                : "mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            }
          >
            {previewState.message}
          </div>
        ) : null}
      </section>

      {validatedQuestions.length > 0 ? (
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-base font-semibold">Preview Hasil Parsing</h2>
              <p className="mt-1 text-sm text-muted-foreground">
              Edit hasil parsing sebelum disimpan. Hanya soal valid yang akan
              dikirim ke proses simpan.
              </p>
            </div>
            <div className="grid gap-1 text-sm md:text-right">
              <span className="font-medium">{validCount} valid</span>
              <span className="text-muted-foreground">{errorCount} error</span>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <DownloadJsonButton
              filename="bank-soal-word-error-log.json"
              label="Download Error Log"
              payload={validatedQuestions
                .filter((question) => question.errors.length > 0)
                .map((question, index) => ({
                  row_number: question.number || index + 1,
                  errors: question.errors,
                }))}
              disabled={errorCount === 0}
            />
            <DownloadJsonButton
              filename="bank-soal-word-preview-result.json"
              label="Download Result"
              payload={{
                total_rows: validatedQuestions.length,
                valid_rows: validCount,
                error_rows: errorCount,
                questions: validatedQuestions,
              }}
            />
          </div>

          <div className="grid gap-4">
            {validatedQuestions.map((question, index) => (
              <article key={question.local_id} className="rounded-lg border p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">Nomor {index + 1}</span>
                    <span
                      className={
                        question.errors.length
                          ? "rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive"
                          : question.warnings.length
                            ? "rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700"
                            : "rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700"
                      }
                    >
                      {question.errors.length
                        ? "Error"
                        : question.warnings.length
                          ? "Warning"
                          : "Valid"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions((current) =>
                        current.filter((_, questionIndex) => questionIndex !== index),
                      )
                    }
                    className="rounded-md border px-3 py-1.5 text-xs text-destructive hover:bg-muted"
                  >
                    Hapus
                  </button>
                </div>

                <div className="grid gap-3">
                  <label className="grid gap-1 text-sm md:max-w-xs">
                    <span className="font-medium">Tipe soal</span>
                    <select
                      value={question.type}
                      onChange={(event) =>
                        updateQuestion(index, {
                          type: event.target.value === "essay"
                            ? "essay"
                            : "multiple_choice",
                        })
                      }
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="multiple_choice">Pilihan ganda</option>
                      <option value="essay">Essay</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Pertanyaan</span>
                    <textarea
                      value={question.content}
                      onChange={(event) =>
                        updateQuestion(index, { content: event.target.value })
                      }
                      className="min-h-24 rounded-md border px-3 py-2 text-sm"
                    />
                  </label>

                  {question.type === "multiple_choice" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {optionLabels.map((label) => (
                        <label key={label} className="grid gap-1 text-sm">
                          <span className="font-medium">Pilihan {label}</span>
                          <textarea
                            value={question.options[label]}
                            onChange={(event) =>
                              updateOption(index, label, event.target.value)
                            }
                            className="min-h-16 rounded-md border px-3 py-2 text-sm"
                          />
                        </label>
                      ))}
                      <label className="grid gap-1 text-sm md:max-w-xs">
                        <span className="font-medium">Jawaban benar</span>
                        <select
                          value={question.correct_option}
                          onChange={(event) =>
                            updateQuestion(index, {
                              correct_option: event.target.value,
                            })
                          }
                          className="rounded-md border px-3 py-2 text-sm"
                        >
                          <option value="">Pilih jawaban</option>
                          {optionLabels.map((label) => (
                            <option key={label} value={label}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : null}

                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Pembahasan</span>
                    <textarea
                      value={question.explanation}
                      onChange={(event) =>
                        updateQuestion(index, { explanation: event.target.value })
                      }
                      className="min-h-20 rounded-md border px-3 py-2 text-sm"
                    />
                  </label>
                  {question.errors.length || question.warnings.length ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      {[...question.errors, ...question.warnings].map((item) => (
                        <div key={item}>{item}</div>
                      ))}
                    </div>
                  ) : null}
                  <details className="rounded-md border bg-background p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      Lihat preview soal
                    </summary>
                    <div className="mt-3 space-y-3 text-sm">
                      <QuestionMathRenderer content={question.content} />
                      {question.type === "multiple_choice" ? (
                        <div className="grid gap-2">
                          {optionLabels.map((label) => (
                            <div
                              key={label}
                              className="flex gap-2 rounded-md border px-3 py-2"
                            >
                              <span className="font-semibold">{label}.</span>
                              <QuestionMathRenderer
                                content={question.options[label] || `Pilihan ${label}`}
                              />
                              {question.correct_option === label ? (
                                <span className="ml-auto text-xs font-medium text-emerald-700">
                                  Benar
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-md bg-muted p-3 text-muted-foreground">
                          Soal essay
                        </div>
                      )}
                      <QuestionMathRenderer
                        content={question.explanation}
                        className="rounded-md bg-muted p-3 text-muted-foreground"
                      />
                    </div>
                  </details>
                </div>
              </article>
            ))}
          </div>

          <form action={saveWordImportAction} className="mt-5 flex justify-end">
            <input type="hidden" name="subject_id" value={subjectId} />
            <input type="hidden" name="category_id" value={categoryId} />
            <input type="hidden" name="difficulty" value={difficulty} />
            <input
              type="hidden"
              name="questions_json"
              value={JSON.stringify(validQuestions)}
            />
            <ConfirmSubmitButton
              disabled={validCount === 0}
              confirmMessage={`Simpan ${validCount} soal valid ke bank soal sebagai draft?`}
              confirmTitle="Konfirmasi Import"
              loadingText="Sedang import..."
              variant="default"
              className="px-4 py-2 text-sm"
            >
              Simpan {validCount} Soal Valid ke Bank Soal
            </ConfirmSubmitButton>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function DownloadJsonButton({
  filename,
  label,
  payload,
  disabled = false,
}: {
  filename: string;
  label: string;
  payload: unknown;
  disabled?: boolean;
}) {
  function download() {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={disabled}
      className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
