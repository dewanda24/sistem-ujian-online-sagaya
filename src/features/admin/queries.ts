import { requirePermission } from "@/lib/auth/require-permission";
import { createClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

function firstRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export type AdminUserRow = {
  id: string;
  auth_user_id: string | null;
  username: string;
  email: string;
  status: string;
  role_id: string | null;
  roles?: Relation<{
    id: string;
    name: string;
    label: string;
  }>;
  user_profiles?: Relation<{
    full_name?: string | null;
    nip?: string | null;
    nis?: string | null;
    nisn?: string | null;
    phone?: string | null;
  }>;
};

export type AdminRoleRow = {
  id: string;
  name: string;
  label: string;
  userCount: number;
  permissionCount: number;
};

export type AdminPermissionRow = {
  id: string;
  code: string;
  module: string;
  action: string;
};

export type RolePermissionMap = Record<string, Set<string>>;

export type AuditLogRow = {
  id?: string | number;
  action?: string | null;
  table_name?: string | null;
  record_id?: string | null;
  user_id?: string | null;
  metadata?: unknown;
  created_at?: string | null;
};

export async function getAdminRoleOptions() {
  await requirePermission("users.view");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id, name, label")
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as Array<{ id: string; name: string; label: string }>;
}

export type AdminUserFilters = {
  q?: string;
  role_id?: string;
  status?: string;
};

export async function getAdminUsers(filters: AdminUserFilters | string = "") {
  await requirePermission("users.view");
  const supabase = await createClient();
  const search = typeof filters === "string" ? filters : filters.q ?? "";
  let query = supabase
    .from("users")
    .select(
      "id, auth_user_id, username, email, status, role_id, roles(id, name, label), user_profiles(full_name, nip, nis, nisn, phone)",
    )
    .order("username", { ascending: true });

  if (search) {
    query = query.or(
      `username.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  if (typeof filters !== "string" && filters.role_id) {
    query = query.eq("role_id", filters.role_id);
  }

  if (typeof filters !== "string" && filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as AdminUserRow[]).map((item) => ({
    ...item,
    role: firstRelation(item.roles),
    profile: firstRelation(item.user_profiles),
  }));
}

export async function getAdminRoles(): Promise<AdminRoleRow[]> {
  await requirePermission("roles.view");
  const supabase = await createClient();
  const [{ data: roles }, { data: users }, { data: rolePermissions }] =
    await Promise.all([
      supabase.from("roles").select("id, name, label").order("name"),
      supabase.from("users").select("role_id"),
      supabase.from("role_permissions").select("role_id, permission_id"),
    ]);

  return (roles ?? []).map((role) => ({
    id: role.id as string,
    name: role.name as string,
    label: role.label as string,
    userCount: (users ?? []).filter((user) => user.role_id === role.id).length,
    permissionCount: (rolePermissions ?? []).filter(
      (item) => item.role_id === role.id,
    ).length,
  }));
}

export async function getPermissionMatrix() {
  await requirePermission("roles.manage");
  const supabase = await createClient();
  const [{ data: roles }, { data: permissions }, { data: rolePermissions }] =
    await Promise.all([
      supabase.from("roles").select("id, name, label").order("name"),
      supabase
        .from("permissions")
        .select("id, code, module, action")
        .order("module")
        .order("action"),
      supabase.from("role_permissions").select("role_id, permission_id"),
    ]);
  const matrix: RolePermissionMap = {};

  for (const item of rolePermissions ?? []) {
    const roleId = item.role_id as string;
    const permissionId = item.permission_id as string;

    matrix[roleId] ??= new Set<string>();
    matrix[roleId].add(permissionId);
  }

  return {
    roles: (roles ?? []) as Array<{ id: string; name: string; label: string }>,
    permissions: (permissions ?? []) as AdminPermissionRow[],
    matrix,
  };
}

export async function getAuditLogs() {
  await requirePermission("audit_logs.view");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return {
      rows: [] as AuditLogRow[],
      unavailable: true,
      message: "Tabel audit_logs belum tersedia atau belum dapat diakses.",
    };
  }

  return {
    rows: (data ?? []) as AuditLogRow[],
    unavailable: false,
    message: "",
  };
}
