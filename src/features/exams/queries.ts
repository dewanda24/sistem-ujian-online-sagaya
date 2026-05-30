import { requireAuth } from "@/lib/auth/require-auth";
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

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getDefaultSchoolId() {
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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("semesters")
    .select("id, name, academic_years(name)")
    .order("name");

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
