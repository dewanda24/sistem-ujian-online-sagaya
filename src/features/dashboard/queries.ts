import { getStudentExamSchedules } from "@/features/exam-room/queries";
import { getProctorOperationalSummary } from "@/features/monitoring/queries";
import {
  getStudentSubmittedAttempts,
  getTeacherResultRecap,
} from "@/features/results/queries";
import { getReportSummary } from "@/features/reports/queries";
import {
  getMasterDataReadinessIssues,
  type MasterDataReadinessIssue,
} from "@/features/master-data/readiness";
import { getExamReadinessSummary } from "@/features/exams/exam-readiness.service";
import { getRecoveryCenterData } from "@/features/recovery-center/queries";
import { requireSchoolScope } from "@/lib/auth/school-scope";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { CurrentUser, RoleName } from "@/types/auth";

function serviceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type DashboardStat = {
  title: string;
  value: string;
  description: string;
  href?: string;
};

export type AdminTask = {
  title: string;
  description: string;
  href: string;
  action: string;
  urgent: boolean;
};

export type AdminSetupProgressItem = {
  label: string;
  done: boolean;
  href: string;
};

export type AdminRecentActivity = {
  label: string;
  description: string;
  createdAt: string | null;
  href: string;
};

export type AdminUpcomingSchedule = {
  id: string;
  title: string;
  startAt: string | null;
  status: string | null;
  participantCount: number;
};

export type AdminOperationalDashboardData = {
  activeAcademicYearName: string | null;
  activeSemesterName: string | null;
  totalClasses: number;
  totalSubjects: number;
  tasks: AdminTask[];
  dataIssues: MasterDataReadinessIssue[];
  examReadiness: {
    ready: number;
    warning: number;
    blocked: number;
  };
  recoverySummary: {
    critical: number;
    warning: number;
    info: number;
  };
  setupProgress: AdminSetupProgressItem[];
  recentActivities: AdminRecentActivity[];
  upcomingSchedules: AdminUpcomingSchedule[];
};

async function getAdminSchoolId() {
  const scope = await requireSchoolScope();

  return scope.user.roles?.name === "admin" ? scope.schoolId : null;
}

async function getDbClient() {
  return serviceRoleClient() ?? (await createClient());
}

async function countTable(table: string, schoolId?: string | null) {
  const supabase = await getDbClient();
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true });

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { count } = await query;

  return count ?? 0;
}

async function countWhere(
  table: string,
  column: string,
  value: string | boolean,
  schoolId?: string | null,
) {
  const supabase = await getDbClient();
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { count } = await query;

  return count ?? 0;
}

async function countUsersByRole(roleName: RoleName) {
  const schoolId = await getAdminSchoolId();
  const supabase = await getDbClient();
  let query = supabase
    .from("users")
    .select("id, roles!inner(name)", { count: "exact", head: true })
    .eq("roles.name", roleName)
    .eq("status", "active");

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { count } = await query;

  return count ?? 0;
}

async function getTeacherOperationalStats(teacherId: string) {
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("teacher_subjects")
    .select("subject_id, class_id")
    .eq("teacher_id", teacherId);
  const subjectIds = [
    ...new Set(
      (assignments ?? [])
        .map((item) => item.subject_id as string | null)
        .filter((subjectId): subjectId is string => Boolean(subjectId)),
    ),
  ];
  const classCount = new Set(
    (assignments ?? [])
      .map((item) => item.class_id as string | null)
      .filter(Boolean),
  ).size;
  const now = new Date().toISOString();

  if (subjectIds.length === 0) {
    return {
      assignmentCount: 0,
      subjectCount: 0,
      classCount: 0,
      draftQuestions: 0,
      publishedQuestions: 0,
      draftPackages: 0,
      publishedPackages: 0,
      todaySchedules: 0,
      upcomingSchedules: 0,
      activeSchedules: 0,
      notStartedParticipants: 0,
    };
  }

  const [
    { count: draftQuestions },
    { count: publishedQuestions },
    { data: packages },
  ] = await Promise.all([
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .in("subject_id", subjectIds)
      .eq("status", "draft")
      .is("deleted_at", null),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .in("subject_id", subjectIds)
      .eq("status", "published")
      .is("deleted_at", null),
    supabase
      .from("exam_packages")
      .select("id, status")
      .in("subject_id", subjectIds)
      .is("deleted_at", null),
  ]);
  const packageIds = (packages ?? []).map((item) => item.id as string);
  const draftPackages = (packages ?? []).filter(
    (item) => item.status === "draft",
  ).length;
  const publishedPackages = (packages ?? []).filter(
    (item) => item.status === "published",
  ).length;

  if (packageIds.length === 0) {
    return {
      assignmentCount: assignments?.length ?? 0,
      subjectCount: subjectIds.length,
      classCount,
      draftQuestions: draftQuestions ?? 0,
      publishedQuestions: publishedQuestions ?? 0,
      draftPackages,
      publishedPackages,
      todaySchedules: 0,
      upcomingSchedules: 0,
      activeSchedules: 0,
      notStartedParticipants: 0,
    };
  }

  const todayStart = new Date();
  const todayEnd = new Date();

  todayStart.setHours(0, 0, 0, 0);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    { count: todaySchedules },
    { count: upcomingSchedules },
    { count: activeSchedules },
    { data: participantSchedules },
  ] =
    await Promise.all([
      supabase
        .from("exam_schedules")
        .select("id", { count: "exact", head: true })
        .in("exam_package_id", packageIds)
        .in("status", ["scheduled", "active"])
        .gte("start_at", todayStart.toISOString())
        .lte("start_at", todayEnd.toISOString())
        .is("deleted_at", null),
      supabase
        .from("exam_schedules")
        .select("id", { count: "exact", head: true })
        .in("exam_package_id", packageIds)
        .in("status", ["scheduled", "active"])
        .gt("start_at", now)
        .is("deleted_at", null),
      supabase
        .from("exam_schedules")
        .select("id", { count: "exact", head: true })
        .in("exam_package_id", packageIds)
        .eq("status", "active")
        .is("deleted_at", null),
      supabase
        .from("exam_schedules")
        .select("id, exam_participants(status)")
        .in("exam_package_id", packageIds)
        .in("status", ["scheduled", "active"])
        .is("deleted_at", null),
    ]);
  const notStartedParticipants = (participantSchedules ?? []).reduce(
    (total, schedule) =>
      total +
      (schedule.exam_participants ?? []).filter(
        (participant: { status?: string | null }) =>
          ["assigned", "pending"].includes(participant.status ?? ""),
      ).length,
    0,
  );

  return {
    assignmentCount: assignments?.length ?? 0,
    subjectCount: subjectIds.length,
    classCount,
    draftQuestions: draftQuestions ?? 0,
    publishedQuestions: publishedQuestions ?? 0,
    draftPackages,
    publishedPackages,
    todaySchedules: todaySchedules ?? 0,
    upcomingSchedules: upcomingSchedules ?? 0,
    activeSchedules: activeSchedules ?? 0,
    notStartedParticipants,
  };
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export async function getAdminOperationalDashboardData(
  user: CurrentUser,
): Promise<AdminOperationalDashboardData> {
  const schoolId = user.school_id;

  if (!schoolId) {
    return {
      activeAcademicYearName: null,
      activeSemesterName: null,
      totalClasses: 0,
      totalSubjects: 0,
      tasks: [],
      dataIssues: [],
      examReadiness: {
        ready: 0,
        warning: 0,
        blocked: 0,
      },
      recoverySummary: {
        critical: 0,
        warning: 0,
        info: 0,
      },
      setupProgress: [],
      recentActivities: [],
      upcomingSchedules: [],
    };
  }

  const supabase = await createClient();
  const [
    { data: academicYears },
    { data: semesters },
    { count: subjectCount },
    { data: classes },
    { data: users },
    { data: schedules },
    dataIssues,
    examReadiness,
    recoveryCenter,
  ] = await Promise.all([
    supabase
      .from("academic_years")
      .select("id, name, is_active, created_at")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false }),
    supabase
      .from("semesters")
      .select("id, name, is_active, academic_year_id, created_at, academic_years!inner(school_id)")
      .eq("academic_years.school_id", schoolId)
      .order("created_at", { ascending: false }),
    supabase
      .from("subjects")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId),
    supabase
      .from("classes")
      .select("id, name, created_at, class_members(student_id, left_at)")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("id, username, email, created_at, roles!inner(name), user_profiles(full_name)")
      .eq("school_id", schoolId)
      .in("roles.name", ["teacher", "student"])
      .order("created_at", { ascending: false }),
    supabase
      .from("exam_schedules")
      .select("id, title, status, start_at, created_at, exam_participants(id)")
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    getMasterDataReadinessIssues(schoolId),
    getExamReadinessSummary(),
    getRecoveryCenterData(user),
  ]);

  const teacherIds = (users ?? [])
    .filter((item) => firstRelation(item.roles)?.name === "teacher")
    .map((item) => item.id as string);
  const studentIds = (users ?? [])
    .filter((item) => firstRelation(item.roles)?.name === "student")
    .map((item) => item.id as string);
  const { data: assignments } = teacherIds.length
    ? await supabase
        .from("teacher_subjects")
        .select("id, teacher_id, created_at")
        .in("teacher_id", teacherIds)
    : { data: [] };

  const assignedTeacherIds = new Set(
    (assignments ?? []).map((item) => item.teacher_id as string),
  );
  const studentsInClass = new Set(
    (classes ?? []).flatMap((classItem) =>
      (classItem.class_members ?? [])
        .filter((member: { left_at?: string | null }) => !member.left_at)
        .map((member: { student_id?: string | null }) => member.student_id)
        .filter((studentId): studentId is string => Boolean(studentId)),
    ),
  );
  const activeAcademicYear =
    (academicYears ?? []).find((item) => Boolean(item.is_active)) ?? null;
  const activeSemester =
    (semesters ?? []).find((item) => Boolean(item.is_active)) ?? null;
  const studentsWithoutClass = studentIds.filter(
    (studentId) => !studentsInClass.has(studentId),
  ).length;
  const teachersWithoutAssignment = teacherIds.filter(
    (teacherId) => !assignedTeacherIds.has(teacherId),
  ).length;
  const schedulesWithoutParticipants = (schedules ?? []).filter(
    (schedule) =>
      ["scheduled", "active"].includes(schedule.status ?? "") &&
      (schedule.exam_participants ?? []).length === 0,
  ).length;

  const tasks: AdminTask[] = [
    !activeAcademicYear
      ? {
          title: "Tahun ajaran belum aktif",
          description: "Aktifkan tahun ajaran agar semester dan jadwal punya periode kerja.",
          href: "/dashboard/master-data/academic-years",
          action: "Atur Tahun Ajaran",
          urgent: true,
        }
      : null,
    (semesters ?? []).length === 0
      ? {
          title: "Semester belum dibuat",
          description: "Buat semester ganjil/genap untuk tahun ajaran sekolah.",
          href: "/dashboard/master-data/semesters",
          action: "Tambah Semester",
          urgent: true,
        }
      : null,
    studentsWithoutClass > 0
      ? {
          title: `${studentsWithoutClass} siswa belum masuk kelas`,
          description: "Tempatkan siswa ke kelas sebelum jadwal ujian dipakai.",
          href: "/dashboard/master-data/students",
          action: "Cek Siswa",
          urgent: true,
        }
      : null,
    teachersWithoutAssignment > 0
      ? {
          title: `${teachersWithoutAssignment} guru belum mendapat mata pelajaran`,
          description: "Lengkapi penugasan guru ke mata pelajaran dan kelas.",
          href: "/dashboard/master-data/teacher-assignments",
          action: "Atur Penugasan",
          urgent: true,
        }
      : null,
    schedulesWithoutParticipants > 0
      ? {
          title: `${schedulesWithoutParticipants} ujian belum memiliki peserta`,
          description: "Lengkapi peserta agar ujian bisa dilaksanakan.",
          href: "/dashboard/exams/schedules",
          action: "Cek Jadwal",
          urgent: true,
        }
      : null,
  ].filter((item): item is AdminTask => Boolean(item));

  if (tasks.length === 0) {
    tasks.push({
      title: "Setup sekolah siap",
      description: "Data utama sudah cukup untuk menjalankan operasional ujian.",
      href: "/dashboard/exams/schedules",
      action: "Lihat Jadwal",
      urgent: false,
    });
  }

  const setupProgress = [
    { label: "Tahun Ajaran", done: (academicYears ?? []).length > 0, href: "/dashboard/master-data/academic-years" },
    { label: "Semester", done: (semesters ?? []).length > 0, href: "/dashboard/master-data/semesters" },
    { label: "Mata Pelajaran", done: (subjectCount ?? 0) > 0, href: "/dashboard/master-data/subjects" },
    { label: "Kelas", done: (classes ?? []).length > 0, href: "/dashboard/master-data/classes" },
    { label: "Guru", done: teacherIds.length > 0, href: "/dashboard/master-data/teachers" },
    { label: "Siswa", done: studentIds.length > 0, href: "/dashboard/master-data/students" },
    { label: "Penugasan Guru", done: (assignments ?? []).length > 0, href: "/dashboard/master-data/teacher-assignments" },
    { label: "Jadwal Ujian", done: (schedules ?? []).length > 0, href: "/dashboard/exams/schedules" },
  ];
  const userActivities = (users ?? []).slice(0, 4).map((item) => {
    const profile = firstRelation(item.user_profiles);
    const role = firstRelation(item.roles)?.name === "teacher" ? "Guru" : "Siswa";

    return {
      label: `${role} baru`,
      description: profile?.full_name ?? item.username ?? item.email ?? "-",
      createdAt: item.created_at as string | null,
      href: role === "Guru" ? "/dashboard/master-data/teachers" : "/dashboard/master-data/students",
    };
  });
  const recentActivities = [
    ...userActivities,
    ...(academicYears ?? []).slice(0, 2).map((item) => ({
      label: "Tahun ajaran dibuat",
      description: item.name ?? "-",
      createdAt: item.created_at as string | null,
      href: "/dashboard/master-data/academic-years",
    })),
    ...(semesters ?? []).slice(0, 2).map((item) => ({
      label: "Semester dibuat",
      description: item.name ?? "-",
      createdAt: item.created_at as string | null,
      href: "/dashboard/master-data/semesters",
    })),
    ...(schedules ?? []).slice(0, 3).map((item) => ({
      label: "Jadwal ujian dibuat",
      description: item.title ?? "-",
      createdAt: item.created_at as string | null,
      href: "/dashboard/exams/schedules",
    })),
  ]
    .filter((item) => Boolean(item.createdAt))
    .sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""))
    .slice(0, 6);
  const now = new Date();
  const upcomingSchedules = (schedules ?? [])
    .filter((schedule) => {
      const startAt = schedule.start_at ? new Date(schedule.start_at) : null;

      return (
        schedule.status === "scheduled" &&
        Boolean(startAt && startAt >= now)
      );
    })
    .sort(
      (left, right) =>
        Date.parse(left.start_at ?? "") - Date.parse(right.start_at ?? ""),
    )
    .slice(0, 5)
    .map((schedule) => ({
      id: schedule.id as string,
      title: schedule.title ?? "-",
      startAt: schedule.start_at as string | null,
      status: schedule.status ?? null,
      participantCount: schedule.exam_participants?.length ?? 0,
    }));

  return {
    activeAcademicYearName: activeAcademicYear?.name ?? null,
    activeSemesterName: activeSemester?.name ?? null,
    totalClasses: (classes ?? []).length,
    totalSubjects: subjectCount ?? 0,
    tasks,
    dataIssues,
    examReadiness: {
      ready: examReadiness.readyScheduleCount,
      warning: examReadiness.warningScheduleCount,
      blocked: examReadiness.blockedScheduleCount,
    },
    recoverySummary: {
      critical: recoveryCenter.summary.critical,
      warning: recoveryCenter.summary.warning,
      info: recoveryCenter.summary.info,
    },
    setupProgress,
    recentActivities,
    upcomingSchedules,
  };
}

export async function getRoleDashboardStats(
  role: RoleName,
  user: CurrentUser,
): Promise<DashboardStat[]> {
  if (role === "super_admin") {
    const [users, activeSchedules, summary] = await Promise.all([
      countTable("users"),
      countWhere("exam_schedules", "status", "active"),
      getReportSummary(),
    ]);

    return [
      {
        title: "Pengguna",
        value: String(users),
        description: "Total akun semua peran pengguna.",
        href: "/dashboard/admin/users",
      },
      {
        title: "Ujian Aktif",
        value: String(activeSchedules),
        description: "Jadwal ujian yang sedang aktif.",
        href: "/dashboard/exams/schedules",
      },
      {
        title: "Perlu Koreksi",
        value: String(summary.pending),
        description: "Jawaban esai yang masih perlu dinilai.",
        href: "/dashboard/teacher/grading",
      },
      {
        title: "Nilai Final",
        value: String(summary.finalized),
        description: "Pengerjaan ujian dengan nilai final.",
        href: "/dashboard/reports",
      },
      {
        title: "Tidak Hadir",
        value: String(summary.absent),
        description: "Peserta yang ditandai tidak hadir.",
        href: "/dashboard/reports/exams",
      },
      {
        title: "Rata-rata Nilai",
        value: `${summary.averagePercent.toFixed(2)}%`,
        description: "Rata-rata dari nilai final.",
        href: "/dashboard/reports",
      },
    ];
  }

  if (role === "admin") {
    const schoolId = user.school_id;
    const [
      students,
      teachers,
      activeSchedules,
      operationalSummary,
      recoveryCenter,
    ] = await Promise.all([
      countUsersByRole("student"),
      countUsersByRole("teacher"),
      countWhere("exam_schedules", "status", "active", schoolId),
      getProctorOperationalSummary(user),
      getRecoveryCenterData(user),
    ]);
    const problemParticipantCount = recoveryCenter.queue.length;

    return [
      {
        title: "Ujian Aktif",
        value: String(activeSchedules),
        description: "Ujian yang sedang berlangsung.",
        href: "/dashboard/admin/monitoring",
      },
      {
        title: "Jadwal Mendatang",
        value: String(operationalSummary.upcomingSchedules.length),
        description: "Jadwal ujian yang akan dimulai.",
        href: "/dashboard/exams/schedules",
      },
      {
        title: "Total Guru",
        value: String(teachers),
        description: "Guru aktif yang terdaftar di sekolah.",
        href: "/dashboard/master-data/teachers",
      },
      {
        title: "Total Siswa",
        value: String(students),
        description: "Siswa aktif yang terdaftar di sekolah.",
        href: "/dashboard/master-data/students",
      },
      {
        title: "Peserta Sedang Ujian",
        value: String(operationalSummary.inProgress),
        description: "Peserta yang sedang mengerjakan ujian.",
        href: "/dashboard/admin/monitoring?status=in_progress",
      },
      {
        title: "Peserta Bermasalah",
        value: String(problemParticipantCount),
        description: "Peserta yang membutuhkan bantuan operator.",
        href: "/dashboard/recovery-center",
      },
    ];
  }

  if (role === "teacher") {
    const [teacherStats, attempts] = await Promise.all([
      getTeacherOperationalStats(user.id),
      getTeacherResultRecap({ grading_status: "needs_manual_grading" }),
    ]);

    return [
      {
        title: "Kelas Saya",
        value: `${teacherStats.subjectCount}/${teacherStats.classCount}`,
        description: `${teacherStats.assignmentCount} penugasan mengajar aktif.`,
        href: "/dashboard/teacher/assignments",
      },
      {
        title: "Soal Belum Diterbitkan",
        value: String(teacherStats.draftQuestions),
        description: "Soal yang masih perlu ditinjau sebelum dipakai.",
        href: "/dashboard/question-bank/questions?status=draft",
      },
      {
        title: "Soal Sudah Diterbitkan",
        value: String(teacherStats.publishedQuestions),
        description: "Soal yang sudah siap digunakan untuk ujian.",
        href: "/dashboard/question-bank/questions?status=published",
      },
      {
        title: "Paket Belum Diterbitkan",
        value: String(teacherStats.draftPackages),
        description: "Paket ujian yang masih perlu dilengkapi.",
        href: "/dashboard/exams/packages?status=draft",
      },
      {
        title: "Paket Sudah Diterbitkan",
        value: String(teacherStats.publishedPackages),
        description: "Paket ujian yang sudah siap dijadwalkan.",
        href: "/dashboard/exams/packages?status=published",
      },
      {
        title: "Jadwal Mendatang",
        value: String(teacherStats.upcomingSchedules),
        description: "Jadwal ujian mendatang untuk mata pelajaran Anda.",
        href: "/dashboard/exams/schedules?status=scheduled",
      },
      {
        title: "Ujian Aktif",
        value: String(teacherStats.activeSchedules),
        description: "Ujian yang sedang berlangsung untuk mata pelajaran Anda.",
        href: "/dashboard/exams/schedules?status=active",
      },
      {
        title: "Perlu Dinilai",
        value: String(attempts.length),
        description: "Jawaban esai yang perlu dinilai.",
        href: "/dashboard/teacher/grading?grading_status=needs_manual_grading",
      },
      {
        title: "Belum Mengikuti",
        value: String(teacherStats.notStartedParticipants),
        description: "Peserta yang belum mulai pada ujian aktif atau terjadwal.",
        href: "/dashboard/reports/students?status=assigned",
      },
      {
        title: "Ujian Hari Ini",
        value: String(teacherStats.todaySchedules),
        description: "Ujian mata pelajaran Anda yang mulai hari ini.",
        href: "/dashboard/exams/schedules",
      },
    ];
  }

  if (role === "student") {
    const [activeSchedules, submittedAttempts] = await Promise.all([
      getStudentExamSchedules({ activeOnly: true }),
      getStudentSubmittedAttempts(),
    ]);

    return [
      {
        title: "Ujian Aktif",
        value: String(activeSchedules.length),
        description: "Ujian yang dapat dikerjakan saat ini.",
        href: "/dashboard/student/active-exams",
      },
      {
        title: "Riwayat",
        value: String(submittedAttempts.length),
        description: "Ujian yang sudah selesai dikerjakan.",
        href: "/dashboard/student/history",
      },
      {
        title: "Akses",
        value: "Aman",
        description: "Akun siswa siap digunakan untuk mengikuti ujian.",
      },
    ];
  }

  if (role === "proctor") {
    const summary = await getProctorOperationalSummary(user);

    return [
      {
        title: "Ujian Aktif",
        value: String(summary.activeSchedules.length),
        description: "Ujian yang sedang membutuhkan pemantauan.",
        href: "/dashboard/proctor/monitoring",
      },
      {
        title: "Jadwal Mendatang",
        value: String(summary.upcomingSchedules.length),
        description: "Jadwal ujian yang akan segera dimulai.",
        href: "/dashboard/proctor/schedules",
      },
      {
        title: "Peserta",
        value: String(summary.participants.length),
        description: "Peserta pada jadwal yang diawasi.",
        href: "/dashboard/proctor/schedules",
      },
      {
        title: "Sedang Ujian",
        value: String(summary.inProgress),
        description: "Peserta yang sedang mengerjakan ujian.",
        href: "/dashboard/proctor/monitoring?status=in_progress",
      },
      {
        title: "Sudah Selesai",
        value: String(summary.submitted),
        description: "Ujian yang sudah selesai dikerjakan.",
        href: "/dashboard/proctor/monitoring?status=submitted",
      },
      {
        title: "Kejadian",
        value: String(summary.events.length),
        description: "Catatan kejadian selama ujian berlangsung.",
        href: "/dashboard/proctor/monitoring",
      },
    ];
  }

  return [];
}
