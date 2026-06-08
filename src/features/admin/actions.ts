"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";

import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireRole } from "@/lib/auth/require-role";
import {
  assertSameSchool,
  requireSchoolScope,
} from "@/lib/auth/school-scope";
import { createClient } from "@/lib/supabase/server";
import {
  adminRoleLabelSchema,
  adminUserPasswordResetSchema,
  adminUserSchema,
} from "@/lib/validations/admin";

type ActionResult = {
  ok: boolean;
  message: string;
};

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function redirectTo(path: string, result: ActionResult): never {
  const params = new URLSearchParams({
    status: result.ok ? "success" : "error",
    message: result.message,
  });

  redirect(`${path}${path.includes("?") ? "&" : "?"}${params.toString()}`);
}

function getOperationalUserRedirectPath(formData: FormData) {
  const path = formString(formData, "redirect_path");
  const allowedPaths = new Set([
    "/dashboard/admin/users",
    "/dashboard/master-data/admins",
    "/dashboard/master-data/proctors",
  ]);

  return allowedPaths.has(path) ? path : "/dashboard/admin/users";
}

function serviceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return null;
  }

  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function isGlobalUserRole(roleName: string | null | undefined) {
  return roleName === "super_admin" || roleName === "admin";
}

async function getRoleNameById(roleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("roles")
    .select("name")
    .eq("id", roleId)
    .maybeSingle();

  return data?.name ? String(data.name) : null;
}

async function getPermissionCodeById(permissionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("permissions")
    .select("code")
    .eq("id", permissionId)
    .maybeSingle();

  return data?.code ? String(data.code) : null;
}

export async function saveAdminUserAction(formData: FormData) {
  const redirectPath = getOperationalUserRedirectPath(formData);
  const parsed = adminUserSchema.safeParse({
    id: formString(formData, "id"),
    auth_user_id: formString(formData, "auth_user_id"),
    email: formString(formData, "email"),
    username: formString(formData, "username"),
    password: formString(formData, "password"),
    full_name: formString(formData, "full_name"),
    role_id: formString(formData, "role_id"),
    school_id: formString(formData, "school_id"),
    status: formString(formData, "status") || "active",
  });

  if (!parsed.success) {
    redirectTo(redirectPath, {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data user tidak valid.",
    });
  }

  const currentUser = await requirePermission(
    parsed.data.id ? "users.update" : "users.create",
  );
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const adminClient = serviceRoleClient();
  const {
    id,
    auth_user_id,
    email,
    username,
    password,
    full_name,
    role_id,
    school_id,
    status,
  } = parsed.data;
  let authUserId = auth_user_id;
  const roleName = await getRoleNameById(role_id);

  if (!roleName || roleName === "teacher" || roleName === "student") {
    redirectTo(id ? `${redirectPath}?edit=${id}` : redirectPath, {
      ok: false,
      message:
        "Guru dan siswa dikelola dari Data Sekolah. Pilih peran operasional.",
    });
  }

  if (!scope.isSuperAdmin && isGlobalUserRole(roleName)) {
    redirectTo(id ? `${redirectPath}?edit=${id}` : redirectPath, {
      ok: false,
      message:
        "Akun Admin Sekolah dan Super Admin hanya boleh dikelola oleh Super Admin.",
    });
  }

  if (!id) {
    if (!adminClient) {
      redirectTo(redirectPath, {
        ok: false,
        message:
          "Kunci layanan Supabase belum tersedia. Akun login tidak dapat dibuat.",
      });
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      redirectTo(redirectPath, {
        ok: false,
        message: error?.message ?? "Gagal membuat auth user.",
      });
    }

    authUserId = data.user.id;
  }

  if (id && authUserId && adminClient && password) {
    const { error } = await adminClient.auth.admin.updateUserById(authUserId, {
      password,
    });

    if (error) {
      redirectTo(`${redirectPath}?edit=${id}`, {
        ok: false,
        message: error.message,
      });
    }
  }

  if (id && authUserId && adminClient) {
    const { error } = await adminClient.auth.admin.updateUserById(authUserId, {
      email,
    });

    if (error) {
      redirectTo(`${redirectPath}?edit=${id}`, {
        ok: false,
        message: error.message,
      });
    }
  }

  let targetSchoolId: string | null = null;

  if (id) {
    const { data: targetUser } = await supabase
      .from("users")
      .select("school_id, roles(name)")
      .eq("id", id)
      .maybeSingle();
    const targetRole = firstRelation(targetUser?.roles);

    assertSameSchool(scope, targetUser?.school_id);

    if (!scope.isSuperAdmin && isGlobalUserRole(targetRole?.name)) {
      redirectTo(`${redirectPath}?edit=${id}`, {
        ok: false,
        message:
          "Akun Admin Sekolah dan Super Admin hanya boleh dikelola oleh Super Admin.",
      });
    }

    targetSchoolId = targetUser?.school_id ?? null;
  }

  const resolvedSchoolId = scope.isSuperAdmin
    ? (school_id ?? targetSchoolId)
    : scope.schoolId;

  if (roleName === "admin" && !resolvedSchoolId) {
    redirectTo(id ? `${redirectPath}?edit=${id}` : redirectPath, {
      ok: false,
      message: "Admin Sekolah wajib terhubung ke sekolah.",
    });
  }

  const userPayload = {
    auth_user_id: authUserId,
    email,
    username,
    role_id,
    status,
    school_id: resolvedSchoolId,
  };

  const { data: savedUser, error: userError } = id
    ? await supabase
        .from("users")
        .update(userPayload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("users").insert(userPayload).select("id").single();

  if (userError || !savedUser) {
    redirectTo(id ? `${redirectPath}?edit=${id}` : redirectPath, {
      ok: false,
      message: userError?.message ?? "Gagal menyimpan user.",
    });
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: savedUser.id,
      full_name,
    },
    { onConflict: "user_id" },
  );

  if (!profileError) {
    await logAuditEvent({
      userId: currentUser.id,
      action: id ? "users.update" : "users.create",
      entityType: "users",
      entityId: savedUser.id,
      payload: {
        email,
        username,
        role_id,
        status,
      },
    });
  }

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/master-data/admins");
  revalidatePath("/dashboard/master-data/proctors");
  redirectTo(redirectPath, {
    ok: !profileError,
    message: profileError ? profileError.message : "User berhasil disimpan.",
  });
}

export async function toggleAdminUserStatusAction(formData: FormData) {
  const redirectPath = getOperationalUserRedirectPath(formData);
  const currentUser = await requirePermission("users.update");
  const scope = await requireSchoolScope();
  const supabase = await createClient();
  const id = formString(formData, "id");
  const { data: targetUser } = await supabase
    .from("users")
    .select("school_id, roles(name)")
    .eq("id", id)
    .maybeSingle();
  const targetRole = firstRelation(targetUser?.roles);

  assertSameSchool(scope, targetUser?.school_id);

  if (!scope.isSuperAdmin && isGlobalUserRole(targetRole?.name)) {
    redirectTo(redirectPath, {
      ok: false,
      message:
        "Akun Admin Sekolah dan Super Admin hanya boleh dikelola oleh Super Admin.",
    });
  }

  const status = formString(formData, "status") === "active" ? "active" : "inactive";
  const { error } = await supabase.from("users").update({ status }).eq("id", id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "users.status_update",
      entityType: "users",
      entityId: id,
      payload: { status },
    });
  }

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/master-data/admins");
  revalidatePath("/dashboard/master-data/proctors");
  redirectTo(redirectPath, {
    ok: !error,
    message: error ? error.message : "Status user berhasil diperbarui.",
  });
}

export async function resetAdminUserPasswordAction(formData: FormData) {
  const redirectPath = getOperationalUserRedirectPath(formData);
  const currentUser = await requirePermission("users.update");
  const scope = await requireSchoolScope();
  const parsed = adminUserPasswordResetSchema.safeParse({
    id: formString(formData, "id"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    redirectTo(redirectPath, {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Password baru tidak valid.",
    });
  }

  const supabase = await createClient();
  const { data: targetUser } = await supabase
    .from("users")
    .select("id, auth_user_id, email, school_id, roles(name)")
    .eq("id", parsed.data.id)
    .maybeSingle();
  const role = Array.isArray(targetUser?.roles)
    ? targetUser?.roles[0]
    : targetUser?.roles;

  if (!targetUser?.auth_user_id) {
    redirectTo(redirectPath, {
      ok: false,
      message: "Auth user belum terhubung.",
    });
  }

  assertSameSchool(scope, targetUser.school_id);

  if (!scope.isSuperAdmin && isGlobalUserRole(role?.name)) {
    redirectTo(redirectPath, {
      ok: false,
      message:
        "Akun Admin Sekolah dan Super Admin hanya boleh dikelola oleh Super Admin.",
    });
  }

  if (role?.name === "teacher" || role?.name === "student") {
    redirectTo(redirectPath, {
      ok: false,
      message: "Password guru dan siswa dikelola dari Master Data.",
    });
  }

  const adminClient = serviceRoleClient();

  if (!adminClient) {
    redirectTo(redirectPath, {
      ok: false,
      message:
        "Kunci layanan Supabase belum tersedia. Password login tidak dapat diubah.",
    });
  }

  const { error } = await adminClient.auth.admin.updateUserById(
    targetUser.auth_user_id,
    {
      password: parsed.data.password,
    },
  );

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "users.password_reset",
      entityType: "users",
      entityId: targetUser.id,
      payload: {
        email: targetUser.email,
      },
    });
  }

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/master-data/admins");
  revalidatePath("/dashboard/master-data/proctors");
  redirectTo(redirectPath, {
    ok: !error,
    message: error ? error.message : "Password user berhasil direset.",
  });
}

export async function updateRolePermissionAction(formData: FormData) {
  await requireRole("super_admin");
  const currentUser = await requirePermission("roles.manage");
  const supabase = await createClient();
  const roleId = formString(formData, "role_id");
  const permissionId = formString(formData, "permission_id");
  const enabled = formString(formData, "enabled") === "true";
  const roleName = await getRoleNameById(roleId);
  const permissionCode = await getPermissionCodeById(permissionId);

  if (!roleName || !permissionCode) {
    redirectTo("/dashboard/admin/permissions", {
      ok: false,
      message: "Hak akses atau izin akses tidak ditemukan.",
    });
  }

  if (roleName === "super_admin") {
    redirectTo("/dashboard/admin/permissions", {
      ok: false,
      message: "Izin akses Super Admin tidak dapat diubah dari tabel ini.",
    });
  }

  const { data: existing } = await supabase
    .from("role_permissions")
    .select("role_id, permission_id")
    .eq("role_id", roleId)
    .eq("permission_id", permissionId)
    .maybeSingle();
  const { error } =
    enabled && !existing
      ? await supabase
          .from("role_permissions")
          .insert({ role_id: roleId, permission_id: permissionId })
      : !enabled
        ? await supabase
            .from("role_permissions")
            .delete()
            .eq("role_id", roleId)
            .eq("permission_id", permissionId)
        : { error: null };

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: enabled
        ? "role_permissions.grant"
        : "role_permissions.revoke",
      entityType: "role_permissions",
      entityId: roleId,
      payload: {
        role_id: roleId,
        role_name: roleName,
        permission_id: permissionId,
        permission_code: permissionCode,
        enabled,
      },
    });
  }

  revalidatePath("/dashboard/admin/permissions");
  redirectTo("/dashboard/admin/permissions", {
    ok: !error,
    message: error ? error.message : "Izin akses berhasil diperbarui.",
  });
}

export async function updateRoleLabelAction(formData: FormData) {
  await requireRole("super_admin");
  const currentUser = await requirePermission("roles.manage");
  const parsed = adminRoleLabelSchema.safeParse({
    id: formString(formData, "id"),
    label: formString(formData, "label"),
  });

  if (!parsed.success) {
    redirectTo("/dashboard/admin/roles", {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Label hak akses tidak valid.",
    });
  }

  const supabase = await createClient();
  const { data: roleBefore } = await supabase
    .from("roles")
    .select("id, name, label")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!roleBefore) {
    redirectTo("/dashboard/admin/roles", {
      ok: false,
      message: "Role tidak ditemukan.",
    });
  }

  const { error } = await supabase
    .from("roles")
    .update({ label: parsed.data.label })
    .eq("id", parsed.data.id);

  if (!error) {
    await logAuditEvent({
      userId: currentUser.id,
      action: "roles.label_update",
      entityType: "roles",
      entityId: parsed.data.id,
      payload: {
        name: roleBefore.name,
        old_label: roleBefore.label,
        new_label: parsed.data.label,
      },
    });
  }

  revalidatePath("/dashboard/admin/roles");
  redirectTo("/dashboard/admin/roles", {
    ok: !error,
    message: error ? error.message : "Label hak akses berhasil diperbarui.",
  });
}
