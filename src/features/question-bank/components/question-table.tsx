"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  TableActionButton,
  TableActionLink,
  TableActions,
  TableActionSubmit,
} from "@/components/dashboard/table-actions";
import { UI_LABELS } from "@/constants/ui-labels";
import {
  bulkQuestionAction,
  updateQuestionStatusAction,
} from "@/features/question-bank/actions";
import { QuestionMathRenderer } from "@/features/question-bank/components/question-math-renderer";
import { QuestionMediaPreview } from "@/features/question-bank/components/question-media-preview";
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
  question_attachments?: Array<{
    id: string;
    media_type: string;
    url: string;
    file_name?: string | null;
    caption?: string | null;
    order_number: number;
  }> | null;
};

type QuestionTableProps = {
  questions: QuestionRow[];
};

type Density = "compact" | "comfortable";

const bulkActions = [
  {
    value: "publish",
    label: UI_LABELS.actions.publish,
    icon: Send,
    message:
      "Terbitkan semua soal yang dipilih? Soal harus aktif dan memenuhi syarat.",
    variant: "default" as const,
  },
  {
    value: "unpublish",
    label: UI_LABELS.actions.unpublish,
    icon: Undo2,
    message: "Ubah semua soal yang dipilih menjadi belum diterbitkan?",
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
  const [previewQuestion, setPreviewQuestion] = useState<QuestionRow | null>(null);
  const [density, setDensity] = useState<Density>("compact");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const pageCount = Math.max(1, Math.ceil(questions.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pagedQuestions = questions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );
  const visibleIds = pagedQuestions.map((question) => question.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));
  const rowClassName =
    density === "compact" ? "h-14 max-h-14" : "h-16 max-h-16";
  const cellClassName = density === "compact" ? "px-3 py-2" : "px-3 py-3";

  function toggleVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }

      return Array.from(next);
    });
  }

  function toggleOne(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function changeRowsPerPage(value: string) {
    setRowsPerPage(Number(value));
    setPage(1);
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <EmptyState
          title="Belum ada soal"
          description="Tambahkan soal pilihan ganda atau essay untuk mapel yang tersedia."
          actionHref="/dashboard/question-bank/questions/create"
          actionLabel="Tambah Soal"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#64748B]">
          {questions.length} soal tersedia
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="inline-flex rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
            {(["compact", "comfortable"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDensity(item)}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-medium capitalize transition",
                  density === item
                    ? "bg-white text-[#2563EB] shadow-sm"
                    : "text-[#64748B] hover:text-[#0F172A]",
                )}
              >
                {item === "compact" ? "Ringkas" : "Nyaman"}
              </button>
            ))}
          </div>
          <select
            value={rowsPerPage}
            onChange={(event) => changeRowsPerPage(event.target.value)}
            className="h-8 rounded-xl border border-[#E2E8F0] bg-white px-2 text-xs"
          >
            <option value={10}>10 / halaman</option>
            <option value={15}>15 / halaman</option>
          </select>
        </div>
      </div>

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
            <tr className="h-10">
              <th className="w-11 px-3 py-2">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleVisible}
                  aria-label="Pilih semua"
                />
              </th>
              <th className="px-3 py-2 font-medium">Soal</th>
              <th className="w-40 px-3 py-2 font-medium">Mapel</th>
              <th className="w-24 px-3 py-2 font-medium">Tipe</th>
              <th className="w-28 px-3 py-2 font-medium">Status</th>
              <th className="w-28 px-3 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {pagedQuestions.map((question) => (
              <tr
                key={question.id}
                className={cn(
                  rowClassName,
                  "transition hover:bg-[#F8FAFC]",
                  selectedSet.has(question.id) && "bg-blue-50/60",
                )}
              >
                <td className={cellClassName}>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(question.id)}
                    onChange={() => toggleOne(question.id)}
                    aria-label={`Pilih soal ${question.id}`}
                  />
                </td>
                <td className={cn(cellClassName, "min-w-0")}>
                  <div className="line-clamp-1 font-medium leading-5 text-[#0F172A]">
                    {question.content || "-"}
                  </div>
                  <div className="mt-1 flex max-w-full flex-wrap gap-1 overflow-hidden">
                    {question.question_attachments && question.question_attachments.length > 0 ? (
                      <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
                        📸 Ada Foto
                      </span>
                    ) : null}
                    {question.question_categories?.name ? (
                      <span className="max-w-44 truncate rounded-md bg-[#F8FAFC] px-1.5 py-0.5 text-[11px] text-[#64748B] ring-1 ring-[#E2E8F0]">
                        {question.question_categories.name}
                      </span>
                    ) : null}
                    {!question.is_active ? (
                      <span className="rounded-md bg-[#EF4444]/10 px-1.5 py-0.5 text-[11px] text-[#EF4444]">
                        Nonaktif
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className={cn(cellClassName, "truncate text-[#0F172A]")}>
                  {question.subjects
                    ? `${question.subjects.code} - ${question.subjects.name}`
                    : "-"}
                </td>
                <td className={cellClassName}>
                  <span className="rounded-md bg-[#F8FAFC] px-2 py-1 text-xs text-[#64748B] ring-1 ring-[#E2E8F0]">
                    {question.type === "multiple_choice" ? "PG" : "Essay"}
                  </span>
                </td>
                <td className={cellClassName}>
                  <QuestionStatusBadge status={question.status ?? "draft"} />
                </td>
                <td className={cellClassName}>
                  <QuestionActions
                    question={question}
                    onPreview={() => setPreviewQuestion(question)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 md:hidden">
        <label className="flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm shadow-sm">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleVisible}
          />
          Pilih Semua
        </label>
        {pagedQuestions.map((question) => (
          <article
            key={question.id}
            className={cn(
              "max-h-[120px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm",
              selectedSet.has(question.id) && "bg-blue-50/60",
            )}
          >
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selectedSet.has(question.id)}
                onChange={() => toggleOne(question.id)}
                className="mt-1"
              />
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 text-sm font-medium leading-5 text-[#0F172A]">
                  {question.content || "-"}
                </div>
                <div className="mt-1 flex items-center gap-1 overflow-hidden text-xs text-[#64748B]">
                  <span className="truncate">
                    {question.subjects?.code ?? "-"}
                  </span>
                  <span className="shrink-0 rounded-md bg-[#F8FAFC] px-1.5 py-0.5 ring-1 ring-[#E2E8F0]">
                    {question.type === "multiple_choice" ? "PG" : "Essay"}
                  </span>
                  <QuestionStatusBadge status={question.status ?? "draft"} />
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <QuestionActions
                    question={question}
                    onPreview={() => setPreviewQuestion(question)}
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        pageCount={pageCount}
        rowsPerPage={rowsPerPage}
        total={questions.length}
        onPageChange={setPage}
      />

      {previewQuestion ? (
        <PreviewModal
          question={previewQuestion}
          onClose={() => setPreviewQuestion(null)}
        />
      ) : null}
    </div>
  );
}

function QuestionActions({
  question,
  onPreview,
}: {
  question: QuestionRow;
  onPreview: () => void;
}) {
  return (
    <TableActions>
      <TableActionButton icon="eye" onClick={onPreview}>
        {UI_LABELS.actions.preview}
      </TableActionButton>
      <TableActionLink
        href={`?action=edit&id=${question.id}`}
        icon="pencil"
      >
        {UI_LABELS.actions.update}
      </TableActionLink>
      <TableActionLink
        href={`?action=duplicate&id=${question.id}`}
        icon="copy"
      >
        Duplikat
      </TableActionLink>
      <form action={updateQuestionStatusAction}>
        <input type="hidden" name="id" value={question.id} />
        <input
          type="hidden"
          name="status"
          value={question.status === "published" ? "draft" : "published"}
        />
        <TableActionSubmit
          icon={question.status === "published" ? "undo" : "send"}
          confirmMessage={
            question.status === "published"
              ? "Ubah soal ini menjadi belum diterbitkan?"
              : "Terbitkan soal ini?"
          }
        >
          {question.status === "published"
            ? UI_LABELS.actions.unpublish
            : UI_LABELS.actions.publish}
        </TableActionSubmit>
      </form>
      <form action={updateQuestionStatusAction}>
        <input type="hidden" name="id" value={question.id} />
        <input type="hidden" name="status" value="archived" />
        <TableActionSubmit
          icon="archive"
          confirmMessage="Arsipkan soal ini?"
          tone="danger"
        >
          Arsipkan
        </TableActionSubmit>
      </form>
    </TableActions>
  );
}

function Pagination({
  currentPage,
  pageCount,
  rowsPerPage,
  total,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  rowsPerPage: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const start = total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(total, currentPage * rowsPerPage);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#64748B] shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <span>
        {start}-{end} dari {total} soal
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#E2E8F0] px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="size-3.5" />
          {UI_LABELS.actions.previous}
        </button>
        <span className="text-xs">
          {currentPage} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
          disabled={currentPage >= pageCount}
          className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#E2E8F0] px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          {UI_LABELS.actions.next}
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function PreviewModal({
  question,
  onClose,
}: {
  question: QuestionRow;
  onClose: () => void;
}) {
  const options = [...(question.question_options ?? [])].sort(
    (a, b) => a.order_number - b.order_number,
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">
              Pratinjau Soal
            </h2>
            <div className="mt-1 flex flex-wrap gap-1 text-xs text-[#64748B]">
              <span>{question.subjects?.code ?? "Mapel"}</span>
              <span>-</span>
              <span>{question.type === "multiple_choice" ? "Pilihan ganda" : "Essay"}</span>
              <span>-</span>
              <span>{question.question_categories?.name ?? "Tanpa kategori"}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-sm"
          >
            Tutup
          </button>
        </div>
        <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <QuestionMathRenderer content={question.content} className="leading-7 text-[#0F172A]" />
          </div>

          {question.question_attachments && question.question_attachments.length > 0 ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-2">
              <div className="text-xs font-bold text-[#0F172A]">Foto / Media Lampiran Soal:</div>
              <div className="grid gap-2">
                {question.question_attachments.map((att) => (
                  <QuestionMediaPreview
                    key={att.id}
                    mediaType={att.media_type}
                    url={att.url}
                    title={att.file_name}
                    caption={att.caption}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {question.type === "multiple_choice" ? (
            <div className="grid gap-2">
              {options.map((option) => (
                <div
                  key={option.option_label}
                  className={cn(
                    "flex gap-2.5 rounded-xl border px-3.5 py-2.5",
                    option.is_correct
                      ? "border-emerald-300 bg-emerald-50/50 text-emerald-950 font-medium ring-1 ring-emerald-300"
                      : "border-[#E2E8F0] bg-white text-[#0F172A]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-lg text-xs font-bold shrink-0",
                      option.is_correct
                        ? "bg-emerald-600 text-white"
                        : "bg-blue-100 text-blue-800",
                    )}
                  >
                    {option.option_label}
                  </span>
                  <span className="flex-1 pt-0.5">
                    <QuestionMathRenderer content={option.option_text} />
                  </span>
                  {option.is_correct ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md self-center">
                      Kunci Benar
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-[#F8FAFC] p-3 text-xs text-[#64748B]">
              Soal essay tidak memakai pilihan jawaban.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
