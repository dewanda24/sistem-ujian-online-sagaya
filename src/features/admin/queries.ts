import { requirePermission } from "@/lib/auth/require-permission";
import {
  requireSchoolScope,
  requireScopedSchoolId,
} from "@/lib/auth/school-scope";
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
  school_id?: string | null;
  roles?: Relation<{
    id: string;
    name: string;
    label: string;
  }>;
  schools?: Relation<{
    id: string;
    name: string;
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
  entity_type?: string | null;
  entity_id?: string | null;
  user_id?: string | null;
  payload?: unknown;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string | null;
};

export type AuditLogFilters = {
  q?: string;
  action?: string;
  entity_type?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: string | number;
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

export async function getOperationalUserRoleOptions() {
  await requirePermission("users.view");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id, name, label")
    .not("name", "in", "(super_admin,admin,teacher,student)")
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as Array<{ id: string; name: string; label: string }>;
}

export async function getRoleOptionsByNames(roleNames: string[]) {
  await requirePermission("users.view");

  if (roleNames.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id, name, label")
    .in("name", roleNames)
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as Array<{ id: string; name: string; label: string }>;
}

export type AdminUserFilters = {
  q?: string;
  role_id?: string;
  role_names?: string[];
  school_id?: string;
  status?: string;
};

export type UserGovernanceSummaryFilters = {
  school_id?: string;
};

export async function getUserGovernanceSummary(
  filters: UserGovernanceSummaryFilters = {},
) {
  await requirePermission("users.view");
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  let query = supabase
    .from("users")
    .select("id, auth_user_id, status, roles(name, label)");

  if (scope.isSuperAdmin && filters.school_id) {
    query = query.eq("school_id", filters.school_id);
  } else if (!scope.isSuperAdmin) {
    query = query.eq("school_id", requireScopedSchoolId(scope));
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      total: 0,
      inactive: 0,
      withoutAuth: 0,
      withoutRole: 0,
      byRole: [] as Array<{ role: string; label: string; count: number }>,
    };
  }

  const roleMap = new Map<string, { label: string; count: number }>();

  for (const user of data) {
    const role = firstRelation(user.roles);
    const roleName = role?.name ?? "tanpa_role";
    const current = roleMap.get(roleName) ?? {
      label: role?.label ?? "Tanpa role",
      count: 0,
    };

    current.count += 1;
    roleMap.set(roleName, current);
  }

  return {
    total: data.length,
    inactive: data.filter((user) => user.status !== "active").length,
    withoutAuth: data.filter((user) => !user.auth_user_id).length,
    withoutRole: data.filter((user) => !firstRelation(user.roles)?.name).length,
    byRole: Array.from(roleMap, ([role, item]) => ({
      role,
      label: item.label,
      count: item.count,
    })).sort((a, b) => a.role.localeCompare(b.role)),
  };
}

export async function getAdminUsers(filters: AdminUserFilters | string = "") {
  await requirePermission("users.view");
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const search = typeof filters === "string" ? filters : filters.q ?? "";
  let query = supabase
    .from("users")
    .select(
      "id, auth_user_id, username, email, status, role_id, school_id, roles(id, name, label), schools(id, name), user_profiles(full_name, nip, nis, nisn, phone)",
    )
    .order("username", { ascending: true });

  if (
    scope.isSuperAdmin &&
    typeof filters !== "string" &&
    filters.school_id
  ) {
    query = query.eq("school_id", filters.school_id);
  } else if (!scope.isSuperAdmin) {
    query = query.eq("school_id", requireScopedSchoolId(scope));
  }

  if (search) {
    query = query.or(
      `username.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  if (typeof filters !== "string" && filters.role_id) {
    query = query.eq("role_id", filters.role_id);
  }

  if (
    typeof filters !== "string" &&
    filters.role_names &&
    filters.role_names.length > 0
  ) {
    query = query.in("roles.name", filters.role_names);
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
    school: firstRelation(item.schools),
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

function parseAuditLogLimit(value: AuditLogFilters["limit"]) {
  const limit = Number(value ?? 100);

  if (!Number.isFinite(limit)) {
    return 100;
  }

  return Math.min(Math.max(limit, 50), 300);
}

function auditLogMatchesKeyword(row: AuditLogRow, keyword: string) {
  const haystack = [
    row.action,
    row.entity_type,
    row.entity_id,
    row.user_id,
    row.ip_address,
    row.user_agent,
    row.payload ? JSON.stringify(row.payload) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(keyword.toLowerCase());
}

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  await requirePermission("audit_logs.view");
  const supabase = await createClient();
  const limit = parseAuditLogLimit(filters.limit);
  const action = filters.action?.trim();
  const entityType = filters.entity_type?.trim();
  const userId = filters.user_id?.trim();
  const keyword = filters.q?.trim();
  const dateFrom = filters.date_from?.trim();
  const dateTo = filters.date_to?.trim();

  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (action) {
    query = query.ilike("action", `%${action}%`);
  }

  if (entityType) {
    query = query.ilike("entity_type", `%${entityType}%`);
  }

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (dateFrom) {
    query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  }

  if (dateTo) {
    query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
  }

  const { data, error } = await query.limit(keyword ? 300 : limit);

  if (error) {
    return {
      rows: [] as AuditLogRow[],
      unavailable: true,
      message: "Tabel audit_logs belum tersedia atau belum dapat diakses.",
    };
  }

  const rows = ((data ?? []) as AuditLogRow[]).filter((row) =>
    keyword ? auditLogMatchesKeyword(row, keyword) : true,
  );

  return {
    rows: rows.slice(0, limit),
    unavailable: false,
    message: "",
  };
}
