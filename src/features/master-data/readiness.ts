import { requireSchoolScope, requireScopedSchoolId } from "@/lib/auth/school-scope";
import { createClient } from "@/lib/supabase/server";

export type MasterDataIssueSeverity = "critical" | "warning" | "info";

export type MasterDataReadinessIssue = {
  key: string;
  title: string;
  count: number;
  severity: MasterDataIssueSeverity;
  href: string;
};

type CountRelation = Array<{ id?: string | null }> | null | undefined;

function hasRows(value: CountRelation) {
  return Array.isArray(value) && value.length > 0;
}

function issue(
  key: string,
  title: string,
  count: number,
  severity: MasterDataIssueSeverity,
  href: string,
): MasterDataReadinessIssue | null {
  if (count <= 0) {
    return null;
  }

  return { key, title, count, severity, href };
}

export async function getMasterDataReadinessIssues(
  schoolId?: string | null,
): Promise<MasterDataReadinessIssue[]> {
  const scope = await requireSchoolScope();
  const effectiveSchoolId = schoolId ?? requireScopedSchoolId(scope);

  if (!effectiveSchoolId) {
    return [];
  }

  const [
    studentsWithoutClass,
    teachersWithoutSubjects,
    subjectsWithoutTeachers,
    classesWithoutStudents,
    schedulesWithoutParticipants,
    schedulesWithoutProctors,
    packagesWithoutQuestions,
    questionsWithoutOptions,
    usersWithoutRole,
    usersWithoutSchool,
  ] = await Promise.all([
    countStudentsWithoutClass(effectiveSchoolId),
    countTeachersWithoutSubjects(effectiveSchoolId),
    countSubjectsWithoutTeachers(effectiveSchoolId),
    countClassesWithoutStudents(effectiveSchoolId),
    countSchedulesWithoutParticipants(effectiveSchoolId),
    countSchedulesWithoutProctors(effectiveSchoolId),
    countPackagesWithoutQuestions(effectiveSchoolId),
    countQuestionsWithoutOptions(effectiveSchoolId),
    countUsersWithoutRole(effectiveSchoolId),
    countUsersWithoutSchool(),
  ]);

  return [
    issue(
      "students_without_class",
      `${studentsWithoutClass} siswa belum memiliki kelas`,
      studentsWithoutClass,
      "critical",
      "/dashboard/master-data/students",
    ),
    issue(
      "teachers_without_subjects",
      `${teachersWithoutSubjects} guru belum memiliki mapel`,
      teachersWithoutSubjects,
      "critical",
      "/dashboard/master-data/teacher-assignments",
    ),
    issue(
      "subjects_without_teachers",
      `${subjectsWithoutTeachers} mapel belum memiliki guru`,
      subjectsWithoutTeachers,
      "warning",
      "/dashboard/master-data/teacher-assignments",
    ),
    issue(
      "classes_without_students",
      `${classesWithoutStudents} kelas belum memiliki siswa`,
      classesWithoutStudents,
      "warning",
      "/dashboard/master-data/classes",
    ),
    issue(
      "schedules_without_participants",
      `${schedulesWithoutParticipants} jadwal belum memiliki peserta`,
      schedulesWithoutParticipants,
      "critical",
      "/dashboard/exams/schedules",
    ),
    issue(
      "schedules_without_proctors",
      `${schedulesWithoutProctors} jadwal belum memiliki pengawas`,
      schedulesWithoutProctors,
      "critical",
      "/dashboard/exams/proctors",
    ),
    issue(
      "packages_without_questions",
      `${packagesWithoutQuestions} paket ujian belum memiliki soal`,
      packagesWithoutQuestions,
      "critical",
      "/dashboard/exams/packages",
    ),
    issue(
      "questions_without_options",
      `${questionsWithoutOptions} soal pilihan belum memiliki opsi jawaban`,
      questionsWithoutOptions,
      "warning",
      "/dashboard/question-bank/questions",
    ),
    issue(
      "users_without_role",
      `${usersWithoutRole} pengguna belum memiliki peran`,
      usersWithoutRole,
      "critical",
      "/dashboard/admin/users",
    ),
    issue(
      "users_without_school",
      `${usersWithoutSchool} user operasional belum memiliki sekolah`,
      usersWithoutSchool,
      "critical",
      "/dashboard/admin/users",
    ),
  ].filter((item): item is MasterDataReadinessIssue => Boolean(item));
}

async function countStudentsWithoutClass(schoolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, class_members(id, left_at), roles!inner(name)")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .eq("roles.name", "student");

  return (data ?? []).filter(
    (student) =>
      !(student.class_members ?? []).some(
        (member: { left_at?: string | null }) => !member.left_at,
      ),
  ).length;
}

async function countTeachersWithoutSubjects(schoolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, teacher_subjects!teacher_subjects_teacher_id_fkey(id), roles!inner(name)")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .eq("roles.name", "teacher");

  return (data ?? []).filter(
    (teacher) => !hasRows(teacher.teacher_subjects as CountRelation),
  ).length;
}

async function countSubjectsWithoutTeachers(schoolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("id, teacher_subjects(id)")
    .eq("school_id", schoolId)
    .eq("is_active", true);

  return (data ?? []).filter(
    (subject) => !hasRows(subject.teacher_subjects as CountRelation),
  ).length;
}

async function countClassesWithoutStudents(schoolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id, class_members(id, left_at)")
    .eq("school_id", schoolId)
    .eq("is_active", true);

  return (data ?? []).filter(
    (classItem) =>
      !(classItem.class_members ?? []).some(
        (member: { left_at?: string | null }) => !member.left_at,
      ),
  ).length;
}

async function countSchedulesWithoutParticipants(schoolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_schedules")
    .select("id, exam_participants(id)")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .in("status", ["scheduled", "active"])
    .is("deleted_at", null);

  return (data ?? []).filter(
    (schedule) => !hasRows(schedule.exam_participants as CountRelation),
  ).length;
}

async function countSchedulesWithoutProctors(schoolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_schedules")
    .select("id, exam_proctors(id, is_active)")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .in("status", ["scheduled", "active"])
    .is("deleted_at", null);

  return (data ?? []).filter(
    (schedule) =>
      !(schedule.exam_proctors ?? []).some(
        (proctor: { is_active?: boolean | null }) => proctor.is_active !== false,
      ),
  ).length;
}

async function countPackagesWithoutQuestions(schoolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_packages")
    .select("id, exam_package_questions(id)")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .is("deleted_at", null);

  return (data ?? []).filter(
    (examPackage) =>
      !hasRows(examPackage.exam_package_questions as CountRelation),
  ).length;
}

async function countQuestionsWithoutOptions(schoolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("questions")
    .select("id, type, question_options(id)")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .neq("type", "essay")
    .is("deleted_at", null);

  return (data ?? []).filter(
    (question) => !hasRows(question.question_options as CountRelation),
  ).length;
}

async function countUsersWithoutRole(schoolId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .is("role_id", null);

  return count ?? 0;
}

async function countUsersWithoutSchool() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("users")
    .select("id, roles!inner(name)", { count: "exact", head: true })
    .in("roles.name", ["admin", "principal", "teacher", "student", "proctor"])
    .eq("status", "active")
    .is("school_id", null);

  return count ?? 0;
}
