import {
  getExamPackages,
  getExamSchedules,
} from "@/features/exams/queries";
import {
  assertSameSchool,
  requireSchoolScope,
} from "@/lib/auth/school-scope";
import { createClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type ScheduleRow = {
  id: string;
  school_id?: string | null;
  exam_package_id?: string | null;
  academic_year_id?: string | null;
  semester_id?: string | null;
  created_by?: string | null;
  title?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  exam_packages?: Relation<PackageRow>;
  exam_schedule_classes?: Array<{
    class_id?: string | null;
    classes?: Relation<{ id?: string | null; name?: string | null }>;
  }> | null;
  exam_participants?: Array<{ id?: string | null }> | null;
  exam_proctors?: Array<{ id?: string | null; is_active?: boolean | null }> | null;
};

type PackageRow = {
  id: string;
  school_id?: string | null;
  subject_id?: string | null;
  created_by?: string | null;
  title?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  total_questions?: number | string | null;
  exam_package_questions?: PackageQuestionRow[] | null;
};

type PackageQuestionRow = {
  question_id?: string | null;
  questions?: Relation<QuestionRow>;
};

type QuestionRow = {
  id?: string | null;
  subject_id?: string | null;
  type?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  deleted_at?: string | null;
  question_options?: Array<{ id?: string | null }> | null;
};

type UserRelation = {
  id?: string | null;
  school_id?: string | null;
  status?: string | null;
  roles?: Relation<{ name?: string | null }>;
};

type ParticipantRow = {
  id?: string | null;
  student_id?: string | null;
  class_id?: string | null;
  users?: Relation<UserRelation & {
    class_members?: Array<{
      id?: string | null;
      class_id?: string | null;
      left_at?: string | null;
    }> | null;
  }>;
};

type ProctorRow = {
  id?: string | null;
  teacher_id?: string | null;
  is_active?: boolean | null;
  users?: Relation<UserRelation>;
};

type ClassTargetRow = {
  class_id?: string | null;
  classes?: Relation<{
    id?: string | null;
    name?: string | null;
    class_members?: Array<{
      student_id?: string | null;
      left_at?: string | null;
      users?: Relation<UserRelation>;
    }> | null;
  }>;
};

export type ExamReadinessSeverity = "critical" | "warning" | "info";
export type ExamReadinessStatus = "ready" | "warning" | "blocked";

export type ExamReadinessCheck = {
  key: string;
  category:
    | "academic"
    | "package"
    | "participants"
    | "teacher"
    | "proctor"
    | "schedule"
    | "class";
  title: string;
  description: string;
  severity: ExamReadinessSeverity;
  passed: boolean;
  href?: string;
};

export type ExamReadinessResult = {
  score: number;
  status: ExamReadinessStatus;
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
  checks: ExamReadinessCheck[];
};

export type ExamReadinessIssue = Omit<ExamReadinessCheck, "passed" | "category"> & {
  category: ExamReadinessCheck["category"];
};

export type ExamReadinessSummary = {
  packageCount: number;
  readyPackageCount: number;
  scheduleCount: number;
  readyScheduleCount: number;
  warningScheduleCount: number;
  blockedScheduleCount: number;
  issues: ExamReadinessIssue[];
  schedules: Array<{
    scheduleId: string;
    title: string;
    readiness: ExamReadinessResult;
  }>;
};

function firstRelation<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function isChoiceQuestion(type?: string | null) {
  return !["essay", "esai"].includes((type ?? "").toLowerCase());
}

function addCheck(
  checks: ExamReadinessCheck[],
  check: ExamReadinessCheck,
) {
  checks.push(check);
}

function buildResult(checks: ExamReadinessCheck[]): ExamReadinessResult {
  const failed = checks.filter((check) => !check.passed);
  const summary = {
    critical: failed.filter((check) => check.severity === "critical").length,
    warning: failed.filter((check) => check.severity === "warning").length,
    info: failed.filter((check) => check.severity === "info").length,
  };
  const penalty =
    summary.critical * 20 + summary.warning * 5 + summary.info;
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const status: ExamReadinessStatus =
    summary.critical > 0
      ? "blocked"
      : score >= 90
        ? "ready"
        : score >= 70
          ? "warning"
          : "blocked";

  return {
    score,
    status,
    summary,
    checks,
  };
}

function failedIssues(result: ExamReadinessResult): ExamReadinessIssue[] {
  return result.checks
    .filter((check) => !check.passed)
    .map((check) => ({
      key: check.key,
      category: check.category,
      title: check.title,
      description: check.description,
      severity: check.severity,
      href: check.href,
    }));
}

async function getScheduleOrThrow(scheduleId: string) {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const { data: schedule, error } = await supabase
    .from("exam_schedules")
    .select(
      "id, school_id, exam_package_id, academic_year_id, semester_id, created_by, title, start_at, end_at, status, is_active, exam_packages(id, school_id, subject_id, created_by, title, status, is_active, total_questions)",
    )
    .eq("id", scheduleId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  assertSameSchool(scope, schedule?.school_id);

  if (!schedule) {
    throw new Error("Jadwal ujian tidak ditemukan.");
  }

  return schedule as ScheduleRow;
}

async function getActiveAcademicContext(schoolId: string) {
  const supabase = await createClient();
  const [{ data: activeYears }, { data: activeSemesters }] = await Promise.all([
    supabase
      .from("academic_years")
      .select("id, name")
      .eq("school_id", schoolId)
      .eq("is_active", true),
    supabase
      .from("semesters")
      .select("id, name, academic_years!inner(school_id)")
      .eq("academic_years.school_id", schoolId)
      .eq("is_active", true),
  ]);

  return {
    activeYears: activeYears ?? [],
    activeSemesters: activeSemesters ?? [],
  };
}

async function getPackageQuestions(packageId?: string | null) {
  if (!packageId) {
    return [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_package_questions")
    .select(
      "question_id, questions(id, subject_id, type, status, is_active, deleted_at, question_options(id))",
    )
    .eq("exam_package_id", packageId);

  return (data ?? []) as PackageQuestionRow[];
}

async function getScheduleParticipants(scheduleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_participants")
    .select(
      "id, student_id, class_id, users(id, school_id, status, roles(name), class_members(id, class_id, left_at))",
    )
    .eq("exam_schedule_id", scheduleId);

  return (data ?? []) as ParticipantRow[];
}

async function getScheduleClasses(scheduleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_schedule_classes")
    .select(
      "class_id, classes(id, name, class_members(student_id, left_at, users(id, school_id, status, roles(name))))",
    )
    .eq("exam_schedule_id", scheduleId);

  return (data ?? []) as ClassTargetRow[];
}

async function getScheduleProctors(scheduleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_proctors")
    .select(
      "id, teacher_id, is_active, users!exam_proctors_teacher_id_fkey(id, school_id, status, roles(name))",
    )
    .eq("exam_schedule_id", scheduleId);

  return (data ?? []) as ProctorRow[];
}

async function hasTeacherAssignment(
  teacherId?: string | null,
  subjectId?: string | null,
  academicYearId?: string | null,
) {
  if (!teacherId || !subjectId) {
    return false;
  }

  const supabase = await createClient();
  let query = supabase
    .from("teacher_subjects")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", teacherId)
    .eq("subject_id", subjectId);

  if (academicYearId) {
    query = query.eq("academic_year_id", academicYearId);
  }

  const { count } = await query;

  return (count ?? 0) > 0;
}

async function getTeacherUser(teacherId?: string | null) {
  if (!teacherId) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, school_id, status, roles(name)")
    .eq("id", teacherId)
    .maybeSingle();

  return data as UserRelation | null;
}

async function hasClassConflict(schedule: ScheduleRow, classIds: string[]) {
  if (!schedule.start_at || !schedule.end_at || classIds.length === 0) {
    return false;
  }

  const supabase = await createClient();
  let query = supabase
    .from("exam_schedules")
    .select("id, exam_schedule_classes!inner(class_id)")
    .eq("school_id", schedule.school_id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .in("status", ["scheduled", "active"])
    .lt("start_at", schedule.end_at)
    .gt("end_at", schedule.start_at)
    .in("exam_schedule_classes.class_id", classIds);

  query = query.neq("id", schedule.id);
  const { data } = await query.limit(1);

  return Boolean(data?.length);
}

async function hasProctorConflict(schedule: ScheduleRow, teacherIds: string[]) {
  if (!schedule.start_at || !schedule.end_at || teacherIds.length === 0) {
    return false;
  }

  const supabase = await createClient();
  let query = supabase
    .from("exam_schedules")
    .select("id, exam_proctors!inner(teacher_id, is_active)")
    .eq("school_id", schedule.school_id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .in("status", ["scheduled", "active"])
    .lt("start_at", schedule.end_at)
    .gt("end_at", schedule.start_at)
    .in("exam_proctors.teacher_id", teacherIds)
    .eq("exam_proctors.is_active", true);

  query = query.neq("id", schedule.id);
  const { data } = await query.limit(1);

  return Boolean(data?.length);
}

async function hasTeacherConflict(
  schedule: ScheduleRow,
  teacherId?: string | null,
) {
  if (!schedule.start_at || !schedule.end_at || !teacherId) {
    return false;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_schedules")
    .select("id, exam_packages!inner(created_by)")
    .neq("id", schedule.id)
    .eq("school_id", schedule.school_id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .in("status", ["scheduled", "active"])
    .lt("start_at", schedule.end_at)
    .gt("end_at", schedule.start_at)
    .eq("exam_packages.created_by", teacherId)
    .limit(1);

  return Boolean(data?.length);
}

export async function getScheduleExamReadiness(
  scheduleId: string,
): Promise<ExamReadinessResult> {
  const schedule = await getScheduleOrThrow(scheduleId);
  const examPackage = firstRelation(schedule.exam_packages);
  const href = `/dashboard/exams/schedules/create?edit=${schedule.id}`;
  const packageHref = examPackage?.id
    ? `/dashboard/exams/packages/create?edit=${examPackage.id}&subject_id=${
        examPackage.subject_id ?? ""
      }`
    : href;
  const schoolId = String(schedule.school_id ?? "");
  const checks: ExamReadinessCheck[] = [];
  const [
    academicContext,
    packageQuestions,
    participants,
    classTargets,
    proctors,
  ] = await Promise.all([
    getActiveAcademicContext(schoolId),
    getPackageQuestions(schedule.exam_package_id),
    getScheduleParticipants(schedule.id),
    getScheduleClasses(schedule.id),
    getScheduleProctors(schedule.id),
  ]);
  const questions = packageQuestions
    .map((item) => firstRelation(item.questions))
    .filter((question): question is QuestionRow => Boolean(question?.id));
  const classIds = classTargets
    .map((target) => target.class_id)
    .filter((classId): classId is string => Boolean(classId));
  const activeProctors = proctors.filter((proctor) => proctor.is_active !== false);
  const proctorTeacherIds = activeProctors
    .map((proctor) => proctor.teacher_id)
    .filter((teacherId): teacherId is string => Boolean(teacherId));
  const responsibleTeacherId = examPackage?.created_by ?? schedule.created_by ?? null;
  const responsibleTeacher = await getTeacherUser(responsibleTeacherId);
  const responsibleTeacherRole = firstRelation(responsibleTeacher?.roles)?.name;
  const hasResponsibleAssignment = await hasTeacherAssignment(
    responsibleTeacherId,
    examPackage?.subject_id,
    schedule.academic_year_id,
  );
  const [classConflict, proctorConflict, teacherConflict] = await Promise.all([
    hasClassConflict(schedule, classIds),
    hasProctorConflict(schedule, proctorTeacherIds),
    hasTeacherConflict(schedule, responsibleTeacherId),
  ]);

  addCheck(checks, {
    key: "academic:active-year-exists",
    category: "academic",
    title: "Tahun ajaran aktif tersedia",
    description: "Sekolah harus memiliki tepat satu tahun ajaran aktif.",
    severity: "critical",
    passed: academicContext.activeYears.length === 1,
    href: "/dashboard/master-data/academic-years",
  });
  addCheck(checks, {
    key: "academic:active-semester-exists",
    category: "academic",
    title: "Semester aktif tersedia",
    description: "Sekolah harus memiliki tepat satu semester aktif.",
    severity: "critical",
    passed: academicContext.activeSemesters.length === 1,
    href: "/dashboard/master-data/semesters",
  });

  addCheck(checks, {
    key: "package:exists",
    category: "package",
    title: "Paket ujian tersedia",
    description: examPackage?.title ?? "Jadwal belum memiliki paket ujian valid.",
    severity: "critical",
    passed: Boolean(examPackage?.id),
    href: packageHref,
  });
  addCheck(checks, {
    key: "package:published",
    category: "package",
    title: "Paket ujian published dan aktif",
    description: examPackage?.title ?? "Paket ujian belum siap dipakai.",
    severity: "critical",
    passed: examPackage?.status === "published" && examPackage.is_active !== false,
    href: packageHref,
  });
  addCheck(checks, {
    key: "package:has-questions",
    category: "package",
    title: "Paket memiliki soal",
    description: `${questions.length} soal terhubung ke paket.`,
    severity: "critical",
    passed: questions.length > 0 && Number(examPackage?.total_questions ?? 0) > 0,
    href: packageHref,
  });
  addCheck(checks, {
    key: "package:questions-active",
    category: "package",
    title: "Semua soal paket aktif",
    description: "Soal paket harus published, aktif, dan belum diarsipkan.",
    severity: "critical",
    passed:
      questions.length > 0 &&
      questions.every(
        (question) =>
          question.status === "published" &&
          question.is_active !== false &&
          !question.deleted_at,
      ),
    href: packageHref,
  });
  addCheck(checks, {
    key: "package:choice-options",
    category: "package",
    title: "Soal pilihan memiliki opsi jawaban",
    description: "Soal non-essay harus memiliki minimal satu opsi jawaban.",
    severity: "critical",
    passed: questions.every(
      (question) =>
        !isChoiceQuestion(question.type) ||
        (question.question_options ?? []).length > 0,
    ),
    href: packageHref,
  });

  const duplicatedParticipants =
    participants.length -
    new Set(
      participants
        .map((participant) => participant.student_id)
        .filter(Boolean),
    ).size;
  const invalidStudent = participants.some((participant) => {
    const user = firstRelation(participant.users);
    const role = firstRelation(user?.roles)?.name;

    return (
      user?.status !== "active" ||
      role !== "student" ||
      user.school_id !== schedule.school_id
    );
  });
  const studentWithoutClass = participants.some((participant) => {
    const user = firstRelation(participant.users);
    return !(user?.class_members ?? []).some(
      (member) => !member.left_at && member.class_id === participant.class_id,
    );
  });

  addCheck(checks, {
    key: "participants:exists",
    category: "participants",
    title: "Peserta ujian tersedia",
    description: `${participants.length} peserta tersinkron ke jadwal.`,
    severity: "critical",
    passed: participants.length > 0,
    href: "/dashboard/exams/schedules",
  });
  addCheck(checks, {
    key: "participants:no-duplicate",
    category: "participants",
    title: "Peserta tidak duplikat",
    description: duplicatedParticipants
      ? `${duplicatedParticipants} peserta duplikat ditemukan.`
      : "Tidak ada peserta duplikat.",
    severity: "critical",
    passed: duplicatedParticipants === 0,
    href: "/dashboard/exams/schedules",
  });
  addCheck(checks, {
    key: "participants:students-valid",
    category: "participants",
    title: "Siswa peserta aktif",
    description: "Semua peserta harus akun siswa aktif di sekolah yang sama.",
    severity: "critical",
    passed: participants.length === 0 || !invalidStudent,
    href: "/dashboard/master-data/students",
  });
  addCheck(checks, {
    key: "participants:students-have-class",
    category: "participants",
    title: "Siswa peserta memiliki kelas",
    description: "Setiap peserta harus memiliki membership aktif pada kelas jadwal.",
    severity: "critical",
    passed: participants.length === 0 || !studentWithoutClass,
    href: "/dashboard/master-data/students",
  });

  addCheck(checks, {
    key: "teacher:responsible-exists",
    category: "teacher",
    title: "Guru penanggung jawab tersedia",
    description: "Paket atau jadwal harus memiliki guru penanggung jawab.",
    severity: "warning",
    passed: Boolean(responsibleTeacher?.id),
    href: "/dashboard/master-data/teachers",
  });
  addCheck(checks, {
    key: "teacher:responsible-active",
    category: "teacher",
    title: "Guru penanggung jawab aktif",
    description: "Guru penanggung jawab harus akun guru aktif.",
    severity: "warning",
    passed:
      !responsibleTeacher ||
      (responsibleTeacher.status === "active" && responsibleTeacherRole === "teacher"),
    href: "/dashboard/master-data/teachers",
  });
  addCheck(checks, {
    key: "teacher:assignment",
    category: "teacher",
    title: "Guru memiliki assignment mapel",
    description: "Guru penanggung jawab harus memiliki assignment pada mapel paket.",
    severity: "warning",
    passed: !responsibleTeacherId || hasResponsibleAssignment,
    href: "/dashboard/master-data/teacher-assignments",
  });

  addCheck(checks, {
    key: "proctor:exists",
    category: "proctor",
    title: "Jadwal memiliki pengawas",
    description: `${activeProctors.length} assignment pengawas aktif.`,
    severity: "critical",
    passed: activeProctors.length > 0,
    href: `/dashboard/exams/proctors?schedule_id=${schedule.id}`,
  });
  addCheck(checks, {
    key: "proctor:teacher-valid",
    category: "proctor",
    title: "Pengawas valid",
    description: "Pengawas harus akun aktif, berperan guru atau pengawas khusus, dan satu sekolah.",
    severity: "critical",
    passed: activeProctors.every((proctor) => {
      const user = firstRelation(proctor.users);
      const role = firstRelation(user?.roles)?.name;

      return (
        Boolean(user?.id) &&
        user?.status === "active" &&
        (role === "teacher" || role === "proctor") &&
        user?.school_id === schedule.school_id
      );
    }),
    href: `/dashboard/exams/proctors?schedule_id=${schedule.id}`,
  });
  addCheck(checks, {
    key: "proctor:assignment-active",
    category: "proctor",
    title: "Assignment pengawas aktif",
    description: "Assignment nonaktif tidak dihitung sebagai pengawas ujian.",
    severity: "info",
    passed: proctors.every((proctor) => proctor.is_active !== false),
    href: `/dashboard/exams/proctors?schedule_id=${schedule.id}`,
  });

  const validDate =
    Boolean(schedule.start_at) &&
    Boolean(schedule.end_at) &&
    !Number.isNaN(Date.parse(schedule.start_at ?? "")) &&
    !Number.isNaN(Date.parse(schedule.end_at ?? ""));
  const validTime =
    validDate && new Date(schedule.start_at ?? "") < new Date(schedule.end_at ?? "");

  addCheck(checks, {
    key: "schedule:date-valid",
    category: "schedule",
    title: "Tanggal jadwal valid",
    description: "Tanggal dan waktu jadwal harus bisa dibaca sistem.",
    severity: "critical",
    passed: validDate,
    href,
  });
  addCheck(checks, {
    key: "schedule:time-range",
    category: "schedule",
    title: "Waktu mulai sebelum selesai",
    description: "Waktu mulai harus lebih awal dari waktu selesai.",
    severity: "critical",
    passed: validTime,
    href,
  });
  addCheck(checks, {
    key: "schedule:class-conflict",
    category: "schedule",
    title: "Tidak bentrok jadwal kelas",
    description: "Kelas target tidak boleh memiliki jadwal ujian lain pada waktu yang sama.",
    severity: "critical",
    passed: !classConflict,
    href: "/dashboard/exams/schedules",
  });
  addCheck(checks, {
    key: "schedule:proctor-conflict",
    category: "schedule",
    title: "Tidak bentrok pengawas",
    description: "Pengawas tidak boleh bertugas di dua jadwal pada waktu yang sama.",
    severity: "critical",
    passed: !proctorConflict,
    href: "/dashboard/exams/proctors",
  });
  addCheck(checks, {
    key: "schedule:teacher-conflict",
    category: "schedule",
    title: "Tidak bentrok guru",
    description: "Guru penanggung jawab tidak boleh memiliki jadwal lain pada waktu yang sama.",
    severity: "critical",
    passed: !teacherConflict,
    href: "/dashboard/exams/schedules",
  });

  const emptyClassCount = classTargets.filter((target) => {
    const classItem = firstRelation(target.classes);
    return !(classItem?.class_members ?? []).some((member) => {
      const user = firstRelation(member.users);
      const role = firstRelation(user?.roles)?.name;

      return (
        !member.left_at &&
        user?.status === "active" &&
        role === "student" &&
        user?.school_id === schedule.school_id
      );
    });
  }).length;

  addCheck(checks, {
    key: "class:has-targets",
    category: "class",
    title: "Jadwal memiliki kelas target",
    description: `${classTargets.length} kelas target dipilih.`,
    severity: "warning",
    passed: classTargets.length > 0,
    href,
  });
  addCheck(checks, {
    key: "class:not-empty",
    category: "class",
    title: "Kelas target tidak kosong",
    description: emptyClassCount
      ? `${emptyClassCount} kelas target belum memiliki siswa aktif.`
      : "Semua kelas target memiliki siswa aktif.",
    severity: "warning",
    passed: classTargets.length === 0 || emptyClassCount === 0,
    href: "/dashboard/master-data/classes",
  });

  return buildResult(checks);
}

export async function getExamReadinessSummary(): Promise<ExamReadinessSummary> {
  const [packages, schedules] = await Promise.all([
    getExamPackages({}),
    getExamSchedules({}),
  ]);
  const typedPackages = packages as PackageRow[];
  const typedSchedules = schedules as ScheduleRow[];
  const packageIssues: ExamReadinessIssue[] = typedPackages.flatMap(
    (examPackage) => {
      const href = `/dashboard/exams/packages/create?edit=${examPackage.id}&subject_id=${
        examPackage.subject_id ?? ""
      }`;
      const questions = examPackage.exam_package_questions ?? [];
      const linkedQuestions = questions
        .map((item) => firstRelation(item.questions))
        .filter((question): question is QuestionRow => Boolean(question?.id));
      const issues: ExamReadinessIssue[] = [];

      if (examPackage.status !== "published" || examPackage.is_active === false) {
        issues.push({
          key: `package:${examPackage.id}:not-ready`,
          category: "package",
          title: "Paket belum published/aktif",
          description: examPackage.title ?? "Paket ujian",
          severity: "critical",
          href,
        });
      }

      if (questions.length === 0 || linkedQuestions.length === 0) {
        issues.push({
          key: `package:${examPackage.id}:empty`,
          category: "package",
          title: "Paket belum memiliki soal",
          description: examPackage.title ?? "Paket ujian",
          severity: "critical",
          href,
        });
      }

      if (linkedQuestions.some((question) => isChoiceQuestion(question.type) && (question.question_options ?? []).length === 0)) {
        issues.push({
          key: `package:${examPackage.id}:missing-options`,
          category: "package",
          title: "Soal pilihan belum memiliki opsi",
          description: examPackage.title ?? "Paket ujian",
          severity: "critical",
          href,
        });
      }

      return issues;
    },
  );
  const packagesWithIssues = new Set(
    packageIssues
      .map((issue) => issue.key.split(":")[1])
      .filter((packageId): packageId is string => Boolean(packageId)),
  );
  const readinessRows = await Promise.all(
    typedSchedules.map(async (schedule) => ({
      scheduleId: schedule.id,
      title: schedule.title ?? "Jadwal ujian",
      readiness: await getScheduleExamReadiness(schedule.id),
    })),
  );
  const scheduleIssues = readinessRows.flatMap((row) =>
    failedIssues(row.readiness).map((issue) => ({
      ...issue,
      key: `schedule:${row.scheduleId}:${issue.key}`,
      description: `${row.title} - ${issue.description}`,
    })),
  );

  return {
    packageCount: typedPackages.length,
    readyPackageCount: typedPackages.length - packagesWithIssues.size,
    scheduleCount: typedSchedules.length,
    readyScheduleCount: readinessRows.filter((row) => row.readiness.status === "ready").length,
    warningScheduleCount: readinessRows.filter((row) => row.readiness.status === "warning").length,
    blockedScheduleCount: readinessRows.filter((row) => row.readiness.status === "blocked").length,
    issues: [...packageIssues, ...scheduleIssues],
    schedules: readinessRows,
  };
}
