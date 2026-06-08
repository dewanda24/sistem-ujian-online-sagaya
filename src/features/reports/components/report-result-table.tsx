"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { UI_LABELS } from "@/constants/ui-labels";

type ReportResultRow = {
  id: string;
  studentName: string;
  username: string;
  nis: string;
  examTitle: string;
  subject: string;
  score: number;
  maxScore: number;
  percent: number;
  status: string;
  gradingStatus: string;
  submittedAt: string | null;
  className: string;
};

type ReportResultTableProps = {
  rows: ReportResultRow[];
  mode?: "results" | "recap";
};

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getScoreLabel(row: ReportResultRow) {
  if (row.gradingStatus !== "finalized") {
    return "Belum final";
  }

  return String(Math.round(row.percent));
}

function getPassStatus(row: ReportResultRow) {
  if (row.gradingStatus !== "finalized") return null;

  return row.percent >= 75 ? "Lulus" : "Tidak lulus";
}

function exportHref(row: ReportResultRow) {
  const params = new URLSearchParams({
    type: "students",
    q: row.nis !== "-" ? row.nis : row.studentName,
  });

  return `/api/reports/export?${params.toString()}`;
}

export function ReportResultTable({
  rows,
  mode = "results",
}: ReportResultTableProps) {
  const [page, setPage] = useState(1);
  const [detailRow, setDetailRow] = useState<ReportResultRow | null>(null);
  const rowsPerPage = 10;
  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(
    () => rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [currentPage, rows],
  );
  const columns =
    mode === "results"
      ? ["Peserta", "Kelas", "Nilai", "Status", "Waktu Selesai", "Aksi"]
      : ["Siswa", "Kelas", "Mapel", "Nilai", "Status", "Aksi"];

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <EmptyState
          title={mode === "results" ? "Belum ada hasil ujian" : "Belum ada rekap nilai"}
          description="Hasil ujian akan tampil setelah peserta menyelesaikan ujian."
          actionHref="/dashboard/exams/schedules"
          actionLabel="Lihat Jadwal"
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
              {columns.map((column, index) => (
                <th
                  key={column}
                  className={`px-3 py-2 font-medium ${
                    index === columns.length - 1 ? "w-36" : ""
                  } ${column === "Nilai" ? "w-28" : ""} ${
                    column === "Status" ? "w-36" : ""
                  } ${column === "Kelas" || column === "Mapel" ? "w-36" : ""}`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {pagedRows.map((row) => (
              <tr key={row.id} className="h-16 hover:bg-[#F8FAFC]">
                <td className="min-w-0 px-3 py-2">
                  <div className="line-clamp-1 font-medium text-[#0F172A]">
                    {row.studentName}
                  </div>
                  <div className="mt-0.5 line-clamp-1 text-xs text-[#64748B]">
                    {row.username || row.nis}
                  </div>
                </td>
                <td className="truncate px-3 py-2 text-[#0F172A]">
                  {mode === "results" ? row.className : row.className}
                </td>
                {mode === "recap" ? (
                  <td className="truncate px-3 py-2 text-[#0F172A]">
                    {row.subject}
                  </td>
                ) : null}
                <td className="px-3 py-2">
                  <div className="text-base font-semibold leading-none text-[#0F172A]">
                    {getScoreLabel(row)}
                  </div>
                  {getPassStatus(row) ? (
                    <div
                      className={`mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                        row.percent >= 75
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {getPassStatus(row)}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <StatusPill
                    value={
                      row.gradingStatus === "needs_manual_grading"
                        ? row.gradingStatus
                        : row.status
                    }
                  />
                </td>
                {mode === "results" ? (
                  <td className="px-3 py-2 text-xs text-[#64748B]">
                    {formatDateTime(row.submittedAt)}
                  </td>
                ) : null}
                <td className="px-3 py-2">
                  <RowActions row={row} onDetail={() => setDetailRow(row)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 md:hidden">
        {pagedRows.map((row) => (
          <article
            key={row.id}
            className="max-h-[120px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="line-clamp-1 text-sm font-medium text-[#0F172A]">
                  {row.studentName}
                </div>
                <div className="mt-0.5 line-clamp-1 text-xs text-[#64748B]">
                  {row.className} - {mode === "recap" ? row.subject : row.username}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-base font-semibold leading-none text-[#0F172A]">
                  {getScoreLabel(row)}
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <StatusPill
                value={
                  row.gradingStatus === "needs_manual_grading"
                    ? row.gradingStatus
                    : row.status
                }
              />
              <RowActions compact row={row} onDetail={() => setDetailRow(row)} />
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#64748B] shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <span>
          {(currentPage - 1) * rowsPerPage + 1}-
          {Math.min(rows.length, currentPage * rowsPerPage)} dari {rows.length} hasil
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

      {detailRow ? (
        <DetailDrawer row={detailRow} onClose={() => setDetailRow(null)} />
      ) : null}
    </div>
  );
}

function RowActions({
  row,
  onDetail,
  compact = false,
}: {
  row: ReportResultRow;
  onDetail: () => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onDetail}
        title="Rincian"
        className={`inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] ${
          compact ? "h-7 px-2 text-xs" : "h-7 w-7"
        }`}
      >
        <Eye className="size-3.5" />
        <span className="sr-only">Rincian</span>
      </button>
      {!compact ? (
        <Link
          href={exportHref(row)}
          title={UI_LABELS.actions.exportData}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
        >
          <Download className="size-3.5" />
          <span className="sr-only">{UI_LABELS.actions.exportData}</span>
        </Link>
      ) : null}
      <details className="relative">
        <summary
          className={`inline-flex cursor-pointer list-none items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] ${
            compact ? "h-7 px-2 text-xs" : "h-7 w-7"
          }`}
        >
          <MoreHorizontal className="size-3.5" />
        </summary>
        <div className="absolute right-0 z-30 mt-2 grid min-w-44 gap-1 rounded-xl border border-[#E2E8F0] bg-white p-2 text-xs shadow-lg">
          <Link
            href={`/dashboard/exam-results/${row.id}`}
            className="rounded-lg px-2 py-1.5 hover:bg-[#F8FAFC]"
          >
            Lihat Jawaban
          </Link>
          {row.gradingStatus === "needs_manual_grading" ? (
            <Link
              href={`/dashboard/exam-results/${row.id}`}
              className="rounded-lg px-2 py-1.5 hover:bg-[#F8FAFC]"
            >
              Koreksi Essay
            </Link>
          ) : null}
          {compact ? (
            <Link
              href={exportHref(row)}
              className="rounded-lg px-2 py-1.5 hover:bg-[#F8FAFC]"
            >
              {UI_LABELS.actions.exportData}
            </Link>
          ) : null}
        </div>
      </details>
    </div>
  );
}

function DetailDrawer({
  row,
  onClose,
}: {
  row: ReportResultRow;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="h-full w-full max-w-lg overflow-y-auto bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">
              Detail Hasil
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Ringkasan pengerjaan ujian dan status penilaian peserta.
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

        <div className="mt-5 grid gap-3 text-sm">
          <Section title="Identitas siswa">
            <Info label="Nama" value={row.studentName} />
            <Info label="Username / NIS" value={`${row.username} / ${row.nis}`} />
            <Info label="Kelas" value={row.className} />
          </Section>
          <Section title="Ujian">
            <Info label="Jadwal" value={row.examTitle} />
            <Info label="Mapel" value={row.subject} />
            <Info label="Waktu selesai" value={formatDateTime(row.submittedAt)} />
          </Section>
          <Section title="Nilai">
            <Info label="Nilai akhir" value={getScoreLabel(row)} />
            <Info label="Skor mentah" value={`${row.score} / ${row.maxScore}`} />
            <div className="flex flex-wrap gap-2">
              <StatusPill value={row.status} />
              <StatusPill value={row.gradingStatus} />
            </div>
          </Section>
          <Link
            href={`/dashboard/exam-results/${row.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FileText className="size-4" />
            Buka Detail Jawaban
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase text-[#64748B]">
        {title}
      </h3>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[#64748B]">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-[#0F172A]">
        {value}
      </span>
    </div>
  );
}
