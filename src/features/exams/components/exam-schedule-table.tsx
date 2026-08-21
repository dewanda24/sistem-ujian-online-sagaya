"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  GraduationCap,
  KeyRound,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  TableActionButton,
  TableActionLink,
  TableActions,
  TableActionSubmit,
} from "@/components/dashboard/table-actions";
import { UI_LABELS } from "@/constants/ui-labels";
import {
  archiveExamScheduleAction,
  regenerateExamTokenAction,
  toggleExamScheduleActiveAction,
  updateExamScheduleStatusAction,
  deleteExamScheduleAction,
} from "@/features/exams/actions";
import type { ExamReadinessResult } from "@/features/exams/exam-readiness.service";
import { cn } from "@/lib/utils";

type ScheduleClassRelation = {
  class_id?: string | null;
  classes?: { name?: string | null } | Array<{ name?: string | null }> | null;
};

type ExamScheduleRow = {
  id: string;
  title: string;
  status: string;
  start_at: string;
  end_at: string;
  is_active?: boolean | null;
  token_required?: boolean | null;
  access_token?: string | null;
  exam_packages?: {
    title?: string | null;
    subjects?: { code?: string | null; name?: string | null } | null;
  } | null;
  exam_schedule_classes?: ScheduleClassRelation[] | null;
  exam_participants?: Array<{ status?: string | null }> | null;
};

type ExamScheduleTableProps = {
  schedules: ExamScheduleRow[];
  readinessBySchedule: Record<string, ExamReadinessResult>;
  monitoringBasePath: string;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function displayStatus(schedule: ExamScheduleRow) {
  if (schedule.status === "scheduled") return "ready";
  if (schedule.status === "active") return "aktif";
  if (schedule.status === "finished") return "selesai";
  if (schedule.status === "cancelled") return "dibatalkan";
  return schedule.status;
}

export function ExamScheduleTable({
  schedules,
  readinessBySchedule,
  monitoringBasePath,
}: ExamScheduleTableProps) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const pageCount = Math.max(1, Math.ceil(schedules.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pagedSchedules = schedules.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const [previewSchedule, setPreviewSchedule] = useState<ExamScheduleRow | null>(null);

  if (schedules.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-2xs">
        <EmptyState
          title="Belum ada jadwal ujian"
          description="Buat jadwal pelaksanaan dari paket ujian yang sudah diterbitkan."
          actionHref="/dashboard/exams/schedules/create"
          actionLabel="Buat Jadwal Ujian"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden overflow-visible rounded-2xl border border-slate-200/90 bg-white shadow-2xs md:block">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Jadwal Ujian</th>
              <th className="w-48 px-4 py-3">Waktu Pelaksanaan</th>
              <th className="w-40 px-4 py-3">Peserta & Kelas</th>
              <th className="w-32 px-4 py-3">Status</th>
              <th className="w-36 px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagedSchedules.map((schedule) => {
              const readiness = readinessBySchedule[schedule.id];
              const classes = schedule.exam_schedule_classes ?? [];
              const classNames = classes
                .map((item) => firstRelation(item.classes)?.name)
                .filter(Boolean);

              return (
                <tr key={schedule.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="min-w-0 px-4 py-3.5">
                    <div className="font-bold text-slate-900 line-clamp-1 text-xs">
                      {schedule.title || schedule.exam_packages?.title || "-"}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                      {schedule.exam_packages?.subjects ? (
                        <span className="rounded bg-blue-50 px-1.5 py-0.2 text-[10.5px] font-semibold text-blue-700">
                          {schedule.exam_packages.subjects.code}
                        </span>
                      ) : null}
                      <span className="truncate">
                        {classNames.length > 0
                          ? classNames.slice(0, 3).join(", ")
                          : "Tanpa kelas"}
                        {classNames.length > 3 ? ` +${classNames.length - 3}` : ""}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900 text-xs">
                      {formatDate(schedule.start_at)}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                      <Clock className="size-3 text-slate-400" />
                      <span>{formatTime(schedule.start_at)} - {formatTime(schedule.end_at)} WIB</span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                        {schedule.exam_participants?.length ?? 0} Peserta
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                        {classes.length} Kelas
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex flex-col items-start gap-1">
                      <StatusPill value={displayStatus(schedule)} />
                      {readiness ? (
                        <ReadinessBadge status={readiness.status} />
                      ) : null}
                      {!schedule.is_active ? (
                        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                          Nonaktif
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <ScheduleActions
                      schedule={schedule}
                      readiness={readiness}
                      monitoringBasePath={monitoringBasePath}
                      onPreview={() => setPreviewSchedule(schedule)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="grid gap-3 md:hidden">
        {pagedSchedules.map((schedule) => {
          const readiness = readinessBySchedule[schedule.id];
          const classes = schedule.exam_schedule_classes ?? [];
          return (
            <article
              key={schedule.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 text-xs line-clamp-1">
                    {schedule.title || schedule.exam_packages?.title || "-"}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <Clock className="size-3 text-slate-400" />
                    <span>{formatDate(schedule.start_at)} ({formatTime(schedule.start_at)} - {formatTime(schedule.end_at)})</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusPill value={displayStatus(schedule)} />
                  {readiness ? <ReadinessBadge status={readiness.status} /> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {schedule.exam_packages?.subjects ? (
                  <span className="rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-800">
                    {schedule.exam_packages.subjects.code}
                  </span>
                ) : null}
                <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                  {schedule.exam_participants?.length ?? 0} Peserta
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                  {classes.length} Kelas
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                <ScheduleActions
                  schedule={schedule}
                  readiness={readiness}
                  monitoringBasePath={monitoringBasePath}
                  onPreview={() => setPreviewSchedule(schedule)}
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* PAGINATION BAR */}
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-xs text-slate-600 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium">
          Menampilkan <strong className="text-slate-900">{(currentPage - 1) * rowsPerPage + 1}</strong> -{" "}
          <strong className="text-slate-900">{Math.min(schedules.length, currentPage * rowsPerPage)}</strong> dari{" "}
          <strong className="text-slate-900">{schedules.length}</strong> jadwal ujian
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

      {/* SCHEDULE PREVIEW MODAL */}
      {previewSchedule ? (
        <PreviewModal
          schedule={previewSchedule}
          readiness={readinessBySchedule[previewSchedule.id]}
          onClose={() => setPreviewSchedule(null)}
        />
      ) : null}
    </div>
  );
}

function ScheduleActions({
  schedule,
  readiness,
  monitoringBasePath,
  onPreview,
}: {
  schedule: ExamScheduleRow;
  readiness?: ExamReadinessResult;
  monitoringBasePath: string;
  onPreview: () => void;
}) {
  async function copyToken() {
    if (schedule.access_token) {
      await navigator.clipboard.writeText(schedule.access_token);
    }
  }

  return (
    <TableActions>
      <TableActionButton icon="eye" onClick={onPreview}>
        {UI_LABELS.actions.preview}
      </TableActionButton>
      <TableActionLink
        href={`${monitoringBasePath}?schedule_id=${schedule.id}`}
        icon="screen-share"
      >
        Live Monitoring
      </TableActionLink>
      <TableActionLink
        href={`/dashboard/reports/students?schedule_id=${schedule.id}`}
        icon="clipboard"
      >
        Hasil Nilai Siswa
      </TableActionLink>
      <TableActionLink
        href={`/dashboard/exams/schedules/create?edit=${schedule.id}`}
        icon="pencil"
      >
        {UI_LABELS.actions.update}
      </TableActionLink>
      <TableActionButton
        icon="clipboard"
        onClick={copyToken}
        disabled={!schedule.access_token}
      >
        {UI_LABELS.actions.copyToken}
      </TableActionButton>
      <form action={regenerateExamTokenAction}>
        <input type="hidden" name="id" value={schedule.id} />
        <TableActionSubmit confirmMessage="Buat token baru? Token lama tidak bisa dipakai lagi.">
          {UI_LABELS.actions.generateToken}
        </TableActionSubmit>
      </form>
      {schedule.status === "draft" || schedule.status === "cancelled" ? (
        <form action={updateExamScheduleStatusAction}>
          <input type="hidden" name="id" value={schedule.id} />
          <input type="hidden" name="status" value="scheduled" />
          <input
            type="hidden"
            name="confirm_warnings"
            value={
              readiness && readiness.summary.warning > 0 && readiness.summary.critical === 0
                ? "true"
                : "false"
            }
          />
          <TableActionSubmit
            icon="send"
            confirmMessage={
              readiness && readiness.summary.warning > 0 && readiness.summary.critical === 0
                ? "Tetap publish? Jadwal masih memiliki warning readiness."
                : "Publish jadwal ujian ini?"
            }
          >
            Publish Jadwal
          </TableActionSubmit>
        </form>
      ) : null}
      <form action={toggleExamScheduleActiveAction}>
        <input type="hidden" name="id" value={schedule.id} />
        <input
          type="hidden"
          name="is_active"
          value={schedule.is_active ? "false" : "true"}
        />
        <TableActionSubmit
          icon="toggle-left"
          confirmMessage={
            schedule.is_active
              ? "Nonaktifkan jadwal ujian ini?"
              : "Aktifkan jadwal ujian ini?"
          }
        >
          {schedule.is_active ? "Nonaktifkan" : "Aktifkan"}
        </TableActionSubmit>
      </form>
      <form action={updateExamScheduleStatusAction}>
        <input type="hidden" name="id" value={schedule.id} />
        <input type="hidden" name="status" value="cancelled" />
        <TableActionSubmit confirmMessage="Batalkan jadwal ujian ini?">
          Batalkan
        </TableActionSubmit>
      </form>
      <form action={archiveExamScheduleAction}>
        <input type="hidden" name="id" value={schedule.id} />
        <TableActionSubmit
          icon="archive"
          confirmMessage="Arsipkan jadwal ujian ini?"
          tone="danger"
        >
          {UI_LABELS.actions.archive}
        </TableActionSubmit>
      </form>
      <form action={deleteExamScheduleAction}>
        <input type="hidden" name="id" value={schedule.id} />
        <TableActionSubmit
          icon="trash"
          confirmMessage="Anda yakin ingin MENGHAPUS PERMANEN jadwal ujian ini? Tindakan ini tidak bisa dibatalkan."
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
  schedule,
  readiness,
  onClose,
}: {
  schedule: ExamScheduleRow;
  readiness?: ExamReadinessResult;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const classes = schedule.exam_schedule_classes ?? [];
  const classNames = classes
    .map((item) => firstRelation(item.classes)?.name)
    .filter(Boolean);

  function handleCopy() {
    if (!schedule.access_token) return;
    navigator.clipboard.writeText(schedule.access_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Detail Jadwal Ujian
            </span>
            <h2 className="mt-1 text-sm font-bold text-slate-900">
              {schedule.title}
            </h2>
            <p className="text-xs text-slate-500">
              {schedule.exam_packages?.title ?? "Paket ujian"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid gap-3 text-xs">
          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-blue-950 font-medium">
            <Calendar className="size-4 text-blue-600 shrink-0" />
            <span>
              {formatDate(schedule.start_at)} • {formatTime(schedule.start_at)} - {formatTime(schedule.end_at)} WIB
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Summary label="Total Peserta" value={`${schedule.exam_participants?.length ?? 0} Siswa`} />
            <Summary label="Target Kelas" value={`${classes.length} Kelas`} />
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">Token Akses</div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {schedule.access_token ?? "-"}
                </span>
                {schedule.access_token ? (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    {copied ? "Disalin!" : "Salin"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
            <div className="text-[11px] font-bold text-slate-700">Daftar Kelas Peserta:</div>
            <div className="text-slate-600 text-xs">
              {classNames.length > 0 ? classNames.join(", ") : "Tanpa kelas target"}
            </div>
          </div>

          {readiness ? <ReadinessCard readiness={readiness} /> : null}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function ReadinessCard({ readiness }: { readiness: ExamReadinessResult }) {
  const visibleChecks = readiness.checks
    .filter((check) => !check.passed || check.severity !== "info")
    .slice(0, 8);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-900">
            Status Kesiapan Ujian (Readiness)
          </h3>
          <p className="text-[11px] text-slate-500">
            Skor {readiness.score}% • Status {readiness.status.toUpperCase()}
          </p>
        </div>
        <ReadinessBadge status={readiness.status} />
      </div>

      <div className="grid gap-1.5">
        {visibleChecks.map((check) => {
          const content = (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 px-2.5 py-1.5">
              <div className="flex min-w-0 gap-2">
                {check.passed ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {check.title}
                  </p>
                  <p className="line-clamp-1 text-[11px] text-slate-500">
                    {check.description}
                  </p>
                </div>
              </div>
              <SeverityBadge severity={check.severity} />
            </div>
          );

          return check.href ? (
            <Link key={check.key} href={check.href}>
              {content}
            </Link>
          ) : (
            <div key={check.key}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}

function ReadinessBadge({ status }: { status: ExamReadinessResult["status"] }) {
  const className =
    status === "ready"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : status === "warning"
        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
        : "bg-rose-50 text-rose-700 ring-1 ring-rose-200";

  return (
    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${className}`}>
      {status === "ready" ? "Siap" : status === "warning" ? "Peringatan" : "Terblokir"}
    </span>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: ExamReadinessResult["checks"][number]["severity"];
}) {
  const className =
    severity === "critical"
      ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
      : severity === "warning"
        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
        : "bg-blue-50 text-blue-700 ring-1 ring-blue-200";

  return (
    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${className}`}>
      {severity === "critical" ? "Critical" : severity === "warning" ? "Warning" : "Info"}
    </span>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-[11px] text-slate-500 font-medium">{label}</div>
      <div className="mt-0.5 line-clamp-1 font-bold text-slate-900 text-xs">{value}</div>
    </div>
  );
}
