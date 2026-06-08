"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireRole } from "@/lib/auth/require-role";
import {
  assertSameSchool,
  requireSchoolScope,
  requireScopedSchoolId,
} from "@/lib/auth/school-scope";
import { getRoleId } from "@/lib/master-data/queries";
import { createClient } from "@/lib/supabase/server";
import {
  academicYearSchema,
  classMemberSchema,
  classSchema,
  schoolSchema,
  semesterSchema,
  studentSchema,
  subjectSchema,
  teacherAssignmentSchema,
  teacherSchema,
} from "@/lib/validations/master-data";
import { parseCsvText } from "@/lib/import/csv";

type ActionResult = {
  ok: boolean;
  message: string;
};

const IMPORT_CENTER_PATH = "/dashboard/import-export";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function formBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function nullableDate(value: string) {
  return value ? value : null;
}

function parseCsv(text: string) {
  return parseCsvText(text).rows;
}

function redirectTo(path: string, result: ActionResult): never {
  const params = new URLSearchParams({
    status: result.ok ? "success" : "error",
    message: result.message,
  });

  redirect(`${path}?${params.toString()}`);
}

function serviceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return null;
  }

  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
  );
}

export async function saveSchoolAction(formData: FormData) {
  await requireRole("super_admin");
  const currentUser = await requirePermission("schools.manage");
  const scope = await requireSchoolScope();
  const parsed = schoolSchema.safeParse({
    id: formString(formData, "id"),
    name: formString(formData, "name"),
    npsn: formString(formData, "npsn"),
    address: formString(formData, "address"),
    phone: formString(formData, "phone"),
    email: formString(formData, "email"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/schools", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data sekolah tidak valid.",
    });
  }

  const supabase = await createClient();
  const { id, ...payload } = parsed.data;

  if (!scope.isSuperAdmin) {
    assertSameSchool(scope, id);
  }

  const { data: savedSchool, error } = id
    ? await supabase
        .from("schools")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("schools").insert(payload).select("id").single();

  if (!error && savedSchool?.id) {
    await logAuditEvent({
      userId: currentUser.id,
      action: id ? "schools.update" : "schools.create",
      entityType: "schools",
      entityId: savedSchool.id,
      payload,
    });
  }

  revalidatePath("/dashboard/master-data/schools");
  redirectTo("/dashboard/master-data/schools", {
    ok: !error,
    message: error ? error.message : "Data sekolah berhasil disimpan.",
  });
}

export async function toggleSchoolAction(formData: FormData) {
  await requireRole("super_admin");
  const currentUser = await requirePermission("schools.manage");
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const id = formString(formData, "id");
  assertSameSchool(scope, id);
  const isActive = formBoolean(formData, "is_active");
  const { error } = await supabase
    .from("schools")
    .update({ is_active: isActive })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "schools.active_update",
      entityType: "schools",
      entityId: id,
      payload: { is_active: isActive },
    });
  }

  revalidatePath("/dashboard/master-data/schools");
  redirectTo("/dashboard/master-data/schools", {
    ok: !error,
    message: error ? error.message : "Status sekolah berhasil diperbarui.",
  });
}

export async function saveAcademicYearAction(formData: FormData) {
  const currentUser = await requirePermission("academic_years.manage");
  const scope = await requireSchoolScope();
  const parsed = academicYearSchema.safeParse({
    id: formString(formData, "id"),
    school_id: formString(formData, "school_id"),
    name: formString(formData, "name"),
    starts_at: formString(formData, "starts_at"),
    ends_at: formString(formData, "ends_at"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/academic-years", {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Data tahun ajaran tidak valid.",
    });
  }

  const supabase = await createClient();
  const { id, is_active, starts_at, ends_at, ...rest } = parsed.data;
  assertSameSchool(scope, rest.school_id);

  if (is_active) {
    await supabase
      .from("academic_years")
      .update({ is_active: false })
      .eq("school_id", rest.school_id);
  }

  const payload = {
    ...rest,
    start_date: nullableDate(starts_at),
    end_date: nullableDate(ends_at),
    is_active,
  };

  const { data: savedAcademicYear, error } = id
    ? await supabase
        .from("academic_years")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("academic_years")
        .insert(payload)
        .select("id")
        .single();

  if (!error && savedAcademicYear?.id) {
    await logAuditEvent({
      userId: currentUser.id,
      action: id ? "academic_years.update" : "academic_years.create",
      entityType: "academic_years",
      entityId: savedAcademicYear.id,
      payload,
    });
  }

  revalidatePath("/dashboard/master-data/academic-years");
  redirectTo("/dashboard/master-data/academic-years", {
    ok: !error,
    message: error ? error.message : "Tahun ajaran berhasil disimpan.",
  });
}

export async function toggleAcademicYearAction(formData: FormData) {
  const currentUser = await requirePermission("academic_years.manage");
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const id = formString(formData, "id");
  const schoolId = formString(formData, "school_id");
  assertSameSchool(scope, schoolId);
  const isActive = formBoolean(formData, "is_active");

  if (isActive) {
    await supabase
      .from("academic_years")
      .update({ is_active: false })
      .eq("school_id", schoolId);
  }

  const { error } = await supabase
    .from("academic_years")
    .update({ is_active: isActive })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "academic_years.active_update",
      entityType: "academic_years",
      entityId: id,
      payload: { school_id: schoolId, is_active: isActive },
    });
  }

  revalidatePath("/dashboard/master-data/academic-years");
  redirectTo("/dashboard/master-data/academic-years", {
    ok: !error,
    message: error ? error.message : "Status tahun ajaran diperbarui.",
  });
}

export async function saveSemesterAction(formData: FormData) {
  const currentUser = await requirePermission("semesters.manage");
  const parsed = semesterSchema.safeParse({
    id: formString(formData, "id"),
    academic_year_id: formString(formData, "academic_year_id"),
    name: formString(formData, "name"),
    code: formString(formData, "code"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/semesters", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data semester tidak valid.",
    });
  }

  const supabase = await createClient();
  const { id, is_active, ...rest } = parsed.data;

  if (is_active) {
    await supabase
      .from("semesters")
      .update({ is_active: false })
      .eq("academic_year_id", rest.academic_year_id);
  }

  const payload = {
    ...rest,
    is_active,
  };

  const { data: savedSemester, error } = id
    ? await supabase
        .from("semesters")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("semesters").insert(payload).select("id").single();

  if (!error && savedSemester?.id) {
    await logAuditEvent({
      userId: currentUser.id,
      action: id ? "semesters.update" : "semesters.create",
      entityType: "semesters",
      entityId: savedSemester.id,
      payload,
    });
  }

  revalidatePath("/dashboard/master-data/semesters");
  redirectTo("/dashboard/master-data/semesters", {
    ok: !error,
    message: error ? error.message : "Semester berhasil disimpan.",
  });
}

export async function toggleSemesterAction(formData: FormData) {
  const currentUser = await requirePermission("semesters.manage");
  const supabase = await createClient();
  const id = formString(formData, "id");
  const academicYearId = formString(formData, "academic_year_id");
  const isActive = formBoolean(formData, "is_active");

  if (isActive) {
    await supabase
      .from("semesters")
      .update({ is_active: false })
      .eq("academic_year_id", academicYearId);
  }

  const { error } = await supabase
    .from("semesters")
    .update({ is_active: isActive })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "semesters.active_update",
      entityType: "semesters",
      entityId: id,
      payload: { academic_year_id: academicYearId, is_active: isActive },
    });
  }

  revalidatePath("/dashboard/master-data/semesters");
  redirectTo("/dashboard/master-data/semesters", {
    ok: !error,
    message: error ? error.message : "Status semester diperbarui.",
  });
}

export async function saveClassAction(formData: FormData) {
  const currentUser = await requirePermission("classes.manage");
  const scope = await requireSchoolScope();
  const parsed = classSchema.safeParse({
    id: formString(formData, "id"),
    school_id: formString(formData, "school_id"),
    academic_year_id: formString(formData, "academic_year_id"),
    name: formString(formData, "name"),
    grade_level: formString(formData, "grade_level"),
    homeroom_teacher_id: formString(formData, "homeroom_teacher_id"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo(IMPORT_CENTER_PATH, {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data kelas tidak valid.",
    });
  }

  const supabase = await createClient();
  const { id, ...payload } = parsed.data;
  assertSameSchool(scope, payload.school_id);
  const { data: savedClass, error } = id
    ? await supabase
        .from("classes")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("classes").insert(payload).select("id").single();

  if (!error && savedClass?.id) {
    await logAuditEvent({
      userId: currentUser.id,
      action: id ? "classes.update" : "classes.create",
      entityType: "classes",
      entityId: savedClass.id,
      payload,
    });
  }

  revalidatePath("/dashboard/master-data/classes");
  redirectTo("/dashboard/master-data/classes", {
    ok: !error,
    message: error ? error.message : "Kelas berhasil disimpan.",
  });
}

export async function toggleClassAction(formData: FormData) {
  const currentUser = await requirePermission("classes.manage");
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const id = formString(formData, "id");
  const { data: classItem } = await supabase
    .from("classes")
    .select("school_id")
    .eq("id", id)
    .maybeSingle();

  assertSameSchool(scope, classItem?.school_id);

  const isActive = formBoolean(formData, "is_active");
  const { error } = await supabase
    .from("classes")
    .update({ is_active: isActive })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "classes.active_update",
      entityType: "classes",
      entityId: id,
      payload: { is_active: isActive },
    });
  }

  revalidatePath("/dashboard/master-data/classes");
  redirectTo("/dashboard/master-data/classes", {
    ok: !error,
    message: error ? error.message : "Status kelas diperbarui.",
  });
}

export async function saveSubjectAction(formData: FormData) {
  const currentUser = await requirePermission("subjects.manage");
  const scope = await requireSchoolScope();
  const parsed = subjectSchema.safeParse({
    id: formString(formData, "id"),
    school_id: formString(formData, "school_id"),
    code: formString(formData, "code"),
    name: formString(formData, "name"),
    is_active: formBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/subjects", {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Data mata pelajaran tidak valid.",
    });
  }

  const supabase = await createClient();
  const { id, ...payload } = parsed.data;
  assertSameSchool(scope, payload.school_id);
  const { data: savedSubject, error } = id
    ? await supabase
        .from("subjects")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("subjects").insert(payload).select("id").single();

  if (!error && savedSubject?.id) {
    await logAuditEvent({
      userId: currentUser.id,
      action: id ? "subjects.update" : "subjects.create",
      entityType: "subjects",
      entityId: savedSubject.id,
      payload,
    });
  }

  revalidatePath("/dashboard/master-data/subjects");
  redirectTo("/dashboard/master-data/subjects", {
    ok: !error,
    message: error ? error.message : "Mata pelajaran berhasil disimpan.",
  });
}

export async function toggleSubjectAction(formData: FormData) {
  const currentUser = await requirePermission("subjects.manage");
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const id = formString(formData, "id");
  const { data: subject } = await supabase
    .from("subjects")
    .select("school_id")
    .eq("id", id)
    .maybeSingle();

  assertSameSchool(scope, subject?.school_id);

  const isActive = formBoolean(formData, "is_active");
  const { error } = await supabase
    .from("subjects")
    .update({ is_active: isActive })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "subjects.active_update",
      entityType: "subjects",
      entityId: id,
      payload: { is_active: isActive },
    });
  }

  revalidatePath("/dashboard/master-data/subjects");
  redirectTo("/dashboard/master-data/subjects", {
    ok: !error,
    message: error ? error.message : "Status mata pelajaran diperbarui.",
  });
}

async function createAuthUser(email: string, password?: string) {
  const adminClient = serviceRoleClient();

  if (!adminClient) {
    return {
      userId: null,
      error:
        "SUPABASE_SERVICE_ROLE_KEY belum tersedia. Pembuatan auth user disiapkan, tetapi belum dapat dijalankan.",
    };
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  return {
    userId: data.user?.id ?? null,
    error: error?.message ?? null,
  };
}

async function getDefaultSchoolId() {
  const scope = await requireSchoolScope();

  if (!scope.isSuperAdmin) {
    return requireScopedSchoolId(scope);
  }

  const supabase = await createClient();
  const { data: activeSchool } = await supabase
    .from("schools")
    .select("id")
    .eq("is_active", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (activeSchool?.id) {
    return activeSchool.id as string;
  }

  const { data: fallbackSchool } = await supabase
    .from("schools")
    .select("id")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  return fallbackSchool?.id ? (fallbackSchool.id as string) : null;
}

async function getAcademicYearIdByName(name: string, schoolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_years")
    .select("id")
    .eq("school_id", schoolId)
    .eq("name", name)
    .maybeSingle();

  return data?.id ? (data.id as string) : null;
}

async function getTeacherIdByEmail(email: string, schoolId?: string | null) {
  if (!email.trim()) {
    return "";
  }

  const supabase = await createClient();
  let query = supabase
    .from("users")
    .select("id, roles!inner(name)")
    .eq("email", email.trim())
    .eq("roles.name", "teacher");

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data } = await query.maybeSingle();

  return data?.id ? (data.id as string) : "";
}

async function getStudentIdByEmail(email: string, schoolId?: string | null) {
  const supabase = await createClient();
  let query = supabase
    .from("users")
    .select("id, roles!inner(name)")
    .eq("email", email.trim())
    .eq("roles.name", "student");

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data } = await query.maybeSingle();

  return data?.id ? (data.id as string) : null;
}

async function getClassIdByNameAndAcademicYear({
  className,
  academicYearName,
  schoolId,
}: {
  className: string;
  academicYearName: string;
  schoolId: string;
}) {
  const academicYearId = await getAcademicYearIdByName(
    academicYearName,
    schoolId,
  );

  if (!academicYearId) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .ilike("name", className.trim())
    .maybeSingle();

  return data?.id ? (data.id as string) : null;
}

async function getSubjectIdByCode(code: string, schoolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("id")
    .eq("school_id", schoolId)
    .ilike("code", code.trim())
    .maybeSingle();

  return data?.id ? (data.id as string) : null;
}

export async function importClassesCsvAction(formData: FormData) {
  const currentUser = await requirePermission("classes.manage");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirectTo(IMPORT_CENTER_PATH, {
      ok: false,
      message: "File CSV kelas wajib diunggah.",
    });
  }

  const rows = parseCsv(await file.text());

  if (rows.length === 0) {
    redirectTo(IMPORT_CENTER_PATH, {
      ok: false,
      message: "CSV kosong atau header tidak valid.",
    });
  }

  const schoolId = await getDefaultSchoolId();

  if (!schoolId) {
    redirectTo("/dashboard/master-data/classes", {
      ok: false,
      message: "Sekolah aktif/default tidak ditemukan.",
    });
  }

  const supabase = await createClient();
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const academicYearName = String(row.academic_year ?? "").trim();
    const academicYearId = await getAcademicYearIdByName(
      academicYearName,
      schoolId,
    );

    if (!academicYearId) {
      errors.push(
        `Baris ${rowNumber}: academic_year ${academicYearName || "-"} tidak ditemukan`,
      );
      continue;
    }

    const homeroomTeacherId = await getTeacherIdByEmail(
      row.homeroom_teacher ?? row.homeroom_teacher_email ?? "",
      schoolId,
    );
    const parsed = classSchema.safeParse({
      school_id: schoolId,
      academic_year_id: academicYearId,
      name: row.class_name ?? row.name ?? "",
      grade_level: row.grade ?? row.grade_level ?? "",
      homeroom_teacher_id: homeroomTeacherId,
      is_active: String(row.is_active ?? "true").toLowerCase() !== "false",
    });

    if (!parsed.success) {
      errors.push(
        `Baris ${rowNumber}: ${
          parsed.error.issues[0]?.message ?? "data kelas tidak valid"
        }`,
      );
      continue;
    }

    const { data: existingClass } = await supabase
      .from("classes")
      .select("id")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .ilike("name", parsed.data.name)
      .maybeSingle();
    const payload = {
      school_id: parsed.data.school_id,
      academic_year_id: parsed.data.academic_year_id,
      name: parsed.data.name,
      grade_level: parsed.data.grade_level,
      homeroom_teacher_id: parsed.data.homeroom_teacher_id,
      is_active: parsed.data.is_active,
    };
    const { data: savedClass, error } = existingClass?.id
      ? await supabase
          .from("classes")
          .update(payload)
          .eq("id", existingClass.id)
          .select("id")
          .single()
      : await supabase.from("classes").insert(payload).select("id").single();

    if (error || !savedClass?.id) {
      errors.push(
        `Baris ${rowNumber}: ${error?.message ?? "gagal menyimpan kelas"}`,
      );
      continue;
    }

    if (existingClass?.id) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "classes.import_csv",
    entityType: "classes",
    payload: {
      total_rows: rows.length,
      created_count: created,
      updated_count: updated,
      error_count: errors.length,
      sample_errors: errors.slice(0, 3),
    },
  });

  revalidatePath("/dashboard/master-data/classes");
  revalidatePath(IMPORT_CENTER_PATH);
  redirectTo(IMPORT_CENTER_PATH, {
    ok: errors.length === 0,
    message:
      errors.length > 0
        ? `Import selesai: ${created} dibuat, ${updated} diperbarui, ${errors.length} gagal. ${errors
            .slice(0, 3)
            .join("; ")}`
        : `Import berhasil: ${created} kelas dibuat, ${updated} diperbarui.`,
  });
}

export async function importStudentClassAssignmentsCsvAction(formData: FormData) {
  const currentUser = await requirePermission("students.manage");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirectTo(IMPORT_CENTER_PATH, {
      ok: false,
      message: "File CSV assignment siswa-kelas wajib diunggah.",
    });
  }

  const rows = parseCsv(await file.text());

  if (rows.length === 0) {
    redirectTo(IMPORT_CENTER_PATH, {
      ok: false,
      message: "CSV kosong atau header tidak valid.",
    });
  }

  const schoolId = await getDefaultSchoolId();

  if (!schoolId) {
    redirectTo(IMPORT_CENTER_PATH, {
      ok: false,
      message: "Sekolah aktif/default tidak ditemukan.",
    });
  }

  const supabase = await createClient();
  let success = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const studentId = await getStudentIdByEmail(row.student_email ?? "", schoolId);
    const classId = await getClassIdByNameAndAcademicYear({
      className: row.class_name ?? "",
      academicYearName: row.academic_year ?? "",
      schoolId,
    });
    const parsed = classMemberSchema.safeParse({
      student_id: studentId ?? "",
      class_id: classId ?? "",
      joined_at: row.joined_at ?? "",
    });

    if (!studentId) {
      errors.push(`Baris ${rowNumber}: student_email tidak ditemukan`);
      continue;
    }

    if (!classId) {
      errors.push(`Baris ${rowNumber}: kelas atau academic_year tidak ditemukan`);
      continue;
    }

    if (!parsed.success) {
      errors.push(
        `Baris ${rowNumber}: ${
          parsed.error.issues[0]?.message ?? "assignment tidak valid"
        }`,
      );
      continue;
    }

    const { data: activeMembership } = await supabase
      .from("class_members")
      .select("id, class_id")
      .eq("student_id", parsed.data.student_id)
      .is("left_at", null)
      .maybeSingle();

    if (activeMembership?.class_id === parsed.data.class_id) {
      success += 1;
      continue;
    }

    if (activeMembership?.id) {
      await supabase
        .from("class_members")
        .update({ left_at: new Date().toISOString().slice(0, 10) })
        .eq("id", activeMembership.id);
    }

    const { error } = await supabase.from("class_members").insert({
      student_id: parsed.data.student_id,
      class_id: parsed.data.class_id,
      joined_at: parsed.data.joined_at || new Date().toISOString().slice(0, 10),
      left_at: null,
    });

    if (error) {
      errors.push(`Baris ${rowNumber}: ${error.message}`);
      continue;
    }

    success += 1;
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "class_members.import_csv",
    entityType: "class_members",
    payload: {
      total_rows: rows.length,
      success_count: success,
      error_count: errors.length,
      sample_errors: errors.slice(0, 3),
    },
  });

  revalidatePath("/dashboard/master-data/students");
  revalidatePath(IMPORT_CENTER_PATH);
  redirectTo(IMPORT_CENTER_PATH, {
    ok: errors.length === 0,
    message:
      errors.length > 0
        ? `Import selesai: ${success} berhasil, ${errors.length} gagal. ${errors
            .slice(0, 3)
            .join("; ")}`
        : `Import berhasil: ${success} assignment siswa-kelas diproses.`,
  });
}

export async function importTeacherSubjectAssignmentsCsvAction(formData: FormData) {
  const currentUser = await requirePermission("teachers.manage");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirectTo(IMPORT_CENTER_PATH, {
      ok: false,
      message: "File CSV assignment guru-mapel-kelas wajib diunggah.",
    });
  }

  const rows = parseCsv(await file.text());

  if (rows.length === 0) {
    redirectTo(IMPORT_CENTER_PATH, {
      ok: false,
      message: "CSV kosong atau header tidak valid.",
    });
  }

  const schoolId = await getDefaultSchoolId();

  if (!schoolId) {
    redirectTo(IMPORT_CENTER_PATH, {
      ok: false,
      message: "Sekolah aktif/default tidak ditemukan.",
    });
  }

  const supabase = await createClient();
  let success = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const teacherId = await getTeacherIdByEmail(row.teacher_email ?? "", schoolId);
    const subjectId = await getSubjectIdByCode(row.subject_code ?? "", schoolId);
    const academicYearId = await getAcademicYearIdByName(
      row.academic_year ?? "",
      schoolId,
    );
    const classId = await getClassIdByNameAndAcademicYear({
      className: row.class_name ?? "",
      academicYearName: row.academic_year ?? "",
      schoolId,
    });
    const parsed = teacherAssignmentSchema.safeParse({
      teacher_id: teacherId,
      subject_id: subjectId ?? "",
      class_id: classId ?? "",
      academic_year_id: academicYearId ?? "",
    });

    if (!teacherId) {
      errors.push(`Baris ${rowNumber}: teacher_email tidak ditemukan`);
      continue;
    }

    if (!subjectId) {
      errors.push(`Baris ${rowNumber}: subject_code tidak ditemukan`);
      continue;
    }

    if (!academicYearId) {
      errors.push(`Baris ${rowNumber}: academic_year tidak ditemukan`);
      continue;
    }

    if (!classId) {
      errors.push(`Baris ${rowNumber}: class_name tidak ditemukan`);
      continue;
    }

    if (!parsed.success) {
      errors.push(
        `Baris ${rowNumber}: ${
          parsed.error.issues[0]?.message ?? "assignment tidak valid"
        }`,
      );
      continue;
    }

    const { data: existingAssignment } = await supabase
      .from("teacher_subjects")
      .select("id")
      .eq("teacher_id", parsed.data.teacher_id)
      .eq("subject_id", parsed.data.subject_id)
      .eq("class_id", parsed.data.class_id)
      .eq("academic_year_id", parsed.data.academic_year_id)
      .maybeSingle();

    if (existingAssignment?.id) {
      skipped += 1;
      continue;
    }

    const { error } = await supabase
      .from("teacher_subjects")
      .insert(parsed.data);

    if (error) {
      errors.push(`Baris ${rowNumber}: ${error.message}`);
      continue;
    }

    success += 1;
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "teacher_subjects.import_csv",
    entityType: "teacher_subjects",
    payload: {
      total_rows: rows.length,
      success_count: success,
      skipped_count: skipped,
      error_count: errors.length,
      sample_errors: errors.slice(0, 3),
    },
  });

  revalidatePath("/dashboard/master-data/teachers");
  revalidatePath(IMPORT_CENTER_PATH);
  redirectTo(IMPORT_CENTER_PATH, {
    ok: errors.length === 0,
    message:
      errors.length > 0
        ? `Import selesai: ${success} berhasil, ${skipped} duplikat dilewati, ${errors.length} gagal. ${errors
            .slice(0, 3)
            .join("; ")}`
        : `Import berhasil: ${success} assignment diproses, ${skipped} duplikat dilewati.`,
  });
}

async function importRoleUsers({
  formData,
  roleName,
  permission,
  redirectPath,
}: {
  formData: FormData;
  roleName: "teacher" | "student";
  permission: "teachers.manage" | "students.manage";
  redirectPath: string;
}) {
  const currentUser = await requirePermission(permission);
  const scope = await requireSchoolScope();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirectTo(redirectPath, {
      ok: false,
      message: "File CSV wajib diunggah.",
    });
  }

  const rows = parseCsv(await file.text());

  if (rows.length === 0) {
    redirectTo(redirectPath, {
      ok: false,
      message: "CSV kosong atau header tidak valid.",
    });
  }

  const supabase = await createClient();
  const adminClient = serviceRoleClient();
  const roleId = await getRoleId(roleName);

  if (!roleId) {
    redirectTo(redirectPath, {
      ok: false,
      message: `Role ${roleName} tidak ditemukan.`,
    });
  }

  if (!adminClient) {
    redirectTo(redirectPath, {
      ok: false,
      message:
        "SUPABASE_SERVICE_ROLE_KEY belum tersedia. Import auth user tidak dapat dijalankan.",
    });
  }

  let success = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const status = row.status === "inactive" ? "inactive" : "active";
    const parsed =
      roleName === "teacher"
        ? teacherSchema.safeParse({
            email: row.email,
            username: row.username,
            password: row.password || undefined,
            full_name: row.full_name,
            nip: row.nip ?? "",
            phone: row.phone ?? "",
            status,
          })
        : studentSchema.safeParse({
            email: row.email,
            username: row.username,
            password: row.password || undefined,
            full_name: row.full_name,
            nis: row.nis ?? "",
            nisn: row.nisn ?? "",
            phone: row.phone ?? "",
            status,
          });

    if (!row.password) {
      errors.push(`Baris ${rowNumber}: password wajib diisi`);
      continue;
    }

    if (!parsed.success) {
      errors.push(
        `Baris ${rowNumber}: ${
          parsed.error.issues[0]?.message ?? "data tidak valid"
        }`,
      );
      continue;
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${row.email},username.eq.${row.username}`)
      .maybeSingle();

    if (existingUser) {
      errors.push(`Baris ${rowNumber}: email atau username sudah terdaftar`);
      continue;
    }

    const createdAuthUser = await adminClient.auth.admin.createUser({
      email: row.email,
      password: row.password,
      email_confirm: true,
    });

    if (createdAuthUser.error || !createdAuthUser.data.user) {
      errors.push(
        `Baris ${rowNumber}: ${
          createdAuthUser.error?.message ?? "gagal membuat auth user"
        }`,
      );
      continue;
    }

    const { data: savedUser, error: userError } = await supabase
      .from("users")
      .insert({
        auth_user_id: createdAuthUser.data.user.id,
        email: row.email,
        username: row.username,
        role_id: roleId,
        status,
        school_id: scope.schoolId,
      })
      .select("id")
      .single();

    if (userError || !savedUser) {
      await adminClient.auth.admin.deleteUser(createdAuthUser.data.user.id);
      errors.push(
        `Baris ${rowNumber}: ${userError?.message ?? "gagal menyimpan user"}`,
      );
      continue;
    }

    const profilePayload: Record<string, string> =
      roleName === "teacher"
        ? {
            user_id: savedUser.id,
            full_name: row.full_name,
            nip: row.nip ?? "",
            phone: row.phone ?? "",
          }
        : {
            user_id: savedUser.id,
            full_name: row.full_name,
            nis: row.nis ?? "",
            nisn: row.nisn ?? "",
            phone: row.phone ?? "",
          };
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert(profilePayload, { onConflict: "user_id" });

    if (profileError) {
      errors.push(`Baris ${rowNumber}: ${profileError.message}`);
      continue;
    }

    success += 1;
  }

  revalidatePath(redirectPath);
  await logAuditEvent({
    userId: currentUser.id,
    action: `${roleName}s.import_csv`,
    entityType: "users",
    payload: {
      role: roleName,
      total_rows: rows.length,
      success_count: success,
      error_count: errors.length,
      sample_errors: errors.slice(0, 3),
    },
  });

  redirectTo(redirectPath, {
    ok: errors.length === 0,
    message:
      errors.length > 0
        ? `Import selesai: ${success} berhasil, ${errors.length} gagal. ${errors
            .slice(0, 3)
            .join("; ")}`
        : `Import berhasil: ${success} ${roleName === "teacher" ? "guru" : "siswa"} ditambahkan.`,
  });
}

export async function importTeachersCsvAction(formData: FormData) {
  await importRoleUsers({
    formData,
    roleName: "teacher",
    permission: "teachers.manage",
    redirectPath: IMPORT_CENTER_PATH,
  });
}

export async function importStudentsCsvAction(formData: FormData) {
  await importRoleUsers({
    formData,
    roleName: "student",
    permission: "students.manage",
    redirectPath: IMPORT_CENTER_PATH,
  });
}

export async function saveTeacherAction(formData: FormData) {
  const currentUser = await requirePermission("teachers.manage");
  const scope = await requireSchoolScope();
  const parsed = teacherSchema.safeParse({
    id: formString(formData, "id"),
    email: formString(formData, "email"),
    username: formString(formData, "username"),
    password: formString(formData, "password") || undefined,
    full_name: formString(formData, "full_name"),
    nip: formString(formData, "nip"),
    phone: formString(formData, "phone"),
    status: formString(formData, "status") || "active",
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/teachers", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data guru tidak valid.",
    });
  }

  const supabase = await createClient();
  const roleId = await getRoleId("teacher");

  if (!roleId) {
    redirectTo("/dashboard/master-data/teachers", {
      ok: false,
      message: "Role teacher tidak ditemukan.",
    });
  }

  const { id, full_name, nip, phone, password, ...userPayload } = parsed.data;
  let authUserId: string | null = null;
  let targetSchoolId: string | null = null;

  if (!id) {
    const createdAuthUser = await createAuthUser(userPayload.email, password);

    if (!createdAuthUser.userId) {
      redirectTo("/dashboard/master-data/teachers", {
        ok: false,
        message: createdAuthUser.error ?? "Gagal membuat auth user guru.",
      });
    }

    authUserId = createdAuthUser.userId;
  } else {
    const { data: targetUser } = await supabase
      .from("users")
      .select("school_id")
      .eq("id", id)
      .maybeSingle();

    assertSameSchool(scope, targetUser?.school_id);
    targetSchoolId = targetUser?.school_id ?? null;
  }

  const userSchoolId = scope.isSuperAdmin ? targetSchoolId : scope.schoolId;
  const { data: savedUser, error: userError } = id
    ? await supabase
        .from("users")
        .update({ ...userPayload, role_id: roleId, school_id: userSchoolId })
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("users")
        .insert({
          ...userPayload,
          role_id: roleId,
          auth_user_id: authUserId,
          school_id: userSchoolId,
        })
        .select("id")
        .single();

  if (userError || !savedUser) {
    redirectTo("/dashboard/master-data/teachers", {
      ok: false,
      message: userError?.message ?? "Gagal menyimpan user guru.",
    });
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: savedUser.id,
      full_name,
      nip,
      phone,
    },
    { onConflict: "user_id" },
  );

  if (!profileError) {
    await logAuditEvent({
      userId: currentUser.id,
      action: id ? "teachers.update" : "teachers.create",
      entityType: "users",
      entityId: savedUser.id,
      payload: {
        role: "teacher",
        email: userPayload.email,
        username: userPayload.username,
        status: userPayload.status,
        nip,
      },
    });
  }

  revalidatePath("/dashboard/master-data/teachers");
  redirectTo("/dashboard/master-data/teachers", {
    ok: !profileError,
    message: profileError ? profileError.message : "Data guru berhasil disimpan.",
  });
}

export async function saveTeacherAssignmentAction(formData: FormData) {
  const currentUser = await requirePermission("teachers.manage");
  const scope = await requireSchoolScope();
  const parsed = teacherAssignmentSchema.safeParse({
    teacher_id: formString(formData, "teacher_id"),
    subject_id: formString(formData, "subject_id"),
    class_id: formString(formData, "class_id"),
    academic_year_id: formString(formData, "academic_year_id"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/teachers", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Penugasan guru tidak valid.",
    });
  }

  const supabase = await createClient();
  const [
    { data: teacher },
    { data: subject },
    { data: classItem },
    { data: academicYear },
  ] =
    await Promise.all([
      supabase
        .from("users")
        .select("school_id")
        .eq("id", parsed.data.teacher_id)
        .maybeSingle(),
      supabase
        .from("subjects")
        .select("school_id")
        .eq("id", parsed.data.subject_id)
        .maybeSingle(),
      supabase
        .from("classes")
        .select("school_id")
        .eq("id", parsed.data.class_id)
        .maybeSingle(),
      supabase
        .from("academic_years")
        .select("school_id")
        .eq("id", parsed.data.academic_year_id)
        .maybeSingle(),
    ]);

  assertSameSchool(scope, teacher?.school_id);
  assertSameSchool(scope, subject?.school_id);
  assertSameSchool(scope, classItem?.school_id);
  assertSameSchool(scope, academicYear?.school_id);

  const { data: assignment, error } = await supabase
    .from("teacher_subjects")
    .insert(parsed.data)
    .select("id")
    .single();

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "teacher_subjects.create",
      entityType: "teacher_subjects",
      entityId: assignment?.id ?? null,
      payload: parsed.data,
    });
  }

  revalidatePath("/dashboard/master-data/teachers");
  redirectTo("/dashboard/master-data/teachers", {
    ok: !error,
    message: error ? error.message : "Penugasan guru berhasil ditambahkan.",
  });
}

export async function toggleUserStatusAction(formData: FormData) {
  const target = formString(formData, "target") as "teachers" | "students";
  const currentUser = await requirePermission(
    target === "teachers" ? "teachers.manage" : "students.manage",
  );
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const status = formString(formData, "status") === "active" ? "active" : "inactive";
  const id = formString(formData, "id");
  const { data: targetUser } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", id)
    .maybeSingle();

  assertSameSchool(scope, targetUser?.school_id);

  const { error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: `${target}.status_update`,
      entityType: "users",
      entityId: id,
      payload: { target, status },
    });
  }

  revalidatePath(`/dashboard/master-data/${target}`);
  redirectTo(`/dashboard/master-data/${target}`, {
    ok: !error,
    message: error ? error.message : "Status pengguna diperbarui.",
  });
}

export async function saveStudentAction(formData: FormData) {
  const currentUser = await requirePermission("students.manage");
  const scope = await requireSchoolScope();
  const parsed = studentSchema.safeParse({
    id: formString(formData, "id"),
    email: formString(formData, "email"),
    username: formString(formData, "username"),
    password: formString(formData, "password") || undefined,
    full_name: formString(formData, "full_name"),
    nis: formString(formData, "nis"),
    nisn: formString(formData, "nisn"),
    phone: formString(formData, "phone"),
    status: formString(formData, "status") || "active",
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/students", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data siswa tidak valid.",
    });
  }

  const supabase = await createClient();
  const roleId = await getRoleId("student");

  if (!roleId) {
    redirectTo("/dashboard/master-data/students", {
      ok: false,
      message: "Role student tidak ditemukan.",
    });
  }

  const { id, full_name, nis, nisn, phone, password, ...userPayload } =
    parsed.data;
  let authUserId: string | null = null;
  let targetSchoolId: string | null = null;

  if (!id) {
    const createdAuthUser = await createAuthUser(userPayload.email, password);

    if (!createdAuthUser.userId) {
      redirectTo("/dashboard/master-data/students", {
        ok: false,
        message: createdAuthUser.error ?? "Gagal membuat auth user siswa.",
      });
    }

    authUserId = createdAuthUser.userId;
  } else {
    const { data: targetUser } = await supabase
      .from("users")
      .select("school_id")
      .eq("id", id)
      .maybeSingle();

    assertSameSchool(scope, targetUser?.school_id);
    targetSchoolId = targetUser?.school_id ?? null;
  }

  const userSchoolId = scope.isSuperAdmin ? targetSchoolId : scope.schoolId;
  const { data: savedUser, error: userError } = id
    ? await supabase
        .from("users")
        .update({ ...userPayload, role_id: roleId, school_id: userSchoolId })
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("users")
        .insert({
          ...userPayload,
          role_id: roleId,
          auth_user_id: authUserId,
          school_id: userSchoolId,
        })
        .select("id")
        .single();

  if (userError || !savedUser) {
    redirectTo("/dashboard/master-data/students", {
      ok: false,
      message: userError?.message ?? "Gagal menyimpan user siswa.",
    });
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: savedUser.id,
      full_name,
      nis,
      nisn,
      phone,
    },
    { onConflict: "user_id" },
  );

  if (!profileError) {
    await logAuditEvent({
      userId: currentUser.id,
      action: id ? "students.update" : "students.create",
      entityType: "users",
      entityId: savedUser.id,
      payload: {
        role: "student",
        email: userPayload.email,
        username: userPayload.username,
        status: userPayload.status,
        nis,
        nisn,
      },
    });
  }

  revalidatePath("/dashboard/master-data/students");
  redirectTo("/dashboard/master-data/students", {
    ok: !profileError,
    message: profileError ? profileError.message : "Data siswa berhasil disimpan.",
  });
}

export async function saveClassMemberAction(formData: FormData) {
  const currentUser = await requirePermission("students.manage");
  const scope = await requireSchoolScope();
  const parsed = classMemberSchema.safeParse({
    student_id: formString(formData, "student_id"),
    class_id: formString(formData, "class_id"),
    joined_at: formString(formData, "joined_at"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/master-data/students", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data anggota kelas invalid.",
    });
  }

  const supabase = await createClient();
  const { student_id, class_id, joined_at } = parsed.data;
  const [{ data: student }, { data: classItem }] = await Promise.all([
    supabase
      .from("users")
      .select("school_id")
      .eq("id", student_id)
      .maybeSingle(),
    supabase
      .from("classes")
      .select("school_id")
      .eq("id", class_id)
      .maybeSingle(),
  ]);

  assertSameSchool(scope, student?.school_id);
  assertSameSchool(scope, classItem?.school_id);

  const { data: activeMembership } = await supabase
    .from("class_members")
    .select("id")
    .eq("student_id", student_id)
    .is("left_at", null)
    .maybeSingle();

  if (activeMembership) {
    await supabase
      .from("class_members")
      .update({ left_at: new Date().toISOString().slice(0, 10) })
      .eq("id", activeMembership.id);
  }

  const membershipPayload = {
    student_id,
    class_id,
    joined_at: joined_at || new Date().toISOString().slice(0, 10),
    left_at: null,
  };
  const { data: membership, error } = await supabase
    .from("class_members")
    .insert(membershipPayload)
    .select("id")
    .single();

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "class_members.create",
      entityType: "class_members",
      entityId: membership?.id ?? null,
      payload: {
        ...membershipPayload,
        previous_membership_id: activeMembership?.id ?? null,
      },
    });
  }

  revalidatePath("/dashboard/master-data/students");
  redirectTo("/dashboard/master-data/students", {
    ok: !error,
    message: error ? error.message : "Riwayat kelas siswa berhasil ditambahkan.",
  });
}
