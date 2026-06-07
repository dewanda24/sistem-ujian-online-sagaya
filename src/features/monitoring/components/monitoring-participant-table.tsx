"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Eye,
  MoreHorizontal,
  RotateCcw,
  Send,
  ShieldAlert,
  Unlock,
} from "lucide-react";

import { StatusPill } from "@/components/dashboard/status-pill";
import {
  forceSubmitAttemptAction,
  lockAttemptAction,
  markParticipantAbsentAction,
  resetAttemptAction,
  unlockAttemptAction,
} from "@/features/monitoring/actions";
import { MonitoringActionButton } from "@/features/monitoring/components/monitoring-action-button";
import { cn } from "@/lib/utils";

type MonitoringParticipant = {
  id: string;
  status?: string | null;
  started_at?: string | null;
  submitted_at?: string | null;
  users?:
    | {
        username?: string | null;
        email?: string | null;
        user_profiles?:
          | { full_name?: string | null; nis?: string | null }
          | Array<{ full_name?: string | null; nis?: string | null }>
          | null;
      }
    | Array<{
        username?: string | null;
        email?: string | null;
        user_profiles?:
          | { full_name?: string | null; nis?: string | null }
          | Array<{ full_name?: string | null; nis?: string | null }>
          | null;
      }>
    | null;
  classes?: { name?: string | null } | Array<{ name?: string | null }> | null;
  exam_attempts?:
    | MonitoringAttempt
    | MonitoringAttempt[]
    | null;
};

type MonitoringAttempt = {
  id?: string | null;
  status?: string | null;
  started_at?: string | null;
  submitted_at?: string | null;
  last_saved_at?: string | null;
  locked_at?: string | null;
  lock_reason?: string | null;
  exam_answers?: Array<{ id?: string | null }> | null;
  exam_events?: Array<{
    id?: string | null;
    event_type?: string | null;
    created_at?: string | null;
  }> | null;
};

type MonitoringParticipantTableProps = {
  participants: MonitoringParticipant[];
  canControlSessions: boolean;
  returnTo: string;
  searchQuery?: string;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function statusLabel(status?: string | null, locked?: boolean) {
  if (locked) return "bermasalah";
  if (status === "assigned") return "belum mulai";
  if (status === "in_progress") return "mengerjakan";
  if (status === "submitted") return "selesai";
  if (status === "expired" || status === "cancelled") return "keluar";
  if (status === "absent") return "tidak hadir";
  return status ?? "belum mulai";
}

export function MonitoringParticipantTable({
  participants,
  canControlSessions,
  returnTo,
  searchQuery = "",
}: MonitoringParticipantTableProps) {
  const [detail, setDetail] = useState<MonitoringParticipant | null>(null);
  const filteredParticipants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return participants;

    return participants.filter((participant) => {
      const user = firstRelation(participant.users);
      const profile = firstRelation(user?.user_profiles);

      return [
        profile?.full_name,
        profile?.nis,
        user?.username,
        user?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [participants, searchQuery]);

  if (filteredParticipants.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="font-medium text-[#0F172A]">Tidak ada peserta</div>
          <p className="mt-1 text-sm text-[#64748B]">
            Peserta akan tampil setelah jadwal memiliki peserta atau filter cocok.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-[#E2E8F0] text-xs uppercase text-[#64748B]">
            <tr className="h-10">
              <th className="px-3 py-2 font-medium">Peserta</th>
              <th className="w-32 px-3 py-2 font-medium">Kelas</th>
              <th className="w-36 px-3 py-2 font-medium">Progres</th>
              <th className="w-32 px-3 py-2 font-medium">Status</th>
              <th className="w-24 px-3 py-2 font-medium">Pelanggaran</th>
              <th className="w-24 px-3 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredParticipants.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                canControlSessions={canControlSessions}
                returnTo={returnTo}
                onDetail={() => setDetail(participant)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 md:hidden">
        {filteredParticipants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            canControlSessions={canControlSessions}
            returnTo={returnTo}
            onDetail={() => setDetail(participant)}
          />
        ))}
      </div>

      {detail ? (
        <DetailDrawer
          participant={detail}
          canControlSessions={canControlSessions}
          returnTo={returnTo}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </div>
  );
}

function ParticipantRow({
  participant,
  canControlSessions,
  returnTo,
  onDetail,
}: {
  participant: MonitoringParticipant;
  canControlSessions: boolean;
  returnTo: string;
  onDetail: () => void;
}) {
  const info = getParticipantInfo(participant);

  return (
    <tr className="h-16 hover:bg-[#F8FAFC]">
      <td className="min-w-0 px-3 py-2">
        <div className="line-clamp-1 font-medium text-[#0F172A]">
          {info.name}
        </div>
        <div className="mt-1 line-clamp-1 text-xs text-[#64748B]">
          {info.identity}
        </div>
      </td>
      <td className="truncate px-3 py-2 text-[#0F172A]">{info.className}</td>
      <td className="px-3 py-2">
        <Progress answerCount={info.answerCount} />
      </td>
      <td className="px-3 py-2">
        <StatusPill value={info.status} />
      </td>
      <td className="px-3 py-2">
        <ViolationBadge count={info.eventCount} />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onDetail}
            title="Detail"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            <Eye className="size-3.5" />
            <span className="sr-only">Detail</span>
          </button>
          <MoreMenu
            participant={participant}
            canControlSessions={canControlSessions}
            returnTo={returnTo}
          />
        </div>
      </td>
    </tr>
  );
}

function ParticipantCard({
  participant,
  canControlSessions,
  returnTo,
  onDetail,
}: {
  participant: MonitoringParticipant;
  canControlSessions: boolean;
  returnTo: string;
  onDetail: () => void;
}) {
  const info = getParticipantInfo(participant);

  return (
    <article className="max-h-[124px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
      <div className="line-clamp-1 text-sm font-medium text-[#0F172A]">
        {info.name}
      </div>
      <div className="mt-1 flex items-center gap-1 overflow-hidden text-xs text-[#64748B]">
        <span className="truncate">{info.className}</span>
        <StatusPill value={info.status} />
        <ViolationBadge count={info.eventCount} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Progress answerCount={info.answerCount} compact />
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onDetail}
            className="rounded-xl border border-[#E2E8F0] px-2.5 py-1 text-xs"
          >
            Detail
          </button>
          <MoreMenu
            participant={participant}
            canControlSessions={canControlSessions}
            returnTo={returnTo}
            compact
          />
        </div>
      </div>
    </article>
  );
}

function MoreMenu({
  participant,
  canControlSessions,
  returnTo,
  compact = false,
}: {
  participant: MonitoringParticipant;
  canControlSessions: boolean;
  returnTo: string;
  compact?: boolean;
}) {
  const attempt = firstRelation(participant.exam_attempts);

  return (
    <details className="relative">
      <summary
        className={cn(
          "inline-flex cursor-pointer list-none items-center justify-center rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC]",
          compact ? "h-7 px-2 text-xs" : "h-7 w-7",
        )}
      >
        <MoreHorizontal className="size-3.5" />
      </summary>
      <div className="absolute right-0 z-30 mt-2 grid min-w-44 gap-1 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-[#64748B] hover:bg-[#F8FAFC]"
        >
          <Eye className="size-3.5" />
          Lihat Jawaban
        </button>
        {canControlSessions ? (
          <ActionForms participant={participant} attempt={attempt} returnTo={returnTo} />
        ) : null}
      </div>
    </details>
  );
}

function ActionForms({
  participant,
  attempt,
  returnTo,
}: {
  participant: MonitoringParticipant;
  attempt: MonitoringAttempt | null;
  returnTo: string;
}) {
  if (attempt?.id) {
    return (
      <>
        <form action={forceSubmitAttemptAction}>
          <input type="hidden" name="attempt_id" value={attempt.id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <MonitoringActionButton
            className="w-full justify-start rounded-lg border-0 px-2"
            disabled={attempt.status === "submitted" || attempt.status === "cancelled"}
            confirmMessage="Force submit attempt siswa ini? Jawaban yang tersimpan akan dinilai."
          >
            <Send className="size-3.5" />
            Submit Manual
          </MonitoringActionButton>
        </form>
        {attempt.locked_at ? (
          <form action={unlockAttemptAction}>
            <input type="hidden" name="attempt_id" value={attempt.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <MonitoringActionButton
              className="w-full justify-start rounded-lg border-0 px-2"
              confirmMessage="Buka lock attempt siswa ini? Siswa bisa lanjut mengerjakan."
            >
              <Unlock className="size-3.5" />
              Unlock
            </MonitoringActionButton>
          </form>
        ) : (
          <form action={lockAttemptAction}>
            <input type="hidden" name="attempt_id" value={attempt.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <input
              type="hidden"
              name="lock_reason"
              value="Dikunci dari monitoring ujian."
            />
            <MonitoringActionButton
              className="w-full justify-start rounded-lg border-0 px-2"
              disabled={attempt.status !== "in_progress"}
              confirmMessage="Kunci attempt siswa ini? Siswa tidak bisa menyimpan jawaban atau submit sampai dibuka."
            >
              <ShieldAlert className="size-3.5" />
              Catatan Pengawas
            </MonitoringActionButton>
          </form>
        )}
        <form action={resetAttemptAction}>
          <input type="hidden" name="attempt_id" value={attempt.id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <MonitoringActionButton
            className="w-full justify-start rounded-lg border-0 px-2"
            variant="danger"
            disabled={attempt.status === "cancelled"}
            confirmMessage="Reset attempt siswa ini? Attempt lama ditandai cancelled dan siswa bisa mulai ulang."
          >
            <RotateCcw className="size-3.5" />
            Reset Attempt
          </MonitoringActionButton>
        </form>
      </>
    );
  }

  if (participant.status === "absent") {
    return null;
  }

  return (
    <form action={markParticipantAbsentAction}>
      <input type="hidden" name="participant_id" value={participant.id} />
      <input type="hidden" name="return_to" value={returnTo} />
      <MonitoringActionButton
        className="w-full justify-start rounded-lg border-0 px-2"
        variant="danger"
        confirmMessage="Tandai peserta ini tidak hadir?"
      >
        Tidak Hadir
      </MonitoringActionButton>
    </form>
  );
}

function DetailDrawer({
  participant,
  canControlSessions,
  returnTo,
  onClose,
}: {
  participant: MonitoringParticipant;
  canControlSessions: boolean;
  returnTo: string;
  onClose: () => void;
}) {
  const info = getParticipantInfo(participant);
  const attempt = firstRelation(participant.exam_attempts);
  const events = attempt?.exam_events ?? [];

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Tutup detail monitoring"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-[#E2E8F0] bg-[#F8FAFC] p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">{info.name}</h2>
            <p className="mt-1 text-sm text-[#64748B]">{info.identity}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm"
          >
            Tutup
          </button>
        </div>

        <div className="mt-5 grid gap-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Kelas" value={info.className} />
            <DetailItem label="Status" value={info.status} badge />
            <DetailItem label="Waktu mulai" value={formatDateTime(attempt?.started_at ?? participant.started_at)} />
            <DetailItem label="Waktu selesai" value={formatDateTime(attempt?.submitted_at ?? participant.submitted_at)} />
            <DetailItem label="Last Save" value={formatDateTime(attempt?.last_saved_at)} />
            <DetailItem label="Progres" value={`${info.answerCount} jawaban tersimpan`} />
          </div>

          <section className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <h3 className="font-semibold text-[#0F172A]">Jawaban</h3>
            <p className="mt-2 text-sm text-[#64748B]">
              {info.answerCount} jawaban tersimpan.
            </p>
          </section>

          <section className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <h3 className="font-semibold text-[#0F172A]">Riwayat Pelanggaran</h3>
            <div className="mt-3 grid gap-2">
              {events.length === 0 ? (
                <p className="text-sm text-[#64748B]">Tidak ada event.</p>
              ) : (
                events.slice(0, 8).map((event) => (
                  <div
                    key={event.id ?? `${event.event_type}-${event.created_at}`}
                    className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm"
                  >
                    <div className="font-medium text-[#0F172A]">
                      {event.event_type ?? "event"}
                    </div>
                    <div className="text-xs text-[#64748B]">
                      {formatDateTime(event.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {canControlSessions ? (
            <section className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <h3 className="mb-3 font-semibold text-[#0F172A]">Aksi Pengawas</h3>
              <div className="grid gap-2">
                <ActionForms
                  participant={participant}
                  attempt={attempt}
                  returnTo={returnTo}
                />
              </div>
            </section>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function DetailItem({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
      <div className="text-xs text-[#64748B]">{label}</div>
      <div className="mt-1 font-medium text-[#0F172A]">
        {badge ? <StatusPill value={value} /> : value || "-"}
      </div>
    </div>
  );
}

function Progress({
  answerCount,
  compact = false,
}: {
  answerCount: number;
  compact?: boolean;
}) {
  const width = Math.min(100, answerCount > 0 ? 45 + answerCount : 0);

  return (
    <div className={compact ? "w-24" : ""}>
      <div className="text-xs font-medium text-[#0F172A]">
        {answerCount} jawaban
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]">
        <div className="h-full bg-[#2563EB]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ViolationBadge({ count }: { count: number }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-7 justify-center rounded-md px-2 py-1 text-xs font-medium ring-1",
        count >= 3
          ? "bg-[#EF4444]/10 text-[#EF4444] ring-[#EF4444]/20"
          : count > 0
            ? "bg-[#F59E0B]/10 text-[#F59E0B] ring-[#F59E0B]/20"
            : "bg-[#F8FAFC] text-[#64748B] ring-[#E2E8F0]",
      )}
    >
      {count}
    </span>
  );
}

function getParticipantInfo(participant: MonitoringParticipant) {
  const user = firstRelation(participant.users);
  const profile = firstRelation(user?.user_profiles);
  const classItem = firstRelation(participant.classes);
  const attempt = firstRelation(participant.exam_attempts);
  const answerCount = attempt?.exam_answers?.length ?? 0;
  const eventCount = attempt?.exam_events?.length ?? 0;
  const locked = Boolean(attempt?.locked_at);

  return {
    name: profile?.full_name ?? user?.username ?? "-",
    identity: profile?.nis ?? user?.email ?? user?.username ?? "",
    className: classItem?.name ?? "-",
    answerCount,
    eventCount,
    status: statusLabel(attempt?.status ?? participant.status, locked),
  };
}
