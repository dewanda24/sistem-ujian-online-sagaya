import { getStudentExamSchedules } from "@/features/exam-room/queries";
import { getMonitoringSchedules } from "@/features/monitoring/queries";
import {
  getStudentSubmittedAttempts,
  getTeacherResultRecap,
} from "@/features/results/queries";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUser, RoleName } from "@/types/auth";

type DashboardStat = {
  title: string;
  value: string;
  description: string;
  href?: string;
};

async function countTable(table: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });

  return count ?? 0;
}

async function countWhere(
  table: string,
  column: string,
  value: string | boolean,
) {
  const supabase = await createClient();
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);

  return count ?? 0;
}

async function countUsersByRole(roleName: RoleName) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("users")
    .select("id, roles!inner(name)", { count: "exact", head: true })
    .eq("roles.name", roleName);

  return count ?? 0;
}

export async function getRoleDashboardStats(
  role: RoleName,
  user: CurrentUser,
): Promise<DashboardStat[]> {
  if (role === "super_admin") {
    const [users, activeSchedules, pendingGrading] = await Promise.all([
      countTable("users"),
      countWhere("exam_schedules", "status", "published"),
      countWhere("exam_attempts", "grading_status", "needs_manual_grading"),
    ]);

    return [
      {
        title: "Users",
        value: String(users),
        description: "Total akun internal semua role.",
        href: "/dashboard/admin/users",
      },
      {
        title: "Jadwal Published",
        value: String(activeSchedules),
        description: "Jadwal ujian yang siap digunakan.",
        href: "/dashboard/exams/schedules",
      },
      {
        title: "Pending Grading",
        value: String(pendingGrading),
        description: "Attempt yang masih perlu koreksi essay.",
        href: "/dashboard/teacher/grading",
      },
    ];
  }

  if (role === "admin") {
    const [students, teachers, classes] = await Promise.all([
      countUsersByRole("student"),
      countUsersByRole("teacher"),
      countTable("classes"),
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
    ];
  }

  if (role === "teacher") {
    const supabase = await createClient();
    const [{ count: assignments }, { count: draftQuestions }, attempts] =
      await Promise.all([
        supabase
          .from("teacher_subjects")
          .select("id", { count: "exact", head: true })
          .eq("teacher_id", user.id),
        supabase
          .from("questions")
          .select("id", { count: "exact", head: true })
          .eq("created_by", user.id)
          .eq("status", "draft"),
        getTeacherResultRecap({ grading_status: "needs_manual_grading" }),
      ]);

    return [
      {
        title: "Assignment",
        value: String(assignments ?? 0),
        description: "Mapel dan kelas yang ditugaskan.",
      },
      {
        title: "Draft Soal",
        value: String(draftQuestions ?? 0),
        description: "Soal draft yang dibuat guru.",
        href: "/dashboard/question-bank/questions?status=draft",
      },
      {
        title: "Pending Grading",
        value: String(attempts.length),
        description: "Essay yang perlu koreksi manual.",
        href: "/dashboard/teacher/grading?grading_status=needs_manual_grading",
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
    const schedules = await getMonitoringSchedules();

    return [
      {
        title: "Monitoring",
        value: "Ready",
        description: "Route monitoring proctor tersedia.",
        href: "/dashboard/proctor/monitoring",
      },
      {
        title: "Jadwal Terpantau",
        value: String(schedules.length),
        description: "Jadwal yang tersedia untuk dipantau.",
      },
      {
        title: "Access",
        value: "Proctor",
        description: "Route dikunci untuk role proctor.",
      },
    ];
  }

  return [];
}
