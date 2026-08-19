"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  TableActionButton,
  TableActions,
  TableActionSubmit,
} from "@/components/dashboard/table-actions";
import { UI_LABELS } from "@/constants/ui-labels";
import {
  forceSubmitAttemptAction,
  lockAttemptAction,
  markParticipantAbsentAction,
  resetAttemptAction,
  unlockAttemptAction,
} from "@/features/monitoring/actions";
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
  last_activity_at?: string | null;
  locked_at?: string | null;
  lock_reason?: string | null;
  exam_answers?: Array<{ id?: string | null }> | null;
  exam_events?: Array<{
    id?: string | null;
    event_type?: string | null;
    created_at?: string | null;
  }> | null;
};

type ParticipantIssue = {
  label: string;
  severity: "danger" | "warning" | "info";
  recommendation: string;
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
  if (locked) return "locked";
  if (status === "assigned") return "assigned";
  if (status === "in_progress") return "in_progress";
  if (status === "submitted") return "submitted";
  if (status === "expired" || status === "cancelled") return status;
  if (status === "absent") return "absent";
  return status ?? "assigned";
}

export function MonitoringParticipantTable({
  participants,
  canControlSessions,
  returnTo,
  searchQuery = "",
}: MonitoringParticipantTableProps) {
  const [detail, setDetail] = useState<MonitoringParticipant | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
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
  const pageCount = Math.max(1, Math.ceil(filteredParticipants.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pagedParticipants = filteredParticipants.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  if (filteredParticipants.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <EmptyState
          title="Tidak ada peserta"
          description="Peserta akan tampil setelah jadwal memiliki peserta atau filter cocok."
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
              <th className="px-3 py-2 font-medium">Peserta</th>
              <th className="w-32 px-3 py-2 font-medium">Kelas</th>
              <th className="w-36 px-3 py-2 font-medium">Progres</th>
              <th className="w-32 px-3 py-2 font-medium">Status</th>
              <th className="w-24 px-3 py-2 font-medium">Kejadian</th>
              <th className="w-24 px-3 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {pagedParticipants.map((participant) => (
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
        {pagedParticipants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            canControlSessions={canControlSessions}
            returnTo={returnTo}
            onDetail={() => setDetail(participant)}
          />
        ))}
      </div>

      <TablePagination
        currentPage={currentPage}
        pageCount={pageCount}
        rowsPerPage={rowsPerPage}
        total={filteredParticipants.length}
        onPageChange={setPage}
      />

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

function TablePagination({
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
        {start}-{end} dari {total} peserta
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
  const issue = getPrimaryIssue(participant);

  return (
    <tr
      className={cn(
        "h-16 hover:bg-[#F8FAFC]",
        issue?.severity === "danger" && "bg-red-50/70 hover:bg-red-50/90",
        issue?.severity === "warning" && "bg-amber-50/70 hover:bg-amber-50/90"
      )}
    >
      <td className="min-w-0 px-3 py-2">
        <div className="line-clamp-1 font-medium text-[#0F172A]">
          {info.name}
        </div>
        <div className="mt-1 line-clamp-1 text-xs text-[#64748B]">
          {info.identity}
        </div>
        {issue ? <IssueBadge issue={issue} className="mt-1" /> : null}
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
        <ParticipantActions
          participant={participant}
          canControlSessions={canControlSessions}
          returnTo={returnTo}
          onDetail={onDetail}
        />
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
  const issue = getPrimaryIssue(participant);

  return (
    <article
      className={cn(
        "max-h-[124px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm",
        issue?.severity === "danger" && "bg-red-50/70 border-red-200",
        issue?.severity === "warning" && "bg-amber-50/70 border-amber-200"
      )}
    >
      <div className="line-clamp-1 text-sm font-medium text-[#0F172A]">
        {info.name}
      </div>
      <div className="mt-1 flex items-center gap-1 overflow-hidden text-xs text-[#64748B]">
        <span className="truncate">{info.className}</span>
        <StatusPill value={info.status} />
        <ViolationBadge count={info.eventCount} />
      </div>
      {issue ? <IssueBadge issue={issue} className="mt-2" /> : null}
      <div className="mt-2 flex items-center justify-between gap-2">
        <Progress answerCount={info.answerCount} compact />
        <div className="flex items-center gap-1.5">
          <ParticipantActions
            participant={participant}
            canControlSessions={canControlSessions}
            returnTo={returnTo}
            onDetail={onDetail}
          />
        </div>
      </div>
    </article>
  );
}

function ParticipantActions({
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
  const attempt = firstRelation(participant.exam_attempts);

  return (
    <TableActions>
      <TableActionButton icon="eye" onClick={onDetail}>
        Detail
      </TableActionButton>
      <TableActionButton icon="eye">Lihat Jawaban</TableActionButton>
      {canControlSessions ? (
        <ActionForms participant={participant} attempt={attempt} returnTo={returnTo} />
      ) : null}
    </TableActions>
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
          <TableActionSubmit
            icon="send"
            disabled={attempt.status === "submitted" || attempt.status === "cancelled"}
            confirmMessage="Selesaikan ujian siswa ini sekarang? Jawaban yang tersimpan akan dinilai."
          >
            Selesaikan Ujian
          </TableActionSubmit>
        </form>
        {attempt.locked_at ? (
          <form action={unlockAttemptAction}>
            <input type="hidden" name="attempt_id" value={attempt.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <TableActionSubmit
              icon="unlock"
              confirmMessage="Buka kunci pengerjaan siswa ini? Siswa bisa lanjut mengerjakan."
            >
              Buka Kunci
            </TableActionSubmit>
          </form>
        ) : (
          <form action={lockAttemptAction}>
            <input type="hidden" name="attempt_id" value={attempt.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <input
              type="hidden"
              name="lock_reason"
              value="Dikunci dari pengawasan ujian."
            />
            <TableActionSubmit
              icon="shield-alert"
              disabled={attempt.status !== "in_progress"}
              confirmMessage="Kunci pengerjaan siswa ini? Siswa tidak bisa menyimpan jawaban atau menyelesaikan ujian sampai dibuka."
            >
              Catatan Pengawas
            </TableActionSubmit>
          </form>
        )}
        <form action={resetAttemptAction}>
          <input type="hidden" name="attempt_id" value={attempt.id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <TableActionSubmit
            icon="rotate-ccw"
            tone="danger"
            confirmationText="RESET"
            disabled={attempt.status === "cancelled"}
            confirmMessage="Mulai ulang pengerjaan siswa ini? Pengerjaan lama dibatalkan dan siswa bisa mulai dari awal."
          >
            {UI_LABELS.actions.resetAttempt}
          </TableActionSubmit>
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
      <TableActionSubmit
        tone="danger"
        confirmMessage="Tandai peserta ini tidak hadir?"
      >
        Tidak Hadir
      </TableActionSubmit>
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
  const issues = getParticipantIssues(participant);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Tutup detail pengawasan"
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
            <DetailItem label="Terakhir tersimpan" value={formatDateTime(attempt?.last_saved_at)} />
            <DetailItem label="Aktivitas terakhir" value={formatDateTime(attempt?.last_activity_at)} />
            <DetailItem label="Progres" value={`${info.answerCount} jawaban tersimpan`} />
          </div>

          <section className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <h3 className="font-semibold text-[#0F172A]">Jawaban</h3>
            <p className="mt-2 text-sm text-[#64748B]">
              {info.answerCount} jawaban tersimpan.
            </p>
          </section>

          <section className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <h3 className="font-semibold text-[#0F172A]">Rekomendasi Tindakan</h3>
            <div className="mt-3 grid gap-2">
              {issues.length === 0 ? (
                <p className="text-sm text-[#64748B]">
                  Tidak ada masalah aktif. Lanjutkan pemantauan berkala.
                </p>
              ) : (
                issues.map((issue) => (
                  <div
                    key={`${issue.label}-${issue.recommendation}`}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      issue.severity === "danger" &&
                        "border-[#EF4444]/25 bg-[#EF4444]/10 text-[#991B1B]",
                      issue.severity === "warning" &&
                        "border-[#F59E0B]/25 bg-[#F59E0B]/10 text-[#92400E]",
                      issue.severity === "info" &&
                        "border-[#2563EB]/20 bg-[#2563EB]/10 text-[#1E3A8A]",
                    )}
                  >
                    <div className="font-medium">{issue.label}</div>
                    <div className="mt-1">{issue.recommendation}</div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <h3 className="font-semibold text-[#0F172A]">Riwayat Kejadian</h3>
            <div className="mt-3 grid gap-2">
              {events.length === 0 ? (
                <p className="text-sm text-[#64748B]">Tidak ada kejadian.</p>
              ) : (
                events.slice(0, 8).map((event) => (
                  <div
                    key={event.id ?? `${event.event_type}-${event.created_at}`}
                    className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm"
                  >
                    <div className="font-medium text-[#0F172A]">
                      {formatEventType(event.event_type)}
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

function IssueBadge({
  issue,
  className,
}: {
  issue: ParticipantIssue;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full truncate rounded-md px-2 py-1 text-xs font-medium ring-1",
        issue.severity === "danger" &&
          "bg-[#EF4444]/10 text-[#EF4444] ring-[#EF4444]/20",
        issue.severity === "warning" &&
          "bg-[#F59E0B]/10 text-[#92400E] ring-[#F59E0B]/20",
        issue.severity === "info" &&
          "bg-[#2563EB]/10 text-[#1D4ED8] ring-[#2563EB]/20",
        className,
      )}
      title={issue.recommendation}
    >
      {issue.label}
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

function getPrimaryIssue(participant: MonitoringParticipant) {
  return getParticipantIssues(participant)[0] ?? null;
}

function getParticipantIssues(participant: MonitoringParticipant): ParticipantIssue[] {
  const attempt = firstRelation(participant.exam_attempts);
  const events = attempt?.exam_events ?? [];
  const status = attempt?.status ?? participant.status;
  const violationCount = countViolationEvents(events);
  const failedSubmitCount = countEvents(events, "failed_submit");
  const latestEvent = getLatestEvent(events);
  const latestEventType = latestEvent?.event_type ?? null;
  const issues: ParticipantIssue[] = [];

  if (attempt?.locked_at) {
    issues.push({
      label: "Pengerjaan terkunci",
      severity: "danger",
      recommendation:
        "Cek alasan kunci dan riwayat kejadian. Buka kunci hanya jika siswa sudah boleh melanjutkan.",
    });
  }

  if (failedSubmitCount > 0) {
    issues.push({
      label: `${failedSubmitCount} gagal mengumpulkan`,
      severity: "danger",
      recommendation:
        "Periksa jumlah jawaban tersimpan dan aktivitas terakhir. Gunakan Selesaikan Ujian bila jawaban sudah layak dikunci.",
    });
  }

  if (violationCount >= 5) {
    issues.push({
      label: `${violationCount} pelanggaran`,
      severity: "danger",
      recommendation:
        "Tinjau riwayat kejadian. Pertimbangkan kunci pengerjaan atau selesaikan ujian sesuai kebijakan.",
    });
  } else if (violationCount >= 3) {
    issues.push({
      label: `${violationCount} pelanggaran`,
      severity: "warning",
      recommendation:
        "Beri peringatan ke siswa dan pantau apakah pelanggaran berulang.",
    });
  }

  if (status === "in_progress" && isAttemptOffline(attempt)) {
    issues.push({
      label: "Tidak Terhubung",
      severity: "warning",
      recommendation:
        "Hubungi siswa atau tunggu tersambung kembali. Jangan selesaikan ujian sebelum memastikan jawaban terakhir tersimpan.",
    });
  }

  if (latestEventType === "disconnected" || latestEventType === "offline") {
    issues.push({
      label: formatEventType(latestEventType),
      severity: "warning",
      recommendation:
        "Pantau koneksi berikutnya. Jika siswa kembali tersambung, pastikan jawaban tersimpan sebelum dikumpulkan.",
    });
  }

  if (latestEventType === "online" && status === "in_progress") {
    issues.push({
      label: "Baru tersambung kembali",
      severity: "info",
      recommendation:
        "Tunggu beberapa detik agar penyimpanan tertunda tersinkron, lalu cek aktivitas terakhir.",
    });
  }

  if (status === "expired") {
    issues.push({
      label: "Waktu habis",
      severity: "warning",
      recommendation:
        "Pastikan pengerjaan masuk laporan sebagai waktu habis dan cek apakah perlu tindakan manual.",
    });
  }

  return dedupeIssues(issues);
}

function countEvents(
  events: NonNullable<MonitoringAttempt["exam_events"]>,
  eventType: string,
) {
  return events.filter((event) => event.event_type === eventType).length;
}

function countViolationEvents(events: NonNullable<MonitoringAttempt["exam_events"]>) {
  const violationTypes = new Set([
    "tab_blur",
    "visibility_hidden",
    "copy_attempt",
    "paste_attempt",
    "fullscreen_exit",
    "before_unload",
  ]);

  return events.filter((event) =>
    event.event_type ? violationTypes.has(event.event_type) : false,
  ).length;
}

function getLatestEvent(events: NonNullable<MonitoringAttempt["exam_events"]>) {
  return events
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime(),
    )[0];
}

function isAttemptOffline(attempt: MonitoringAttempt | null) {
  if (!attempt?.last_activity_at) {
    return true;
  }

  return Date.now() - new Date(attempt.last_activity_at).getTime() > 5 * 60 * 1000;
}

function dedupeIssues(issues: ParticipantIssue[]) {
  const seen = new Set<string>();

  return issues.filter((issue) => {
    if (seen.has(issue.label)) {
      return false;
    }

    seen.add(issue.label);
    return true;
  });
}

function formatEventType(eventType?: string | null) {
  const labels: Record<string, string> = {
    tab_blur: "Jendela kehilangan fokus",
    tab_focus: "Jendela aktif kembali",
    visibility_hidden: "Tab disembunyikan",
    visibility_visible: "Tab terlihat kembali",
    copy_attempt: "Percobaan copy/shortcut",
    paste_attempt: "Percobaan paste",
    fullscreen_exit: "Keluar fullscreen",
    before_unload: "Refresh/tutup halaman",
    offline: "Tidak terhubung",
    online: "Online kembali",
    disconnected: "Terputus",
    failed_submit: "Gagal mengumpulkan",
  };

  return eventType ? (labels[eventType] ?? eventType) : "Kejadian";
}
