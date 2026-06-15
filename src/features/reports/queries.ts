import { requireAuth } from "@/lib/auth/require-auth";
import {
  requireSchoolScope,
  requireScopedSchoolId,
} from "@/lib/auth/school-scope";
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
  exam_schedule_id?: string | null;
  status: string;
  score: number | null;
  max_score: number | null;
  grading_status: string | null;
  submitted_at: string | null;
  exam_schedules?: {
    id: string;
    title: string;
    academic_year_id?: string | null;
    semester_id?: string | null;
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
    academic_year_id?: string | null;
    semester_id?: string | null;
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

export type ReportFilters = {
  q?: string | null;
  status?: string | null;
  grading_status?: string | null;
  schedule_id?: string | null;
  class_id?: string | null;
  subject_id?: string | null;
  academic_year_id?: string | null;
  semester_id?: string | null;
};

export type ReportParticipant = {
  id: string;
  status: string;
  class_id?: string | null;
  exam_schedule_id?: string | null;
  classes?: Relation<{ id: string; name: string }>;
  exam_schedules?: Relation<{
    id: string;
    title: string;
    academic_year_id?: string | null;
    semester_id?: string | null;
    exam_packages?: Relation<{
      id: string;
      title: string;
      subjects?: Relation<{ id: string; code: string; name: string }>;
    }>;
  }>;
};

export async function getReportAttempts(
  filters: ReportFilters = {},
): Promise<ReportAttempt[]> {
  const user = await requireAuth();
  const schoolScope = await requireSchoolScope();
  const supabase = await createClient();
  let scheduleIds: string[] | null = null;

  if (user.roles?.name === "teacher") {
    scheduleIds = await getTeacherScheduleIds(user.id);

    if (scheduleIds.length === 0) {
      return [];
    }
  }

  if (user.roles?.name !== "teacher" && !schoolScope.isSuperAdmin) {
    scheduleIds = await getAdminScheduleIds(
      requireScopedSchoolId(schoolScope)!,
    );

    if (scheduleIds.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from("exam_attempts")
    .select(
      "id, exam_schedule_id, status, score, max_score, grading_status, submitted_at, users(id, username, email, user_profiles(full_name, nis)), exam_participants(class_id, classes(id, name)), exam_schedules(id, title, academic_year_id, semester_id, exam_packages(id, title, subjects(id, code, name)))",
    )
    .in("status", ["submitted", "expired"])
    .order("submitted_at", { ascending: false });

  if (scheduleIds) {
    query = query.in("exam_schedule_id", scheduleIds);
  }

  if (filters.schedule_id) {
    query = query.eq("exam_schedule_id", filters.schedule_id);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.grading_status) {
    query = query.eq("grading_status", filters.grading_status);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as ReportAttempt[]).filter((attempt) =>
    matchesReportFilters(attempt, filters),
  );
}

export async function getReportSummary() {
  const [attempts, participants] = await Promise.all([
    getReportAttempts(),
    getReportParticipants(),
  ]);
  const submitted = attempts.filter((attempt) => attempt.status === "submitted");
  const expired = attempts.filter((attempt) => attempt.status === "expired");
  const finalized = attempts.filter(
    (attempt) => attempt.grading_status === "finalized",
  );
  const pending = attempts.filter(
    (attempt) => attempt.grading_status === "needs_manual_grading",
  );
  const absent = participants.filter(
    (participant) => participant.status === "absent",
  );
  const averageScore =
    finalized.length > 0
      ? finalized.reduce((total, attempt) => total + Number(attempt.score ?? 0), 0) /
        finalized.length
      : 0;
  const averagePercent =
    finalized.length > 0
      ? finalized.reduce((total, attempt) => {
          const maxScore = Number(attempt.max_score ?? 0);

          return total + (maxScore > 0 ? (Number(attempt.score ?? 0) / maxScore) * 100 : 0);
        }, 0) / finalized.length
      : 0;
  const passed = finalized.filter((attempt) => {
    const maxScore = Number(attempt.max_score ?? 0);

    return maxScore > 0 && (Number(attempt.score ?? 0) / maxScore) * 100 >= 75;
  }).length;

  return {
    totalAttempts: attempts.length,
    totalParticipants: participants.length,
    submitted: submitted.length,
    expired: expired.length,
    finalized: finalized.length,
    pending: pending.length,
    absent: absent.length,
    averageScore,
    averagePercent,
    passed,
    notPassed: Math.max(0, finalized.length - passed),
  };
}

export async function getReportsByExam(filters: ReportFilters = {}) {
  const [attempts, participants] = await Promise.all([
    getReportAttempts(filters),
    getReportParticipants(filters),
  ]);
  const grouped = new Map<string, { scheduleId: string; title: string; count: number; submitted: number; expired: number; finalized: number; pending: number; absent: number; totalScore: number; totalPercent: number }>();

  participants.forEach((participant) => {
    const schedule = firstRelation(participant.exam_schedules);
    const key = schedule?.id ?? "unknown";
    const current = grouped.get(key) ?? {
      scheduleId: schedule?.id ?? "",
      title: schedule?.title ?? "Tanpa ujian",
      count: 0,
      submitted: 0,
      expired: 0,
      finalized: 0,
      pending: 0,
      absent: 0,
      totalScore: 0,
      totalPercent: 0,
    };

    current.count += 1;
    current.absent += participant.status === "absent" ? 1 : 0;
    grouped.set(key, current);
  });

  attempts.forEach((attempt) => {
    const schedule = firstRelation(attempt.exam_schedules);
    const key = schedule?.id ?? "unknown";
    const current = grouped.get(key) ?? {
      scheduleId: schedule?.id ?? "",
      title: schedule?.title ?? "Tanpa ujian",
      count: 0,
      submitted: 0,
      expired: 0,
      finalized: 0,
      pending: 0,
      absent: 0,
      totalScore: 0,
      totalPercent: 0,
    };
    const isFinalized = attempt.grading_status === "finalized";
    const maxScore = Number(attempt.max_score ?? 0);
    const percent = maxScore > 0 ? (Number(attempt.score ?? 0) / maxScore) * 100 : 0;

    current.submitted += attempt.status === "submitted" ? 1 : 0;
    current.expired += attempt.status === "expired" ? 1 : 0;
    current.finalized += isFinalized ? 1 : 0;
    current.pending += attempt.grading_status === "needs_manual_grading" ? 1 : 0;
    current.totalScore += isFinalized ? Number(attempt.score ?? 0) : 0;
    current.totalPercent += isFinalized ? percent : 0;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    averageScore: item.finalized > 0 ? item.totalScore / item.finalized : 0,
    averagePercent: item.finalized > 0 ? item.totalPercent / item.finalized : 0,
  }));
}

export async function getReportsByClass(filters: ReportFilters = {}) {
  const [attempts, participants] = await Promise.all([
    getReportAttempts(filters),
    getReportParticipants(filters),
  ]);
  const grouped = new Map<string, { classId: string; name: string; count: number; submitted: number; finalized: number; pending: number; absent: number; totalPercent: number }>();

  participants.forEach((participant) => {
    const classItem = firstRelation(participant.classes);
    const key = classItem?.id ?? "unknown";
    const current = grouped.get(key) ?? {
      classId: classItem?.id ?? "",
      name: classItem?.name ?? "Tanpa kelas",
      count: 0,
      submitted: 0,
      finalized: 0,
      pending: 0,
      absent: 0,
      totalPercent: 0,
    };

    current.count += 1;
    current.absent += participant.status === "absent" ? 1 : 0;
    grouped.set(key, current);
  });

  attempts.forEach((attempt) => {
    const participant = firstRelation(attempt.exam_participants);
    const classItem = firstRelation(participant?.classes as Relation<{ id: string; name: string }>);
    const key = classItem?.id ?? "unknown";
    const current = grouped.get(key) ?? {
      classId: classItem?.id ?? "",
      name: classItem?.name ?? "Tanpa kelas",
      count: 0,
      submitted: 0,
      finalized: 0,
      pending: 0,
      absent: 0,
      totalPercent: 0,
    };
    const isFinalized = attempt.grading_status === "finalized";
    const maxScore = Number(attempt.max_score ?? 0);
    const percent = maxScore > 0 ? (Number(attempt.score ?? 0) / maxScore) * 100 : 0;

    current.submitted += attempt.status === "submitted" ? 1 : 0;
    current.finalized += isFinalized ? 1 : 0;
    current.pending += attempt.grading_status === "needs_manual_grading" ? 1 : 0;
    current.totalPercent += isFinalized ? percent : 0;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    averagePercent: item.finalized > 0 ? item.totalPercent / item.finalized : 0,
  }));
}

export async function getReportsBySubject(filters: ReportFilters = {}) {
  const [attempts, participants] = await Promise.all([
    getReportAttempts(filters),
    getReportParticipants(filters),
  ]);
  const grouped = new Map<string, { subjectId: string; code: string; name: string; count: number; submitted: number; finalized: number; pending: number; absent: number; totalPercent: number }>();

  participants.forEach((participant) => {
    const schedule = firstRelation(participant.exam_schedules);
    const examPackage = firstRelation(schedule?.exam_packages);
    const subject = firstRelation(examPackage?.subjects);
    const key = subject?.id ?? "unknown";
    const current = grouped.get(key) ?? {
      subjectId: subject?.id ?? "",
      code: subject?.code ?? "-",
      name: subject?.name ?? "Tanpa mapel",
      count: 0,
      submitted: 0,
      finalized: 0,
      pending: 0,
      absent: 0,
      totalPercent: 0,
    };

    current.count += 1;
    current.absent += participant.status === "absent" ? 1 : 0;
    grouped.set(key, current);
  });

  attempts.forEach((attempt) => {
    const schedule = firstRelation(attempt.exam_schedules);
    const examPackage = firstRelation(schedule?.exam_packages as Relation<{ subjects?: Relation<{ id: string; code: string; name: string }> }>);
    const subject = firstRelation(examPackage?.subjects);
    const key = subject?.id ?? "unknown";
    const current = grouped.get(key) ?? {
      subjectId: subject?.id ?? "",
      code: subject?.code ?? "-",
      name: subject?.name ?? "Tanpa mapel",
      count: 0,
      submitted: 0,
      finalized: 0,
      pending: 0,
      absent: 0,
      totalPercent: 0,
    };
    const isFinalized = attempt.grading_status === "finalized";
    const maxScore = Number(attempt.max_score ?? 0);
    const percent = maxScore > 0 ? (Number(attempt.score ?? 0) / maxScore) * 100 : 0;

    current.submitted += attempt.status === "submitted" ? 1 : 0;
    current.finalized += isFinalized ? 1 : 0;
    current.pending += attempt.grading_status === "needs_manual_grading" ? 1 : 0;
    current.totalPercent += isFinalized ? percent : 0;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    averagePercent: item.finalized > 0 ? item.totalPercent / item.finalized : 0,
  }));
}

export async function getReportsByStudent(filters: ReportFilters = {}) {
  const attempts = await getReportAttempts(filters);

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
      username: student?.username ?? "-",
      nis: profile?.nis ?? "-",
      examTitle: schedule?.title ?? "-",
      subject: subject?.code ?? "-",
      score: Number(attempt.score ?? 0),
      maxScore,
      percent: attempt.grading_status === "finalized" ? percent : 0,
      status: attempt.status,
      gradingStatus: attempt.grading_status ?? "-",
      submittedAt: attempt.submitted_at,
      scheduleId: schedule?.id ?? "",
      classId: firstRelation(attempt.exam_participants)?.classes
        ? firstRelation(firstRelation(attempt.exam_participants)?.classes as Relation<{ id: string; name: string }>)?.id ?? ""
        : "",
      className: firstRelation(attempt.exam_participants)?.classes
        ? firstRelation(firstRelation(attempt.exam_participants)?.classes as Relation<{ id: string; name: string }>)?.name ?? "-"
        : "-",
      subjectId: firstRelation(
        (firstRelation(schedule?.exam_packages as Relation<{ subjects?: Relation<{ id: string; code: string; name: string }> }>)?.subjects),
      )?.id ?? "",
    };
  });
}

export type StudentReportFilters = ReportFilters;

export function filterStudentReportRows(
  rows: Awaited<ReturnType<typeof getReportsByStudent>>,
  filters: StudentReportFilters,
) {
  return rows.filter((row) => {
    const keyword = filters.q?.toLowerCase().trim();
    const matchesKeyword = keyword
      ? [row.studentName, row.nis, row.examTitle, row.subject]
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      : true;
    const matchesStatus = filters.status ? row.status === filters.status : true;
    const matchesGrading = filters.grading_status
      ? row.gradingStatus === filters.grading_status
      : true;
    const matchesSchedule = filters.schedule_id
      ? row.scheduleId === filters.schedule_id
      : true;
    const matchesClass = filters.class_id ? row.classId === filters.class_id : true;
    const matchesSubject = filters.subject_id
      ? row.subjectId === filters.subject_id
      : true;

    return (
      matchesKeyword &&
      matchesStatus &&
      matchesGrading &&
      matchesSchedule &&
      matchesClass &&
      matchesSubject
    );
  });
}

export async function getReportFilterOptions() {
  const [attempts, participants, academicYears, semesters] = await Promise.all([
    getReportAttempts(),
    getReportParticipants(),
    getAcademicYearReportOptions(),
    getSemesterReportOptions(),
  ]);
  const schedules = new Map<string, string>();
  const classes = new Map<string, string>();
  const subjects = new Map<string, string>();

  for (const attempt of attempts) {
    collectFilterOptionsFromAttempt(attempt, schedules, classes, subjects);
  }

  for (const participant of participants) {
    const schedule = firstRelation(participant.exam_schedules);
    const classItem = firstRelation(participant.classes);
    const examPackage = firstRelation(schedule?.exam_packages);
    const subject = firstRelation(examPackage?.subjects);

    if (schedule?.id && schedule.title) schedules.set(schedule.id, schedule.title);
    if (classItem?.id && classItem.name) classes.set(classItem.id, classItem.name);
    if (subject?.id && subject.code && subject.name) {
      subjects.set(subject.id, `${subject.code} - ${subject.name}`);
    }
  }

  return {
    schedules: Array.from(schedules, ([value, label]) => ({ value, label })),
    classes: Array.from(classes, ([value, label]) => ({ value, label })),
    subjects: Array.from(subjects, ([value, label]) => ({ value, label })),
    academicYears,
    semesters,
  };
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

async function getAdminScheduleIds(schoolId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_schedules")
    .select("id")
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error || !data) {
    return [];
  }

  return data.map((item) => item.id as string);
}

async function getReportParticipants(
  filters: ReportFilters = {},
): Promise<ReportParticipant[]> {
  const user = await requireAuth();
  const schoolScope = await requireSchoolScope();
  const supabase = await createClient();
  let scheduleIds =
    user.roles?.name === "teacher" ? await getTeacherScheduleIds(user.id) : null;

  if (user.roles?.name !== "teacher" && !schoolScope.isSuperAdmin) {
    scheduleIds = await getAdminScheduleIds(
      requireScopedSchoolId(schoolScope)!,
    );
  }

  if (scheduleIds && scheduleIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("exam_participants")
    .select(
      "id, status, class_id, exam_schedule_id, classes(id, name), exam_schedules(id, title, academic_year_id, semester_id, exam_packages(id, title, subjects(id, code, name)))",
    );

  if (scheduleIds) {
    query = query.in("exam_schedule_id", scheduleIds);
  }

  if (filters.schedule_id) {
    query = query.eq("exam_schedule_id", filters.schedule_id);
  }

  if (filters.class_id) {
    query = query.eq("class_id", filters.class_id);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as ReportParticipant[]).filter((participant) =>
    matchesParticipantFilters(participant, filters),
  );
}

function matchesReportFilters(attempt: ReportAttempt, filters: ReportFilters) {
  const student = firstRelation(attempt.users);
  const profile = firstRelation(
    student?.user_profiles as Relation<{ full_name?: string | null; nis?: string | null }>,
  );
  const schedule = firstRelation(attempt.exam_schedules);
  const examPackage = firstRelation(
    schedule?.exam_packages as Relation<{
      subjects?: Relation<{ id: string; code: string; name: string }>;
    }>,
  );
  const subject = firstRelation(examPackage?.subjects);
  const participant = firstRelation(attempt.exam_participants);
  const classItem = firstRelation(
    participant?.classes as Relation<{ id: string; name: string }>,
  );
  const keyword = filters.q?.toLowerCase().trim();

  return (
    (!keyword ||
      [
        profile?.full_name,
        profile?.nis,
        student?.email,
        schedule?.title,
        subject?.code,
        subject?.name,
        classItem?.name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)) &&
    (!filters.class_id || classItem?.id === filters.class_id) &&
    (!filters.subject_id || subject?.id === filters.subject_id) &&
    (!filters.academic_year_id ||
      schedule?.academic_year_id === filters.academic_year_id) &&
    (!filters.semester_id || schedule?.semester_id === filters.semester_id)
  );
}

function matchesParticipantFilters(
  participant: ReportParticipant,
  filters: ReportFilters,
) {
  const schedule = firstRelation(participant.exam_schedules);
  const examPackage = firstRelation(schedule?.exam_packages);
  const subject = firstRelation(examPackage?.subjects);
  const classItem = firstRelation(participant.classes);
  const keyword = filters.q?.toLowerCase().trim();

  return (
    (!keyword ||
      [schedule?.title, subject?.code, subject?.name, classItem?.name]
        .join(" ")
        .toLowerCase()
        .includes(keyword)) &&
    (!filters.subject_id || subject?.id === filters.subject_id) &&
    (!filters.academic_year_id ||
      schedule?.academic_year_id === filters.academic_year_id) &&
    (!filters.semester_id || schedule?.semester_id === filters.semester_id)
  );
}

function collectFilterOptionsFromAttempt(
  attempt: ReportAttempt,
  schedules: Map<string, string>,
  classes: Map<string, string>,
  subjects: Map<string, string>,
) {
  const schedule = firstRelation(attempt.exam_schedules);
  const participant = firstRelation(attempt.exam_participants);
  const classItem = firstRelation(
    participant?.classes as Relation<{ id: string; name: string }>,
  );
  const examPackage = firstRelation(
    schedule?.exam_packages as Relation<{
      subjects?: Relation<{ id: string; code: string; name: string }>;
    }>,
  );
  const subject = firstRelation(examPackage?.subjects);

  if (schedule?.id && schedule.title) schedules.set(schedule.id, schedule.title);
  if (classItem?.id && classItem.name) classes.set(classItem.id, classItem.name);
  if (subject?.id && subject.code && subject.name) {
    subjects.set(subject.id, `${subject.code} - ${subject.name}`);
  }
}

async function getAcademicYearReportOptions() {
  const schoolScope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("academic_years")
    .select("id, name")
    .order("name", { ascending: false });

  if (!schoolScope.isSuperAdmin && schoolScope.user.roles?.name !== "teacher") {
    query = query.eq("school_id", requireScopedSchoolId(schoolScope));
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    value: item.id as string,
    label: item.name as string,
  }));
}

async function getSemesterReportOptions() {
  const schoolScope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("semesters")
    .select("id, name, academic_years!inner(name, school_id)")
    .order("name");

  if (!schoolScope.isSuperAdmin && schoolScope.user.roles?.name !== "teacher") {
    query = query.eq(
      "academic_years.school_id",
      requireScopedSchoolId(schoolScope),
    );
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((item) => {
    const academicYear = firstRelation(item.academic_years);

    return {
      value: item.id as string,
      label: `${item.name as string} - ${academicYear?.name ?? "Tahun ajaran"}`,
    };
  });
}
