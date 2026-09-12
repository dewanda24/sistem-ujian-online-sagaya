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
  description?: string;
  href: string;
  icon: DashboardIconName;
  roles: RoleName[];
  permission?: string;
  activePaths?: string[];
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
const examManagerRoles: RoleName[] = ["admin", "teacher"];
const reportRoles: RoleName[] = ["super_admin", "admin", "principal", "teacher"];

const commonPermissions = ["dashboard.view"];

const dashboardItem = (role: RoleName, href: string): AccessMenuItem => ({
  label:
    role === "super_admin"
      ? "Dashboard Pusat"
      : role === "teacher"
        ? "Dashboard Guru"
        : role === "proctor"
          ? "Dashboard Pengawas"
          : "Dashboard",
  description:
    role === "super_admin"
      ? "Ringkasan kondisi seluruh sekolah dan aktivitas sistem."
      : role === "admin"
        ? "Ringkasan aktivitas, ujian berjalan, dan informasi penting sekolah."
        : role === "teacher"
          ? "Ringkasan aktivitas mengajar dan pelaksanaan ujian."
          : role === "proctor"
            ? "Ringkasan ujian yang sedang diawasi."
            : role === "student"
              ? "Ringkasan ujian, jadwal, dan informasi penting untuk siswa."
              : "Ringkasan aktivitas dan informasi penting.",
  href,
  icon: "layout-dashboard",
  roles: [role],
  permission: "dashboard.view",
});

const profileItem = (role: RoleName): AccessMenuItem => ({
  label: "Profil",
  description: "Kelola informasi akun dan profil pribadi.",
  href: "/dashboard/profile",
  icon: "users",
  roles: [role],
});



const proctorExamMenu: AccessMenuItem = {
  label: "Ujian Diawasi",
  description: "Daftar ujian yang menjadi tanggung jawab pengawasan.",
  href: "/dashboard/proctor/monitoring",
  icon: "file-text",
  roles: ["proctor"],
  permission: "exam_monitoring.view",
  children: [
    {
      label: "Monitoring Ujian",
      href: "/dashboard/proctor/monitoring",
      icon: "activity",
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
  ],
};

const reportMenu = (roles: RoleName[]): AccessMenuItem => ({
  label: roles.includes("teacher") ? "Hasil Siswa" : "Hasil & Laporan",
  description: roles.includes("teacher")
    ? "Lihat hasil dan perkembangan peserta ujian."
    : "Analisis hasil ujian dan unduh laporan sekolah.",
  href: "/dashboard/reports",
  icon: "activity",
  roles,
  permission: "reports.view",
  children: [
    {
      label: "Hasil Ujian",
      href: "/dashboard/reports/students",
      icon: "file-text",
      roles,
      permission: "reports.view",
    },
    {
      label: "Analitik",
      href: "/dashboard/reports/classes",
      activePaths: ["/dashboard/reports/exams", "/dashboard/reports/subjects"],
      icon: "activity",
      roles,
      permission: "reports.view",
    },
    {
      label: "Ekspor Laporan",
      href: "/dashboard/reports",
      icon: "download",
      roles,
      permission: "reports.export",
    },
    {
      label: "Audit Logs",
      href: "/dashboard/reports/audit",
      icon: "scroll-text",
      roles: ["admin"],
      permission: "audit_logs.view",
    },
  ],
});


const superAdminAcademicMenu: AccessMenuItem = {
  label: "Institusi Sekolah",
  description: "Kelola data sekolah dan admin sekolah terdaftar.",
  href: "/dashboard/super-admin/schools",
  icon: "building-2",
  roles: ["super_admin"],
  permission: "schools.view",
  children: [
    {
      label: "Daftar Sekolah",
      href: "/dashboard/super-admin/schools",
      activePaths: [
        "/dashboard/super-admin/schools/new",
      ],
      icon: "building-2",
      roles: ["super_admin"],
      permission: "schools.view",
    },
    {
      label: "Admin Sekolah",
      href: "/dashboard/super-admin/admins",
      icon: "users",
      roles: ["super_admin"],
      permission: "users.view",
    },
  ],
};

const superAdminUserMenu: AccessMenuItem = {
  label: "Pengguna & Akses",
  description: "Kelola pengguna direktori global dan hak akses.",
  href: "/dashboard/super-admin/users",
  icon: "users",
  roles: ["super_admin"],
  permission: "users.view",
  children: [
    {
      label: "Pengguna Global",
      href: "/dashboard/super-admin/users",
      icon: "users",
      roles: ["super_admin"],
      permission: "users.view",
    },
    {
      label: "Peran & Izin",
      href: "/dashboard/super-admin/roles",
      activePaths: [
        "/dashboard/super-admin/permissions",
      ],
      icon: "shield-check",
      roles: ["super_admin"],
      permission: "roles.view",
    },
  ],
};

const superAdminExamMenu: AccessMenuItem = {
  label: "Monitoring & Data",
  description: "Pantau aktivitas ujian langsung, cadangan, dan impor data.",
  href: "/dashboard/super-admin/monitoring",
  icon: "activity",
  roles: ["super_admin"],
  permission: "exam_monitoring.view",
  children: [
    {
      label: "Pemantauan CBT Live",
      href: "/dashboard/super-admin/monitoring",
      icon: "activity",
      roles: ["super_admin"],
      permission: "exam_monitoring.view",
    },
    {
      label: "Cadangan & Pemulihan",
      href: "/dashboard/super-admin/backup-recovery",
      icon: "hard-drive",
      roles: ["super_admin"],
    },
    {
      label: "Impor & Ekspor Data",
      href: "/dashboard/super-admin/import-export",
      icon: "download",
      roles: ["super_admin"],
      permission: "import_export.view",
    },
  ],
};

const superAdminReportMenu: AccessMenuItem = {
  label: "Laporan & Analitik",
  description: "Statistik komparatif dan performa lintas sekolah.",
  href: "/dashboard/super-admin/reports",
  icon: "file-text",
  roles: ["super_admin"],
  permission: "reports.view",
  children: [
    {
      label: "Laporan Global",
      href: "/dashboard/super-admin/reports",
      icon: "file-text",
      roles: ["super_admin"],
      permission: "reports.view",
    },
  ],
};

const superAdminSystemMenu: AccessMenuItem = {
  label: "Pengaturan Platform",
  description: "Konfigurasi sistem, audit trails, dan bantuan operasional.",
  href: "/dashboard/super-admin/settings",
  icon: "settings",
  roles: ["super_admin"],
  children: [
    {
      label: "Catatan Aktivitas",
      href: "/dashboard/super-admin/audit-logs",
      icon: "scroll-text",
      roles: ["super_admin"],
      permission: "audit_logs.view",
    },
    {
      label: "Kesiapan Sistem",
      href: "/dashboard/super-admin/readiness",
      icon: "shield-check",
      roles: ["super_admin"],
      permission: "users.view",
    },
    {
      label: "Pengaturan Global",
      href: "/dashboard/super-admin/settings",
      icon: "settings",
      roles: ["super_admin"],
    },
    {
      label: "Bantuan Sekolah",
      href: "/dashboard/super-admin/support",
      icon: "activity",
      roles: ["super_admin"],
    },
    {
      label: "Panduan & FAQ",
      href: "/dashboard/super-admin/help",
      icon: "file-text",
      roles: ["super_admin"],
    },
  ],
};

const adminSetupMenu: AccessMenuItem = {
  label: "Setup & Data Induk",
  description: "Kelola tahun ajaran, kurikulum, guru, kelas, dan siswa.",
  href: "/dashboard/master-data/academic-years",
  icon: "database",
  roles: ["admin"],
  permission: "master_data.view",
  children: [
    {
      label: "Tahun Ajaran & Semester",
      href: "/dashboard/master-data/academic-years",
      icon: "calendar-days",
      roles: ["admin"],
      permission: "academic_years.view",
    },
    {
      label: "Mata Pelajaran",
      href: "/dashboard/master-data/subjects",
      icon: "book-open",
      roles: ["admin"],
      permission: "subjects.view",
    },
    {
      label: "Guru & Pengawas",
      href: "/dashboard/master-data/teachers",
      activePaths: ["/dashboard/exams/proctors"],
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
      label: "Siswa",
      href: "/dashboard/master-data/students",
      icon: "graduation-cap",
      roles: ["admin"],
      permission: "students.view",
    },
    {
      label: "Direktori Pengguna",
      href: "/dashboard/master-data/users",
      icon: "users",
      roles: ["admin"],
      permission: "users.view",
    },
  ],
};

const adminQuestionBankMenu: AccessMenuItem = {
  label: "Bank Soal Sekolah",
  description: "Pantau ketersediaan dan butir soal mata pelajaran sekolah.",
  href: "/dashboard/question-bank/questions",
  activePaths: [
    "/dashboard/question-bank",
    "/dashboard/question-bank/questions",
    "/dashboard/question-bank/categories",
    "/dashboard/question-bank/stimuli",
  ],
  icon: "book-open",
  roles: ["admin"],
  permission: "question_bank.view",
  children: [
    {
      label: "Daftar Soal",
      href: "/dashboard/question-bank/questions",
      activePaths: [
        "/dashboard/question-bank",
        "/dashboard/question-bank/questions",
      ],
      icon: "book-open",
      roles: ["admin"],
      permission: "question_bank.view",
    },
    {
      label: "Kategori Soal",
      href: "/dashboard/question-bank/categories",
      icon: "list-checks",
      roles: ["admin"],
      permission: "question_categories.view",
    },
    {
      label: "Stimulus / Bacaan",
      href: "/dashboard/question-bank/stimuli",
      icon: "file-text",
      roles: ["admin"],
      permission: "question_bank.view",
    },
    {
      label: "Import Soal",
      href: "/dashboard/question-bank/import-word",
      activePaths: [
        "/dashboard/question-bank/import-word",
        "/dashboard/question-bank/import-excel",
      ],
      icon: "download",
      roles: ["admin"],
      permission: "question_bank.manage",
    },
  ],
};

const adminOperationsMenu: AccessMenuItem = {
  label: "Ujian & Pelaksanaan",
  description: "Kelola paket, jadwal, pencetakan kartu, dan pemantauan ujian.",
  href: "/dashboard/exams/packages",
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
      label: "Cetak Kartu Login",
      href: "/dashboard/reports/login-cards",
      icon: "clipboard-check",
      roles: ["admin"],
      permission: "students.view",
    },
    {
      label: "Impor & Ekspor Data",
      href: "/dashboard/import-export",
      icon: "download",
      roles: ["admin"],
      permission: "import_export.view",
    },
    {
      label: "Monitoring Berjalan",
      href: "/dashboard/admin/monitoring",
      icon: "activity",
      roles: ["admin"],
      permission: "exam_monitoring.view",
    },
    {
      label: "Pusat Pemulihan",
      href: "/dashboard/recovery-center",
      icon: "shield-check",
      roles: ["admin"],
      permission: "exam_monitoring.view",
    },
  ],
};

export const ACCESS_MATRIX: Record<RoleName, AccessRoleConfig> = {
  super_admin: {
    dashboardPath: "/dashboard/super-admin",
    permissions: ["*"],
    menu: [
      dashboardItem("super_admin", "/dashboard/super-admin"),
      superAdminAcademicMenu,
      superAdminUserMenu,
      superAdminExamMenu,
      superAdminReportMenu,
      superAdminSystemMenu,
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
      "question_categories.view",
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
      "audit_logs.view",
    ],
    menu: [
      dashboardItem("admin", "/dashboard/admin"),
      adminSetupMenu,
      adminQuestionBankMenu,
      adminOperationsMenu,
      reportMenu(["admin"]),
      profileItem("admin"),
    ],
  },
  principal: {
    dashboardPath: "/dashboard/principal",
    permissions: [
      ...commonPermissions,
      "reports.view",
      "reports.export",
      "exam_results.view",
    ],
    menu: [
      dashboardItem("principal", "/dashboard/principal"),
      reportMenu(["principal"]),
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
      "question_categories.view",
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
        label: "Bank Soal",
        description: "Kelola butir soal pilihan ganda, esai, dan import naskah.",
        href: "/dashboard/question-bank/questions",
        activePaths: [
          "/dashboard/question-bank",
          "/dashboard/question-bank/questions",
          "/dashboard/question-bank/import-word",
          "/dashboard/question-bank/import-excel",
          "/dashboard/question-bank/stimuli",
          "/dashboard/question-bank/categories",
        ],
        icon: "book-open",
        roles: ["teacher"],
        permission: "question_bank.view",
        children: [
          {
            label: "Daftar Soal",
            href: "/dashboard/question-bank/questions",
            activePaths: [
              "/dashboard/question-bank",
              "/dashboard/question-bank/questions",
              "/dashboard/question-bank/stimuli",
            ],
            icon: "book-open",
            roles: ["teacher"],
            permission: "question_bank.view",
          },
          {
            label: "Kategori Soal",
            href: "/dashboard/question-bank/categories",
            icon: "list-checks",
            roles: ["teacher"],
            permission: "question_categories.manage",
          },
          {
            label: "Import & Ekspor",
            href: "/dashboard/question-bank/import-word",
            activePaths: [
              "/dashboard/question-bank/import-word",
              "/dashboard/question-bank/import-excel",
            ],
            icon: "download",
            roles: ["teacher"],
            permission: "question_bank.manage",
          },
        ],
      },
      {
        label: "Kelola Ujian",
        description: "Siapkan paket naskah dan jadwal ujian mata pelajaran Anda.",
        href: "/dashboard/exams/packages",
        icon: "file-text",
        roles: ["teacher"],
        permission: "exams.view",
        children: [
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
        ],
      },
      {
        label: "Koreksi Esai",
        description: "Koreksi dan beri nilai jawaban esai peserta ujian.",
        href: "/dashboard/teacher/grading",
        icon: "clipboard-check",
        roles: ["teacher"],
        permission: "grading.view",
      },
      {
        label: "Rekap Nilai Siswa",
        description: "Daftar nilai akhir siswa dan ekspor data.",
        href: "/dashboard/reports/students",
        icon: "scroll-text",
        roles: ["teacher"],
        permission: "reports.view",
      },
      {
        label: "Monitoring Ujian",
        description: "Pantau pengerjaan siswa yang sedang berlangsung.",
        href: "/dashboard/teacher/monitoring",
        icon: "activity",
        roles: ["teacher"],
        permission: "exam_monitoring.view",
      },
      {
        label: "Pusat Pemulihan",
        description: "Penanganan kendala ujian saat bertugas sebagai pengawas.",
        href: "/dashboard/recovery-center",
        icon: "activity",
        roles: ["teacher"],
        permission: "exam_monitoring.view",
      },
      {
        label: "Kelas Saya",
        description: "Daftar kelas dan rombel yang Anda ampu.",
        href: "/dashboard/teacher/assignments",
        icon: "graduation-cap",
        roles: ["teacher"],
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
        label: "Ujian Saya",
        description: "Lihat dan kerjakan ujian yang tersedia.",
        href: "/dashboard/student/active-exams",
        icon: "graduation-cap",
        roles: ["student"],
        permission: "active_exams.view",
      },
      {
        label: "Hasil Saya",
        description: "Lihat nilai dan hasil ujian yang telah selesai.",
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
      proctorExamMenu,
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
    roles: ["super_admin", "admin", "proctor", "teacher"],
    match: "prefix",
    permission: "exam_monitoring.view",
  },
  { path: "/dashboard/super-admin", roles: ["super_admin"], match: "exact" },
  { path: "/dashboard/admin", roles: ["admin"], match: "exact" },
  {
    path: "/dashboard/super-admin/users",
    roles: ["super_admin"],
    match: "prefix",
    permission: "users.view",
  },
  {
    path: "/dashboard/super-admin/roles",
    roles: ["super_admin"],
    match: "prefix",
    permission: "roles.view",
  },
  {
    path: "/dashboard/super-admin/permissions",
    roles: ["super_admin"],
    match: "prefix",
    permission: "roles.manage",
  },
  {
    path: "/dashboard/super-admin/audit-logs",
    roles: ["super_admin"],
    match: "prefix",
    permission: "audit_logs.view",
  },
  { path: "/dashboard/super-admin", roles: ["super_admin"], match: "prefix" },
  {
    path: "/dashboard/admin/monitoring",
    roles: ["admin"],
    match: "prefix",
    permission: "exam_monitoring.view",
  },
  {
    path: "/dashboard/master-data/academic-years",
    roles: ["super_admin", "admin"],
    match: "prefix",
    permission: "academic_years.view",
  },
  {
    path: "/dashboard/master-data/semesters",
    roles: ["super_admin", "admin"],
    match: "prefix",
    permission: "semesters.view",
  },
  {
    path: "/dashboard/master-data/proctors",
    roles: ["super_admin"],
    match: "prefix",
    permission: "users.view",
  },
  {
    path: "/dashboard/master-data/users",
    roles: ["super_admin", "admin"],
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
    roles: examManagerRoles,
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
    path: "/dashboard/reports/audit",
    roles: ["admin"],
    match: "prefix",
    permission: "audit_logs.view",
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
    roles: ["student", "teacher", "admin", "super_admin", "principal"],
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
    item.href === "/dashboard/recovery-center" &&
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

  if (role === "super_admin") {
    return true;
  }

  const rule = findRouteRule(pathname);

  if (!rule) {
    return false;
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

  return (
    user.permissions.some((item) => item.code === permission) ||
    user.permissions.length === 0
  );
}

function isRoleName(role: string | null | undefined): role is RoleName {
  return role === "super_admin" ||
    role === "admin" ||
    role === "principal" ||
    role === "teacher" ||
    role === "student" ||
    role === "proctor";
}
