import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { requireRole } from "@/lib/auth/require-role";
import { rowsToCsv } from "@/lib/import/csv";
import { createClient } from "@/lib/supabase/server";

type ExportRow = Record<string, string | number | boolean | null | undefined>;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> },
) {
  const user = await requireRole("super_admin");
  const { type } = await context.params;
  const format = request.nextUrl.searchParams.get("format") ?? "csv";

  if (!["schools", "users", "reports"].includes(type)) {
    return NextResponse.json(
      { ok: false, message: "Tipe export tidak didukung." },
      { status: 404 },
    );
  }

  if (!["csv", "xlsx"].includes(format)) {
    return NextResponse.json(
      { ok: false, message: "Format PDF belum tersedia. Gunakan CSV atau XLSX." },
      { status: 400 },
    );
  }

  const rows = await getExportRows(type);
  const filename = `sagaya-${type}-${new Date().toISOString().slice(0, 10)}.${format}`;

  await logAuditEvent({
    userId: user.id,
    action: `global_export.${type}`,
    entityType: "global_export",
    payload: {
      type,
      format,
      row_count: rows.length,
    },
  });

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, type);
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return new NextResponse(rowsToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function getExportRows(type: string): Promise<ExportRow[]> {
  const supabase = await createClient();

  if (type === "schools") {
    const { data } = await supabase
      .from("schools")
      .select("id, name, npsn, education_level, city, province, email, phone, is_active, created_at")
      .order("created_at", { ascending: false });

    return (data ?? []).map((school) => ({
      id: school.id,
      name: school.name,
      npsn: school.npsn,
      education_level: school.education_level,
      city: school.city,
      province: school.province,
      email: school.email,
      phone: school.phone,
      status: school.is_active ? "active" : "inactive",
      created_at: school.created_at,
    }));
  }

  if (type === "users") {
    const { data } = await supabase
      .from("users")
      .select("id, username, email, status, school_id, roles(name, label), schools(name), user_profiles(full_name)")
      .order("email");

    return (data ?? []).map((user) => {
      const role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
      const school = Array.isArray(user.schools) ? user.schools[0] : user.schools;
      const profile = Array.isArray(user.user_profiles)
        ? user.user_profiles[0]
        : user.user_profiles;

      return {
        id: user.id,
        full_name: profile?.full_name,
        username: user.username,
        email: user.email,
        role: role?.name,
        role_label: role?.label,
        school: school?.name,
        status: user.status,
      };
    });
  }

  const [{ data: schools }, { data: users }, { data: schedules }] =
    await Promise.all([
      supabase.from("schools").select("id, name, is_active"),
      supabase.from("users").select("id, school_id, roles(name)"),
      supabase.from("exam_schedules").select("id, school_id, status").is("deleted_at", null),
    ]);

  return (schools ?? []).map((school) => {
    const schoolUsers = (users ?? []).filter((user) => user.school_id === school.id);
    const schoolSchedules = (schedules ?? []).filter(
      (schedule) => schedule.school_id === school.id,
    );

    return {
      school_id: school.id,
      school_name: school.name,
      status: school.is_active ? "active" : "inactive",
      admins: schoolUsers.filter((user) => {
        const role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
        return role?.name === "admin";
      }).length,
      teachers: schoolUsers.filter((user) => {
        const role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
        return role?.name === "teacher";
      }).length,
      students: schoolUsers.filter((user) => {
        const role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
        return role?.name === "student";
      }).length,
      exams: schoolSchedules.length,
      active_exams: schoolSchedules.filter((schedule) => schedule.status === "active").length,
      finished_exams: schoolSchedules.filter((schedule) => schedule.status === "finished").length,
    };
  });
}
