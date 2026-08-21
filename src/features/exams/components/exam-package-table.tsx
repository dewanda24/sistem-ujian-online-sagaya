"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  TableActionButton,
  TableActionLink,
  TableActions,
  TableActionSubmit,
} from "@/components/dashboard/table-actions";
import { UI_LABELS, getStatusLabel } from "@/constants/ui-labels";
import {
  archiveExamPackageAction,
  deleteExamPackageAction,
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
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs md:block">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Paket Ujian</th>
              <th className="w-44 px-4 py-3">Mata Pelajaran</th>
              <th className="w-60 px-4 py-3">Ringkasan Paket</th>
              <th className="w-32 px-4 py-3">Status</th>
              <th className="w-36 px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagedPackages.map((examPackage) => (
              <tr key={examPackage.id} className="transition-colors hover:bg-slate-50/60">
                <td className="min-w-0 px-4 py-3.5">
                  <div className="font-bold text-slate-900 line-clamp-1 text-xs">
                    {examPackage.title || "-"}
                  </div>
                  {examPackage.description ? (
                    <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                      {examPackage.description}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3.5 text-slate-700 font-medium">
                  {examPackage.subjects ? (
                    <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
                      {examPackage.subjects.code} - {examPackage.subjects.name}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                      {Number(examPackage.total_questions ?? 0)} Soal
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                      {Number(examPackage.duration_minutes ?? 0)} Mnt
                    </span>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                      {getTotalPoints(examPackage)} Poin
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col items-start gap-1">
                    <StatusPill value={examPackage.status} />
                    {!examPackage.is_active ? (
                      <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                        Nonaktif
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <PackageActions
                    examPackage={examPackage}
                    onPreview={() => setPreviewPackage(examPackage)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {pagedPackages.map((examPackage) => (
          <article
            key={examPackage.id}
            className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-slate-900 text-xs line-clamp-1">
                  {examPackage.title || "-"}
                </div>
                {examPackage.description ? (
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {examPackage.description}
                  </p>
                ) : null}
              </div>
              <StatusPill value={examPackage.status} />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {examPackage.subjects ? (
                <span className="rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-800">
                  {examPackage.subjects.code}
                </span>
              ) : null}
              <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                {Number(examPackage.total_questions ?? 0)} Soal
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                {Number(examPackage.duration_minutes ?? 0)} Mnt
              </span>
              <span className="rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                {getTotalPoints(examPackage)} Poin
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
              <PackageActions
                examPackage={examPackage}
                onPreview={() => setPreviewPackage(examPackage)}
              />
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-xs text-slate-600 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium">
          Menampilkan <strong className="text-slate-900">{(currentPage - 1) * rowsPerPage + 1}</strong> -{" "}
          <strong className="text-slate-900">{Math.min(packages.length, currentPage * rowsPerPage)}</strong> dari{" "}
          <strong className="text-slate-900">{packages.length}</strong> paket ujian
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage <= 1}
            className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
          >
            <ChevronLeft className="size-3.5" />
            {UI_LABELS.actions.previous}
          </button>
          <span className="text-xs font-bold text-slate-700 px-1">
            {currentPage} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            disabled={currentPage >= pageCount}
            className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
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

function PackageActions({
  examPackage,
  onPreview,
}: {
  examPackage: ExamPackageRow;
  onPreview: () => void;
}) {
  return (
    <TableActions>
      <TableActionButton icon="eye" onClick={onPreview}>
        {UI_LABELS.actions.preview}
      </TableActionButton>
      <TableActionLink
        href={`/dashboard/exams/packages/create?edit=${examPackage.id}&subject_id=${examPackage.subject_id ?? ""}`}
        icon="pencil"
      >
        {UI_LABELS.actions.update}
      </TableActionLink>
      {examPackage.status === "published" ? (
        <TableActionLink
          href={`/dashboard/exams/schedules?package_id=${examPackage.id}`}
          icon="calendar-plus"
        >
          Jadwalkan
        </TableActionLink>
      ) : null}
      
      <form action={updateExamPackageStatusAction}>
        <input type="hidden" name="id" value={examPackage.id} />
        <input 
          type="hidden" 
          name="status" 
          value={examPackage.status === "published" ? "draft" : "published"} 
        />
        <TableActionSubmit
          icon={examPackage.status === "published" ? "undo" : "send"}
          confirmMessage={
            examPackage.status === "published" 
              ? "Tarik kembali paket ini menjadi Draf?" 
              : "Terbitkan paket ujian ini agar dapat dijadwalkan?"
          }
        >
          {examPackage.status === "published" ? "Jadikan Draf" : "Terbitkan Paket"}
        </TableActionSubmit>
      </form>

      <form action={archiveExamPackageAction}>
        <input type="hidden" name="id" value={examPackage.id} />
        <TableActionSubmit
          icon="archive"
          confirmMessage="Arsipkan paket ujian ini? Paket yang diarsipkan tidak akan muncul di daftar utama."
          tone="danger"
        >
          Arsipkan
        </TableActionSubmit>
      </form>
      <form action={deleteExamPackageAction}>
        <input type="hidden" name="id" value={examPackage.id} />
        <TableActionSubmit
          icon="trash"
          confirmMessage="Anda yakin ingin MENGHAPUS PERMANEN paket ujian ini? Tindakan ini tidak bisa dibatalkan."
          confirmationText="HAPUS"
          tone="danger"
        >
          Hapus Permanen
        </TableActionSubmit>
      </form>
    </TableActions>
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
