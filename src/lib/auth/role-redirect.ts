// src/lib/auth/role-redirect.ts

import { getRoleDashboardPath } from "@/lib/auth/access-matrix";

export function getDashboardPath(role?: string | null) {
  return getRoleDashboardPath(role);
}

export function getRoleDashboardSegment(role?: string | null) {
  return role === "super_admin" ? "super-admin" : role;
}
