import { createClient } from "@/lib/supabase/server";
import {
  assertSameSchool,
  requireSchoolScope,
  requireScopedSchoolId,
} from "@/lib/auth/school-scope";

export type SelectOption = {
  value: string;
  label: string;
};

export type StudentLoginCard = {
  id: string;
  email: string;
  username: string;
  status: string;
  full_name: string;
  nis: string;
  nisn: string;
  class_id: string;
  class_name: string;
  academic_year: string;
};

type AcademicYearRelation =
  | {
      name?: string | null;
    }
  | Array<{
      name?: string | null;
    }>
  | null;

type ClassRelation =
  | {
      id?: string | null;
      name?: string | null;
      academic_years?: AcademicYearRelation;
    }
  | Array<{
      id?: string | null;
      name?: string | null;
      academic_years?: AcademicYearRelation;
    }>
  | null;

type ActiveClassSummary = {
  id: string;
  name: string;
  academicYear: string;
};

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getAcademicYearName(value: AcademicYearRelation) {
  return firstRelation(value)?.name ?? "";
}

function getClassRelation(value: ClassRelation) {
  return firstRelation(value);
}

async function assertUserSchoolScope(userId: string) {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", userId)
    .maybeSingle();

  assertSameSchool(scope, user?.school_id);
}

async function getScopedUserIds(userIds: string[]) {
  const scope = await requireSchoolScope();

  if (scope.isSuperAdmin) {
    return userIds;
  }

  const schoolId = requireScopedSchoolId(scope);
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id")
    .in("id", userIds)
    .eq("school_id", schoolId);

  return (data ?? []).map((user) => user.id as string);
}

export async function getSchools(search = "") {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase.from("schools").select("*").order("name");

  if (!scope.isSuperAdmin) {
    query = query.eq("id", requireScopedSchoolId(scope));
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getSchoolOptions(): Promise<SelectOption[]> {
  const schools = await getSchools();

  return schools.map((school) => ({
    value: school.id,
    label: school.name,
  }));
}

export async function getAcademicYears(search = "") {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("academic_years")
    .select("*, schools(name)")
    .order("name", { ascending: false });

  if (!scope.isSuperAdmin) {
    query = query.eq("school_id", requireScopedSchoolId(scope));
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getAcademicYearOptions(): Promise<SelectOption[]> {
  const academicYears = await getAcademicYears();

  return academicYears.map((academicYear) => ({
    value: academicYear.id,
    label: academicYear.name,
  }));
}

export async function getSemesters(search = "") {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("semesters")
    .select("*, academic_years!inner(name, school_id, schools(name))")
    .order("name");

  if (!scope.isSuperAdmin) {
    query = query.eq("academic_years.school_id", requireScopedSchoolId(scope));
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getClasses(search = "") {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("classes")
    .select(
      "*, schools(name), academic_years(name), users!classes_homeroom_teacher_id_fkey(id, username, user_profiles(full_name)), class_members(id, left_at)",
    )
    .order("grade_level")
    .order("name");

  if (!scope.isSuperAdmin) {
    query = query.eq("school_id", requireScopedSchoolId(scope));
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getClassOptions(): Promise<SelectOption[]> {
  const classes = await getClasses();

  return classes.map((classItem) => ({
    value: classItem.id,
    label: `${classItem.name} - ${classItem.academic_years?.name ?? "Tahun ajaran"}`,
  }));
}

export async function getSubjects(search = "") {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("subjects")
    .select("*, schools(name)")
    .order("name");

  if (!scope.isSuperAdmin) {
    query = query.eq("school_id", requireScopedSchoolId(scope));
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getSubjectOptions(): Promise<SelectOption[]> {
  const subjects = await getSubjects();

  return subjects.map((subject) => ({
    value: subject.id,
    label: `${subject.code} - ${subject.name}`,
  }));
}

export async function getRoleId(roleName: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .single();

  return data?.id ?? null;
}

export async function getUsersByRole(roleName: "teacher" | "student", search = "") {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("users")
    .select(
      "*, roles!inner(name, label), user_profiles(full_name, nip, nis, nisn, phone, avatar_url)",
    )
    .eq("roles.name", roleName)
    .order("username");

  if (!scope.isSuperAdmin) {
    query = query.eq("school_id", requireScopedSchoolId(scope));
  }

  if (search) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getTeacherOptions(): Promise<SelectOption[]> {
  const teachers = await getUsersByRole("teacher");

  return teachers.map((teacher) => {
    const profile = Array.isArray(teacher.user_profiles)
      ? teacher.user_profiles[0]
      : teacher.user_profiles;

    return {
      value: teacher.id,
      label: profile?.full_name ?? teacher.username,
    };
  });
}

export async function getTeacherAssignments(teacherId: string) {
  await assertUserSchoolScope(teacherId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_subjects")
    .select("*, subjects(code, name), classes(name), academic_years(name)")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getAllTeacherAssignments(search = "") {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("teacher_subjects")
    .select(
      "id, teacher_id, subject_id, class_id, academic_year_id, users!teacher_subjects_teacher_id_fkey(id, username, email, school_id, user_profiles(full_name)), subjects(code, name, school_id), classes(name, school_id), academic_years(name, school_id), created_at",
    )
    .order("created_at", { ascending: false });

  if (!scope.isSuperAdmin) {
    const schoolId = requireScopedSchoolId(scope);

    query = query
      .eq("users.school_id", schoolId)
      .eq("subjects.school_id", schoolId)
      .eq("classes.school_id", schoolId)
      .eq("academic_years.school_id", schoolId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  if (!search.trim()) {
    return data;
  }

  const keyword = search.trim().toLowerCase();

  return data.filter((item) => {
    const teacher = firstRelation(item.users);
    const profile = firstRelation(teacher?.user_profiles);
    const subject = firstRelation(item.subjects);
    const classItem = firstRelation(item.classes);
    const academicYear = firstRelation(item.academic_years);

    return [
      profile?.full_name,
      teacher?.username,
      teacher?.email,
      subject?.code,
      subject?.name,
      classItem?.name,
      academicYear?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });
}

export async function getTeacherAssignmentCounts(teacherIds: string[]) {
  if (teacherIds.length === 0) {
    return new Map<string, number>();
  }

  const scopedTeacherIds = await getScopedUserIds(teacherIds);

  if (scopedTeacherIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_subjects")
    .select("teacher_id")
    .in("teacher_id", scopedTeacherIds);

  if (error || !data) {
    return new Map<string, number>();
  }

  const counts = new Map<string, number>();

  for (const item of data) {
    const teacherId = item.teacher_id as string | null;

    if (teacherId) {
      counts.set(teacherId, (counts.get(teacherId) ?? 0) + 1);
    }
  }

  return counts;
}

export async function getStudentClassHistory(studentId: string) {
  await assertUserSchoolScope(studentId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_members")
    .select("*, classes(name, academic_years(name))")
    .eq("student_id", studentId)
    .order("joined_at", { ascending: false });

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getStudentActiveClassCounts(studentIds: string[]) {
  if (studentIds.length === 0) {
    return new Map<string, number>();
  }

  const scopedStudentIds = await getScopedUserIds(studentIds);

  if (scopedStudentIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("class_members")
    .select("student_id, class_id")
    .in("student_id", scopedStudentIds)
    .is("left_at", null);

  const activeClassIdsByStudent = new Map<string, Set<string>>();

  for (const item of data ?? []) {
    const studentId = item.student_id as string | null;
    const classId = item.class_id as string | null;

    if (studentId && classId) {
      const classIds = activeClassIdsByStudent.get(studentId) ?? new Set<string>();

      classIds.add(classId);
      activeClassIdsByStudent.set(studentId, classIds);
    }
  }

  const studentsWithoutActiveClass = scopedStudentIds.filter(
    (studentId) => !activeClassIdsByStudent.has(studentId),
  );

  if (studentsWithoutActiveClass.length > 0) {
    const { data: legacyClasses } = await supabase
      .from("student_classes")
      .select("student_id, class_id")
      .in("student_id", studentsWithoutActiveClass);

    for (const item of legacyClasses ?? []) {
      const studentId = item.student_id as string | null;
      const classId = item.class_id as string | null;

      if (studentId && classId) {
        const classIds =
          activeClassIdsByStudent.get(studentId) ?? new Set<string>();

        classIds.add(classId);
        activeClassIdsByStudent.set(studentId, classIds);
      }
    }
  }

  return new Map(
    [...activeClassIdsByStudent.entries()].map(([studentId, classIds]) => [
      studentId,
      classIds.size,
    ]),
  );
}

export async function getStudentLoginCards(filters: {
  class_id?: string;
  q?: string;
}): Promise<StudentLoginCard[]> {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("users")
    .select(
      "id, email, username, status, roles!inner(name), user_profiles(full_name, nis, nisn)",
    )
    .eq("roles.name", "student")
    .eq("status", "active")
    .order("username");

  if (!scope.isSuperAdmin) {
    query = query.eq("school_id", requireScopedSchoolId(scope));
  }

  const { data: students, error } = await query;

  if (error || !students?.length) {
    return [];
  }

  const studentIds = students.map((student) => student.id as string);
  const { data: memberships } = await supabase
    .from("class_members")
    .select("student_id, classes(id, name, academic_years(name))")
    .in("student_id", studentIds)
    .is("left_at", null);
  const activeClassByStudent = new Map<string, ActiveClassSummary>();

  for (const membership of memberships ?? []) {
    const classItem = getClassRelation(membership.classes);
    const classId = classItem?.id ?? "";

    if (membership.student_id && classId) {
      activeClassByStudent.set(membership.student_id as string, {
        id: classId,
        name: classItem?.name ?? "Kelas",
        academicYear: getAcademicYearName(classItem?.academic_years ?? null),
      });
    }
  }

  const studentsWithoutActiveClass = studentIds.filter(
    (studentId) => !activeClassByStudent.has(studentId),
  );

  if (studentsWithoutActiveClass.length > 0) {
    const { data: legacyClasses } = await supabase
      .from("student_classes")
      .select("student_id, classes(id, name), academic_years(name)")
      .in("student_id", studentsWithoutActiveClass)
      .order("created_at", { ascending: false });

    for (const membership of legacyClasses ?? []) {
      if (activeClassByStudent.has(membership.student_id as string)) {
        continue;
      }

      const classItem = getClassRelation(membership.classes);
      const classId = classItem?.id ?? "";

      if (membership.student_id && classId) {
        activeClassByStudent.set(membership.student_id as string, {
          id: classId,
          name: classItem?.name ?? "Kelas",
          academicYear: getAcademicYearName(membership.academic_years),
        });
      }
    }
  }

  const search = filters.q?.trim().toLowerCase() ?? "";

  return students
    .map((student) => {
      const profile = Array.isArray(student.user_profiles)
        ? student.user_profiles[0]
        : student.user_profiles;
      const activeClass = activeClassByStudent.get(student.id as string);

      return {
        id: student.id as string,
        email: student.email as string,
        username: student.username as string,
        status: student.status as string,
        full_name: profile?.full_name || (student.username as string),
        nis: profile?.nis ?? "",
        nisn: profile?.nisn ?? "",
        class_id: activeClass?.id ?? "",
        class_name: activeClass?.name ?? "Belum ada kelas aktif",
        academic_year: activeClass?.academicYear ?? "",
      };
    })
    .filter((student) => !filters.class_id || student.class_id === filters.class_id)
    .filter((student) => {
      if (!search) {
        return true;
      }

      return [
        student.full_name,
        student.username,
        student.email,
        student.nis,
        student.nisn,
      ].some((value) => value.toLowerCase().includes(search));
    });
}
