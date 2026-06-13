import {
  firstRelation,
  getMonitoringSchedules,
  getScheduleMonitoring,
  type MonitoringScope,
} from "@/features/monitoring/queries";
import type { CurrentUser } from "@/types/auth";

export type RecoverySeverity = "critical" | "warning" | "info";
export type RecoveryIssueType =
  | "failed_submit"
  | "session_conflict"
  | "problem_attempt"
  | "offline_long"
  | "locked_attempt"
  | "expired_attempt";
export type RecoveryActionType =
  | "retry_submit"
  | "force_submit"
  | "reset_attempt"
  | "unlock_attempt"
  | "release_session"
  | "monitor";

export type RecoveryQueueItem = {
  id: string;
  issueType: RecoveryIssueType;
  severity: RecoverySeverity;
  problem: string;
  recommendation: string;
  action: RecoveryActionType;
  participantId: string;
  attemptId: string | null;
  studentName: string;
  identity: string;
  scheduleId: string;
  scheduleTitle: string;
  className: string;
  status: string;
  failedAt: string | null;
  lastSyncAt: string | null;
  lastActivityAt: string | null;
  retryCount: number;
  activeSessionId: string | null;
  activeSessionSeenAt: string | null;
  durationLabel: string;
  eventTimeline: Array<{
    id?: string | null;
    eventType?: string | null;
    createdAt?: string | null;
  }>;
};

export type RecoverySummary = {
  failedSubmit: number;
  sessionConflict: number;
  problemAttempt: number;
  offlineLong: number;
  lockedAttempt: number;
  expiredAttempt: number;
  critical: number;
  warning: number;
  info: number;
};

export type RecoveryCenterData = {
  summary: RecoverySummary;
  queue: RecoveryQueueItem[];
};

type MonitoringParticipant = Awaited<ReturnType<typeof getScheduleMonitoring>>[number];

type MonitoringAttempt = {
  id?: string | null;
  status?: string | null;
  started_at?: string | null;
  submitted_at?: string | null;
  last_saved_at?: string | null;
  last_activity_at?: string | null;
  locked_at?: string | null;
  lock_reason?: string | null;
  active_session_id?: string | null;
  active_session_seen_at?: string | null;
  exam_answers?: Array<{ id?: string | null }> | null;
  exam_events?: Array<{
    id?: string | null;
    event_type?: string | null;
    created_at?: string | null;
    metadata?: Record<string, unknown> | null;
  }> | null;
};

function severityRank(severity: RecoverySeverity) {
  if (severity === "critical") return 0;
  if (severity === "warning") return 1;
  return 2;
}

function eventTime(events: NonNullable<MonitoringAttempt["exam_events"]>, type: string) {
  return events
    .filter((event) => event.event_type === type)
    .map((event) => event.created_at ?? null)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

function countEvents(events: NonNullable<MonitoringAttempt["exam_events"]>, type: string) {
  return events.filter((event) => event.event_type === type).length;
}

function latestEvent(events: NonNullable<MonitoringAttempt["exam_events"]>) {
  return events
    .slice()
    .sort(
      (left, right) =>
        Date.parse(right.created_at ?? "") - Date.parse(left.created_at ?? ""),
    )[0] ?? null;
}

function minutesSince(value?: string | null) {
  if (!value) return null;

  const diff = Date.now() - Date.parse(value);

  if (!Number.isFinite(diff) || diff < 0) return null;

  return Math.floor(diff / 60000);
}

function durationLabel(value?: string | null) {
  const minutes = minutesSince(value);

  if (minutes === null) return "-";
  if (minutes < 60) return `${minutes} menit`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest ? `${hours} jam ${rest} menit` : `${hours} jam`;
}

function userProfile(participant: MonitoringParticipant) {
  const user = firstRelation(participant.users);
  const profile = firstRelation(user?.user_profiles);

  return {
    name: profile?.full_name ?? user?.username ?? "-",
    identity: profile?.nis ?? user?.email ?? user?.username ?? "",
  };
}

function participantClassName(participant: MonitoringParticipant) {
  return firstRelation(participant.classes)?.name ?? "-";
}

function buildIssue(params: {
  participant: MonitoringParticipant;
  attempt: MonitoringAttempt;
  scheduleId: string;
  scheduleTitle: string;
  issueType: RecoveryIssueType;
  severity: RecoverySeverity;
  problem: string;
  recommendation: string;
  action: RecoveryActionType;
  failedAt?: string | null;
}) {
  const profile = userProfile(params.participant);
  const events = params.attempt.exam_events ?? [];
  const status = params.attempt.status ?? params.participant.status ?? "assigned";

  return {
    id: `${params.issueType}:${params.attempt.id ?? params.participant.id}`,
    issueType: params.issueType,
    severity: params.severity,
    problem: params.problem,
    recommendation: params.recommendation,
    action: params.action,
    participantId: params.participant.id as string,
    attemptId: params.attempt.id ?? null,
    studentName: profile.name,
    identity: profile.identity,
    scheduleId: params.scheduleId,
    scheduleTitle: params.scheduleTitle,
    className: participantClassName(params.participant),
    status,
    failedAt: params.failedAt ?? eventTime(events, "failed_submit"),
    lastSyncAt: params.attempt.last_saved_at ?? null,
    lastActivityAt: params.attempt.last_activity_at ?? null,
    retryCount: countEvents(events, "failed_submit"),
    activeSessionId: params.attempt.active_session_id ?? null,
    activeSessionSeenAt: params.attempt.active_session_seen_at ?? null,
    durationLabel: durationLabel(
      params.attempt.last_activity_at ??
        params.attempt.active_session_seen_at ??
        params.attempt.started_at,
    ),
    eventTimeline: events
      .slice()
      .sort(
        (left, right) =>
          Date.parse(right.created_at ?? "") -
          Date.parse(left.created_at ?? ""),
      )
      .slice(0, 10)
      .map((event) => ({
        id: event.id,
        eventType: event.event_type,
        createdAt: event.created_at,
      })),
  } satisfies RecoveryQueueItem;
}

function issuesForParticipant(
  participant: MonitoringParticipant,
  scheduleId: string,
  scheduleTitle: string,
) {
  const attempt = firstRelation(participant.exam_attempts) as MonitoringAttempt | null;
  const issues: RecoveryQueueItem[] = [];

  if (!attempt?.id) {
    return issues;
  }

  const events = attempt.exam_events ?? [];
  const failedSubmitCount = countEvents(events, "failed_submit");
  const lastActivityMinutes = minutesSince(attempt.last_activity_at);
  const activeSessionMinutes = minutesSince(attempt.active_session_seen_at);
  const latest = latestEvent(events);
  const latestType = latest?.event_type ?? null;

  if (failedSubmitCount > 0 && attempt.status !== "submitted") {
    issues.push(
      buildIssue({
        participant,
        attempt,
        scheduleId,
        scheduleTitle,
        issueType: "failed_submit",
        severity: "critical",
        problem: "Failed Submit",
        recommendation: "Force Submit jika jawaban sudah tersimpan; Reset Attempt jika siswa perlu mulai ulang.",
        action: "force_submit",
      }),
    );
  }

  if (
    attempt.status === "in_progress" &&
    attempt.active_session_id &&
    activeSessionMinutes !== null &&
    activeSessionMinutes <= 2
  ) {
    issues.push(
      buildIssue({
        participant,
        attempt,
        scheduleId,
        scheduleTitle,
        issueType: "session_conflict",
        severity: "warning",
        problem: "Session Conflict",
        recommendation: "Release Session jika siswa perlu pindah perangkat atau tab lama tidak dapat ditutup.",
        action: "release_session",
      }),
    );
  }

  if (attempt.locked_at) {
    issues.push(
      buildIssue({
        participant,
        attempt,
        scheduleId,
        scheduleTitle,
        issueType: "locked_attempt",
        severity: minutesSince(attempt.locked_at) !== null && minutesSince(attempt.locked_at)! > 30
          ? "critical"
          : "warning",
        problem: "Locked Attempt",
        recommendation: "Unlock Attempt jika siswa boleh melanjutkan; Force Submit jika harus dikunci selesai.",
        action: "unlock_attempt",
      }),
    );
  }

  if (attempt.status === "expired") {
    issues.push(
      buildIssue({
        participant,
        attempt,
        scheduleId,
        scheduleTitle,
        issueType: "expired_attempt",
        severity: "warning",
        problem: "Expired Attempt",
        recommendation: "Force Submit jika jawaban perlu dinilai; Reset Attempt jika ujian perlu diulang.",
        action: "force_submit",
      }),
    );
  }

  if (
    attempt.status === "in_progress" &&
    lastActivityMinutes !== null &&
    lastActivityMinutes > 10
  ) {
    issues.push(
      buildIssue({
        participant,
        attempt,
        scheduleId,
        scheduleTitle,
        issueType: "offline_long",
        severity: lastActivityMinutes > 30 ? "critical" : "warning",
        problem: "Offline Berkepanjangan",
        recommendation: "Tunggu reconnect singkat; Force Submit atau Reset Attempt jika siswa tidak kembali.",
        action: "force_submit",
      }),
    );
  }

  if (
    attempt.status === "in_progress" &&
    (latestType === "offline" || latestType === "disconnected")
  ) {
    issues.push(
      buildIssue({
        participant,
        attempt,
        scheduleId,
        scheduleTitle,
        issueType: "problem_attempt",
        severity: "info",
        problem: "Attempt Bermasalah",
        recommendation: "Pantau reconnect dan pastikan autosave berjalan sebelum submit.",
        action: "monitor",
      }),
    );
  }

  return issues;
}

function emptySummary(): RecoverySummary {
  return {
    failedSubmit: 0,
    sessionConflict: 0,
    problemAttempt: 0,
    offlineLong: 0,
    lockedAttempt: 0,
    expiredAttempt: 0,
    critical: 0,
    warning: 0,
    info: 0,
  };
}

function summarize(queue: RecoveryQueueItem[]): RecoverySummary {
  const summary = emptySummary();

  for (const item of queue) {
    if (item.issueType === "failed_submit") summary.failedSubmit += 1;
    if (item.issueType === "session_conflict") summary.sessionConflict += 1;
    if (item.issueType === "problem_attempt") summary.problemAttempt += 1;
    if (item.issueType === "offline_long") summary.offlineLong += 1;
    if (item.issueType === "locked_attempt") summary.lockedAttempt += 1;
    if (item.issueType === "expired_attempt") summary.expiredAttempt += 1;
    if (item.severity === "critical") summary.critical += 1;
    if (item.severity === "warning") summary.warning += 1;
    if (item.severity === "info") summary.info += 1;
  }

  return summary;
}

export async function getRecoveryCenterData(
  user: CurrentUser,
): Promise<RecoveryCenterData> {
  const scope: MonitoringScope = user.roles?.name === "teacher" ? "teacher" : "all";
  const schedules = await getMonitoringSchedules({ scope, user });
  const rows = await Promise.all(
    schedules.map(async (schedule) => {
      const participants = await getScheduleMonitoring(
        schedule.id as string,
        {},
        { scope, user },
      );

      return participants.flatMap((participant) =>
        issuesForParticipant(
          participant,
          schedule.id as string,
          String(schedule.title ?? "Jadwal ujian"),
        ),
      );
    }),
  );
  const queue = rows
    .flat()
    .sort((left, right) => {
      const severity = severityRank(left.severity) - severityRank(right.severity);

      if (severity !== 0) return severity;

      return (
        Date.parse(right.failedAt ?? right.lastActivityAt ?? "") -
        Date.parse(left.failedAt ?? left.lastActivityAt ?? "")
      );
    });

  return {
    summary: summarize(queue),
    queue,
  };
}
