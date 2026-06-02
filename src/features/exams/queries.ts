import { requireAuth } from "@/lib/auth/require-auth";
import {
  requireSchoolScope,
  requireScopedSchoolId,
} from "@/lib/auth/school-scope";
import {
  getAcademicYearOptions,
  getClassOptions,
  getSubjectOptions,
  type SelectOption,
} from "@/lib/master-data/queries";
import { createClient } from "@/lib/supabase/server";

export type ExamPackageFilters = {
  q?: string;
  subject_id?: string;
  status?: string;
};

export type ExamScheduleFilters = {
  q?: string;
  status?: string;
  package_id?: string;
  date_from?: string;
  date_to?: string;
};

export type ExamAdmissionCardFilters = {
  schedule_id?: string;
  class_id?: string;
  status?: string;
  q?: string;
};

export type ExamAdmissionCard = {
  id: string;
  status: string;
  assigned_at: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_username: string;
  nis: string;
  nisn: string;
  class_id: string;
  class_name: string;
  academic_year: string;
  schedule_id: string;
  schedule_title: string;
  schedule_status: string;
  start_at: string;
  end_at: string;
  token_required: boolean;
  access_token: string;
  package_title: string;
  subject_code: string;
  subject_name: string;
  duration_minutes: number;
  semester: string;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getDefaultSchoolId() {
  const scope = await requireSchoolScope();

  if (!scope.isSuperAdmin) {
    return requireScopedSchoolId(scope);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("schools")
    .select("id")
    .eq("is_active", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    return data.id as string;
  }

  const fallback = await supabase
    .from("schools")
    .select("id")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  return fallback.data?.id ?? null;
}

export async function getScopedSubjectOptions(): Promise<SelectOption[]> {
  const user = await requireAuth();
  const supabase = await createClient();

  if (user.roles?.name !== "teacher") {
    return getSubjectOptions();
  }

  const { data, error } = await supabase
    .from("teacher_subjects")
    .select("subject_id, subjects(id, code, name)")
    .eq("teacher_id", user.id);

  if (error || !data) {
    return [];
  }

  const unique = new Map<string, SelectOption>();

  data.forEach((assignment) => {
    const subject = Array.isArray(assignment.subjects)
      ? assignment.subjects[0]
      : assignment.subjects;

    if (subject?.id) {
      unique.set(subject.id, {
        value: subject.id,
        label: `${subject.code} - ${subject.name}`,
      });
    }
  });

  return Array.from(unique.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

async function getScopedSubjectIds() {
  const subjects = await getScopedSubjectOptions();

  return subjects.map((subject) => subject.value);
}

export async function getScopedClassOptions(): Promise<SelectOption[]> {
  const user = await requireAuth();
  const supabase = await createClient();

  if (user.roles?.name !== "teacher") {
    return getClassOptions();
  }

  const { data, error } = await supabase
    .from("teacher_subjects")
    .select("class_id, classes(id, name, academic_years(name))")
    .eq("teacher_id", user.id);

  if (error || !data) {
    return [];
  }

  const unique = new Map<string, SelectOption>();

  data.forEach((assignment) => {
    const classItem = Array.isArray(assignment.classes)
      ? assignment.classes[0]
      : assignment.classes;

    if (classItem?.id) {
      const academicYear = firstRelation(classItem.academic_years);
      unique.set(classItem.id, {
        value: classItem.id,
        label: `${classItem.name} - ${academicYear?.name ?? "Tahun ajaran"}`,
      });
    }
  });

  return Array.from(unique.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export async function getAcademicYearSelectOptions() {
  return getAcademicYearOptions();
}

export async function getSemesterOptions(): Promise<SelectOption[]> {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("semesters")
    .select("id, name, academic_years!inner(name, school_id)")
    .order("name");

  if (!scope.isSuperAdmin) {
    query = query.eq("academic_years.school_id", requireScopedSchoolId(scope));
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((semester) => {
    const academicYear = firstRelation(semester.academic_years);

    return {
      value: semester.id,
      label: `${semester.name} - ${academicYear?.name ?? "Tahun ajaran"}`,
    };
  });
}

export async function getPublishedQuestionOptions(subjectId?: string) {
  const supabase = await createClient();
  const subjectIds = await getScopedSubjectIds();

  if (subjectIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("questions")
    .select("id, content, point, type, difficulty, subject_id, subjects(code, name)")
    .is("deleted_at", null)
    .eq("is_active", true)
    .eq("status", "published")
    .in("subject_id", subjectIds)
    .order("created_at", { ascending: false });

  if (subjectId) {
    query = query.eq("subject_id", subjectId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getExamPackages(filters: ExamPackageFilters) {
  const supabase = await createClient();
  const subjectIds = await getScopedSubjectIds();

  if (subjectIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("exam_packages")
    .select(
      "*, subjects(id, code, name), schools(name), users(username), exam_package_questions(id, question_id, questions(id, subject_id, type, difficulty, point, status, is_active, deleted_at))",
    )
    .is("deleted_at", null)
    .in("subject_id", subjectIds)
    .order("created_at", { ascending: false });

  if (filters.subject_id) {
    query = query.eq("subject_id", filters.subject_id);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.q) {
    query = query.ilike("title", `%${filters.q}%`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getExamPackageOptions(): Promise<SelectOption[]> {
  const packages = await getExamPackages({ status: "published" });

  return packages
    .filter((examPackage) => examPackage.is_active)
    .map((examPackage) => ({
      value: examPackage.id,
      label: `${examPackage.title} - ${
        examPackage.subjects?.code ?? "Mapel"
      }`,
    }));
}

export async function getExamPackageQuestionIds(packageId?: string) {
  if (!packageId) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_package_questions")
    .select("question_id")
    .eq("exam_package_id", packageId);

  if (error || !data) {
    return [];
  }

  return data.map((item) => item.question_id as string);
}

export async function getExamSchedules(filters: ExamScheduleFilters) {
  const supabase = await createClient();
  const packages = await getExamPackages({});
  const packageIds = packages.map((examPackage) => examPackage.id as string);

  if (packageIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("exam_schedules")
    .select(
      "*, exam_packages(id, title, status, is_active, subjects(code, name)), academic_years(name), semesters(name), exam_schedule_classes(id, class_id, classes(name)), exam_participants(id, status)",
    )
    .is("deleted_at", null)
    .in("exam_package_id", packageIds)
    .order("start_at", { ascending: false });

  if (filters.package_id) {
    query = query.eq("exam_package_id", filters.package_id);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.q) {
    query = query.ilike("title", `%${filters.q}%`);
  }

  if (filters.date_from) {
    query = query.gte("start_at", `${filters.date_from}T00:00:00.000Z`);
  }

  if (filters.date_to) {
    query = query.lte("start_at", `${filters.date_to}T23:59:59.999Z`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getExamScheduleClassIds(scheduleId?: string) {
  if (!scheduleId) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_schedule_classes")
    .select("class_id")
    .eq("exam_schedule_id", scheduleId);

  if (error || !data) {
    return [];
  }

  return data.map((item) => item.class_id as string);
}

export async function getExamAdmissionCards(
  filters: ExamAdmissionCardFilters,
): Promise<ExamAdmissionCard[]> {
  const supabase = await createClient();
  const schedules = await getExamSchedules({});
  const scopedScheduleIds = schedules.map((schedule) => schedule.id as string);

  if (scopedScheduleIds.length === 0) {
    return [];
  }

  const scheduleIds =
    filters.schedule_id && scopedScheduleIds.includes(filters.schedule_id)
      ? [filters.schedule_id]
      : scopedScheduleIds;

  let query = supabase
    .from("exam_participants")
    .select(
      "id, status, assigned_at, student_id, class_id, users(id, username, email, user_profiles(full_name, nis, nisn)), classes(id, name, academic_years(name)), exam_schedules(id, title, status, start_at, end_at, token_required, access_token, academic_years(name), semesters(name), exam_packages(id, title, duration_minutes, subjects(code, name)))",
    )
    .in("exam_schedule_id", scheduleIds)
    .order("assigned_at", { ascending: false });

  if (filters.class_id) {
    query = query.eq("class_id", filters.class_id);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  const normalizedQuery = filters.q?.trim().toLowerCase();

  return data
    .map((participant) => {
      const user = firstRelation(participant.users);
      const profile = firstRelation(user?.user_profiles);
      const classItem = firstRelation(participant.classes);
      const classAcademicYear = firstRelation(classItem?.academic_years);
      const schedule = firstRelation(participant.exam_schedules);
      const scheduleAcademicYear = firstRelation(schedule?.academic_years);
      const semester = firstRelation(schedule?.semesters);
      const examPackage = firstRelation(schedule?.exam_packages);
      const subject = firstRelation(examPackage?.subjects);

      return {
        id: participant.id as string,
        status: participant.status as string,
        assigned_at: participant.assigned_at as string,
        student_id: participant.student_id as string,
        student_name: profile?.full_name || user?.username || "Siswa",
        student_email: user?.email ?? "",
        student_username: user?.username ?? "",
        nis: profile?.nis ?? "",
        nisn: profile?.nisn ?? "",
        class_id: participant.class_id ?? "",
        class_name: classItem?.name ?? "Tanpa kelas",
        academic_year:
          classAcademicYear?.name ?? scheduleAcademicYear?.name ?? "",
        schedule_id: schedule?.id ?? "",
        schedule_title: schedule?.title ?? "Jadwal ujian",
        schedule_status: schedule?.status ?? "",
        start_at: schedule?.start_at ?? "",
        end_at: schedule?.end_at ?? "",
        token_required: Boolean(schedule?.token_required),
        access_token: schedule?.access_token ?? "",
        package_title: examPackage?.title ?? "Paket ujian",
        subject_code: subject?.code ?? "",
        subject_name: subject?.name ?? "",
        duration_minutes: Number(examPackage?.duration_minutes ?? 0),
        semester: semester?.name ?? "",
      };
    })
    .filter((card) => {
      if (!normalizedQuery) {
        return true;
      }

      return [
        card.student_name,
        card.student_email,
        card.student_username,
        card.nis,
        card.nisn,
        card.class_name,
        card.schedule_title,
        card.subject_code,
        card.subject_name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
}
