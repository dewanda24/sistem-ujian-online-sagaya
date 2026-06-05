import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/require-auth";
import type { RoleName } from "@/types/auth";

export async function requireRole(allowedRoles: RoleName | RoleName[]) {
  const user = await requireAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const role = user.roles?.name;

  if (!role || !roles.includes(role)) {
    redirect("/dashboard/forbidden");
  }

  return user;
}
