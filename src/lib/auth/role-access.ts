export function canAccessRoute(role: string, pathname: string) {
  if (pathname === "/dashboard") {
    return true;
  }

  if (pathname.startsWith("/dashboard/super-admin")) {
    return role === "super_admin";
  }

  if (pathname.startsWith("/dashboard/admin")) {
    return role === "admin" || role === "super_admin";
  }

  if (pathname.startsWith("/dashboard/master-data")) {
    return role === "admin" || role === "super_admin";
  }

  if (pathname.startsWith("/dashboard/question-bank")) {
    return role === "admin" || role === "super_admin" || role === "teacher";
  }

  if (pathname.startsWith("/dashboard/exams")) {
    return role === "admin" || role === "super_admin" || role === "teacher";
  }

  if (pathname.startsWith("/dashboard/exam-room")) {
    return role === "student";
  }

  if (pathname.startsWith("/dashboard/exam-results")) {
    return (
      role === "student" ||
      role === "teacher" ||
      role === "admin" ||
      role === "super_admin"
    );
  }

  if (pathname.startsWith("/dashboard/reports")) {
    return (
      role === "principal" ||
      role === "admin" ||
      role === "super_admin" ||
      role === "teacher"
    );
  }

  if (pathname.startsWith("/dashboard/import-export")) {
    return role === "admin" || role === "super_admin";
  }

  if (pathname.startsWith("/dashboard/teacher")) {
    return role === "teacher";
  }

  if (pathname.startsWith("/dashboard/proctor")) {
    return role === "proctor";
  }

  if (pathname.startsWith("/dashboard/student")) {
    return role === "student";
  }

  if (pathname.startsWith("/dashboard/principal")) {
    return role === "principal";
  }

  if (role === "super_admin") return true;

  if (pathname.startsWith("/admin")) {
    return role === "admin";
  }

  if (pathname.startsWith("/teacher")) {
    return role === "teacher";
  }

  if (pathname.startsWith("/proctor")) {
    return role === "proctor";
  }

  if (pathname.startsWith("/student")) {
    return role === "student";
  }

  if (pathname.startsWith("/principal")) {
    return role === "principal";
  }

  return true;
}
