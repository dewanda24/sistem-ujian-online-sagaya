"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Archive,
  Clipboard,
  Eye,
  MoreHorizontal,
  Pencil,
  ScreenShare,
  ToggleLeft,
} from "lucide-react";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  archiveExamScheduleAction,
  regenerateExamTokenAction,
  toggleExamScheduleActiveAction,
  updateExamScheduleStatusAction,
} from "@/features/exams/actions";

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
  monitoringBasePath,
}: ExamScheduleTableProps) {
  const [previewSchedule, setPreviewSchedule] = useState<ExamScheduleRow | null>(null);

  if (schedules.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <EmptyState
          title="Belum ada jadwal ujian"
          description="Buat jadwal dari paket ujian published."
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
                    {!schedule.is_active ? (
                      <div className="mt-1 text-xs text-[#EF4444]">Nonaktif</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewSchedule(schedule)}
                        title="Preview"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                      >
                        <Eye className="size-3.5" />
                        <span className="sr-only">Preview</span>
                      </button>
                      <Link
                        href={`/dashboard/exams/schedules/create?edit=${schedule.id}`}
                        title="Edit"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Link>
                      <Link
                        href={`${monitoringBasePath}?schedule_id=${schedule.id}`}
                        title="Monitoring"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                      >
                        <ScreenShare className="size-3.5" />
                        <span className="sr-only">Monitoring</span>
                      </Link>
                      <MoreMenu schedule={schedule} />
                    </div>
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
              <button
                type="button"
                onClick={() => setPreviewSchedule(schedule)}
                className="rounded-xl border border-[#E2E8F0] px-2.5 py-1 text-xs"
              >
                Preview
              </button>
              <Link
                href={`/dashboard/exams/schedules/create?edit=${schedule.id}`}
                className="rounded-xl border border-[#E2E8F0] px-2.5 py-1 text-xs"
              >
                Edit
              </Link>
              <MoreMenu schedule={schedule} compact />
            </div>
          </article>
        ))}
      </div>

      {previewSchedule ? (
        <PreviewModal
          schedule={previewSchedule}
          onClose={() => setPreviewSchedule(null)}
        />
      ) : null}
    </div>
  );
}

function MoreMenu({
  schedule,
  compact = false,
}: {
  schedule: ExamScheduleRow;
  compact?: boolean;
}) {
  async function copyToken() {
    if (schedule.access_token) {
      await navigator.clipboard.writeText(schedule.access_token);
    }
  }

  return (
    <details className="relative">
      <summary
        className={`inline-flex cursor-pointer list-none items-center justify-center rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] ${
          compact ? "h-7 px-2 text-xs" : "h-7 w-7"
        }`}
      >
        <MoreHorizontal className="size-3.5" />
      </summary>
      <div className="absolute right-0 z-30 mt-2 grid min-w-44 gap-1 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg">
        <button
          type="button"
          onClick={copyToken}
          disabled={!schedule.access_token}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Clipboard className="size-3.5" />
          Copy Token
        </button>
        <form action={regenerateExamTokenAction}>
          <input type="hidden" name="id" value={schedule.id} />
          <ConfirmSubmitButton
            confirmMessage="Buat token baru? Token lama tidak bisa dipakai lagi."
            className="w-full justify-start rounded-lg border-0 px-2"
          >
            Generate Token
          </ConfirmSubmitButton>
        </form>
        <form action={toggleExamScheduleActiveAction}>
          <input type="hidden" name="id" value={schedule.id} />
          <input
            type="hidden"
            name="is_active"
            value={schedule.is_active ? "false" : "true"}
          />
          <ConfirmSubmitButton
            confirmMessage={
              schedule.is_active
                ? "Nonaktifkan jadwal ujian ini?"
                : "Aktifkan jadwal ujian ini?"
            }
            className="w-full justify-start rounded-lg border-0 px-2"
          >
            <ToggleLeft className="size-3.5" />
            {schedule.is_active ? "Nonaktifkan" : "Aktifkan"}
          </ConfirmSubmitButton>
        </form>
        <form action={updateExamScheduleStatusAction}>
          <input type="hidden" name="id" value={schedule.id} />
          <input type="hidden" name="status" value="cancelled" />
          <ConfirmSubmitButton
            confirmMessage="Batalkan jadwal ujian ini?"
            className="w-full justify-start rounded-lg border-0 px-2"
          >
            Batalkan
          </ConfirmSubmitButton>
        </form>
        <form action={archiveExamScheduleAction}>
          <input type="hidden" name="id" value={schedule.id} />
          <ConfirmSubmitButton
            confirmMessage="Arsipkan jadwal ujian ini?"
            variant="danger"
            className="w-full justify-start rounded-lg border-0 px-2"
          >
            <Archive className="size-3.5" />
            Hapus
          </ConfirmSubmitButton>
        </form>
      </div>
    </details>
  );
}

function PreviewModal({
  schedule,
  onClose,
}: {
  schedule: ExamScheduleRow;
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
        </div>
      </div>
    </div>
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
