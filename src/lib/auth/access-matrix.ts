import type { CurrentUser, RoleName } from "@/types/auth";

export type DashboardIconName =
  | "activity"
  | "book-open"
  | "building-2"
  | "calendar-days"
  | "clipboard-check"
  | "database"
  | "download"
  | "file-clock"
  | "file-text"
  | "graduation-cap"
  | "history"
  | "layout-dashboard"
  | "list-checks"
  | "lock-keyhole"
  | "scroll-text"
  | "settings"
  | "hard-drive"
  | "shield-check"
  | "users";

export type AccessMenuItem = {
  label: string;
  href: string;
  icon: DashboardIconName;
  roles: RoleName[];
  permission?: string;
  children?: AccessMenuItem[];
};

type AccessRoleConfig = {
  dashboardPath: string;
  permissions: string[];
  menu: AccessMenuItem[];
};

type RouteAccessRule = {
  path: string;
  roles: RoleName[];
  permission?: string;
  match?: "exact" | "prefix";
};

const allRoles: RoleName[] = [
  "super_admin",
  "admin",
  "principal",
  "teacher",
  "student",
  "proctor",
];

const adminSchoolRoles: RoleName[] = ["super_admin", "admin"];
const examManagerRoles: RoleName[] = ["super_admin", "admin", "teacher"];
const reportRoles: RoleName[] = ["super_admin", "admin", "principal", "teacher"];

const commonPermissions = ["dashboard.view"];

const superAdminSystemMenu: AccessMenuItem = {
  label: "System",
  href: "/dashboard/admin/users",
  icon: "shield-check",
  roles: ["super_admin"],
  children: [
    {
      label: "Users",
      href: "/dashboard/admin/users",
      icon: "users",
      roles: ["super_admin"],
      permission: "users.view",
    },
    {
      label: "Roles",
      href: "/dashboard/admin/roles",
      icon: "shield-check",
      roles: ["super_admin"],
      permission: "roles.view",
    },
    {
      label: "Permissions",
      href: "/dashboard/admin/permissions",
      icon: "lock-keyhole",
      roles: ["super_admin"],
      permission: "roles.manage",
    },
    {
      label: "Audit Logs",
      href: "/dashboard/admin/audit-logs",
      icon: "scroll-text",
      roles: ["super_admin"],
      permission: "audit_logs.view",
    },
    {
      label: "Readiness",
      href: "/dashboard/super-admin/readiness",
      icon: "shield-check",
      roles: ["super_admin"],
      permission: "users.view",
    },
    {
      label: "Settings",
      href: "/dashboard/super-admin/settings",
      icon: "settings",
      roles: ["super_admin"],
    },
    {
      label: "Backup",
      href: "/dashboard/super-admin/backup-recovery",
      icon: "hard-drive",
      roles: ["super_admin"],
    },
  ],
};

const masterDataMenu: AccessMenuItem = {
  label: "Master Data",
  href: "/dashboard/master-data",
  icon: "database",
  roles: adminSchoolRoles,
  permission: "master_data.view",
  children: [
    {
      label: "Sekolah",
      href: "/dashboard/master-data/schools",
      icon: "building-2",
      roles: ["super_admin"],
      permission: "schools.view",
    },
    {
      label: "Tahun Ajaran",
      href: "/dashboard/master-data/academic-years",
      icon: "calendar-days",
      roles: adminSchoolRoles,
      permission: "academic_years.view",
    },
    {
      label: "Kelas",
      href: "/dashboard/master-data/classes",
      icon: "list-checks",
      roles: adminSchoolRoles,
      permission: "classes.view",
    },
    {
      label: "Mapel",
      href: "/dashboard/master-data/subjects",
      icon: "book-open",
      roles: adminSchoolRoles,
      permission: "subjects.view",
    },
    {
      label: "Guru",
      href: "/dashboard/master-data/teachers",
      icon: "users",
      roles: adminSchoolRoles,
      permission: "teachers.view",
    },
    {
      label: "Siswa",
      href: "/dashboard/master-data/students",
      icon: "graduation-cap",
      roles: adminSchoolRoles,
      permission: "students.view",
    },
  ],
};

const examMenu: AccessMenuItem = {
  label: "Ujian",
  href: "/dashboard/exams",
  icon: "file-text",
  roles: examManagerRoles,
  permission: "exams.view",
  children: [
    {
      label: "Paket",
      href: "/dashboard/exams/packages",
      icon: "book-open",
      roles: examManagerRoles,
      permission: "exam_packages.view",
    },
    {
      label: "Jadwal",
      href: "/dashboard/exams/schedules",
      icon: "calendar-days",
      roles: examManagerRoles,
      permission: "exam_schedules.view",
    },
    {
      label: "Monitoring",
      href: "/dashboard/admin/monitoring",
      icon: "list-checks",
      roles: ["admin"],
      permission: "exam_monitoring.view",
    },
    {
      label: "Monitoring",
      href: "/dashboard/super-admin/monitoring",
      icon: "list-checks",
      roles: ["super_admin"],
      permission: "exam_monitoring.view",
    },
  ],
};

const teacherQuestionBankMenu: AccessMenuItem = {
  label: "Bank Soal",
  href: "/dashboard/question-bank",
  icon: "book-open",
  roles: ["teacher"],
  permission: "question_bank.view",
  children: [
    {
      label: "Semua Soal",
      href: "/dashboard/question-bank/questions",
      icon: "book-open",
      roles: ["teacher"],
      permission: "question_bank.view",
    },
    {
      label: "Tambah Soal",
      href: "/dashboard/question-bank/questions/create",
      icon: "file-text",
      roles: ["teacher"],
      permission: "questions.create",
    },
    {
      label: "Kategori Soal",
      href: "/dashboard/question-bank/categories",
      icon: "list-checks",
      roles: ["teacher"],
      permission: "question_bank.view",
    },
  ],
};

const dashboardItem = (role: RoleName, href: string): AccessMenuItem => ({
  label: "Dashboard",
  href,
  icon: "layout-dashboard",
  roles: [role],
  permission: "dashboard.view",
});

const profileItem = (role: RoleName): AccessMenuItem => ({
  label: "Profile",
  href: "/dashboard/profile",
  icon: "users",
  roles: [role],
});

export const ACCESS_MATRIX: Record<RoleName, AccessRoleConfig> = {
  super_admin: {
    dashboardPath: "/dashboard/super-admin",
    permissions: ["*"],
    menu: [
      dashboardItem("super_admin", "/dashboard/super-admin"),
      superAdminSystemMenu,
      masterDataMenu,
      {
        ...examMenu,
        children: [
          {
            label: "Semua Soal",
            href: "/dashboard/question-bank/questions",
            icon: "book-open",
            roles: ["super_admin"],
            permission: "question_bank.view",
          },
          {
            label: "Tambah Soal",
            href: "/dashboard/question-bank/questions/create",
            icon: "file-text",
            roles: ["super_admin"],
            permission: "questions.create",
          },
          {
            label: "Kategori Soal",
            href: "/dashboard/question-bank/categories",
            icon: "list-checks",
            roles: ["super_admin"],
            permission: "question_bank.view",
          },
          ...(examMenu.children ?? []),
        ],
      },
      {
        label: "Laporan",
        href: "/dashboard/reports",
        icon: "activity",
        roles: ["super_admin"],
        permission: "reports.view",
        children: [
          {
            label: "Hasil Ujian",
            href: "/dashboard/reports/students",
            icon: "file-text",
            roles: ["super_admin"],
            permission: "reports.view",
          },
          {
            label: "Rekap Nilai",
            href: "/dashboard/reports/classes",
            icon: "activity",
            roles: ["super_admin"],
            permission: "reports.view",
          },
        ],
      },
      {
        label: "Import Export",
        href: "/dashboard/import-export",
        icon: "download",
        roles: ["super_admin"],
        permission: "import_export.view",
      },
      profileItem("super_admin"),
    ],
  },
  admin: {
    dashboardPath: "/dashboard/admin",
    permissions: [
      ...commonPermissions,
      "users.view",
      "users.create",
      "users.update",
      "master_data.view",
      "academic_years.view",
      "academic_years.manage",
      "classes.view",
      "classes.manage",
      "subjects.view",
      "subjects.manage",
      "teachers.view",
      "teachers.manage",
      "students.view",
      "students.manage",
      "question_bank.view",
      "question_bank.manage",
      "questions.create",
      "questions.update",
      "questions.publish",
      "questions.archive",
      "question_categories.manage",
      "exams.view",
      "exam_packages.view",
      "exam_packages.manage",
      "exam_packages.archive",
      "exam_schedules.view",
      "exam_schedules.manage",
      "exam_schedules.archive",
      "exam_tokens.manage",
      "exam_monitoring.view",
      "exam_sessions.control",
      "reports.view",
      "reports.export",
      "import_export.view",
    ],
    menu: [
      dashboardItem("admin", "/dashboard/admin"),
      {
        label: "Master Data",
        href: "/dashboard/master-data",
        icon: "database",
        roles: ["admin"],
        permission: "master_data.view",
        children: [
          {
            label: "Tahun Ajaran",
            href: "/dashboard/master-data/academic-years",
            icon: "calendar-days",
            roles: ["admin"],
            permission: "academic_years.view",
          },
          {
            label: "Siswa",
            href: "/dashboard/master-data/students",
            icon: "graduation-cap",
            roles: ["admin"],
            permission: "students.view",
          },
          {
            label: "Guru",
            href: "/dashboard/master-data/teachers",
            icon: "users",
            roles: ["admin"],
            permission: "teachers.view",
          },
          {
            label: "Kelas",
            href: "/dashboard/master-data/classes",
            icon: "list-checks",
            roles: ["admin"],
            permission: "classes.view",
          },
          {
            label: "Mapel",
            href: "/dashboard/master-data/subjects",
            icon: "book-open",
            roles: ["admin"],
            permission: "subjects.view",
          },
        ],
      },
      {
        label: "Bank Soal",
        href: "/dashboard/question-bank",
        icon: "book-open",
        roles: ["admin"],
        permission: "question_bank.view",
        children: [
          {
            label: "Semua Soal",
            href: "/dashboard/question-bank/questions",
            icon: "book-open",
            roles: ["admin"],
            permission: "question_bank.view",
          },
          {
            label: "Tambah Soal",
            href: "/dashboard/question-bank/questions/create",
            icon: "file-text",
            roles: ["admin"],
            permission: "questions.create",
          },
          {
            label: "Kategori Soal",
            href: "/dashboard/question-bank/categories",
            icon: "list-checks",
            roles: ["admin"],
            permission: "question_bank.view",
          },
        ],
      },
      {
        label: "Ujian",
        href: "/dashboard/exams",
        icon: "file-text",
        roles: ["admin"],
        permission: "exams.view",
        children: [
          {
            label: "Paket Ujian",
            href: "/dashboard/exams/packages",
            icon: "book-open",
            roles: ["admin"],
            permission: "exam_packages.view",
          },
          {
            label: "Jadwal Ujian",
            href: "/dashboard/exams/schedules",
            icon: "calendar-days",
            roles: ["admin"],
            permission: "exam_schedules.view",
          },
          {
            label: "Monitoring",
            href: "/dashboard/admin/monitoring",
            icon: "list-checks",
            roles: ["admin"],
            permission: "exam_monitoring.view",
          },
        ],
      },
      {
        label: "Laporan",
        href: "/dashboard/reports",
        icon: "activity",
        roles: ["admin"],
        permission: "reports.view",
        children: [
          {
            label: "Hasil Ujian",
            href: "/dashboard/reports/students",
            icon: "file-text",
            roles: ["admin"],
            permission: "reports.view",
          },
          {
            label: "Rekap Nilai",
            href: "/dashboard/reports/classes",
            icon: "activity",
            roles: ["admin"],
            permission: "reports.view",
          },
        ],
      },
      {
        label: "Import Export",
        href: "/dashboard/import-export",
        icon: "download",
        roles: ["admin"],
        permission: "import_export.view",
        children: [
          {
            label: "Import Data",
            href: "/dashboard/import-export?mode=import",
            icon: "download",
            roles: ["admin"],
            permission: "import_export.view",
          },
          {
            label: "Export Data",
            href: "/dashboard/import-export?mode=export",
            icon: "download",
            roles: ["admin"],
            permission: "import_export.view",
          },
        ],
      },
      {
        label: "Lainnya",
        href: "/dashboard/profile",
        icon: "users",
        roles: ["admin"],
        children: [
          {
            label: "Profil Saya",
            href: "/dashboard/profile?section=me",
            icon: "users",
            roles: ["admin"],
          },
        ],
      },
    ],
  },
  principal: {
    dashboardPath: "/dashboard/principal",
    permissions: [...commonPermissions, "reports.view", "reports.export"],
    menu: [
      dashboardItem("principal", "/dashboard/principal"),
      {
        label: "Laporan",
        href: "/dashboard/reports",
        icon: "activity",
        roles: ["principal"],
        permission: "reports.view",
        children: [
          {
            label: "Hasil Ujian",
            href: "/dashboard/reports/students",
            icon: "file-text",
            roles: ["principal"],
            permission: "reports.view",
          },
          {
            label: "Rekap Nilai",
            href: "/dashboard/reports/classes",
            icon: "activity",
            roles: ["principal"],
            permission: "reports.view",
          },
        ],
      },
      profileItem("principal"),
    ],
  },
  teacher: {
    dashboardPath: "/dashboard/teacher",
    permissions: [
      ...commonPermissions,
      "question_bank.view",
      "question_bank.manage",
      "questions.create",
      "questions.update",
      "questions.publish",
      "questions.archive",
      "question_categories.manage",
      "exams.view",
      "exam_packages.view",
      "exam_packages.manage",
      "exam_packages.archive",
      "exam_schedules.view",
      "exam_schedules.manage",
      "exam_schedules.archive",
      "exam_monitoring.view",
      "grading.view",
      "grading.manage",
      "exam_results.view",
      "exam_results.finalize",
      "exam_results.recap",
      "reports.view",
      "reports.export",
    ],
    menu: [
      dashboardItem("teacher", "/dashboard/teacher"),
      {
        label: "Kelas Binaan",
        href: "/dashboard/teacher/homeroom",
        icon: "graduation-cap",
        roles: ["teacher"],
      },
      teacherQuestionBankMenu,
      {
        label: "Ujian",
        href: "/dashboard/exams",
        icon: "file-text",
        roles: ["teacher"],
        permission: "exams.view",
        children: [
          {
            label: "Paket",
            href: "/dashboard/exams/packages",
            icon: "book-open",
            roles: ["teacher"],
            permission: "exam_packages.view",
          },
          {
            label: "Jadwal",
            href: "/dashboard/exams/schedules",
            icon: "calendar-days",
            roles: ["teacher"],
            permission: "exam_schedules.view",
          },
        ],
      },
      {
        label: "Monitoring",
        href: "/dashboard/teacher/monitoring",
        icon: "list-checks",
        roles: ["teacher"],
        permission: "exam_monitoring.view",
      },
      {
        label: "Grading",
        href: "/dashboard/teacher/grading",
        icon: "clipboard-check",
        roles: ["teacher"],
        permission: "grading.view",
      },
      {
        label: "Laporan",
        href: "/dashboard/reports",
        icon: "activity",
        roles: ["teacher"],
        permission: "reports.view",
        children: [
          {
            label: "Hasil Ujian",
            href: "/dashboard/reports/students",
            icon: "file-text",
            roles: ["teacher"],
            permission: "reports.view",
          },
          {
            label: "Rekap Nilai",
            href: "/dashboard/reports/classes",
            icon: "activity",
            roles: ["teacher"],
            permission: "reports.view",
          },
        ],
      },
      profileItem("teacher"),
    ],
  },
  student: {
    dashboardPath: "/dashboard/student",
    permissions: [
      ...commonPermissions,
      "active_exams.view",
      "exam_results.view",
      "exam_room.access",
      "exam_attempts.start",
      "exam_answers.save",
      "exam_attempts.submit",
    ],
    menu: [
      dashboardItem("student", "/dashboard/student"),
      {
        label: "Ujian Aktif",
        href: "/dashboard/student/active-exams",
        icon: "graduation-cap",
        roles: ["student"],
        permission: "active_exams.view",
      },
      {
        label: "Jadwal",
        href: "/dashboard/student/schedules",
        icon: "file-clock",
        roles: ["student"],
        permission: "active_exams.view",
      },
      {
        label: "Riwayat Hasil",
        href: "/dashboard/student/history",
        icon: "history",
        roles: ["student"],
        permission: "exam_results.view",
      },
      profileItem("student"),
    ],
  },
  proctor: {
    dashboardPath: "/dashboard/proctor",
    permissions: [
      ...commonPermissions,
      "exam_monitoring.view",
      "exam_sessions.control",
    ],
    menu: [
      dashboardItem("proctor", "/dashboard/proctor"),
      {
        label: "Jadwal Pengawasan",
        href: "/dashboard/proctor/schedules",
        icon: "calendar-days",
        roles: ["proctor"],
        permission: "exam_monitoring.view",
      },
      {
        label: "Token Ujian",
        href: "/dashboard/proctor/tokens",
        icon: "lock-keyhole",
        roles: ["proctor"],
        permission: "exam_monitoring.view",
      },
      {
        label: "Monitoring",
        href: "/dashboard/proctor/monitoring",
        icon: "list-checks",
        roles: ["proctor"],
        permission: "exam_monitoring.view",
      },
      profileItem("proctor"),
    ],
  },
};

export const DASHBOARD_ROUTE_RULES: RouteAccessRule[] = [
  {
    path: "/dashboard",
    roles: allRoles,
    match: "exact",
    permission: "dashboard.view",
  },
  { path: "/dashboard/forbidden", roles: allRoles, match: "prefix" },
  {
    path: "/dashboard/profile",
    roles: allRoles,
    match: "prefix",
  },
  { path: "/dashboard/super-admin", roles: ["super_admin"], match: "prefix" },
  { path: "/dashboard/admin", roles: ["admin"], match: "exact" },
  {
    path: "/dashboard/admin/users",
    roles: adminSchoolRoles,
    match: "prefix",
    permission: "users.view",
  },
  {
    path: "/dashboard/admin/roles",
    roles: ["super_admin"],
    match: "prefix",
    permission: "roles.view",
  },
  {
    path: "/dashboard/admin/permissions",
    roles: ["super_admin"],
    match: "prefix",
    permission: "roles.manage",
  },
  {
    path: "/dashboard/admin/audit-logs",
    roles: ["super_admin"],
    match: "prefix",
    permission: "audit_logs.view",
  },
  {
    path: "/dashboard/admin/monitoring",
    roles: ["admin"],
    match: "prefix",
    permission: "exam_monitoring.view",
  },
  {
    path: "/dashboard/master-data/schools",
    roles: ["super_admin"],
    match: "prefix",
    permission: "schools.view",
  },
  {
    path: "/dashboard/master-data/semesters",
    roles: ["super_admin"],
    match: "prefix",
    permission: "semesters.view",
  },
  {
    path: "/dashboard/master-data/admins",
    roles: ["super_admin"],
    match: "prefix",
  },
  {
    path: "/dashboard/master-data/proctors",
    roles: ["super_admin"],
    match: "prefix",
    permission: "users.view",
  },
  {
    path: "/dashboard/master-data",
    roles: adminSchoolRoles,
    match: "prefix",
    permission: "master_data.view",
  },
  {
    path: "/dashboard/question-bank/import",
    roles: ["teacher"],
    match: "prefix",
    permission: "question_bank.manage",
  },
  {
    path: "/dashboard/question-bank",
    roles: examManagerRoles,
    match: "prefix",
    permission: "question_bank.view",
  },
  {
    path: "/dashboard/exams",
    roles: examManagerRoles,
    match: "prefix",
    permission: "exams.view",
  },
  {
    path: "/dashboard/exam-room",
    roles: ["student"],
    match: "prefix",
    permission: "exam_room.access",
  },
  {
    path: "/dashboard/exam-results",
    roles: ["student", "teacher", "admin", "super_admin"],
    match: "prefix",
    permission: "exam_results.view",
  },
  {
    path: "/dashboard/reports",
    roles: reportRoles,
    match: "prefix",
    permission: "reports.view",
  },
  {
    path: "/dashboard/import-export",
    roles: ["super_admin", "admin"],
    match: "prefix",
    permission: "import_export.view",
  },
  { path: "/dashboard/teacher", roles: ["teacher"], match: "prefix" },
  { path: "/dashboard/proctor", roles: ["proctor"], match: "prefix" },
  { path: "/dashboard/student", roles: ["student"], match: "prefix" },
  { path: "/dashboard/principal", roles: ["principal"], match: "prefix" },
  { path: "/admin", roles: ["admin"], match: "prefix" },
  { path: "/teacher", roles: ["teacher"], match: "prefix" },
  { path: "/proctor", roles: ["proctor"], match: "prefix" },
  { path: "/student", roles: ["student"], match: "prefix" },
  { path: "/principal", roles: ["principal"], match: "prefix" },
];

export function getRoleDashboardPath(role?: string | null) {
  return isRoleName(role) ? ACCESS_MATRIX[role].dashboardPath : "/login";
}

export function getAccessMenu(user: CurrentUser) {
  const role = user.roles?.name;

  if (!role || !isRoleName(role)) {
    return [];
  }

  return ACCESS_MATRIX[role].menu
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => canShowMenuItem(user, child)),
    }))
    .filter((item) => {
      if (!canShowMenuItem(user, item)) {
        return false;
      }

      if (item.children) {
        return item.children.length > 0;
      }

      return true;
    });
}

export function canShowMenuItem(user: CurrentUser, item: AccessMenuItem) {
  const role = user.roles?.name;

  if (!role || !item.roles.includes(role)) {
    return false;
  }

  if (!item.permission) {
    return true;
  }

  return userHasPermission(user, item.permission);
}

export function canRoleAccessPermission(role: string | null | undefined, permission: string) {
  if (!isRoleName(role)) {
    return false;
  }

  const permissions = ACCESS_MATRIX[role].permissions;

  return permissions.includes("*") || permissions.includes(permission);
}

export function canRoleAccessRoute(role: string | null | undefined, pathname: string) {
  if (!isRoleName(role)) {
    return false;
  }

  const rule = findRouteRule(pathname);

  if (!rule) {
    return role === "super_admin";
  }

  return rule.roles.includes(role);
}

export function canUserAccessRoute(user: CurrentUser, pathname: string) {
  const role = user.roles?.name;
  const rule = findRouteRule(pathname);

  if (!role || !canRoleAccessRoute(role, pathname)) {
    return false;
  }

  if (!rule?.permission) {
    return true;
  }

  return userHasPermission(user, rule.permission);
}

export function getRouteRule(pathname: string) {
  return findRouteRule(pathname);
}

function findRouteRule(pathname: string) {
  return DASHBOARD_ROUTE_RULES.find((rule) =>
    rule.match === "exact" ? pathname === rule.path : pathname.startsWith(rule.path),
  );
}

function userHasPermission(user: CurrentUser, permission: string) {
  const role = user.roles?.name;

  if (role === "super_admin") {
    return true;
  }

  if (!canRoleAccessPermission(role, permission)) {
    return false;
  }

  return user.permissions.some((item) => item.code === permission);
}

function isRoleName(role: string | null | undefined): role is RoleName {
  return role === "super_admin" ||
    role === "admin" ||
    role === "principal" ||
    role === "teacher" ||
    role === "student" ||
    role === "proctor";
}
