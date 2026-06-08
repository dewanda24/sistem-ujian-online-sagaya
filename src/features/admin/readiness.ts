import { createClient } from "@/lib/supabase/server";

type ReadinessItem = {
  title: string;
  status: "ready" | "warning" | "missing";
  value: string;
  description: string;
  href?: string;
};

export async function getProductionReadinessItems(): Promise<ReadinessItem[]> {
  const [
    activeSchools,
    schoolAdminsWithoutSchool,
    operationalUsersWithoutSchool,
    usersWithoutAuth,
    usersWithoutRole,
    inactiveUsers,
    studentsWithoutClass,
    activeSchedulesWithoutParticipants,
    auditLogsAvailable,
    lockFieldsAvailable,
    serviceRoleAvailable,
  ] = await Promise.all([
    countActiveSchools(),
    countUsersWithoutSchoolByRoles(["admin"]),
    countUsersWithoutSchoolByRoles([
      "admin",
      "principal",
      "teacher",
      "student",
      "proctor",
    ]),
    countUsersWithoutAuth(),
    countUsersWithoutRole(),
    countInactiveUsers(),
    countStudentsWithoutActiveClass(),
    countActiveSchedulesWithoutParticipants(),
    tableAvailable("audit_logs"),
    examAttemptLockFieldsAvailable(),
    Promise.resolve(Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)),
  ]);

  return [
    {
      title: "Sekolah Aktif",
      status: activeSchools > 0 ? "ready" : "missing",
      value: String(activeSchools),
      description:
        "Minimal satu sekolah aktif wajib dibuat sebelum Admin Sekolah mengisi data operasional.",
      href: "/dashboard/master-data/schools",
    },
    {
      title: "Admin Tanpa Sekolah",
      status: schoolAdminsWithoutSchool === 0 ? "ready" : "missing",
      value: String(schoolAdminsWithoutSchool),
      description:
        "Admin Sekolah wajib punya school_id agar tidak masuk halaman forbidden.",
      href: "/dashboard/master-data/admins",
    },
    {
      title: "Pengguna Operasional Tanpa Sekolah",
      status: operationalUsersWithoutSchool === 0 ? "ready" : "warning",
      value: String(operationalUsersWithoutSchool),
      description:
        "Guru, siswa, proctor, principal, dan admin sebaiknya terhubung ke sekolah untuk mode multi-school.",
      href: "/dashboard/admin/users",
    },
    {
      title: "Kunci Layanan Supabase",
      status: serviceRoleAvailable ? "ready" : "warning",
      value: serviceRoleAvailable ? "Siap" : "Belum Siap",
      description:
        "Dibutuhkan untuk membuat akun login dan reset password dari beranda.",
    },
    {
      title: "Audit Logs Table",
      status: auditLogsAvailable ? "ready" : "missing",
      value: auditLogsAvailable ? "Siap" : "Belum Siap",
      description: "Wajib untuk jejak audit action sensitif.",
      href: "/dashboard/admin/audit-logs",
    },
    {
      title: "Attempt Lock Fields",
      status: lockFieldsAvailable ? "ready" : "missing",
      value: lockFieldsAvailable ? "Siap" : "Belum Siap",
      description:
        "Wajib untuk fitur lock/unlock attempt dari monitoring pengawas.",
      href: "/dashboard/proctor/monitoring",
    },
    {
      title: "Pengguna Tanpa Akun Login",
      status: usersWithoutAuth === 0 ? "ready" : "warning",
      value: String(usersWithoutAuth),
      description: "Pengguna internal tanpa akun login Supabase tidak bisa masuk.",
      href: "/dashboard/admin/users",
    },
    {
      title: "Pengguna Tanpa Hak Akses",
      status: usersWithoutRole === 0 ? "ready" : "missing",
      value: String(usersWithoutRole),
      description: "Pengguna tanpa hak akses tidak bisa masuk ke beranda.",
      href: "/dashboard/admin/users",
    },
    {
      title: "Pengguna Tidak Aktif",
      status: inactiveUsers === 0 ? "ready" : "warning",
      value: String(inactiveUsers),
      description: "Pastikan pengguna tidak aktif memang disengaja.",
      href: "/dashboard/admin/users?user_status=inactive",
    },
    {
      title: "Siswa Tanpa Kelas Aktif",
      status: studentsWithoutClass === 0 ? "ready" : "warning",
      value: String(studentsWithoutClass),
      description: "Siswa tanpa kelas aktif tidak akan menerima ujian kelas.",
      href: "/dashboard/master-data/students",
    },
    {
      title: "Jadwal Aktif Tanpa Peserta",
      status: activeSchedulesWithoutParticipants === 0 ? "ready" : "missing",
      value: String(activeSchedulesWithoutParticipants),
      description: "Jalankan Sync Peserta sebelum ujian dimulai.",
      href: "/dashboard/exams/schedules",
    },
  ];
}

async function countActiveSchools() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("schools")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  return count ?? 0;
}

async function countUsersWithoutSchoolByRoles(roleNames: string[]) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("users")
    .select("id, roles!inner(name)", { count: "exact", head: true })
    .in("roles.name", roleNames)
    .is("school_id", null)
    .eq("status", "active");

  return count ?? 0;
}

async function countUsersWithoutAuth() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .is("auth_user_id", null);

  return count ?? 0;
}

async function countUsersWithoutRole() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .is("role_id", null);

  return count ?? 0;
}

async function countInactiveUsers() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .neq("status", "active");

  return count ?? 0;
}

async function countStudentsWithoutActiveClass() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, class_members(id, left_at), roles!inner(name)")
    .eq("roles.name", "student")
    .eq("status", "active");

  return (data ?? []).filter((student) => {
    const memberships = student.class_members ?? [];

    return !memberships.some(
      (membership: { left_at?: string | null }) => !membership.left_at,
    );
  }).length;
}

async function countActiveSchedulesWithoutParticipants() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exam_schedules")
    .select("id, exam_participants(id)")
    .in("status", ["scheduled", "active"])
    .eq("is_active", true)
    .is("deleted_at", null);

  return (data ?? []).filter(
    (schedule) => (schedule.exam_participants ?? []).length === 0,
  ).length;
}

async function tableAvailable(tableName: string) {
  const supabase = await createClient();
  const { error } = await supabase.from(tableName).select("id").limit(1);

  return !error;
}

async function examAttemptLockFieldsAvailable() {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_attempts")
    .select("id, locked_at, locked_by, lock_reason")
    .limit(1);

  return !error;
}
