import { requirePermission } from "@/lib/auth/require-permission";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type SchoolRow = {
  id: string;
  name: string;
  npsn?: string | null;
  education_level?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type UserRow = {
  id: string;
  school_id: string | null;
  status?: string | null;
  roles?: Relation<{
    name?: string | null;
    label?: string | null;
  }>;
  user_profiles?: Relation<{
    full_name?: string | null;
    phone?: string | null;
  }>;
  username?: string | null;
  email?: string | null;
  auth_user_id?: string | null;
};

type SchoolScopedIdRow = {
  id: string;
  school_id: string | null;
};

type AuditLogRow = {
  id?: string | number;
  action?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  created_at?: string | null;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function emptyStats() {
  return {
    adminCount: 0,
    teacherCount: 0,
    studentCount: 0,
    classCount: 0,
    examCount: 0,
    activeExamCount: 0,
    finishedExamCount: 0,
  };
}

function countBySchool(rows: SchoolScopedIdRow[]) {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    if (row.school_id) {
      counts.set(row.school_id, (counts.get(row.school_id) ?? 0) + 1);
    }
  });

  return counts;
}

function applyCounts(
  schools: SchoolRow[],
  users: UserRow[],
  classes: SchoolScopedIdRow[],
  schedules: Array<SchoolScopedIdRow & { status?: string | null }>,
) {
  const statsBySchool = new Map<string, ReturnType<typeof emptyStats>>();
  const classCounts = countBySchool(classes);

  schools.forEach((school) => {
    statsBySchool.set(school.id, emptyStats());
  });

  users.forEach((user) => {
    if (!user.school_id) {
      return;
    }

    const stats = statsBySchool.get(user.school_id) ?? emptyStats();
    const roleName = firstRelation(user.roles)?.name;

    if (roleName === "admin") stats.adminCount += 1;
    if (roleName === "teacher") stats.teacherCount += 1;
    if (roleName === "student") stats.studentCount += 1;

    statsBySchool.set(user.school_id, stats);
  });

  schedules.forEach((schedule) => {
    if (!schedule.school_id) {
      return;
    }

    const stats = statsBySchool.get(schedule.school_id) ?? emptyStats();

    stats.examCount += 1;
    if (schedule.status === "active") stats.activeExamCount += 1;
    if (schedule.status === "finished") stats.finishedExamCount += 1;

    statsBySchool.set(schedule.school_id, stats);
  });

  classCounts.forEach((count, schoolId) => {
    const stats = statsBySchool.get(schoolId) ?? emptyStats();
    stats.classCount = count;
    statsBySchool.set(schoolId, stats);
  });

  return statsBySchool;
}

export type SuperAdminSchoolListFilters = {
  q?: string;
  status?: string;
};

export async function getSuperAdminSchoolRows(
  filters: SuperAdminSchoolListFilters = {},
) {
  await requireRole("super_admin");
  await requirePermission("schools.view");

  const supabase = await createClient();
  let schoolQuery = supabase
    .from("schools")
    .select(
      "id, name, npsn, education_level, address, city, province, email, phone, is_active, created_at",
    )
    .order("created_at", { ascending: false });

  if (filters.q) {
    schoolQuery = schoolQuery.or(
      `name.ilike.%${filters.q}%,npsn.ilike.%${filters.q}%,city.ilike.%${filters.q}%,province.ilike.%${filters.q}%`,
    );
  }

  if (filters.status === "active") {
    schoolQuery = schoolQuery.eq("is_active", true);
  }

  if (filters.status === "inactive") {
    schoolQuery = schoolQuery.eq("is_active", false);
  }

  const [{ data: schools }, { data: users }, { data: classes }, { data: schedules }] =
    await Promise.all([
      schoolQuery,
      supabase
        .from("users")
        .select("id, school_id, roles(name)")
        .not("school_id", "is", null),
      supabase.from("classes").select("id, school_id"),
      supabase
        .from("exam_schedules")
        .select("id, school_id, status")
        .is("deleted_at", null),
    ]);

  const schoolRows = (schools ?? []) as SchoolRow[];
  const statsBySchool = applyCounts(
    schoolRows,
    (users ?? []) as UserRow[],
    (classes ?? []) as SchoolScopedIdRow[],
    (schedules ?? []) as Array<SchoolScopedIdRow & { status?: string | null }>,
  );

  return schoolRows.map((school) => ({
    ...school,
    stats: statsBySchool.get(school.id) ?? emptyStats(),
  }));
}

export async function getSuperAdminSchoolDetail(id: string) {
  await requireRole("super_admin");
  await requirePermission("schools.view");

  const supabase = await createClient();
  const [
    { data: school },
    { data: users },
    { data: classes },
    { data: schedules },
  ] = await Promise.all([
    supabase
      .from("schools")
      .select(
        "id, name, npsn, education_level, address, city, province, email, phone, is_active, created_at",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("users")
      .select(
        "id, auth_user_id, username, email, status, school_id, roles(name, label), user_profiles(full_name, phone)",
      )
      .eq("school_id", id),
    supabase.from("classes").select("id, school_id").eq("school_id", id),
    supabase
      .from("exam_schedules")
      .select("id, school_id, status")
      .eq("school_id", id)
      .is("deleted_at", null),
  ]);

  if (!school) {
    return null;
  }

  const schoolRow = school as SchoolRow;
  const userRows = (users ?? []) as UserRow[];
  const statsBySchool = applyCounts(
    [schoolRow],
    userRows,
    (classes ?? []) as SchoolScopedIdRow[],
    (schedules ?? []) as Array<SchoolScopedIdRow & { status?: string | null }>,
  );

  return {
    school: schoolRow,
    stats: statsBySchool.get(schoolRow.id) ?? emptyStats(),
    admins: userRows
      .filter((user) => firstRelation(user.roles)?.name === "admin")
      .map((user) => ({
        ...user,
        role: firstRelation(user.roles),
        profile: firstRelation(user.user_profiles),
      })),
  };
}

export async function getSuperAdminDashboardData() {
  await requireRole("super_admin");
  await requirePermission("dashboard.view");

  const supabase = await createClient();
  const [
    { data: schools },
    { data: users },
    { data: classes },
    { data: schedules },
    { data: auditLogs },
  ] = await Promise.all([
    supabase
      .from("schools")
      .select(
        "id, name, npsn, education_level, address, city, province, email, phone, is_active, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("id, school_id, status, roles(name), created_at")
      .not("school_id", "is", null),
    supabase.from("classes").select("id, school_id"),
    supabase
      .from("exam_schedules")
      .select("id, school_id, title, status, created_at")
      .is("deleted_at", null),
    supabase
      .from("audit_logs")
      .select("id, action, entity_type, entity_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const schoolRows = (schools ?? []) as SchoolRow[];
  const userRows = (users ?? []) as UserRow[];
  const scheduleRows = (schedules ?? []) as Array<
    SchoolScopedIdRow & {
      title?: string | null;
      status?: string | null;
      created_at?: string | null;
    }
  >;
  const statsBySchool = applyCounts(
    schoolRows,
    userRows,
    (classes ?? []) as SchoolScopedIdRow[],
    scheduleRows,
  );
  const topSchools = schoolRows
    .map((school) => ({
      id: school.id,
      name: school.name,
      activeExamCount: statsBySchool.get(school.id)?.activeExamCount ?? 0,
      finishedExamCount: statsBySchool.get(school.id)?.finishedExamCount ?? 0,
      examCount: statsBySchool.get(school.id)?.examCount ?? 0,
    }))
    .sort((a, b) => b.examCount - a.examCount)
    .slice(0, 5);

  return {
    summary: {
      totalSchools: schoolRows.length,
      activeSchools: schoolRows.filter((school) => school.is_active).length,
      inactiveSchools: schoolRows.filter((school) => !school.is_active).length,
      totalTeachers: userRows.filter(
        (user) => firstRelation(user.roles)?.name === "teacher",
      ).length,
      totalStudents: userRows.filter(
        (user) => firstRelation(user.roles)?.name === "student",
      ).length,
      totalActiveExams: scheduleRows.filter(
        (schedule) => schedule.status === "active",
      ).length,
      totalFinishedExams: scheduleRows.filter(
        (schedule) => schedule.status === "finished",
      ).length,
    },
    topSchools,
    recentActivities: [
      ...schoolRows.slice(0, 3).map((school) => ({
        label: "Sekolah baru",
        description: school.name,
        created_at: school.created_at,
      })),
      ...scheduleRows.slice(0, 3).map((schedule) => ({
        label: "Ujian baru",
        description: schedule.title ?? schedule.id,
        created_at: schedule.created_at,
      })),
      ...((auditLogs ?? []) as AuditLogRow[]).map((log) => ({
        label:
          log.entity_type === "role_permissions"
            ? "Perubahan permission"
            : log.action ?? "Audit log",
        description: log.entity_id ?? log.entity_type ?? "-",
        created_at: log.created_at,
      })),
    ]
      .filter((item) => Boolean(item.created_at))
      .sort((a, b) =>
        String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")),
      )
      .slice(0, 8),
  };
}
