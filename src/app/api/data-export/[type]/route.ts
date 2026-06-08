import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { hasPermission } from "@/lib/auth/has-permission";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  requireSchoolScope,
  requireScopedSchoolId,
} from "@/lib/auth/school-scope";
import { rowsToCsv } from "@/lib/import/csv";
import { createClient } from "@/lib/supabase/server";

type ExportType = "teachers" | "students" | "classes" | "teacher-assignments";

type Relation<T> = T | T[] | null | undefined;

function firstRelation<T>(value: Relation<T>) {
  return Array.isArray(value) ? value[0] : value;
}

function isExportType(type: string): type is ExportType {
  return (
    type === "teachers" ||
    type === "students" ||
    type === "classes" ||
    type === "teacher-assignments"
  );
}

const exportConfig: Record<
  ExportType,
  { permission: string; filename: string; label: string }
> = {
  teachers: {
    permission: "teachers.view",
    filename: "data-guru.csv",
    label: "Guru",
  },
  students: {
    permission: "students.view",
    filename: "data-siswa.csv",
    label: "Siswa",
  },
  classes: {
    permission: "classes.view",
    filename: "data-kelas.csv",
    label: "Kelas",
  },
  "teacher-assignments": {
    permission: "teachers.view",
    filename: "assignment-guru.csv",
    label: "Penugasan Guru",
  },
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const user = await requireAuth();
  const { type } = await params;

  if (!isExportType(type)) {
    return NextResponse.json({ error: "Jenis unduhan tidak ditemukan" }, { status: 404 });
  }

  const config = exportConfig[type];

  if (!hasPermission(user, config.permission)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const rows = await buildRows(type);
  const csv = rowsToCsv(rows);

  await logAuditEvent({
    userId: user.id,
    action: `data_export.${type}`,
    entityType: "data_export",
    payload: {
      type,
      row_count: rows.length,
    },
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${config.filename}"`,
    },
  });
}

async function buildRows(type: ExportType) {
  if (type === "teachers" || type === "students") {
    return getUserRows(type === "teachers" ? "teacher" : "student");
  }

  if (type === "classes") {
    return getClassRows();
  }

  return getTeacherAssignmentRows();
}

async function getUserRows(roleName: "teacher" | "student") {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("users")
    .select(
      "id, email, username, status, created_at, school_id, schools(name), roles!inner(name), user_profiles(full_name, nip, nis, nisn, phone)",
    )
    .eq("roles.name", roleName)
    .order("username");

  if (!scope.isSuperAdmin) {
    query = query.eq("school_id", requireScopedSchoolId(scope));
  }

  const { data } = await query;

  return (data ?? []).map((user) => {
    const profile = firstRelation(user.user_profiles);
    const school = firstRelation(user.schools);

    return roleName === "teacher"
      ? {
          full_name: profile?.full_name ?? "",
          email: user.email ?? "",
          username: user.username ?? "",
          nip: profile?.nip ?? "",
          phone: profile?.phone ?? "",
          status: user.status ?? "",
          school: school?.name ?? "",
          created_at: user.created_at ?? "",
        }
      : {
          full_name: profile?.full_name ?? "",
          email: user.email ?? "",
          username: user.username ?? "",
          nis: profile?.nis ?? "",
          nisn: profile?.nisn ?? "",
          phone: profile?.phone ?? "",
          status: user.status ?? "",
          school: school?.name ?? "",
          created_at: user.created_at ?? "",
        };
  });
}

async function getClassRows() {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("classes")
    .select(
      "id, name, grade_level, is_active, schools(name), academic_years(name), users!classes_homeroom_teacher_id_fkey(username, user_profiles(full_name))",
    )
    .order("grade_level")
    .order("name");

  if (!scope.isSuperAdmin) {
    query = query.eq("school_id", requireScopedSchoolId(scope));
  }

  const { data } = await query;

  return (data ?? []).map((classItem) => {
    const school = firstRelation(classItem.schools);
    const academicYear = firstRelation(classItem.academic_years);
    const homeroomTeacher = firstRelation(classItem.users);
    const profile = firstRelation(homeroomTeacher?.user_profiles);

    return {
      name: classItem.name ?? "",
      grade_level: classItem.grade_level ?? "",
      academic_year: academicYear?.name ?? "",
      homeroom_teacher: profile?.full_name ?? homeroomTeacher?.username ?? "",
      is_active: classItem.is_active ? "true" : "false",
      school: school?.name ?? "",
    };
  });
}

async function getTeacherAssignmentRows() {
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("teacher_subjects")
    .select(
      "id, users!teacher_subjects_teacher_id_fkey(email, username, school_id, user_profiles(full_name)), subjects(code, name, school_id), classes(name, school_id), academic_years(name, school_id)",
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

  const { data } = await query;

  return (data ?? []).map((assignment) => {
    const teacher = firstRelation(assignment.users);
    const profile = firstRelation(teacher?.user_profiles);
    const subject = firstRelation(assignment.subjects);
    const classItem = firstRelation(assignment.classes);
    const academicYear = firstRelation(assignment.academic_years);

    return {
      teacher_name: profile?.full_name ?? teacher?.username ?? "",
      teacher_email: teacher?.email ?? "",
      subject_code: subject?.code ?? "",
      subject_name: subject?.name ?? "",
      class_name: classItem?.name ?? "",
      academic_year: academicYear?.name ?? "",
    };
  });
}
