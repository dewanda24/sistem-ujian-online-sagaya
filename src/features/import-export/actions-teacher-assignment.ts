"use server";

import { revalidatePath } from "next/cache";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { requirePermission } from "@/lib/auth/require-permission";
import { createClient } from "@/lib/supabase/server";
import { teacherAssignmentSchema } from "@/lib/validations/master-data";

type TeacherAssignmentImportResult = {
  ok: boolean;
  message: string;
  summary?: {
    total: number;
    valid: number;
    invalid: number;
    errors: Array<{ row_number: number; errors: string[] }>;
  };
};

async function getDefaultSchoolId() {
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

async function getTeacherIdByEmail(email: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, roles!inner(name)")
    .eq("email", email.trim())
    .eq("roles.name", "teacher")
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

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());

  return values;
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

export async function commitTeacherSubjectAssignmentImportAction(
  formData: FormData,
): Promise<TeacherAssignmentImportResult> {
  const currentUser = await requirePermission("teachers.manage");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      message: "File CSV assignment guru-mapel-kelas wajib diunggah.",
    };
  }

  const text = await file.text();

  // Parse CSV
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return {
      ok: false,
      message: "File CSV kosong atau header tidak valid.",
    };
  }

  const schoolId = await getDefaultSchoolId();

  if (!schoolId) {
    return {
      ok: false,
      message: "Sekolah aktif/default tidak ditemukan.",
    };
  }

  const supabase = await createClient();
  const errors: Array<{ row_number: number; errors: string[] }> = [];
  let success = 0;
  let skipped = 0;

  // Skip header row
  for (let index = 1; index < lines.length; index++) {
    const rowNumber = index + 1;
    const line = lines[index];

    const parts = parseCsvLine(line);
    if (parts.length < 4) {
      errors.push({
        row_number: rowNumber,
        errors: ["Format baris tidak valid"],
      });
      continue;
    }

    const teacherEmail = parts[0] ?? "";
    const subjectCode = parts[1] ?? "";
    const className = parts[2] ?? "";
    const academicYear = parts[3] ?? "";

    const rowErrors: string[] = [];

    if (!teacherEmail) {
      rowErrors.push("teacher_email tidak boleh kosong");
    }
    if (!subjectCode) {
      rowErrors.push("subject_code tidak boleh kosong");
    }
    if (!className) {
      rowErrors.push("class_name tidak boleh kosong");
    }
    if (!academicYear) {
      rowErrors.push("academic_year tidak boleh kosong");
    }

    if (rowErrors.length > 0) {
      errors.push({ row_number: rowNumber, errors: rowErrors });
      continue;
    }

    // Lookup IDs
    const teacherId = await getTeacherIdByEmail(teacherEmail);
    const subjectId = await getSubjectIdByCode(subjectCode, schoolId);
    const classId = await getClassIdByNameAndAcademicYear({
      className,
      academicYearName: academicYear,
      schoolId,
    });
    const academicYearId = await getAcademicYearIdByName(
      academicYear,
      schoolId,
    );

    if (!teacherId) {
      errors.push({
        row_number: rowNumber,
        errors: [`Guru dengan email "${teacherEmail}" tidak ditemukan`],
      });
      continue;
    }

    if (!subjectId) {
      errors.push({
        row_number: rowNumber,
        errors: [`Mapel dengan kode "${subjectCode}" tidak ditemukan`],
      });
      continue;
    }

    if (!classId) {
      errors.push({
        row_number: rowNumber,
        errors: [
          `Kelas "${className}" di tahun ajaran "${academicYear}" tidak ditemukan`,
        ],
      });
      continue;
    }

    if (!academicYearId) {
      errors.push({
        row_number: rowNumber,
        errors: [`Tahun ajaran "${academicYear}" tidak ditemukan`],
      });
      continue;
    }

    // Validate with schema
    const parsed = teacherAssignmentSchema.safeParse({
      teacher_id: teacherId,
      subject_id: subjectId,
      class_id: classId,
      academic_year_id: academicYearId,
    });

    if (!parsed.success) {
      errors.push({
        row_number: rowNumber,
        errors: parsed.error.issues.map((issue) => issue.message),
      });
      continue;
    }

    // Check for existing assignment
    const { data: existingAssignment } = await supabase
      .from("teacher_subjects")
      .select("id")
      .eq("teacher_id", parsed.data.teacher_id)
      .eq("subject_id", parsed.data.subject_id)
      .eq("class_id", parsed.data.class_id)
      .eq("academic_year_id", parsed.data.academic_year_id)
      .maybeSingle();

    if (existingAssignment?.id) {
      // Already exists, skip
      skipped += 1;
      continue;
    }

    // Insert new assignment
    const { error } = await supabase.from("teacher_subjects").insert({
      teacher_id: parsed.data.teacher_id,
      subject_id: parsed.data.subject_id,
      class_id: parsed.data.class_id,
      academic_year_id: parsed.data.academic_year_id,
    });

    if (error) {
      errors.push({
        row_number: rowNumber,
        errors: [error.message],
      });
      continue;
    }

    success += 1;
  }

  // Log audit event
  await logAuditEvent({
    userId: currentUser.id,
    action: "teacher_subjects.import_csv",
    entityType: "teacher_subjects",
    payload: {
      total_rows: lines.length - 1,
      success_count: success,
      skipped_count: skipped,
      error_count: errors.length,
      sample_errors: errors.slice(0, 3).map((e) => ({
        row_number: e.row_number,
        errors: e.errors.slice(0, 2),
      })),
    },
  });

  revalidatePath("/dashboard/master-data/teachers");

  const isSuccess = errors.length === 0;

  return {
    ok: isSuccess,
    message: isSuccess
      ? `Import berhasil! ${success} assignment guru-mapel-kelas telah diproses${skipped > 0 ? `, ${skipped} duplikat dilewati` : ""}.`
      : `Import selesai dengan ${errors.length} error dari ${lines.length - 1} baris.`,
    summary: {
      total: lines.length - 1,
      valid: success + skipped,
      invalid: errors.length,
      errors,
    },
  };
}

