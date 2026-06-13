import { UI_LABELS } from "@/constants/ui-labels";
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

const adminSchoolRoles: RoleName[] = ["admin"];
const userAdminRoles: RoleName[] = ["super_admin", "admin"];
const examManagerRoles: RoleName[] = ["admin", "teacher"];
const reportRoles: RoleName[] = ["super_admin", "admin", "principal", "teacher"];

const commonPermissions = ["dashboard.view"];

const superAdminSystemMenu: AccessMenuItem = {
  label: "Akses Sistem",
  href: "/dashboard/super-admin/role-permission",
  icon: "shield-check",
  roles: ["super_admin"],
  children: [
    {
      label: UI_LABELS.navigation.roles,
      href: "/dashboard/admin/roles",
      icon: "shield-check",
      roles: ["super_admin"],
      permission: "roles.view",
    },
    {
      label: UI_LABELS.navigation.permissions,
      href: "/dashboard/admin/permissions",
      icon: "lock-keyhole",
      roles: ["super_admin"],
      permission: "roles.manage",
    },
  ],
};

const superAdminAuditMenu: AccessMenuItem = {
  label: "Catatan Aktivitas",
  href: "/dashboard/super-admin/audit-logs",
  icon: "scroll-text",
  roles: ["super_admin"],
  permission: "audit_logs.view",
};

const superAdminSettingsMenu: AccessMenuItem = {
  label: "Pengaturan Sistem",
  href: "/dashboard/super-admin/settings",
  icon: "settings",
  roles: ["super_admin"],
  children: [
    {
      label: "Status Sistem",
      href: "/dashboard/super-admin/readiness",
      icon: "shield-check",
      roles: ["super_admin"],
      permission: "users.view",
    },
    {
      label: UI_LABELS.navigation.settings,
      href: "/dashboard/super-admin/settings",
      icon: "settings",
      roles: ["super_admin"],
    },
  ],
};

const superAdminSchoolMenu: AccessMenuItem = {
  label: "Manajemen Sekolah",
  href: "/dashboard/super-admin/schools",
  icon: "building-2",
  roles: ["super_admin"],
  permission: "schools.view",
  children: [
    {
      label: "Daftar Sekolah",
      href: "/dashboard/super-admin/schools",
      icon: "building-2",
      roles: ["super_admin"],
      permission: "schools.view",
    },
    {
      label: "Tambah Sekolah",
      href: "/dashboard/super-admin/schools/new",
      icon: "file-text",
      roles: ["super_admin"],
      permission: "schools.manage",
    },
  ],
};

const superAdminMonitoringMenu: AccessMenuItem = {
  label: "Pemantauan Sekolah",
  href: "/dashboard/super-admin/monitoring",
  icon: "activity",
  roles: ["super_admin"],
  permission: "exam_monitoring.view",
};

const teacherQuestionBankMenu: AccessMenuItem = {
  label: UI_LABELS.navigation.questionBank,
  href: "/dashboard/question-bank",
  icon: "book-open",
  roles: ["teacher"],
  permission: "question_bank.view",
  children: [
    {
      label: UI_LABELS.navigation.allQuestions,
      href: "/dashboard/question-bank/questions",
      icon: "book-open",
      roles: ["teacher"],
      permission: "question_bank.view",
    },
    {
      label: UI_LABELS.navigation.addQuestion,
      href: "/dashboard/question-bank/questions/create",
      icon: "file-text",
      roles: ["teacher"],
      permission: "questions.create",
    },
  ],
};

const dashboardItem = (role: RoleName, href: string): AccessMenuItem => ({
  label: UI_LABELS.navigation.home,
  href,
  icon: "layout-dashboard",
  roles: [role],
  permission: "dashboard.view",
});

const profileItem = (role: RoleName): AccessMenuItem => ({
  label: UI_LABELS.navigation.profile,
  href: "/dashboard/profile",
  icon: "users",
  roles: [role],
});

export const ACCESS_MATRIX: Record<RoleName, AccessRoleConfig> = {
  super_admin: {
    dashboardPath: "/dashboard/super-admin",
    permissions: ["*"],
    menu: [
      {
        ...dashboardItem("super_admin", "/dashboard/super-admin"),
        label: "Dashboard Pusat",
      },
      superAdminSchoolMenu,
      {
        label: "Admin Sekolah",
        href: "/dashboard/super-admin/admins",
        icon: "users",
        roles: ["super_admin"],
        permission: "users.view",
      },
      {
        label: "Pengguna Global",
        href: "/dashboard/super-admin/users",
        icon: "users",
        roles: ["super_admin"],
        permission: "users.view",
      },
      superAdminSystemMenu,
      superAdminMonitoringMenu,
      {
        label: "Pusat Pemulihan",
        href: "/dashboard/recovery-center",
        icon: "activity",
        roles: ["super_admin"],
        permission: "exam_monitoring.view",
      },
      superAdminAuditMenu,
      {
        label: "Laporan Global",
        href: "/dashboard/super-admin/reports",
        icon: "activity",
        roles: ["super_admin"],
        permission: "reports.view",
      },
      {
        label: "Import & Unduh Data",
        href: "/dashboard/super-admin/import-export",
        icon: "download",
        roles: ["super_admin"],
        permission: "import_export.view",
      },
      {
        label: "Cadangan & Pemulihan",
        href: "/dashboard/super-admin/backup-recovery",
        icon: "hard-drive",
        roles: ["super_admin"],
      },
      superAdminSettingsMenu,
      {
        label: "Bantuan Sekolah",
        href: "/dashboard/super-admin/support",
        icon: "file-text",
        roles: ["super_admin"],
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
      "semesters.view",
      "semesters.manage",
      "classes.view",
      "classes.manage",
      "subjects.view",
      "subjects.manage",
      "teachers.view",
      "teachers.manage",
      "students.view",
      "students.manage",
      "question_bank.view",
      "question_bank.export",
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
        label: "Akademik",
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
            label: "Semester",
            href: "/dashboard/master-data/semesters",
            icon: "calendar-days",
            roles: ["admin"],
            permission: "semesters.view",
          },
          {
            label: "Mata Pelajaran",
            href: "/dashboard/master-data/subjects",
            icon: "book-open",
            roles: ["admin"],
            permission: "subjects.view",
          },
          {
            label: "Kelas",
            href: "/dashboard/master-data/classes",
            icon: "list-checks",
            roles: ["admin"],
            permission: "classes.view",
          },
        ],
      },
      {
        label: "Pengguna",
        href: "/dashboard/master-data/teachers",
        icon: "users",
        roles: ["admin"],
        permission: "users.view",
        children: [
          {
            label: "Guru",
            href: "/dashboard/master-data/teachers",
            icon: "users",
            roles: ["admin"],
            permission: "teachers.view",
          },
          {
            label: "Siswa",
            href: "/dashboard/master-data/students",
            icon: "graduation-cap",
            roles: ["admin"],
            permission: "students.view",
          },
        ],
      },
      {
        label: "Data Sekolah",
        href: "/dashboard/master-data/teacher-assignments",
        icon: "list-checks",
        roles: ["admin"],
        permission: "teachers.manage",
        children: [
          {
            label: "Penugasan Guru",
            href: "/dashboard/master-data/teacher-assignments",
            icon: "list-checks",
            roles: ["admin"],
            permission: "teachers.manage",
          },
        ],
      },
      {
        label: "Ujian",
        href: "/dashboard/exams/schedules",
        icon: "file-text",
        roles: ["admin"],
        permission: "exam_schedules.view",
        children: [
          {
            label: "Jadwal Ujian",
            href: "/dashboard/exams/schedules",
            icon: "calendar-days",
            roles: ["admin"],
            permission: "exam_schedules.view",
          },
          {
            label: "Penugasan Pengawas",
            href: "/dashboard/exams/proctors",
            icon: "shield-check",
            roles: ["admin"],
            permission: "exam_schedules.manage",
          },
          {
            label: "Pemantauan Ujian",
            href: "/dashboard/admin/monitoring",
            icon: "activity",
            roles: ["admin"],
            permission: "exam_monitoring.view",
          },
          {
            label: "Pusat Pemulihan",
            href: "/dashboard/recovery-center",
            icon: "activity",
            roles: ["admin"],
            permission: "exam_monitoring.view",
          },
        ],
      },
      {
        label: UI_LABELS.navigation.reports,
        href: "/dashboard/reports",
        icon: "activity",
        roles: ["admin"],
        permission: "reports.view",
        children: [
          {
            label: "Rekap Nilai",
            href: "/dashboard/reports/classes",
            icon: "file-text",
            roles: ["admin"],
            permission: "reports.view",
          },
          {
            label: "Rekap Ujian",
            href: "/dashboard/reports/exams",
            icon: "activity",
            roles: ["admin"],
            permission: "reports.view",
          },
        ],
      },
      {
        label: "Data Sekolah",
        href: "/dashboard/import-export",
        icon: "download",
        roles: ["admin"],
        permission: "import_export.view",
        children: [
          {
            label: UI_LABELS.navigation.importData,
            href: "/dashboard/import-export?tab=import",
            icon: "download",
            roles: ["admin"],
            permission: "import_export.view",
          },
          {
            label: UI_LABELS.navigation.exportData,
            href: "/dashboard/import-export?tab=export",
            icon: "download",
            roles: ["admin"],
            permission: "import_export.view",
          },
          {
            label: "Cetak Akun Login",
            href: "/dashboard/master-data/students/login-cards",
            icon: "file-text",
            roles: ["admin"],
            permission: "students.view",
          },
        ],
      },
      profileItem("admin"),
    ],
  },
  principal: {
    dashboardPath: "/dashboard/principal",
    permissions: [...commonPermissions, "reports.view", "reports.export"],
    menu: [
      dashboardItem("principal", "/dashboard/principal"),
      {
        label: UI_LABELS.navigation.reports,
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
      "question_bank.export",
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
      teacherQuestionBankMenu,
      {
        label: "Paket Ujian",
        href: "/dashboard/exams/packages",
        icon: "book-open",
        roles: ["teacher"],
        permission: "exam_packages.view",
      },
      {
        label: "Jadwal Ujian",
        href: "/dashboard/exams/schedules",
        icon: "calendar-days",
        roles: ["teacher"],
        permission: "exam_schedules.view",
      },
      {
        label: "Nilai",
        href: "/dashboard/teacher/grading",
        icon: "clipboard-check",
        roles: ["teacher"],
        children: [
          {
            label: "Koreksi Essay",
            href: "/dashboard/teacher/grading",
            icon: "clipboard-check",
            roles: ["teacher"],
            permission: "grading.view",
          },
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
      {
        label: "Pemantauan Ujian",
        href: "/dashboard/teacher/monitoring",
        icon: "activity",
        roles: ["teacher"],
        permission: "exam_monitoring.view",
      },
      {
        label: "Pusat Pemulihan",
        href: "/dashboard/recovery-center",
        icon: "activity",
        roles: ["teacher"],
        permission: "exam_monitoring.view",
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
        label: UI_LABELS.navigation.activeExams,
        href: "/dashboard/student/active-exams",
        icon: "graduation-cap",
        roles: ["student"],
        permission: "active_exams.view",
      },
      {
        label: "Riwayat Ujian",
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
      {
        ...dashboardItem("proctor", "/dashboard/proctor"),
        label: "Dashboard Pengawas",
      },
      {
        label: "Pemantauan Ujian",
        href: "/dashboard/proctor/monitoring",
        icon: "list-checks",
        roles: ["proctor"],
        permission: "exam_monitoring.view",
      },
      {
        label: "Pusat Pemulihan",
        href: "/dashboard/recovery-center",
        icon: "activity",
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
  {
    path: "/dashboard/recovery-center",
    roles: ["super_admin", "admin", "teacher", "proctor"],
    match: "prefix",
    permission: "exam_monitoring.view",
  },
  { path: "/dashboard/super-admin", roles: ["super_admin"], match: "prefix" },
  { path: "/dashboard/admin", roles: ["admin"], match: "exact" },
  {
    path: "/dashboard/admin/users",
    roles: userAdminRoles,
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
    roles: ["super_admin", "admin"],
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

  if (
    role === "teacher" &&
    ["/dashboard/teacher/monitoring", "/dashboard/recovery-center"].includes(
      item.href,
    ) &&
    !user.has_active_proctor_assignment
  ) {
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
