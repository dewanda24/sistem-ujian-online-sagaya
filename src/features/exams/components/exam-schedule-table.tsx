"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  ShieldAlert,
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
} from "@/features/exams/actions";
import type { ExamReadinessResult } from "@/features/exams/exam-readiness.service";

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
  const [previewSchedule, setPreviewSchedule] = useState<ExamScheduleRow | null>(null);

  if (schedules.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <EmptyState
          title="Belum ada jadwal ujian"
          description="Buat jadwal dari paket ujian yang sudah diterbitkan."
          actionHref="/dashboard/exams/schedules/create"
          actionLabel="Buat Jadwal"
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
              <th className="px-3 py-2 font-medium">Jadwal</th>
              <th className="w-36 px-3 py-2 font-medium">Waktu</th>
              <th className="w-28 px-3 py-2 font-medium">Peserta</th>
              <th className="w-28 px-3 py-2 font-medium">Status</th>
              <th className="w-36 px-3 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {schedules.map((schedule) => {
              const readiness = readinessBySchedule[schedule.id];
              const classes = schedule.exam_schedule_classes ?? [];
              const classNames = classes
                .map((item) => firstRelation(item.classes)?.name)
                .filter(Boolean);

              return (
                <tr key={schedule.id} className="h-16 hover:bg-[#F8FAFC]">
                  <td className="min-w-0 px-3 py-2">
                    <div className="line-clamp-1 font-medium text-[#0F172A]">
                      {schedule.title || schedule.exam_packages?.title || "-"}
                    </div>
                    <div className="mt-1 line-clamp-1 text-xs text-[#64748B]">
                      {schedule.exam_packages?.subjects?.code ?? "Mapel"} -{" "}
                      {classNames.length > 0
                        ? classNames.slice(0, 3).join(", ")
                        : "Tanpa kelas"}
                      {classNames.length > 3 ? ` +${classNames.length - 3}` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-[#0F172A]">
                      {formatDate(schedule.start_at)}
                    </div>
                    <div className="mt-1 text-xs text-[#64748B]">
                      {formatTime(schedule.start_at)} - {formatTime(schedule.end_at)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[#64748B]">
                    <div>{schedule.exam_participants?.length ?? 0} peserta</div>
                    <div className="text-xs">{classes.length} kelas</div>
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill value={displayStatus(schedule)} />
                    {readiness ? (
                      <div className="mt-1">
                        <ReadinessBadge status={readiness.status} />
                      </div>
                    ) : null}
                    {!schedule.is_active ? (
                      <div className="mt-1 text-xs text-[#EF4444]">Nonaktif</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
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

      <div className="grid gap-2 md:hidden">
        {schedules.map((schedule) => (
          <article
            key={schedule.id}
            className="max-h-[120px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm"
          >
            <div className="line-clamp-1 text-sm font-medium text-[#0F172A]">
              {schedule.title || schedule.exam_packages?.title || "-"}
            </div>
            <div className="mt-1 flex items-center gap-1 overflow-hidden text-xs text-[#64748B]">
              <span className="truncate">{formatDate(schedule.start_at)}</span>
              <StatusPill value={displayStatus(schedule)} />
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <ScheduleActions
                schedule={schedule}
                readiness={readinessBySchedule[schedule.id]}
                monitoringBasePath={monitoringBasePath}
                onPreview={() => setPreviewSchedule(schedule)}
              />
            </div>
          </article>
        ))}
      </div>

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
        href={`/dashboard/exams/schedules/create?edit=${schedule.id}`}
        icon="pencil"
      >
        {UI_LABELS.actions.update}
      </TableActionLink>
      <TableActionLink
        href={`${monitoringBasePath}?schedule_id=${schedule.id}`}
        icon="screen-share"
      >
        {UI_LABELS.navigation.examMonitoring}
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
      <TableActionLink
        href={`/dashboard/exams/proctors?schedule_id=${schedule.id}`}
        icon="user-check"
      >
        Penugasan Pengawas
      </TableActionLink>
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
  const classes = schedule.exam_schedule_classes ?? [];
  const classNames = classes
    .map((item) => firstRelation(item.classes)?.name)
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">
              {schedule.title}
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {schedule.exam_packages?.title ?? "Paket ujian"}
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
            {formatDate(schedule.start_at)} - {formatTime(schedule.start_at)} sampai{" "}
            {formatTime(schedule.end_at)}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Summary label="Peserta" value={`${schedule.exam_participants?.length ?? 0}`} />
            <Summary label="Kelas" value={`${classes.length}`} />
            <Summary label="Token" value={schedule.access_token ?? "Belum dibuat"} />
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 text-[#64748B]">
            {classNames.length > 0 ? classNames.join(", ") : "Tanpa kelas target"}
          </div>
          {readiness ? <ReadinessCard readiness={readiness} /> : null}
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
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A]">
            Status Kesiapan Ujian
          </h3>
          <p className="mt-1 text-xs text-[#64748B]">
            Skor {readiness.score}% dengan status {readiness.status.toUpperCase()}.
          </p>
        </div>
        <ReadinessBadge status={readiness.status} />
      </div>
      <div className="mt-3 grid gap-2">
        {visibleChecks.map((check) => {
          const content = (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-[#E2E8F0] px-3 py-2">
              <div className="flex min-w-0 gap-2">
                {check.passed ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : (
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#0F172A]">
                    {check.title}
                  </p>
                  <p className="line-clamp-2 text-xs leading-5 text-[#64748B]">
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
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
      : status === "warning"
        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
        : "bg-red-50 text-red-700 ring-1 ring-red-100";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${className}`}>
      {status === "ready" ? "Ready" : status === "warning" ? "Warning" : "Blocked"}
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
      ? "bg-red-50 text-red-700 ring-1 ring-red-100"
      : severity === "warning"
        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
        : "bg-blue-50 text-blue-700 ring-1 ring-blue-100";

  return (
    <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${className}`}>
      {severity === "critical" ? "Critical" : severity === "warning" ? "Warning" : "Info"}
    </span>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
      <div className="text-xs text-[#64748B]">{label}</div>
      <div className="mt-1 line-clamp-1 font-semibold text-[#0F172A]">{value}</div>
    </div>
  );
}
