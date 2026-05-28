import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

export function firstRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export type ReportAttempt = {
  id: string;
  status: string;
  score: number | null;
  max_score: number | null;
  grading_status: string | null;
  submitted_at: string | null;
  exam_schedules?: {
    id: string;
    title: string;
    exam_packages?: {
      id: string;
      title: string;
      subjects?: {
        id: string;
        code: string;
        name: string;
      } | Array<{
        id: string;
        code: string;
        name: string;
      }> | null;
    } | Array<{
      id: string;
      title: string;
      subjects?: {
        id: string;
        code: string;
        name: string;
      } | Array<{
        id: string;
        code: string;
        name: string;
      }> | null;
    }> | null;
  } | Array<{
    id: string;
    title: string;
    exam_packages?: unknown;
  }> | null;
  users?: {
    id: string;
    username: string;
    email: string;
    user_profiles?: {
      full_name?: string | null;
      nis?: string | null;
    } | Array<{
      full_name?: string | null;
      nis?: string | null;
    }> | null;
  } | Array<{
    id: string;
    username: string;
    email: string;
    user_profiles?: unknown;
  }> | null;
  exam_participants?: {
    classes?: {
      id: string;
      name: string;
    } | Array<{
      id: string;
      name: string;
    }> | null;
  } | Array<{
    classes?: unknown;
  }> | null;
};

export async function getReportAttempts(): Promise<ReportAttempt[]> {
  const user = await requireAuth();
  const supabase = await createClient();
  let scheduleIds: string[] | null = null;

  if (user.roles?.name === "teacher") {
    scheduleIds = await getTeacherScheduleIds(user.id);

    if (scheduleIds.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from("exam_attempts")
    .select(
      "id, status, score, max_score, grading_status, submitted_at, users(id, username, email, user_profiles(full_name, nis)), exam_participants(classes(id, name)), exam_schedules(id, title, exam_packages(id, title, subjects(id, code, name)))",
    )
    .in("status", ["submitted", "expired"])
    .order("submitted_at", { ascending: false });

  if (scheduleIds) {
    query = query.in("exam_schedule_id", scheduleIds);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data as ReportAttempt[];
}

export async function getReportSummary() {
  const attempts = await getReportAttempts();
  const submitted = attempts.filter((attempt) => attempt.status === "submitted");
  const expired = attempts.filter((attempt) => attempt.status === "expired");
  const finalized = attempts.filter(
    (attempt) => attempt.grading_status === "finalized",
  );
  const averageScore =
    submitted.length > 0
      ? submitted.reduce((total, attempt) => total + Number(attempt.score ?? 0), 0) /
        submitted.length
      : 0;
  const averagePercent =
    submitted.length > 0
      ? submitted.reduce((total, attempt) => {
          const maxScore = Number(attempt.max_score ?? 0);

          return total + (maxScore > 0 ? (Number(attempt.score ?? 0) / maxScore) * 100 : 0);
        }, 0) / submitted.length
      : 0;

  return {
    totalAttempts: attempts.length,
    submitted: submitted.length,
    expired: expired.length,
    finalized: finalized.length,
    averageScore,
    averagePercent,
  };
}

export async function getReportsByExam() {
  const attempts = await getReportAttempts();
  const grouped = new Map<string, { title: string; count: number; submitted: number; expired: number; totalScore: number; totalPercent: number }>();

  attempts.forEach((attempt) => {
    const schedule = firstRelation(attempt.exam_schedules);
    const key = schedule?.id ?? "unknown";
    const maxScore = Number(attempt.max_score ?? 0);
    const percent = maxScore > 0 ? (Number(attempt.score ?? 0) / maxScore) * 100 : 0;
    const current = grouped.get(key) ?? {
      title: schedule?.title ?? "Tanpa ujian",
      count: 0,
      submitted: 0,
      expired: 0,
      totalScore: 0,
      totalPercent: 0,
    };

    current.count += 1;
    current.submitted += attempt.status === "submitted" ? 1 : 0;
    current.expired += attempt.status === "expired" ? 1 : 0;
    current.totalScore += Number(attempt.score ?? 0);
    current.totalPercent += percent;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    averageScore: item.count > 0 ? item.totalScore / item.count : 0,
    averagePercent: item.count > 0 ? item.totalPercent / item.count : 0,
  }));
}

export async function getReportsByClass() {
  const attempts = await getReportAttempts();
  const grouped = new Map<string, { name: string; count: number; submitted: number; totalPercent: number }>();

  attempts.forEach((attempt) => {
    const participant = firstRelation(attempt.exam_participants);
    const classItem = firstRelation(participant?.classes as Relation<{ id: string; name: string }>);
    const key = classItem?.id ?? "unknown";
    const maxScore = Number(attempt.max_score ?? 0);
    const percent = maxScore > 0 ? (Number(attempt.score ?? 0) / maxScore) * 100 : 0;
    const current = grouped.get(key) ?? {
      name: classItem?.name ?? "Tanpa kelas",
      count: 0,
      submitted: 0,
      totalPercent: 0,
    };

    current.count += 1;
    current.submitted += attempt.status === "submitted" ? 1 : 0;
    current.totalPercent += percent;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    averagePercent: item.count > 0 ? item.totalPercent / item.count : 0,
  }));
}

export async function getReportsBySubject() {
  const attempts = await getReportAttempts();
  const grouped = new Map<string, { code: string; name: string; count: number; totalPercent: number }>();

  attempts.forEach((attempt) => {
    const schedule = firstRelation(attempt.exam_schedules);
    const examPackage = firstRelation(schedule?.exam_packages as Relation<{ subjects?: Relation<{ id: string; code: string; name: string }> }>);
    const subject = firstRelation(examPackage?.subjects);
    const key = subject?.id ?? "unknown";
    const maxScore = Number(attempt.max_score ?? 0);
    const percent = maxScore > 0 ? (Number(attempt.score ?? 0) / maxScore) * 100 : 0;
    const current = grouped.get(key) ?? {
      code: subject?.code ?? "-",
      name: subject?.name ?? "Tanpa mapel",
      count: 0,
      totalPercent: 0,
    };

    current.count += 1;
    current.totalPercent += percent;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    averagePercent: item.count > 0 ? item.totalPercent / item.count : 0,
  }));
}

export async function getReportsByStudent() {
  const attempts = await getReportAttempts();

  return attempts.map((attempt) => {
    const student = firstRelation(attempt.users);
    const profile = firstRelation(student?.user_profiles as Relation<{ full_name?: string | null; nis?: string | null }>);
    const schedule = firstRelation(attempt.exam_schedules);
    const examPackage = firstRelation(schedule?.exam_packages as Relation<{ subjects?: Relation<{ code: string; name: string }> }>);
    const subject = firstRelation(examPackage?.subjects);
    const maxScore = Number(attempt.max_score ?? 0);
    const percent = maxScore > 0 ? (Number(attempt.score ?? 0) / maxScore) * 100 : 0;

    return {
      id: attempt.id,
      studentName: profile?.full_name ?? student?.username ?? "-",
      nis: profile?.nis ?? "-",
      examTitle: schedule?.title ?? "-",
      subject: subject?.code ?? "-",
      score: Number(attempt.score ?? 0),
      maxScore,
      percent,
      status: attempt.status,
      gradingStatus: attempt.grading_status ?? "-",
    };
  });
}

export function toCsv(rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) =>
    `"${String(value).replaceAll('"', '""')}"`;

  return [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header] ?? "")).join(",")),
  ].join("\n");
}

async function getTeacherScheduleIds(userId: string) {
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("teacher_subjects")
    .select("subject_id")
    .eq("teacher_id", userId);
  const subjectIds = [...new Set((assignments ?? []).map((item) => item.subject_id as string))];

  if (subjectIds.length === 0) {
    return [];
  }

  const { data: packages } = await supabase
    .from("exam_packages")
    .select("id")
    .in("subject_id", subjectIds);
  const packageIds = (packages ?? []).map((item) => item.id as string);

  if (packageIds.length === 0) {
    return [];
  }

  const { data: schedules } = await supabase
    .from("exam_schedules")
    .select("id")
    .in("exam_package_id", packageIds);

  return (schedules ?? []).map((item) => item.id as string);
}
