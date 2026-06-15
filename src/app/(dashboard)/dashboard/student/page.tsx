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
      <section className="rounded-lg bg-blue-700 p-5 text-white sm:p-6">
        <p className="text-sm font-medium text-blue-100">Halo, {studentName}</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Ringkasan ujian, jadwal, dan informasi penting untuk siswa.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
          Lihat ujian yang tersedia, jadwal terdekat, dan hasil ujian yang sudah
          selesai.
        </p>
      </section>

      <StudentDashboardSummary
        activeCount={activeSchedules.length}
        upcomingCount={upcomingSchedules.length}
        historyCount={attempts.length}
      />

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Ujian Saya
            </h2>
            <p className="text-sm text-slate-600">
              Ujian yang dapat dikerjakan akan tampil di sini.
            </p>
          </div>
          <Link
            href="/dashboard/student/active-exams"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Lihat semua
          </Link>
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

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Jadwal Ujian Terdekat
              </h2>
              <p className="text-sm text-slate-600">
                Jadwal ujian berikutnya untuk kelasmu.
              </p>
            </div>
            <Link
              href="/dashboard/student/schedules"
              className="inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
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
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              Belum ada jadwal ujian terdekat.
            </p>
          )}
        </div>

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
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-bold text-slate-950">Hasil Terakhir</h2>
        <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          Belum ada hasil ujian yang dapat ditampilkan.
        </p>
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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Hasil Terakhir</h2>
          <p className="mt-1 text-sm text-slate-600">
            {subject?.code ?? "-"} - {subject?.name ?? "Mata pelajaran"}
          </p>
        </div>
        <ExamStatusBadge status="submitted" />
      </div>

      <div className="mt-5 rounded-lg bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-600">
          {schedule?.title ?? "Ujian"}
        </p>
        <p className="mt-2 text-3xl font-bold text-slate-950">
          {canShowScore ? scoreText(attempt.score, attempt.max_score) : "Menunggu"}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Dikumpulkan:{" "}
          {attempt.submitted_at ? formatJakartaDateTime(attempt.submitted_at) : "-"}
        </p>
      </div>

      <Link
        href="/dashboard/student/history"
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Lihat Riwayat
      </Link>
    </div>
  );
}
