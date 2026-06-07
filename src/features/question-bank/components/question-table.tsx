"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Archive, Eye, Pencil, Send, Trash2, Undo2 } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { bulkQuestionAction, updateQuestionStatusAction } from "@/features/question-bank/actions";
import { QuestionMathRenderer } from "@/features/question-bank/components/question-math-renderer";
import { QuestionStatusBadge } from "@/features/question-bank/components/question-status-badge";
import { cn } from "@/lib/utils";

type QuestionRow = {
  id: string;
  content: string | null;
  type: string | null;
  status: string | null;
  is_active: boolean | null;
  subjects?: {
    code?: string | null;
    name?: string | null;
  } | null;
  question_categories?: {
    name?: string | null;
  } | null;
  question_options?: Array<{
    option_label: string;
    option_text: string;
    is_correct: boolean;
    order_number: number;
  }> | null;
};

type QuestionTableProps = {
  questions: QuestionRow[];
};

const bulkActions = [
  {
    value: "publish",
    label: "Publish",
    icon: Send,
    message:
      "Publish semua soal yang dipilih? Soal harus aktif dan memenuhi syarat publish.",
    variant: "default" as const,
  },
  {
    value: "unpublish",
    label: "Unpublish",
    icon: Undo2,
    message: "Ubah semua soal yang dipilih menjadi draft?",
    variant: "outline" as const,
  },
  {
    value: "archive",
    label: "Arsipkan",
    icon: Archive,
    message: "Arsipkan semua soal yang dipilih?",
    variant: "outline" as const,
  },
  {
    value: "delete",
    label: "Hapus",
    icon: Trash2,
    message:
      "Hapus soal yang dipilih dari daftar aktif? Data akan ditandai terhapus dan dinonaktifkan.",
    variant: "danger" as const,
  },
];

export function QuestionTable({ questions }: QuestionTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = questions.length > 0 && selectedIds.length === questions.length;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : questions.map((question) => question.id));
  }

  function toggleOne(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <EmptyState
          title="Belum ada soal"
          description="Tambahkan soal pilihan ganda atau essay untuk mapel yang tersedia."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {selectedIds.length > 0 ? (
        <div className="sticky top-3 z-20 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm font-medium text-[#0F172A]">
              {selectedIds.length} soal dipilih
            </div>
            <div className="flex flex-wrap gap-2">
              {bulkActions.map((action) => {
                const Icon = action.icon;

                return (
                  <form key={action.value} action={bulkQuestionAction}>
                    <input type="hidden" name="bulk_action" value={action.value} />
                    {selectedIds.map((id) => (
                      <input key={id} type="hidden" name="question_ids" value={id} />
                    ))}
                    <ConfirmSubmitButton
                      confirmMessage={action.message}
                      confirmationText={action.value === "delete" ? "HAPUS" : undefined}
                      variant={action.variant}
                      className="rounded-xl"
                    >
                      <Icon className="size-3.5" />
                      {action.label}
                    </ConfirmSubmitButton>
                  </form>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-[#E2E8F0] text-xs uppercase text-[#64748B]">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select All"
                />
              </th>
              <th className="px-4 py-3 font-medium">Soal</th>
              <th className="w-44 px-4 py-3 font-medium">Mapel</th>
              <th className="w-28 px-4 py-3 font-medium">Tipe</th>
              <th className="w-32 px-4 py-3 font-medium">Status</th>
              <th className="w-52 px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {questions.map((question) => (
              <tr
                key={question.id}
                className={cn(
                  "align-top transition hover:bg-[#F8FAFC]",
                  selectedSet.has(question.id) && "bg-blue-50/60",
                )}
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(question.id)}
                    onChange={() => toggleOne(question.id)}
                    aria-label={`Pilih soal ${question.id}`}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="line-clamp-2 font-medium text-[#0F172A]">
                    {question.content || "-"}
                  </div>
                  <div className="mt-1 text-xs text-[#64748B]">
                    {question.question_categories?.name ?? "Tanpa kategori"}
                  </div>
                  {expandedId === question.id ? (
                    <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                      <QuestionMathRenderer content={question.content} />
                      {question.type === "multiple_choice" ? (
                        <div className="mt-3 grid gap-2">
                          {(question.question_options ?? [])
                            .sort((a, b) => a.order_number - b.order_number)
                            .map((option) => (
                              <div
                                key={option.option_label}
                                className="flex gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2"
                              >
                                <span className="font-semibold">
                                  {option.option_label}.
                                </span>
                                <span className="flex-1">{option.option_text}</span>
                                {option.is_correct ? (
                                  <span className="text-xs font-medium text-[#22C55E]">
                                    Benar
                                  </span>
                                ) : null}
                              </div>
                            ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-4 text-[#0F172A]">
                  {question.subjects
                    ? `${question.subjects.code} - ${question.subjects.name}`
                    : "-"}
                </td>
                <td className="px-4 py-4">
                  {question.type === "multiple_choice" ? "PG" : "Essay"}
                </td>
                <td className="px-4 py-4">
                  <QuestionStatusBadge status={question.status ?? "draft"} />
                  {!question.is_active ? (
                    <div className="mt-2 text-xs text-[#EF4444]">Nonaktif</div>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((current) =>
                          current === question.id ? null : question.id,
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-xs hover:bg-[#F8FAFC]"
                    >
                      <Eye className="size-3.5" />
                      Detail
                    </button>
                    <Link
                      href={`/dashboard/question-bank/questions/create?edit=${question.id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-xs hover:bg-[#F8FAFC]"
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Link>
                    <form action={updateQuestionStatusAction}>
                      <input type="hidden" name="id" value={question.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={
                          question.status === "published" ? "draft" : "published"
                        }
                      />
                      <ConfirmSubmitButton
                        confirmMessage={
                          question.status === "published"
                            ? "Ubah soal ini menjadi draft?"
                            : "Publish soal ini?"
                        }
                        variant="outline"
                        className="rounded-xl"
                      >
                        {question.status === "published" ? "Draft" : "Publish"}
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        <label className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white p-3 text-sm shadow-sm">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Select All
        </label>
        {questions.map((question) => (
          <article
            key={question.id}
            className={cn(
              "rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm",
              selectedSet.has(question.id) && "bg-blue-50/60",
            )}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedSet.has(question.id)}
                onChange={() => toggleOne(question.id)}
                className="mt-1"
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[#0F172A]">
                  {question.content || "-"}
                </div>
                <div className="mt-2 grid gap-1 text-xs text-[#64748B]">
                  <span>
                    {question.subjects
                      ? `${question.subjects.code} - ${question.subjects.name}`
                      : "-"}
                  </span>
                  <span>{question.type === "multiple_choice" ? "PG" : "Essay"}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <QuestionStatusBadge status={question.status ?? "draft"} />
                  {!question.is_active ? (
                    <span className="text-xs text-[#EF4444]">Nonaktif</span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/question-bank/questions/create?edit=${question.id}`}
                    className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-xs"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId((current) =>
                        current === question.id ? null : question.id,
                      )
                    }
                    className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-xs"
                  >
                    Detail
                  </button>
                </div>
              </div>
            </div>
            {expandedId === question.id ? (
              <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm">
                <QuestionMathRenderer content={question.content} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
