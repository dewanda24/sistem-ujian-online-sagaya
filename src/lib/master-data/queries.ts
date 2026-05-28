import { createClient } from "@/lib/supabase/server";

export type SelectOption = {
  value: string;
  label: string;
};

export async function getSchools(search = "") {
  const supabase = await createClient();
  let query = supabase.from("schools").select("*").order("name");

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
  const supabase = await createClient();
  let query = supabase
    .from("academic_years")
    .select("*, schools(name)")
    .order("name", { ascending: false });

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
  const supabase = await createClient();
  let query = supabase
    .from("semesters")
    .select("*, academic_years(name, school_id, schools(name))")
    .order("name");

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
  const supabase = await createClient();
  let query = supabase
    .from("classes")
    .select(
      "*, schools(name), academic_years(name), users!classes_homeroom_teacher_id_fkey(id, username, user_profiles(full_name)), class_members(id)",
    )
    .order("grade_level")
    .order("name");

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
  const supabase = await createClient();
  let query = supabase
    .from("subjects")
    .select("*, schools(name)")
    .order("name");

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
  const supabase = await createClient();
  let query = supabase
    .from("users")
    .select(
      "*, roles!inner(name, label), user_profiles(full_name, nip, nis, nisn, phone, avatar_url)",
    )
    .eq("roles.name", roleName)
    .order("username");

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

export async function getStudentClassHistory(studentId: string) {
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
