import { getStudentExamSchedules } from "@/features/exam-room/queries";
import { getProctorOperationalSummary } from "@/features/monitoring/queries";
import {
  getStudentSubmittedAttempts,
  getTeacherResultRecap,
} from "@/features/results/queries";
import { getReportSummary } from "@/features/reports/queries";
import { requireSchoolScope } from "@/lib/auth/school-scope";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUser, RoleName } from "@/types/auth";

type DashboardStat = {
  title: string;
  value: string;
  description: string;
  href?: string;
};

async function getAdminSchoolId() {
  const scope = await requireSchoolScope();

  return scope.user.roles?.name === "admin" ? scope.schoolId : null;
}

async function countTable(table: string, schoolId?: string | null) {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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

async function countSchedulesToday() {
  const schoolId = await getAdminSchoolId();
  const supabase = await createClient();
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  let query = supabase
    .from("exam_schedules")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .gte("start_at", start.toISOString())
    .lte("start_at", end.toISOString());

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { count } = await query;

  return count ?? 0;
}

async function countSchedulesWithoutParticipants() {
  const schoolId = await getAdminSchoolId();
  const supabase = await createClient();
  let query = supabase
    .from("exam_schedules")
    .select("id, exam_participants(id)")
    .is("deleted_at", null)
    .eq("is_active", true)
    .in("status", ["scheduled", "active"]);

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data } = await query;

  return (data ?? []).filter(
    (schedule) => (schedule.exam_participants ?? []).length === 0,
  ).length;
}

async function getClassReadinessCounts() {
  const schoolId = await getAdminSchoolId();
  const supabase = await createClient();
  let query = supabase
    .from("classes")
    .select("id, homeroom_teacher_id, class_members(id, left_at)")
    .eq("is_active", true);

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data } = await query;

  const classes = data ?? [];

  return {
    withoutStudents: classes.filter(
      (classItem) =>
        !(classItem.class_members ?? []).some(
          (member: { left_at?: string | null }) => !member.left_at,
        ),
    ).length,
    withoutHomeroom: classes.filter(
      (classItem) => !classItem.homeroom_teacher_id,
    ).length,
  };
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
      .eq("created_by", teacherId)
      .eq("status", "draft")
      .is("deleted_at", null),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("created_by", teacherId)
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
        .lte("start_at", now)
        .gte("end_at", now)
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
        title: "Users",
        value: String(users),
        description: "Total akun internal semua role.",
        href: "/dashboard/admin/users",
      },
      {
        title: "Jadwal Active",
        value: String(activeSchedules),
        description: "Jadwal ujian yang sedang aktif.",
        href: "/dashboard/exams/schedules",
      },
      {
        title: "Pending Grading",
        value: String(summary.pending),
        description: "Attempt yang masih perlu koreksi essay.",
        href: "/dashboard/teacher/grading",
      },
      {
        title: "Finalized",
        value: String(summary.finalized),
        description: "Attempt dengan nilai final.",
        href: "/dashboard/reports",
      },
      {
        title: "Absent",
        value: String(summary.absent),
        description: "Peserta yang ditandai tidak hadir.",
        href: "/dashboard/reports/exams",
      },
      {
        title: "Average Final",
        value: `${summary.averagePercent.toFixed(2)}%`,
        description: "Rata-rata dari nilai finalized.",
        href: "/dashboard/reports",
      },
    ];
  }

  if (role === "admin") {
    const schoolId = user.school_id;
    const [
      students,
      teachers,
      classes,
      subjects,
      activeSchedules,
      todaySchedules,
      schedulesWithoutParticipants,
      classReadiness,
      summary,
    ] = await Promise.all([
      countUsersByRole("student"),
      countUsersByRole("teacher"),
      countTable("classes", schoolId),
      countTable("subjects", schoolId),
      countWhere("exam_schedules", "status", "active", schoolId),
      countSchedulesToday(),
      countSchedulesWithoutParticipants(),
      getClassReadinessCounts(),
      getReportSummary(),
    ]);

    return [
      {
        title: "Siswa",
        value: String(students),
        description: "Total akun siswa aktif di data internal.",
        href: "/dashboard/master-data/students",
      },
      {
        title: "Guru",
        value: String(teachers),
        description: "Total akun guru di data internal.",
        href: "/dashboard/master-data/teachers",
      },
      {
        title: "Kelas",
        value: String(classes),
        description: "Total kelas pada master data.",
        href: "/dashboard/master-data/classes",
      },
      {
        title: "Mapel",
        value: String(subjects),
        description: "Total mata pelajaran pada master data.",
        href: "/dashboard/master-data/subjects",
      },
      {
        title: "Jadwal Hari Ini",
        value: String(todaySchedules),
        description: "Jadwal ujian yang mulai hari ini.",
        href: "/dashboard/exams/schedules",
      },
      {
        title: "Jadwal Active",
        value: String(activeSchedules),
        description: "Ujian yang sedang aktif.",
        href: "/dashboard/exams/schedules?status=active",
      },
      {
        title: "Tanpa Peserta",
        value: String(schedulesWithoutParticipants),
        description: "Scheduled/active tapi peserta belum tersinkron.",
        href: "/dashboard/exams/schedules",
      },
      {
        title: "Kelas Tanpa Siswa",
        value: String(classReadiness.withoutStudents),
        description: "Kelas aktif yang belum punya siswa aktif.",
        href: "/dashboard/master-data/classes",
      },
      {
        title: "Kelas Tanpa Wali",
        value: String(classReadiness.withoutHomeroom),
        description: "Kelas aktif tanpa homeroom teacher.",
        href: "/dashboard/master-data/classes",
      },
      {
        title: "Submitted",
        value: String(summary.submitted),
        description: "Attempt yang sudah dikumpulkan.",
        href: "/dashboard/reports",
      },
      {
        title: "Pending Grading",
        value: String(summary.pending),
        description: "Essay yang masih perlu koreksi.",
        href: "/dashboard/teacher/grading",
      },
      {
        title: "Average Final",
        value: `${summary.averagePercent.toFixed(2)}%`,
        description: "Rata-rata nilai finalized.",
        href: "/dashboard/reports",
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
        description: `${teacherStats.assignmentCount} tugas mengajar.`,
        href: "/dashboard/teacher/assignments",
      },
      {
        title: "Draft Soal",
        value: String(teacherStats.draftQuestions),
        description: "Soal draft yang dibuat guru.",
        href: "/dashboard/question-bank/questions?status=draft",
      },
      {
        title: "Soal Published",
        value: String(teacherStats.publishedQuestions),
        description: "Soal siap dipakai pada paket ujian.",
        href: "/dashboard/question-bank/questions?status=published",
      },
      {
        title: "Paket Draft",
        value: String(teacherStats.draftPackages),
        description: "Paket ujian yang belum dipublish.",
        href: "/dashboard/exams/packages?status=draft",
      },
      {
        title: "Paket Published",
        value: String(teacherStats.publishedPackages),
        description: "Paket ujian siap dijadwalkan.",
        href: "/dashboard/exams/packages?status=published",
      },
      {
        title: "Jadwal Upcoming",
        value: String(teacherStats.upcomingSchedules),
        description: "Jadwal mendatang untuk mapel guru.",
        href: "/dashboard/exams/schedules?status=scheduled",
      },
      {
        title: "Ujian Aktif",
        value: String(teacherStats.activeSchedules),
        description: "Ujian aktif yang terkait mapel guru.",
        href: "/dashboard/exams/schedules?status=active",
      },
      {
        title: "Perlu Dinilai",
        value: String(attempts.length),
        description: "Essay yang perlu koreksi manual.",
        href: "/dashboard/teacher/grading?grading_status=needs_manual_grading",
      },
      {
        title: "Belum Mengikuti",
        value: String(teacherStats.notStartedParticipants),
        description: "Peserta pada ujian aktif/terjadwal yang belum mulai.",
        href: "/dashboard/reports/students?status=assigned",
      },
      {
        title: "Ujian Hari Ini",
        value: String(teacherStats.todaySchedules),
        description: "Ujian mapel guru yang mulai hari ini.",
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
        description: "Ujian yang dapat dikerjakan sekarang.",
        href: "/dashboard/student/active-exams",
      },
      {
        title: "Riwayat",
        value: String(submittedAttempts.length),
        description: "Attempt yang sudah dikumpulkan.",
        href: "/dashboard/student/history",
      },
      {
        title: "Session",
        value: "Secure",
        description: "Akses peserta terlindungi Supabase SSR.",
      },
    ];
  }

  if (role === "proctor") {
    const summary = await getProctorOperationalSummary();

    return [
      {
        title: "Jadwal Active",
        value: String(summary.activeSchedules.length),
        description: "Jadwal yang sedang perlu dipantau.",
        href: "/dashboard/proctor/monitoring",
      },
      {
        title: "Jadwal Mendatang",
        value: String(summary.upcomingSchedules.length),
        description: "Jadwal scheduled yang akan mulai.",
        href: "/dashboard/proctor/schedules",
      },
      {
        title: "Peserta",
        value: String(summary.participants.length),
        description: "Total peserta pada jadwal terpantau.",
        href: "/dashboard/proctor/schedules",
      },
      {
        title: "In Progress",
        value: String(summary.inProgress),
        description: "Attempt siswa yang sedang berjalan.",
        href: "/dashboard/proctor/monitoring?status=in_progress",
      },
      {
        title: "Submitted",
        value: String(summary.submitted),
        description: "Attempt yang sudah dikumpulkan.",
        href: "/dashboard/proctor/monitoring?status=submitted",
      },
      {
        title: "Event",
        value: String(summary.events.length),
        description: "Event ujian/anti-cheat yang tercatat.",
        href: "/dashboard/proctor/monitoring",
      },
    ];
  }

  return [];
}
