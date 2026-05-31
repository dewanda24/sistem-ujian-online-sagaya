"use server";

import { revalidatePath } from "next/cache";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { requirePermission } from "@/lib/auth/require-permission";
import { createClient } from "@/lib/supabase/server";
import { classMemberSchema } from "@/lib/validations/master-data";

type ClassMemberImportResult = {
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

async function getStudentIdByEmail(email: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, roles!inner(name)")
    .eq("email", email.trim())
    .eq("roles.name", "student")
    .maybeSingle();

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

export async function commitStudentClassAssignmentImportAction(
  formData: FormData,
): Promise<ClassMemberImportResult> {
  const currentUser = await requirePermission("students.manage");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      message: "File CSV assignment siswa-kelas wajib diunggah.",
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

  // Skip header row
  for (let index = 1; index < lines.length; index++) {
    const rowNumber = index + 1;
    const line = lines[index];

    const parts = parseCsvLine(line);
    if (parts.length < 3) {
      errors.push({
        row_number: rowNumber,
        errors: ["Format baris tidak valid"],
      });
      continue;
    }

    const studentEmail = parts[0] ?? "";
    const className = parts[1] ?? "";
    const academicYear = parts[2] ?? "";
    const joinedAt = parts[3] ?? "";

    const rowErrors: string[] = [];

    if (!studentEmail) {
      rowErrors.push("student_email tidak boleh kosong");
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

    // Lookup student and class
    const studentId = await getStudentIdByEmail(studentEmail);
    const classId = await getClassIdByNameAndAcademicYear({
      className,
      academicYearName: academicYear,
      schoolId,
    });

    if (!studentId) {
      errors.push({
        row_number: rowNumber,
        errors: [`Siswa dengan email "${studentEmail}" tidak ditemukan`],
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

    // Validate with schema
    const parsed = classMemberSchema.safeParse({
      student_id: studentId,
      class_id: classId,
      joined_at: joinedAt || "",
    });

    if (!parsed.success) {
      errors.push({
        row_number: rowNumber,
        errors: parsed.error.issues.map((issue) => issue.message),
      });
      continue;
    }

    // Check for existing active membership in same class
    const { data: activeMembership } = await supabase
      .from("class_members")
      .select("id, class_id")
      .eq("student_id", parsed.data.student_id)
      .is("left_at", null)
      .maybeSingle();

    if (activeMembership?.class_id === parsed.data.class_id) {
      // Already in this class, skip
      success += 1;
      continue;
    }

    // Close previous active membership if exists
    if (activeMembership?.id) {
      await supabase
        .from("class_members")
        .update({ left_at: new Date().toISOString().slice(0, 10) })
        .eq("id", activeMembership.id);
    }

    // Insert new membership
    const { error } = await supabase.from("class_members").insert({
      student_id: parsed.data.student_id,
      class_id: parsed.data.class_id,
      joined_at: parsed.data.joined_at || new Date().toISOString().slice(0, 10),
      left_at: null,
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
    action: "class_members.import_csv",
    entityType: "class_members",
    payload: {
      total_rows: lines.length - 1,
      success_count: success,
      error_count: errors.length,
      sample_errors: errors.slice(0, 3).map((e) => ({
        row_number: e.row_number,
        errors: e.errors.slice(0, 2),
      })),
    },
  });

  revalidatePath("/dashboard/master-data/students");

  const isSuccess = errors.length === 0;

  return {
    ok: isSuccess,
    message: isSuccess
      ? `Import berhasil! ${success} assignment siswa-kelas telah diproses.`
      : `Import selesai dengan ${errors.length} error dari ${lines.length - 1} baris.`,
    summary: {
      total: lines.length - 1,
      valid: success,
      invalid: errors.length,
      errors,
    },
  };
}

