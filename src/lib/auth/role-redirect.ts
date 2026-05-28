// src/lib/auth/role-redirect.ts

export function getDashboardPath(role?: string | null) {
  switch (role) {
    case "super_admin":
      return "/dashboard/super-admin";
    case "admin":
      return "/dashboard/admin";
    case "teacher":
      return "/dashboard/teacher";
    case "proctor":
      return "/dashboard/proctor";
    case "student":
      return "/dashboard/student";
    case "principal":
      return "/dashboard/principal";
    default:
      return "/login";
  }
}

export function getRoleDashboardSegment(role?: string | null) {
  return role === "super_admin" ? "super-admin" : role;
}
