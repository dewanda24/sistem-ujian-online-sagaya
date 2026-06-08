"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Archive,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
} from "lucide-react";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { UI_LABELS, getStatusLabel } from "@/constants/ui-labels";
import {
  archiveExamPackageAction,
  toggleExamPackageActiveAction,
  updateExamPackageStatusAction,
} from "@/features/exams/actions";

type PackageQuestion = {
  point_override?: number | string | null;
  questions?:
    | {
        point?: number | string | null;
      }
    | Array<{
        point?: number | string | null;
      }>
    | null;
};

type ExamPackageRow = {
  id: string;
  title: string | null;
  description?: string | null;
  subject_id?: string | null;
  duration_minutes?: number | string | null;
  total_questions?: number | string | null;
  total_points?: number | string | null;
  status: string;
  is_active?: boolean | null;
  subjects?: {
    code?: string | null;
    name?: string | null;
  } | null;
  exam_package_questions?: PackageQuestion[] | null;
};

type ExamPackageTableProps = {
  packages: ExamPackageRow[];
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function getTotalPoints(examPackage: ExamPackageRow) {
  const packageQuestions = examPackage.exam_package_questions ?? [];

  if (packageQuestions.length === 0) {
    return Number(examPackage.total_points ?? 0);
  }

  return packageQuestions.reduce((total, item) => {
    const question = firstRelation(item.questions);

    return total + Number(item.point_override ?? question?.point ?? 0);
  }, 0);
}

export function ExamPackageTable({ packages }: ExamPackageTableProps) {
  const [page, setPage] = useState(1);
  const [previewPackage, setPreviewPackage] = useState<ExamPackageRow | null>(null);
  const rowsPerPage = 10;
  const pageCount = Math.max(1, Math.ceil(packages.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pagedPackages = packages.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  if (packages.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <EmptyState
          title="Belum ada paket ujian"
          description="Buat paket ujian dari soal yang sudah diterbitkan terlebih dahulu."
          actionHref="/dashboard/exams/packages/create"
          actionLabel="Buat Paket Ujian"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-[#E2E8F0] text-xs uppercase text-[#64748B]">
            <tr className="h-10">
              <th className="px-3 py-2 font-medium">Paket</th>
              <th className="w-44 px-3 py-2 font-medium">Mapel</th>
              <th className="w-52 px-3 py-2 font-medium">Ringkasan</th>
              <th className="w-28 px-3 py-2 font-medium">Status</th>
              <th className="w-36 px-3 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {pagedPackages.map((examPackage) => (
              <tr key={examPackage.id} className="h-16 hover:bg-[#F8FAFC]">
                <td className="min-w-0 px-3 py-2">
                  <div className="line-clamp-1 font-medium text-[#0F172A]">
                    {examPackage.title || "-"}
                  </div>
                  {examPackage.description ? (
                    <div className="mt-1 line-clamp-1 text-xs text-[#64748B]">
                      {examPackage.description}
                    </div>
                  ) : null}
                </td>
                <td className="truncate px-3 py-2 text-[#0F172A]">
                  {examPackage.subjects
                    ? `${examPackage.subjects.code} - ${examPackage.subjects.name}`
                    : "-"}
                </td>
                <td className="px-3 py-2 text-[#64748B]">
                  {Number(examPackage.total_questions ?? 0)} soal -{" "}
                  {Number(examPackage.duration_minutes ?? 0)} menit -{" "}
                  {getTotalPoints(examPackage)} poin
                </td>
                <td className="px-3 py-2">
                  <StatusPill value={examPackage.status} />
                  {!examPackage.is_active ? (
                    <div className="mt-1 text-xs text-[#EF4444]">Nonaktif</div>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewPackage(examPackage)}
                      title={UI_LABELS.actions.preview}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                    >
                      <Eye className="size-3.5" />
                      <span className="sr-only">{UI_LABELS.actions.preview}</span>
                    </button>
                    <Link
                      href={`/dashboard/exams/packages/create?edit=${examPackage.id}&subject_id=${examPackage.subject_id ?? ""}`}
                      title={UI_LABELS.actions.update}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only">{UI_LABELS.actions.update}</span>
                    </Link>
                    <Link
                      href={`/dashboard/exams/schedules?package_id=${examPackage.id}`}
                      title="Jadwalkan"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                    >
                      <CalendarPlus className="size-3.5" />
                      <span className="sr-only">Jadwalkan</span>
                    </Link>
                    <MoreMenu examPackage={examPackage} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 md:hidden">
        {pagedPackages.map((examPackage) => (
          <article
            key={examPackage.id}
            className="max-h-[120px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm"
          >
            <div className="line-clamp-1 text-sm font-medium text-[#0F172A]">
              {examPackage.title || "-"}
            </div>
            <div className="mt-1 flex items-center gap-1 overflow-hidden text-xs text-[#64748B]">
              <span className="truncate">{examPackage.subjects?.code ?? "-"}</span>
              <span className="shrink-0">
                {Number(examPackage.total_questions ?? 0)} soal
              </span>
              <StatusPill value={examPackage.status} />
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewPackage(examPackage)}
                className="rounded-xl border border-[#E2E8F0] px-2.5 py-1 text-xs"
              >
                {UI_LABELS.actions.preview}
              </button>
              <Link
                href={`/dashboard/exams/packages/create?edit=${examPackage.id}&subject_id=${examPackage.subject_id ?? ""}`}
                className="rounded-xl border border-[#E2E8F0] px-2.5 py-1 text-xs"
              >
                {UI_LABELS.actions.update}
              </Link>
              <MoreMenu examPackage={examPackage} compact />
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#64748B] shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <span>
          {(currentPage - 1) * rowsPerPage + 1}-
          {Math.min(packages.length, currentPage * rowsPerPage)} dari{" "}
          {packages.length} paket
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
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
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            disabled={currentPage >= pageCount}
            className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#E2E8F0] px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            {UI_LABELS.actions.next}
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {previewPackage ? (
        <PreviewModal
          examPackage={previewPackage}
          onClose={() => setPreviewPackage(null)}
        />
      ) : null}
    </div>
  );
}

function MoreMenu({
  examPackage,
  compact = false,
}: {
  examPackage: ExamPackageRow;
  compact?: boolean;
}) {
  return (
    <details className="relative">
      <summary
        className={`inline-flex cursor-pointer list-none items-center justify-center rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] ${
          compact ? "h-7 px-2 text-xs" : "h-7 w-7"
        }`}
      >
        <MoreHorizontal className="size-3.5" />
      </summary>
      <div className="absolute right-0 z-30 mt-2 grid min-w-44 gap-1 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg">
        {["draft", "published", "archived"].map((status) => (
          <form key={status} action={updateExamPackageStatusAction}>
            <input type="hidden" name="id" value={examPackage.id} />
            <input type="hidden" name="status" value={status} />
            <ConfirmSubmitButton
              confirmMessage={`Ubah status paket menjadi ${getStatusLabel(status)}?`}
              className="w-full justify-start rounded-lg border-0 px-2"
            >
              {getStatusLabel(status)}
            </ConfirmSubmitButton>
          </form>
        ))}
        <form action={toggleExamPackageActiveAction}>
          <input type="hidden" name="id" value={examPackage.id} />
          <input
            type="hidden"
            name="is_active"
            value={examPackage.is_active ? "false" : "true"}
          />
          <ConfirmSubmitButton
            confirmMessage={
              examPackage.is_active
                ? "Nonaktifkan paket ujian ini?"
                : "Aktifkan paket ujian ini?"
            }
            className="w-full justify-start rounded-lg border-0 px-2"
          >
            {examPackage.is_active ? "Nonaktifkan" : "Aktifkan"}
          </ConfirmSubmitButton>
        </form>
        <form action={archiveExamPackageAction}>
          <input type="hidden" name="id" value={examPackage.id} />
          <ConfirmSubmitButton
            confirmMessage="Arsipkan paket ujian ini?"
            variant="danger"
            className="w-full justify-start rounded-lg border-0 px-2"
          >
            <Archive className="size-3.5" />
            Arsipkan
          </ConfirmSubmitButton>
        </form>
      </div>
    </details>
  );
}

function PreviewModal({
  examPackage,
  onClose,
}: {
  examPackage: ExamPackageRow;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">
              {examPackage.title}
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {examPackage.subjects
                ? `${examPackage.subjects.code} - ${examPackage.subjects.name}`
                : "Tanpa mapel"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-sm"
          >
            Tutup
          </button>
        </div>
        <div className="grid gap-3 text-sm">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            {examPackage.description || "Tidak ada deskripsi."}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Summary label="Soal" value={String(examPackage.total_questions ?? 0)} />
            <Summary
              label="Durasi"
              value={`${Number(examPackage.duration_minutes ?? 0)} menit`}
            />
            <Summary label="Poin" value={String(getTotalPoints(examPackage))} />
          </div>
          <div>
            <StatusPill value={examPackage.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
      <div className="text-xs text-[#64748B]">{label}</div>
      <div className="mt-1 font-semibold text-[#0F172A]">{value}</div>
    </div>
  );
}
