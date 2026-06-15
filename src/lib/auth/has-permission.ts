import type { CurrentUser } from "@/types/auth";
import { canRoleAccessPermission } from "@/lib/auth/access-matrix";

type PermissionInput =
  | string
  | {
      code?: string;
      module: string;
      action: string;
    };

export function hasPermission(
  user: CurrentUser | null | undefined,
  permission: PermissionInput,
) {
  if (!user || user.status !== "active") {
    return false;
  }

  if (user.roles?.name === "super_admin") {
    return true;
  }

  if (
    typeof permission === "string" &&
    !canRoleAccessPermission(user.roles?.name, permission)
  ) {
    return false;
  }

  if (typeof permission === "string") {
    return (
      user.permissions.some((item) => item.code === permission) ||
      user.permissions.length === 0
    );
  }

  if (permission.code) {
    if (!canRoleAccessPermission(user.roles?.name, permission.code)) {
      return false;
    }

    return (
      user.permissions.some((item) => item.code === permission.code) ||
      user.permissions.length === 0
    );
  }

  return user.permissions.some(
    (item) =>
      item.module === permission.module && item.action === permission.action,
  );
}

export function hasAnyPermission(
  user: CurrentUser | null | undefined,
  permissions: PermissionInput[],
) {
  return permissions.some((permission) => hasPermission(user, permission));
}
