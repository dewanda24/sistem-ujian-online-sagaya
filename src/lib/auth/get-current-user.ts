// src/lib/auth/get-current-user.ts

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { isDemoEmail } from "@/lib/auth/demo-mode";
import { hasAnyActiveProctorAssignment } from "@/lib/auth/proctor-scope";
import type { CurrentUser, RoleName, UserPermission } from "@/types/auth";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: appUser, error } = await supabase
    .from("users")
    .select(
      `
      id,
      username,
      email,
      status,
      role_id,
      school_id,
      roles (
        id,
        name,
        label
      ),
      schools (
        id,
        name
      ),
      user_profiles (
        full_name,
        avatar_url
      )
    `,
    )
    .eq("auth_user_id", user.id)
    .single();

  if (error || !appUser) {
    return null;
  }

  const role = Array.isArray(appUser.roles) ? appUser.roles[0] : appUser.roles;
  const school = Array.isArray(appUser.schools)
    ? appUser.schools[0]
    : appUser.schools;

  const profile = Array.isArray(appUser.user_profiles)
    ? appUser.user_profiles[0]
    : appUser.user_profiles;

  let permissions: UserPermission[] = [];

  if (appUser.role_id) {
    permissions = await getRolePermissions(appUser.role_id);
  }

  const roleName = role?.name as RoleName | undefined;
  const hasActiveProctorAssignment =
    roleName === "teacher" || roleName === "proctor"
      ? await hasAnyActiveProctorAssignment(appUser.id)
      : false;

  return {
    id: appUser.id,
    email: appUser.email,
    username: appUser.username,
    status: appUser.status,
    role_id: appUser.role_id,
    school_id: appUser.school_id ?? null,
    school_name: school?.name ?? null,
    is_demo_user: isDemoEmail(appUser.email),
    roles: role
      ? {
          id: role.id,
          name: roleName as RoleName,
          label: role.label,
        }
      : null,
    user_profiles: profile ?? null,
    permissions,
    has_active_proctor_assignment: hasActiveProctorAssignment,
  };
}

async function getRolePermissions(roleId: string): Promise<UserPermission[]> {
  const supabase = getRolePermissionClient() ?? (await createClient());
  const { data: rolePermissions } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", roleId);

  const permissionIds = (rolePermissions ?? [])
    .map((item) => item.permission_id)
    .filter((permissionId): permissionId is string => Boolean(permissionId));

  if (permissionIds.length === 0) {
    return [];
  }

  const { data: permissions } = await supabase
    .from("permissions")
    .select("id, code, module, action")
    .in("id", permissionIds);

  return (permissions ?? []).filter(
    (permission): permission is UserPermission =>
      Boolean(
        permission.id &&
          permission.code &&
          permission.module &&
          permission.action,
      ),
  );
}

function getRolePermissionClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
