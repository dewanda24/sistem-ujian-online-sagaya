import { hasPermission } from "@/lib/auth/has-permission";
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

export type DashboardMenuItem = {
  label: string;
  href: string;
  icon: DashboardIconName;
  roles: RoleName[];
  permission?: string;
  children?: DashboardMenuItem[];
};

const allRoles: RoleName[] = [
  "super_admin",
  "admin",
  "principal",
  "teacher",
  "student",
  "proctor",
];

export const dashboardMenuItems: DashboardMenuItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "layout-dashboard",
    roles: allRoles,
    permission: "dashboard.view",
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: "users",
    roles: allRoles,
  },
  {
    label: "Users",
    href: "/dashboard/admin/users",
    icon: "users",
    roles: ["super_admin", "admin"],
    permission: "users.view",
  },
  {
    label: "Roles",
    href: "/dashboard/admin/roles",
    icon: "shield-check",
    roles: ["super_admin", "admin"],
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
    label: "Exam Monitoring",
    href: "/dashboard/admin/monitoring",
    icon: "list-checks",
    roles: ["admin"],
    permission: "exam_monitoring.view",
  },
  {
    label: "Master Data",
    href: "/dashboard/master-data",
    icon: "database",
    roles: ["super_admin", "admin"],
    permission: "master_data.view",
    children: [
      {
        label: "Sekolah",
        href: "/dashboard/master-data/schools",
        icon: "building-2",
        roles: ["super_admin", "admin"],
        permission: "schools.view",
      },
      {
        label: "Tahun Ajaran",
        href: "/dashboard/master-data/academic-years",
        icon: "calendar-days",
        roles: ["super_admin", "admin"],
        permission: "academic_years.view",
      },
      {
        label: "Semester",
        href: "/dashboard/master-data/semesters",
        icon: "calendar-days",
        roles: ["super_admin", "admin"],
        permission: "semesters.view",
      },
      {
        label: "Kelas",
        href: "/dashboard/master-data/classes",
        icon: "list-checks",
        roles: ["super_admin", "admin"],
        permission: "classes.view",
      },
      {
        label: "Mata Pelajaran",
        href: "/dashboard/master-data/subjects",
        icon: "book-open",
        roles: ["super_admin", "admin"],
        permission: "subjects.view",
      },
      {
        label: "Guru",
        href: "/dashboard/master-data/teachers",
        icon: "users",
        roles: ["super_admin", "admin"],
        permission: "teachers.view",
      },
      {
        label: "Admin Sekolah",
        href: "/dashboard/master-data/admins",
        icon: "shield-check",
        roles: ["super_admin", "admin"],
        permission: "users.view",
      },
      {
        label: "Proctor",
        href: "/dashboard/master-data/proctors",
        icon: "users",
        roles: ["super_admin", "admin"],
        permission: "users.view",
      },
      {
        label: "Siswa",
        href: "/dashboard/master-data/students",
        icon: "graduation-cap",
        roles: ["super_admin", "admin"],
        permission: "students.view",
      },
    ],
  },
  {
    label: "Questions",
    href: "/dashboard/question-bank",
    icon: "book-open",
    roles: allRoles,
    permission: "question_bank.view",
  },
  {
    label: "Exams",
    href: "/dashboard/exams",
    icon: "file-text",
    roles: ["super_admin", "admin", "teacher"],
    permission: "exams.view",
  },
  {
    label: "Grading",
    href: "/dashboard/teacher/grading",
    icon: "clipboard-check",
    roles: ["teacher"],
  },
  {
    label: "Mapel & Kelas Saya",
    href: "/dashboard/teacher/assignments",
    icon: "book-open",
    roles: ["teacher"],
  },
  {
    label: "Kelas Binaan",
    href: "/dashboard/teacher/homeroom",
    icon: "graduation-cap",
    roles: ["teacher"],
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: "activity",
    roles: ["super_admin", "admin", "principal", "teacher"],
    permission: "reports.view",
  },
  {
    label: "Import / Export",
    href: "/dashboard/import-export",
    icon: "download",
    roles: ["super_admin", "admin"],
    permission: "import_export.view",
  },
  {
    label: "Monitoring Ujian",
    href: "/dashboard/super-admin/monitoring",
    icon: "list-checks",
    roles: ["super_admin"],
    permission: "exam_monitoring.view",
  },
  {
    label: "Production Readiness",
    href: "/dashboard/super-admin/readiness",
    icon: "shield-check",
    roles: ["super_admin"],
    permission: "users.view",
  },
  {
    label: "Settings Sistem",
    href: "/dashboard/super-admin/settings",
    icon: "settings",
    roles: ["super_admin"],
  },
  {
    label: "Backup / Recovery",
    href: "/dashboard/super-admin/backup-recovery",
    icon: "hard-drive",
    roles: ["super_admin"],
  },
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
    label: "Exam Monitoring",
    href: "/dashboard/proctor/monitoring",
    icon: "list-checks",
    roles: ["proctor"],
    permission: "exam_monitoring.view",
  },
  {
    label: "Exam Monitoring",
    href: "/dashboard/teacher/monitoring",
    icon: "list-checks",
    roles: ["teacher"],
    permission: "exam_monitoring.view",
  },
  {
    label: "Active Exams",
    href: "/dashboard/student/active-exams",
    icon: "graduation-cap",
    roles: ["student"],
  },
  {
    label: "Exam History",
    href: "/dashboard/student/history",
    icon: "history",
    roles: ["student"],
  },
  {
    label: "Schedules",
    href: "/dashboard/student/schedules",
    icon: "file-clock",
    roles: ["student"],
  },
];

export function getDashboardMenu(user: CurrentUser) {
  const role = user.roles?.name;

  if (!role) {
    return [];
  }

  return dashboardMenuItems
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

function canShowMenuItem(user: CurrentUser, item: DashboardMenuItem) {
  const role = user.roles?.name;

  if (!role) {
    return false;
  }

  if (!item.roles.includes(role)) {
    return false;
  }

  if (!item.permission) {
    return true;
  }

  return hasPermission(user, item.permission);
}
