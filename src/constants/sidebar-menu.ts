export const sidebarMenus = {
  super_admin: [
    { label: "Dashboard", href: "/dashboard/super-admin" },
    { label: "Users", href: "/dashboard/admin/users" },
    { label: "Roles", href: "/dashboard/admin/roles" },
  ],

  admin: [
    { label: "Dashboard", href: "/dashboard/admin" },
    { label: "Users", href: "/dashboard/admin/users" },
  ],

  teacher: [
    { label: "Dashboard", href: "/dashboard/teacher" },
    { label: "Bank Soal", href: "/dashboard/question-bank/questions" },
  ],

  proctor: [
    { label: "Dashboard", href: "/dashboard/proctor" },
    { label: "Monitoring", href: "/dashboard/proctor/monitoring" },
  ],

  student: [
    { label: "Dashboard", href: "/dashboard/student" },
    { label: "Ujian Saya", href: "/dashboard/student/active-exams" },
  ],

  principal: [
    { label: "Dashboard", href: "/dashboard/principal" },
    { label: "Laporan", href: "/dashboard/principal/reports" },
  ],
} as const;
