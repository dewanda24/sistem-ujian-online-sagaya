import Link from "next/link";

import {
  ActiveExamCard,
  type ActiveExamCardExam,
} from "@/features/student-dashboard/components/active-exam-card";
import { EmptyExamState } from "@/features/student-dashboard/components/empty-exam-state";
import {
  ExamStatusBadge,
  type StudentExamStatus,
} from "@/features/student-dashboard/components/exam-status-badge";
import {
  UpcomingExamCard,
  type UpcomingExamCardExam,
} from "@/features/student-dashboard/components/upcoming-exam-card";
import { StudentDashboardSummary } from "@/features/student-dashboard/components/student-dashboard-summary";
import { PwaInstallBanner } from "@/features/student-dashboard/components/pwa-install-banner";
import { startExamAction } from "@/features/exam-room/actions";
import { getStudentExamSchedules } from "@/features/exam-room/queries";
import {
  firstRelation,
  getStudentSubmittedAttempts,
} from "@/features/results/queries";
import { requireRole } from "@/lib/auth/require-role";
import { formatJakartaDateTime } from "@/lib/date-time";

type StudentSchedule = Awaited<ReturnType<typeof getStudentExamSchedules>>[number];
type StudentAttemptStatus = { id?: string; status?: string | null };

function getParticipant(schedule: StudentSchedule) {
  return schedule.exam_participants?.[0] ?? null;
}

function getExamStatus(schedule: StudentSchedule, now: Date): StudentExamStatus {
  const participant = getParticipant(schedule);
  const attempts = participant?.exam_attempts ?? [];
  const hasSubmitted =
    participant?.status === "submitted" ||
    attempts.some((attempt: StudentAttemptStatus) => attempt.status === "submitted");
  const hasInProgress =
    participant?.status === "in_progress" ||
    attempts.some((attempt: StudentAttemptStatus) => attempt.status === "in_progress");
  const endAt = schedule.end_at ? new Date(schedule.end_at) : null;

  if (hasSubmitted) {
    return "submitted";
  }

  if (hasInProgress) {
    return "in_progress";
  }

  if (endAt && endAt < now) {
    return "late";
  }

  return "not_started";
}

function getActiveAttemptId(schedule: StudentSchedule) {
  return (
    getParticipant(schedule)?.exam_attempts?.find(
      (attempt: StudentAttemptStatus) => attempt.status === "in_progress",
    )?.id ?? null
  );
}

function toExamCard(schedule: StudentSchedule, now: Date): ActiveExamCardExam {
  return {
    id: schedule.id as string,
    title: schedule.title as string,
    subjectCode: schedule.exam_packages?.subjects?.code ?? "-",
    subjectName: schedule.exam_packages?.subjects?.name ?? "Mata pelajaran",
    startAt: schedule.start_at as string,
    endAt: schedule.end_at as string,
    durationMinutes: schedule.exam_packages?.duration_minutes,
    status: getExamStatus(schedule, now),
    attemptId: getActiveAttemptId(schedule),
    tokenRequired: schedule.token_required,
  };
}

function toUpcomingCard(schedule: StudentSchedule, now: Date): UpcomingExamCardExam {
  return {
    id: schedule.id as string,
    title: schedule.title as string,
    subjectCode: schedule.exam_packages?.subjects?.code ?? "-",
    subjectName: schedule.exam_packages?.subjects?.name ?? "Mata pelajaran",
    startAt: schedule.start_at as string,
    endAt: schedule.end_at as string,
    status: getExamStatus(schedule, now),
  };
}

function isActiveNow(schedule: StudentSchedule, now: Date) {
  const startAt = schedule.start_at ? new Date(schedule.start_at) : null;
  const endAt = schedule.end_at ? new Date(schedule.end_at) : null;

  return (
    ["scheduled", "active"].includes(schedule.status) &&
    Boolean(startAt && endAt && startAt <= now && endAt >= now)
  );
}

function isUpcoming(schedule: StudentSchedule, now: Date) {
  const startAt = schedule.start_at ? new Date(schedule.start_at) : null;

  return (
    ["scheduled", "active"].includes(schedule.status) &&
    Boolean(startAt && startAt > now)
  );
}

function scoreText(score?: number | null, maxScore?: number | null) {
  const max = Number(maxScore ?? 0);

  if (max <= 0) {
    return "Menunggu hasil";
  }

  return `${Number(score ?? 0)} / ${max}`;
}

export default async function StudentDashboardPage() {
  const user = await requireRole("student");
  const [schedules, attempts] = await Promise.all([
    getStudentExamSchedules(),
    getStudentSubmittedAttempts(),
  ]);
  const now = new Date();
  const studentName = user.user_profiles?.full_name ?? user.username;
  const activeSchedules = schedules.filter((schedule) => isActiveNow(schedule, now));
  const upcomingSchedules = schedules
    .filter((schedule) => isUpcoming(schedule, now))
    .slice(0, 3);
  const latestAttempt = attempts[0] ?? null;

  return (
    <div className="space-y-6">
      {/* PWA 1-Click Install Banner for Mobile Students */}
      <PwaInstallBanner />

      {/* Friendly Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-600 p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold text-blue-100 backdrop-blur-xs">
              <span>👋 Selamat Datang di Portal CBT</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
              Halo, {studentName}!
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Siapkan diri kamu untuk mengikuti ujian dengan tenang dan teliti. Pastikan koneksi internet stabil sebelum mulai.
            </p>
          </div>
        </div>

        {/* Subtle decorative background circles */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-indigo-500/20 blur-2xl" />
      </section>

      {/* Quick Action Navigation Tiles */}
      <StudentDashboardSummary
        activeCount={activeSchedules.length}
        upcomingCount={upcomingSchedules.length}
        historyCount={attempts.length}
      />

      {/* Active Exams Section */}
      <section className="space-y-3.5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 flex items-center gap-2">
              <span>Ujian Saya</span>
              {activeSchedules.length > 0 && (
                <span className="flex size-2.5 rounded-full bg-emerald-500 animate-ping" />
              )}
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Ujian yang aktif dan dapat dikerjakan saat ini.
            </p>
          </div>
          {activeSchedules.length > 1 && (
            <Link
              href="/dashboard/student/active-exams"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50"
            >
              Lihat Semua ({activeSchedules.length})
            </Link>
          )}
        </div>

        {activeSchedules.length > 0 ? (
          <div className="space-y-4">
            {activeSchedules.map((schedule) => (
              <ActiveExamCard
                key={schedule.id}
                exam={toExamCard(schedule, now)}
                action={startExamAction}
              />
            ))}
          </div>
        ) : (
          <EmptyExamState />
        )}
      </section>

      {/* Upcoming & Latest Results Grid */}
      <section className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Upcoming Schedules */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950 sm:text-lg">
                Jadwal Ujian Terdekat
              </h2>
              <p className="text-xs text-slate-500">
                Jadwal ujian berikutnya untuk kelasmu.
              </p>
            </div>
            <Link
              href="/dashboard/student/schedules"
              className="inline-flex h-9 items-center rounded-xl bg-slate-900 px-3.5 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800"
            >
              Lihat Jadwal
            </Link>
          </div>

          {upcomingSchedules.length > 0 ? (
            <div className="space-y-3">
              {upcomingSchedules.map((schedule) => (
                <UpcomingExamCard
                  key={schedule.id}
                  exam={toUpcomingCard(schedule, now)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-medium text-slate-500">
              Belum ada jadwal ujian terdekat untuk kelasmu.
            </div>
          )}
        </div>

        {/* Latest Result */}
        <LatestResultCard attempt={latestAttempt} />
      </section>
    </div>
  );
}

function LatestResultCard({
  attempt,
}: {
  attempt: Awaited<ReturnType<typeof getStudentSubmittedAttempts>>[number] | null;
}) {
  if (!attempt) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <h2 className="text-base font-bold text-slate-950 sm:text-lg">Hasil Ujian Terakhir</h2>
        <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-xs font-medium text-slate-500">
          Belum ada riwayat hasil ujian yang dikumpulkan.
        </div>
      </div>
    );
  }

  const schedule = firstRelation(attempt.exam_schedules);
  const examPackage = firstRelation(schedule?.exam_packages);
  const subject = firstRelation(examPackage?.subjects);
  const canShowScore =
    Boolean(examPackage?.show_result) &&
    attempt.grading_status !== "needs_manual_grading";

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-950 sm:text-lg">Hasil Ujian Terakhir</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {subject?.code ?? "-"} - {subject?.name ?? "Mata Pelajaran"}
            </p>
          </div>
          <ExamStatusBadge status="submitted" />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-xs font-bold text-slate-700 truncate">
            {schedule?.title ?? "Ujian"}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-950">
              {canShowScore ? scoreText(attempt.score, attempt.max_score) : "Terkumpul"}
            </span>
            {!canShowScore && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                Menunggu Nilai
              </span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Dikumpulkan: {attempt.submitted_at ? formatJakartaDateTime(attempt.submitted_at) : "-"}
          </p>
        </div>
      </div>

      <Link
        href="/dashboard/student/history"
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800 active:scale-98"
      >
        Lihat Semua Riwayat Nilai
      </Link>
    </div>
  );
}

