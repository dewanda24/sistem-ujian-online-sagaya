import { startExamAction } from "@/features/exam-room/actions";
import { getStudentExamSchedules } from "@/features/exam-room/queries";
import {
  firstRelation,
  getStudentSubmittedAttempts,
} from "@/features/results/queries";
import {
  type ActiveExamCardExam,
} from "@/features/student-dashboard/components/active-exam-card";
import { type StudentExamStatus } from "@/features/student-dashboard/components/exam-status-badge";
import { StudentDashboardClient } from "@/features/student-dashboard/components/student-dashboard-client";
import { type UpcomingExamCardExam } from "@/features/student-dashboard/components/upcoming-exam-card";
import { requireRole } from "@/lib/auth/require-role";
import { formatJakartaDate, formatJakartaDateTime } from "@/lib/date-time";

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
    subjectName: schedule.exam_packages?.subjects?.name ?? "Mata Pelajaran",
    startAt: schedule.start_at as string,
    endAt: schedule.end_at as string,
    durationMinutes: schedule.exam_packages?.duration_minutes,
    status: getExamStatus(schedule, now),
    attemptId: getActiveAttemptId(schedule),
    tokenRequired: schedule.token_required,
    schoolOrClassName: schedule.academic_years?.name ?? schedule.title,
  };
}

function toUpcomingCard(schedule: StudentSchedule, now: Date): UpcomingExamCardExam {
  return {
    id: schedule.id as string,
    title: schedule.title as string,
    subjectCode: schedule.exam_packages?.subjects?.code ?? "-",
    subjectName: schedule.exam_packages?.subjects?.name ?? "Mata Pelajaran",
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
    .slice(0, 5);

  const latestAttempt = attempts[0] ?? null;

  // Determine active hero card and status
  let activeExam: ActiveExamCardExam | null = null;
  let statusType: "active" | "empty" | "waiting_grading" | "result_ready" = "empty";

  if (activeSchedules.length > 0) {
    activeExam = toExamCard(activeSchedules[0], now);
    statusType = "active";
  } else if (latestAttempt) {
    const schedule = firstRelation(latestAttempt.exam_schedules);
    const examPackage = firstRelation(schedule?.exam_packages);
    const subject = firstRelation(examPackage?.subjects);
    const canShowScore =
      Boolean(examPackage?.show_result) &&
      latestAttempt.grading_status !== "needs_manual_grading" &&
      latestAttempt.score !== null &&
      latestAttempt.score !== undefined;

    // If submitted recently (within last 3 days) and no active exam, show as last activity card
    const isRecent =
      latestAttempt.submitted_at &&
      now.getTime() - new Date(latestAttempt.submitted_at).getTime() < 3 * 24 * 60 * 60 * 1000;

    if (isRecent) {
      activeExam = {
        id: schedule?.id ?? latestAttempt.id,
        title: schedule?.title ?? "Ujian",
        subjectCode: subject?.code ?? "-",
        subjectName: subject?.name ?? "Mata Pelajaran",
        startAt: schedule?.start_at ?? latestAttempt.started_at ?? now.toISOString(),
        endAt: schedule?.end_at ?? latestAttempt.submitted_at ?? now.toISOString(),
        status: "submitted",
        score: latestAttempt.score,
        maxScore: latestAttempt.max_score,
        gradingStatus: latestAttempt.grading_status,
        showResult: examPackage?.show_result,
      };

      statusType = canShowScore ? "result_ready" : "waiting_grading";
    }
  }

  return (
    <StudentDashboardClient
      studentName={studentName}
      activeExam={activeExam}
      activeExamCount={activeSchedules.length}
      upcomingExams={upcomingSchedules.map((s) => toUpcomingCard(s, now))}
      latestAttempts={attempts}
      startExamAction={startExamAction}
      statusType={statusType}
    />
  );
}
