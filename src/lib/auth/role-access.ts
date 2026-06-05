import { canRoleAccessRoute } from "@/lib/auth/access-matrix";

export function canAccessRoute(role: string, pathname: string) {
  return canRoleAccessRoute(role, pathname);
}
